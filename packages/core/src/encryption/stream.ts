import { randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha2';
import { Buffer } from '../buffer';
import { encrypt as mlkem2Encrypt, decrypt as mlkem2Decrypt } from './mlkem2';
import { encrypt as argon2Encrypt, decrypt as argon2Decrypt } from './mlkem_argon2';
import { DecryptError, EncryptError } from './encryption';

/**
 * CFYI streaming container v1 — see docs/streaming-format.md.
 *
 * Payloads above the inline threshold are encrypted frame by frame so neither
 * client nor server ever holds the whole plaintext. The construction is the
 * STREAM pattern (Rogaway et al.): one key, a counter-based nonce per frame,
 * and a final-frame marker inside the AAD so truncation cannot pass
 * authentication.
 *
 * No new key agreement is introduced. A random content encryption key (CEK)
 * protects the payload, and that 32-byte key is wrapped by the existing,
 * unmodified `mlkem2` / `mlkem_argon2` layers. The two-factor model is
 * therefore identical to the inline path, but Argon2id runs against 32 bytes
 * instead of the payload, and the payload is encrypted in a single pass whether
 * or not a password is set.
 */

/** ASCII "CFYI". */
export const STREAM_MAGIC = Uint8Array.from([0x43, 0x46, 0x59, 0x49]);
export const STREAM_VERSION = 1;
/** 2^22 = 4 MiB. Two frames make an 8 MiB part, clearing S3's 5 MiB minimum. */
export const DEFAULT_FRAME_SIZE_LOG2 = 22;
export const MIN_FRAME_SIZE_LOG2 = 8;
export const MAX_FRAME_SIZE_LOG2 = 30;

export const CEK_LENGTH = 32;
export const TAG_LENGTH = 16;
export const NONCE_LENGTH = 12;
export const NONCE_PREFIX_LENGTH = 4;
export const HEADER_HASH_LENGTH = 32;
/** headerHash ‖ u64BE(index) ‖ u8(final) */
export const AAD_LENGTH = HEADER_HASH_LENGTH + 8 + 1;

/** Bytes needed before `wkLen` is known and the rest of the prefix can be read. */
export const HEADER_FIXED_LENGTH = 16;

const FLAG_PASSWORD_REQUIRED = 0x01;
const FLAG_RESERVED_MASK = 0xfe;
/** The metadata frame is counter 0; data frames start at 1. */
const META_FRAME_INDEX = 0;

const OFF_VERSION = 4;
const OFF_FLAGS = 5;
const OFF_FRAME_SIZE_LOG2 = 6;
const OFF_RESERVED = 7;
const OFF_NONCE_PREFIX = 8;
const OFF_WK_LEN = 12;
const OFF_WRAPPED_KEY = 16;

export type StreamMetadata = {
  /** Original filename. Carried encrypted so it never reaches a key or a log. */
  name: string;
  /** MIME type, or the empty string when unknown. */
  type: string;
  size: number;
};

export type StreamHeader = {
  version: number;
  passwordRequired: boolean;
  frameSizeLog2: number;
  frameSize: number;
  noncePrefix: Uint8Array;
  wrappedKey: string;
  metaLength: number;
  plaintextLength: number;
  /** Length of the hashed prefix P: 28 + wkLen. */
  prefixLength: number;
  /** Offset of data frame 1: prefixLength + metaLength. */
  headerLength: number;
  frameCount: number;
};

/**
 * Minimal structural WebCrypto surface. This package is isomorphic and compiles
 * without the DOM lib, so the few types used here are declared locally rather
 * than pulling browser globals into Node builds.
 */
type CryptoKeyHandle = { readonly type: string };

type AesGcmParams = {
  name: 'AES-GCM';
  iv: ArrayBufferView;
  additionalData: ArrayBufferView;
  tagLength: number;
};

type SubtleCryptoLike = {
  importKey(
    format: 'raw',
    keyData: ArrayBufferView,
    algorithm: { name: 'AES-GCM' },
    extractable: boolean,
    keyUsages: string[],
  ): Promise<CryptoKeyHandle>;
  encrypt(
    algorithm: AesGcmParams,
    key: CryptoKeyHandle,
    data: ArrayBufferView,
  ): Promise<ArrayBuffer>;
  decrypt(
    algorithm: AesGcmParams,
    key: CryptoKeyHandle,
    data: ArrayBufferView,
  ): Promise<ArrayBuffer>;
};

const getSubtle = (): SubtleCryptoLike => {
  const subtle = (globalThis as { crypto?: { subtle?: SubtleCryptoLike } }).crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'crypto.subtle is unavailable — the streaming container requires WebCrypto (Node >= 19 or a secure browser context)',
    );
  }
  return subtle;
};

const importCek = (cek: Uint8Array, usages: string[]): Promise<CryptoKeyHandle> => {
  if (cek.length !== CEK_LENGTH) {
    throw new Error(`CEK must be ${CEK_LENGTH} bytes, received ${cek.length}`);
  }
  return getSubtle().importKey('raw', cek, { name: 'AES-GCM' }, false, usages);
};

/**
 * Nonce uniqueness rests on the CEK being fresh per secret, so the counter can
 * start at zero. The random prefix is defence in depth: were a future change to
 * ever reuse a CEK, distinct prefixes still keep nonces apart.
 */
const buildNonce = (noncePrefix: Uint8Array, index: number): Uint8Array => {
  const nonce = new Uint8Array(NONCE_LENGTH);
  nonce.set(noncePrefix, 0);
  new DataView(nonce.buffer).setBigUint64(NONCE_PREFIX_LENGTH, BigInt(index), false);
  return nonce;
};

/**
 * Binding `headerHash` into every frame makes header tampering — frame size,
 * nonce prefix, declared length, wrapped key — fail authentication on the first
 * frame opened. `isFinal` is what makes truncation detectable.
 */
const buildAad = (headerHash: Uint8Array, index: number, isFinal: boolean): Uint8Array => {
  const aad = new Uint8Array(AAD_LENGTH);
  aad.set(headerHash, 0);
  new DataView(aad.buffer).setBigUint64(HEADER_HASH_LENGTH, BigInt(index), false);
  aad[HEADER_HASH_LENGTH + 8] = isFinal ? 0x01 : 0x00;
  return aad;
};

export const frameCountFor = (plaintextLength: number, frameSize: number): number =>
  // An empty payload still emits one (empty) final frame so that every container
  // carries a frame with isFinal set, keeping the truncation check universal.
  plaintextLength === 0 ? 1 : Math.ceil(plaintextLength / frameSize);

/** Byte offset of data frame `index` (1-based) within the container. */
export const frameOffset = (header: StreamHeader, index: number): number =>
  header.headerLength + (index - 1) * (header.frameSize + TAG_LENGTH);

const sealFrame = async (
  key: CryptoKeyHandle,
  noncePrefix: Uint8Array,
  headerHash: Uint8Array,
  index: number,
  isFinal: boolean,
  plaintext: Uint8Array,
): Promise<Uint8Array> => {
  const sealed = await getSubtle().encrypt(
    {
      name: 'AES-GCM',
      iv: buildNonce(noncePrefix, index),
      additionalData: buildAad(headerHash, index, isFinal),
      tagLength: TAG_LENGTH * 8,
    },
    key,
    plaintext,
  );
  return new Uint8Array(sealed);
};

const openFrame = async (
  key: CryptoKeyHandle,
  noncePrefix: Uint8Array,
  headerHash: Uint8Array,
  index: number,
  isFinal: boolean,
  frame: Uint8Array,
): Promise<Uint8Array> => {
  const opened = await getSubtle().decrypt(
    {
      name: 'AES-GCM',
      iv: buildNonce(noncePrefix, index),
      additionalData: buildAad(headerHash, index, isFinal),
      tagLength: TAG_LENGTH * 8,
    },
    key,
    frame,
  );
  return new Uint8Array(opened);
};

const wrapCek = async (cek: Uint8Array, key: string, password?: string): Promise<string> => {
  const inner = await mlkem2Encrypt(Buffer.from(cek).toString('base64'), key);
  return password ? argon2Encrypt(inner, password) : inner;
};

const unwrapCek = async (
  wrappedKey: string,
  key: string,
  password: string | undefined,
  passwordRequired: boolean,
): Promise<Uint8Array> => {
  const inner = passwordRequired ? await argon2Decrypt(wrappedKey, password as string) : wrappedKey;
  const cek = Buffer.from(await mlkem2Decrypt(inner, key), 'base64');
  if (cek.length !== CEK_LENGTH) {
    throw new Error('unwrapped CEK has the wrong length');
  }
  return new Uint8Array(cek);
};

export type EncryptorOptions = {
  /** The high-entropy URL key. */
  key: string;
  password?: string;
  plaintextLength: number;
  metadata: StreamMetadata;
  frameSizeLog2?: number;
  /** Test-only injection points; production callers must leave these unset. */
  cek?: Uint8Array;
  noncePrefix?: Uint8Array;
};

export type StreamEncryptor = {
  /** Header prefix P followed by the encrypted metadata frame. */
  header: Uint8Array;
  headerHash: Uint8Array;
  frameSize: number;
  frameCount: number;
  /** Seals data frame `index` (1-based). */
  encryptFrame(index: number, plaintext: Uint8Array): Promise<Uint8Array>;
};

export const createStreamEncryptor = async (
  options: EncryptorOptions,
): Promise<StreamEncryptor> => {
  try {
    const frameSizeLog2 = options.frameSizeLog2 ?? DEFAULT_FRAME_SIZE_LOG2;
    if (
      !Number.isInteger(frameSizeLog2) ||
      frameSizeLog2 < MIN_FRAME_SIZE_LOG2 ||
      frameSizeLog2 > MAX_FRAME_SIZE_LOG2
    ) {
      throw new Error(`frameSizeLog2 must be an integer in [8, 30], received ${frameSizeLog2}`);
    }
    if (!Number.isSafeInteger(options.plaintextLength) || options.plaintextLength < 0) {
      throw new Error('plaintextLength must be a non-negative safe integer');
    }

    const frameSize = 2 ** frameSizeLog2;
    const cek = options.cek ?? randomBytes(CEK_LENGTH);
    const noncePrefix = options.noncePrefix ?? randomBytes(NONCE_PREFIX_LENGTH);
    if (noncePrefix.length !== NONCE_PREFIX_LENGTH) {
      throw new Error(`noncePrefix must be ${NONCE_PREFIX_LENGTH} bytes`);
    }

    const aesKey = await importCek(cek, ['encrypt']);
    const wrappedKey = await wrapCek(cek, options.key, options.password);
    const wrappedKeyBytes = new TextEncoder().encode(wrappedKey);
    const metaPlaintext = new TextEncoder().encode(JSON.stringify(options.metadata));

    // metaLength is known before the frame is sealed (plaintext + GCM tag), so
    // the prefix can be finalised — and hashed — ahead of encrypting anything.
    const metaLength = metaPlaintext.length + TAG_LENGTH;
    const prefixLength = 28 + wrappedKeyBytes.length;

    const prefix = new Uint8Array(prefixLength);
    const view = new DataView(prefix.buffer);
    prefix.set(STREAM_MAGIC, 0);
    prefix[OFF_VERSION] = STREAM_VERSION;
    prefix[OFF_FLAGS] = options.password ? FLAG_PASSWORD_REQUIRED : 0x00;
    prefix[OFF_FRAME_SIZE_LOG2] = frameSizeLog2;
    prefix[OFF_RESERVED] = 0x00;
    prefix.set(noncePrefix, OFF_NONCE_PREFIX);
    view.setUint32(OFF_WK_LEN, wrappedKeyBytes.length, false);
    prefix.set(wrappedKeyBytes, OFF_WRAPPED_KEY);
    view.setUint32(OFF_WRAPPED_KEY + wrappedKeyBytes.length, metaLength, false);
    view.setBigUint64(
      OFF_WRAPPED_KEY + wrappedKeyBytes.length + 4,
      BigInt(options.plaintextLength),
      false,
    );

    const headerHash = sha256(prefix);
    const metaFrame = await sealFrame(
      aesKey,
      noncePrefix,
      headerHash,
      META_FRAME_INDEX,
      false,
      metaPlaintext,
    );

    const header = new Uint8Array(prefixLength + metaFrame.length);
    header.set(prefix, 0);
    header.set(metaFrame, prefixLength);

    const frameCount = frameCountFor(options.plaintextLength, frameSize);

    return {
      header,
      headerHash,
      frameSize,
      frameCount,
      async encryptFrame(index, plaintext) {
        if (!Number.isInteger(index) || index < 1 || index > frameCount) {
          throw new Error(`frame index ${index} out of range [1, ${frameCount}]`);
        }
        const isFinal = index === frameCount;
        const expected = isFinal
          ? options.plaintextLength - (frameCount - 1) * frameSize
          : frameSize;
        if (plaintext.length !== expected) {
          throw new Error(
            `frame ${index} must carry ${expected} plaintext bytes, received ${plaintext.length}`,
          );
        }
        return sealFrame(aesKey, noncePrefix, headerHash, index, isFinal, plaintext);
      },
    };
  } catch (error) {
    throw new EncryptError(error);
  }
};

/**
 * Parses the fixed 16-byte head so a streaming reader knows how many more bytes
 * the prefix needs before it can be parsed in full.
 */
export const readWrappedKeyLength = (bytes: Uint8Array): number => {
  if (bytes.length < HEADER_FIXED_LENGTH) {
    throw new Error(`need at least ${HEADER_FIXED_LENGTH} bytes to read the wrapped key length`);
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    OFF_WK_LEN,
    false,
  );
};

export const parseStreamHeader = (bytes: Uint8Array): StreamHeader => {
  if (bytes.length < HEADER_FIXED_LENGTH) {
    throw new Error('container is shorter than the fixed header');
  }
  for (let i = 0; i < STREAM_MAGIC.length; i++) {
    if (bytes[i] !== STREAM_MAGIC[i]) {
      throw new Error('not a CFYI container');
    }
  }
  const version = bytes[OFF_VERSION];
  if (version !== STREAM_VERSION) {
    throw new Error(`unsupported container version ${version}`);
  }
  const flags = bytes[OFF_FLAGS];
  if ((flags & FLAG_RESERVED_MASK) !== 0) {
    throw new Error('reserved flag bits must be zero');
  }
  if (bytes[OFF_RESERVED] !== 0x00) {
    throw new Error('reserved byte must be zero');
  }
  const frameSizeLog2 = bytes[OFF_FRAME_SIZE_LOG2];
  if (frameSizeLog2 < MIN_FRAME_SIZE_LOG2 || frameSizeLog2 > MAX_FRAME_SIZE_LOG2) {
    throw new Error(`frameSizeLog2 ${frameSizeLog2} out of range`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const wkLen = view.getUint32(OFF_WK_LEN, false);
  const prefixLength = 28 + wkLen;
  if (bytes.length < prefixLength) {
    throw new Error('container is shorter than its declared header prefix');
  }

  const metaLength = view.getUint32(OFF_WRAPPED_KEY + wkLen, false);
  const plaintextLengthBig = view.getBigUint64(OFF_WRAPPED_KEY + wkLen + 4, false);
  if (plaintextLengthBig > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('declared plaintext length exceeds the safe integer range');
  }
  if (metaLength < TAG_LENGTH) {
    throw new Error('metadata frame is shorter than a GCM tag');
  }

  const frameSize = 2 ** frameSizeLog2;
  const plaintextLength = Number(plaintextLengthBig);

  return {
    version,
    passwordRequired: (flags & FLAG_PASSWORD_REQUIRED) !== 0,
    frameSizeLog2,
    frameSize,
    noncePrefix: bytes.slice(OFF_NONCE_PREFIX, OFF_NONCE_PREFIX + NONCE_PREFIX_LENGTH),
    wrappedKey: new TextDecoder().decode(bytes.subarray(OFF_WRAPPED_KEY, OFF_WRAPPED_KEY + wkLen)),
    metaLength,
    plaintextLength,
    prefixLength,
    headerLength: prefixLength + metaLength,
    frameCount: frameCountFor(plaintextLength, frameSize),
  };
};

export type StreamDecryptor = {
  header: StreamHeader;
  metadata: StreamMetadata;
  /** Opens data frame `index` (1-based). */
  decryptFrame(index: number, frame: Uint8Array): Promise<Uint8Array>;
};

export const openStream = async (
  headerBytes: Uint8Array,
  key: string,
  password?: string,
): Promise<StreamDecryptor> => {
  try {
    const header = parseStreamHeader(headerBytes);
    if (headerBytes.length < header.headerLength) {
      throw new Error('header is shorter than its declared metadata frame');
    }
    if (header.passwordRequired && !password) {
      throw new Error('this container requires a password');
    }
    // Refuse a password the container was not sealed with rather than ignoring
    // it. Silently succeeding would diverge from the inline path, where a
    // spurious password changes the verification hash and the read is rejected.
    if (!header.passwordRequired && password) {
      throw new Error('this container was sealed without a password');
    }

    const cek = await unwrapCek(header.wrappedKey, key, password, header.passwordRequired);
    const aesKey = await importCek(cek, ['decrypt']);
    const headerHash = sha256(headerBytes.subarray(0, header.prefixLength));

    const metaPlaintext = await openFrame(
      aesKey,
      header.noncePrefix,
      headerHash,
      META_FRAME_INDEX,
      false,
      headerBytes.subarray(header.prefixLength, header.headerLength),
    );
    const metadata = JSON.parse(new TextDecoder().decode(metaPlaintext)) as StreamMetadata;

    return {
      header,
      metadata,
      async decryptFrame(index, frame) {
        if (!Number.isInteger(index) || index < 1 || index > header.frameCount) {
          throw new Error(`frame index ${index} out of range [1, ${header.frameCount}]`);
        }
        const isFinal = index === header.frameCount;
        const opened = await openFrame(
          aesKey,
          header.noncePrefix,
          headerHash,
          index,
          isFinal,
          frame,
        );
        const expected = isFinal
          ? header.plaintextLength - (header.frameCount - 1) * header.frameSize
          : header.frameSize;
        if (opened.length !== expected) {
          throw new Error(
            `frame ${index} decrypted to ${opened.length} bytes, expected ${expected}`,
          );
        }
        return opened;
      },
    };
  } catch (error) {
    throw new DecryptError(error);
  }
};

/**
 * Whole-buffer convenience wrapper. Real callers stream frame by frame; this
 * exists for tests, the CLI, and any payload small enough to hold in memory.
 */
export const encryptStream = async (
  plaintext: Uint8Array,
  options: Omit<EncryptorOptions, 'plaintextLength'>,
): Promise<Uint8Array> => {
  const encryptor = await createStreamEncryptor({ ...options, plaintextLength: plaintext.length });
  const parts: Uint8Array[] = [encryptor.header];
  let total = encryptor.header.length;

  for (let index = 1; index <= encryptor.frameCount; index++) {
    const start = (index - 1) * encryptor.frameSize;
    const frame = await encryptor.encryptFrame(
      index,
      plaintext.subarray(start, Math.min(start + encryptor.frameSize, plaintext.length)),
    );
    parts.push(frame);
    total += frame.length;
  }

  const container = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    container.set(part, offset);
    offset += part.length;
  }
  return container;
};

export const decryptStream = async (
  container: Uint8Array,
  key: string,
  password?: string,
): Promise<{ content: Uint8Array; metadata: StreamMetadata }> => {
  const decryptor = await openStream(container, key, password);
  const { header } = decryptor;
  const content = new Uint8Array(header.plaintextLength);
  let written = 0;

  for (let index = 1; index <= header.frameCount; index++) {
    const start = frameOffset(header, index);
    const isFinal = index === header.frameCount;
    const end = isFinal ? container.length : start + header.frameSize + TAG_LENGTH;
    if (start > container.length || end > container.length) {
      throw new DecryptError(new Error(`container is truncated before frame ${index}`));
    }
    const opened = await decryptor.decryptFrame(index, container.subarray(start, end));
    content.set(opened, written);
    written += opened.length;
  }

  if (written !== header.plaintextLength) {
    throw new DecryptError(
      new Error(`recovered ${written} bytes, header declares ${header.plaintextLength}`),
    );
  }

  return { content, metadata: decryptor.metadata };
};
