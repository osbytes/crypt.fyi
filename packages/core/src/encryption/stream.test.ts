import { Buffer } from '../buffer';
import {
  CEK_LENGTH,
  DEFAULT_FRAME_SIZE_LOG2,
  NONCE_PREFIX_LENGTH,
  STREAM_VERSION,
  TAG_LENGTH,
  createStreamEncryptor,
  decryptStream,
  encryptStream,
  frameCountFor,
  frameOffset,
  openStream,
  parseStreamHeader,
  readWrappedKeyLength,
} from './stream';
import { GOLDEN_CONTAINER_B64, GOLDEN_KEY, GOLDEN_TEXT } from './stream.vector';

// Small frames keep the suite fast while exercising every multi-frame path;
// the layout is identical at the 4 MiB production size.
const LOG2 = 8;
const F = 2 ** LOG2;

const KEY = 'sZq2kR7wTfB9xNvC1mLpYd4HgJ0uEaWt';
const PASSWORD = 'correct horse battery staple';
const META = { name: 'payload.bin', type: 'application/octet-stream', size: 0 };

const bytes = (n: number): Uint8Array => {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (i * 31 + 7) & 0xff;
  return out;
};

const seal = (plaintext: Uint8Array, password?: string) =>
  encryptStream(plaintext, {
    key: KEY,
    password,
    metadata: { ...META, size: plaintext.length },
    frameSizeLog2: LOG2,
  });

describe('stream container / framing', () => {
  it.each([
    ['empty', 0],
    ['single byte', 1],
    ['one byte under a frame', F - 1],
    ['exactly one frame', F],
    ['one byte over a frame', F + 1],
    ['exactly three frames', 3 * F],
    ['three frames plus a remainder', 3 * F + 17],
  ])('round-trips %s', async (_label, size) => {
    const plaintext = bytes(size);
    const container = await seal(plaintext);
    const { content, metadata } = await decryptStream(container, KEY);

    expect(Buffer.from(content).equals(Buffer.from(plaintext))).toBe(true);
    expect(metadata).toEqual({ ...META, size });
  });

  it('round-trips with a password', async () => {
    const plaintext = bytes(3 * F + 5);
    const container = await seal(plaintext, PASSWORD);
    const { content } = await decryptStream(container, KEY, PASSWORD);
    expect(Buffer.from(content).equals(Buffer.from(plaintext))).toBe(true);
  });

  it('always emits a final frame, even when empty', () => {
    expect(frameCountFor(0, F)).toBe(1);
    expect(frameCountFor(1, F)).toBe(1);
    expect(frameCountFor(F, F)).toBe(1);
    expect(frameCountFor(F + 1, F)).toBe(2);
  });

  it('places frames at the documented offsets', async () => {
    const plaintext = bytes(3 * F);
    const container = await seal(plaintext);
    const header = parseStreamHeader(container);

    expect(header.frameCount).toBe(3);
    expect(frameOffset(header, 1)).toBe(header.headerLength);
    expect(frameOffset(header, 2)).toBe(header.headerLength + F + TAG_LENGTH);
    expect(container.length).toBe(header.headerLength + 3 * (F + TAG_LENGTH));
  });

  it('supports random access to a single frame without reading its neighbours', async () => {
    const plaintext = bytes(3 * F);
    const container = await seal(plaintext);
    const decryptor = await openStream(container, KEY);
    const { header } = decryptor;

    const start = frameOffset(header, 2);
    const opened = await decryptor.decryptFrame(
      2,
      container.subarray(start, start + F + TAG_LENGTH),
    );

    expect(Buffer.from(opened).equals(Buffer.from(plaintext.subarray(F, 2 * F)))).toBe(true);
  });

  it('exposes the wrapped key length from the fixed 16-byte head', async () => {
    const container = await seal(bytes(10));
    const header = parseStreamHeader(container);
    expect(readWrappedKeyLength(container.subarray(0, 16))).toBe(header.prefixLength - 28);
  });
});

describe('stream container / header', () => {
  it('parses the documented fields', async () => {
    const plaintext = bytes(F + 3);
    const container = await seal(plaintext, PASSWORD);
    const header = parseStreamHeader(container);

    expect(header.version).toBe(STREAM_VERSION);
    expect(header.passwordRequired).toBe(true);
    expect(header.frameSizeLog2).toBe(LOG2);
    expect(header.frameSize).toBe(F);
    expect(header.plaintextLength).toBe(F + 3);
    expect(header.noncePrefix).toHaveLength(NONCE_PREFIX_LENGTH);
    expect(header.headerLength).toBe(header.prefixLength + header.metaLength);
  });

  it('marks password-free containers in flags', async () => {
    const header = parseStreamHeader(await seal(bytes(10)));
    expect(header.passwordRequired).toBe(false);
  });

  it('defaults to 4 MiB frames', async () => {
    const encryptor = await createStreamEncryptor({
      key: KEY,
      plaintextLength: 0,
      metadata: META,
    });
    expect(encryptor.frameSize).toBe(2 ** DEFAULT_FRAME_SIZE_LOG2);
  });

  it('rejects a foreign magic', async () => {
    const container = await seal(bytes(10));
    container[0] ^= 0xff;
    expect(() => parseStreamHeader(container)).toThrow(/not a CFYI container/);
  });

  it('rejects an unknown version', async () => {
    const container = await seal(bytes(10));
    container[4] = 99;
    expect(() => parseStreamHeader(container)).toThrow(/unsupported container version/);
  });

  it('rejects non-zero reserved flag bits', async () => {
    const container = await seal(bytes(10));
    container[5] |= 0x02;
    expect(() => parseStreamHeader(container)).toThrow(/reserved flag bits/);
  });

  it('rejects a non-zero reserved byte', async () => {
    const container = await seal(bytes(10));
    container[7] = 1;
    expect(() => parseStreamHeader(container)).toThrow(/reserved byte/);
  });
});

describe('stream container / tamper resistance', () => {
  it('rejects a truncated stream', async () => {
    const plaintext = bytes(3 * F);
    const container = await seal(plaintext);
    const header = parseStreamHeader(container);

    // Drop the last frame and restate the length so the container is internally
    // consistent — only the final-frame marker in the AAD catches this.
    const truncated = container.subarray(0, frameOffset(header, 3));
    await expect(decryptStream(truncated, KEY)).rejects.toThrow();
  });

  it('rejects a stream whose final frame is re-presented as non-final', async () => {
    const plaintext = bytes(2 * F);
    const container = await seal(plaintext);
    const decryptor = await openStream(container, KEY);
    const start = frameOffset(decryptor.header, 2);
    const finalFrame = container.subarray(start, start + F + TAG_LENGTH);

    // Frame 2 authenticates as final; asking for it at index 1 (non-final) must fail.
    await expect(decryptor.decryptFrame(1, finalFrame)).rejects.toThrow();
  });

  it('rejects reordered frames', async () => {
    const plaintext = bytes(3 * F);
    const container = await seal(plaintext);
    const header = parseStreamHeader(container);
    const stride = F + TAG_LENGTH;

    const swapped = Uint8Array.from(container);
    const first = container.subarray(frameOffset(header, 1), frameOffset(header, 1) + stride);
    const second = container.subarray(frameOffset(header, 2), frameOffset(header, 2) + stride);
    swapped.set(second, frameOffset(header, 1));
    swapped.set(first, frameOffset(header, 2));

    await expect(decryptStream(swapped, KEY)).rejects.toThrow();
  });

  it('rejects a flipped ciphertext bit', async () => {
    const container = await seal(bytes(F));
    const header = parseStreamHeader(container);
    container[frameOffset(header, 1) + 4] ^= 0x01;
    await expect(decryptStream(container, KEY)).rejects.toThrow();
  });

  it.each([
    ['frameSizeLog2', 6],
    ['noncePrefix', 8],
    ['wrappedKey', 20],
  ])('rejects tampering with header field %s', async (_field, offset) => {
    const container = await seal(bytes(F));
    container[offset] ^= 0x01;
    await expect(decryptStream(container, KEY)).rejects.toThrow();
  });

  it('rejects tampering with the declared plaintext length', async () => {
    const container = await seal(bytes(F));
    const header = parseStreamHeader(container);
    const lengthOffset = 20 + (header.prefixLength - 28);
    new DataView(container.buffer, container.byteOffset, container.byteLength).setBigUint64(
      lengthOffset,
      BigInt(F - 1),
      false,
    );
    await expect(decryptStream(container, KEY)).rejects.toThrow();
  });

  it('rejects tampering with the metadata frame', async () => {
    const container = await seal(bytes(F));
    const header = parseStreamHeader(container);
    container[header.prefixLength + 2] ^= 0x01;
    await expect(decryptStream(container, KEY)).rejects.toThrow();
  });
});

describe('stream container / credentials', () => {
  it('rejects the wrong URL key', async () => {
    const container = await seal(bytes(F));
    await expect(decryptStream(container, 'x'.repeat(32))).rejects.toThrow();
  });

  it('rejects the wrong password', async () => {
    const container = await seal(bytes(F), PASSWORD);
    await expect(decryptStream(container, KEY, 'not the password')).rejects.toThrow();
  });

  it('rejects the right password with the wrong key', async () => {
    const container = await seal(bytes(F), PASSWORD);
    await expect(decryptStream(container, 'x'.repeat(32), PASSWORD)).rejects.toThrow();
  });

  it('rejects a missing password when the container requires one', async () => {
    const container = await seal(bytes(F), PASSWORD);

    // Callers learn a password is needed from the header, without decrypting —
    // this is what lets the reader prompt instead of reporting a failure.
    expect(parseStreamHeader(container).passwordRequired).toBe(true);
    await expect(decryptStream(container, KEY)).rejects.toMatchObject({
      error: expect.objectContaining({ message: expect.stringMatching(/requires a password/) }),
    });
  });

  it('rejects a password supplied for a container that has none', async () => {
    const container = await seal(bytes(F));
    await expect(decryptStream(container, KEY, PASSWORD)).rejects.toThrow();
  });
});

describe('stream container / interoperability vector', () => {
  // A container generated once and frozen. Any implementation of the format —
  // browser, CLI, or a future port — must open these exact bytes. Deliberately
  // password-free so the fixture does not depend on Argon2 work factors, which
  // the test suite lowers.
  it('opens the frozen golden container', async () => {
    const container = new Uint8Array(Buffer.from(GOLDEN_CONTAINER_B64, 'base64'));
    const { content, metadata } = await decryptStream(container, GOLDEN_KEY);

    expect(new TextDecoder().decode(content)).toBe(GOLDEN_TEXT);
    expect(metadata.name).toBe('golden.txt');
    expect(metadata.type).toBe('text/plain');
    expect(metadata.size).toBe(GOLDEN_TEXT.length);
  });

  it('rejects the golden container under the wrong key', async () => {
    const container = new Uint8Array(Buffer.from(GOLDEN_CONTAINER_B64, 'base64'));
    await expect(decryptStream(container, 'x'.repeat(32))).rejects.toThrow();
  });

  it('reports the documented geometry for the golden container', () => {
    const container = new Uint8Array(Buffer.from(GOLDEN_CONTAINER_B64, 'base64'));
    const header = parseStreamHeader(container);

    expect(header.version).toBe(1);
    expect(header.passwordRequired).toBe(false);
    expect(header.frameSizeLog2).toBe(LOG2);
    expect(header.frameCount).toBe(3);
    expect(header.plaintextLength).toBe(GOLDEN_TEXT.length);
    expect(container.length).toBe(
      header.headerLength + 2 * (F + TAG_LENGTH) + (GOLDEN_TEXT.length - 2 * F) + TAG_LENGTH,
    );
  });
});

describe('stream container / input validation', () => {
  it('rejects an out-of-range frame size', async () => {
    await expect(
      createStreamEncryptor({ key: KEY, plaintextLength: 0, metadata: META, frameSizeLog2: 7 }),
    ).rejects.toThrow();
  });

  it('rejects a CEK of the wrong length', async () => {
    await expect(
      createStreamEncryptor({
        key: KEY,
        plaintextLength: 0,
        metadata: META,
        cek: new Uint8Array(CEK_LENGTH - 1),
      }),
    ).rejects.toThrow();
  });

  it('rejects a frame that is not the declared size', async () => {
    const encryptor = await createStreamEncryptor({
      key: KEY,
      plaintextLength: 2 * F,
      metadata: META,
      frameSizeLog2: LOG2,
    });
    await expect(encryptor.encryptFrame(1, bytes(F - 1))).rejects.toThrow();
  });

  it('rejects a frame index outside the container', async () => {
    const encryptor = await createStreamEncryptor({
      key: KEY,
      plaintextLength: F,
      metadata: META,
      frameSizeLog2: LOG2,
    });
    await expect(encryptor.encryptFrame(2, bytes(F))).rejects.toThrow();
  });
});
