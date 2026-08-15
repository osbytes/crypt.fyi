import {
  createStreamEncryptor,
  openStream,
  frameCountFor,
  parseStreamHeader,
  readWrappedKeyLength,
  HEADER_FIXED_LENGTH,
  TAG_LENGTH,
  DEFAULT_FRAME_SIZE_LOG2,
  type StreamMetadata,
} from './encryption/stream';
import { generateRandomString } from './random';
import { deriveVerificationHash } from './verification';
import { KEY_VERSION_2_PREFIX } from './verification';
import type { CreateStreamRequest, CreateStreamResponse, CreateVaultResponse } from './api';
import { ErrorNotFound, ErrorInvalidKeyAndOrPassword, ErrorUnexpectedStatus } from './client';

/** S3's floor for every part but the last; mirrored from the server. */
const MIN_PART_SIZE = 5 * 1024 * 1024;

export type ProgressPhase = 'encrypting' | 'uploading' | 'downloading' | 'decrypting';

export type ProgressEvent = {
  phase: ProgressPhase;
  /** Plaintext (or ciphertext, when transferring) bytes handled so far. */
  bytes: number;
  total: number;
};

/**
 * Payloads above the inline threshold take the streamed path. Kept here so the
 * client, the UI, and the CLI all route on the same number.
 */
export const INLINE_PAYLOAD_MAX_BYTES = 1024 * 1024;

/**
 * A payload the client can read piecewise. A `File` never has to be resident:
 * only the frames currently being encrypted are in memory.
 */
export type ByteSource = {
  size: number;
  slice(start: number, end: number): Promise<Uint8Array>;
};

export const bytesToSource = (bytes: Uint8Array): ByteSource => ({
  size: bytes.length,
  slice: async (start, end) => bytes.subarray(start, end),
});

/** Backs a source with a Blob or File, which reads lazily from disk. */
export const blobToSource = (blob: Blob): ByteSource => ({
  size: blob.size,
  slice: async (start, end) => new Uint8Array(await blob.slice(start, end).arrayBuffer()),
});

// Blob is absent in some runtimes, so probe before testing against it — an
// inline `typeof` guard also stops TypeScript narrowing the union.
const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== 'undefined' && value instanceof Blob;

const toByteSource = (input: Uint8Array | Blob | ByteSource): ByteSource => {
  if (input instanceof Uint8Array) return bytesToSource(input);
  if (isBlob(input)) return blobToSource(input);
  return input;
};

/**
 * Reads an exact number of bytes at a time from a response stream.
 *
 * Chunks are held in a list and only assembled when a caller asks for them, so
 * filling a 4 MiB frame from 64 KB network chunks costs one copy rather than
 * one per chunk.
 */
const createByteReader = (stream: ReadableStream<Uint8Array>) => {
  const reader = stream.getReader();
  let chunks: Uint8Array[] = [];
  let buffered = 0;
  let exhausted = false;

  const pull = async (): Promise<boolean> => {
    if (exhausted) return false;
    const { value, done } = await reader.read();
    if (done) {
      exhausted = true;
      return false;
    }
    if (value?.length) {
      chunks.push(value);
      buffered += value.length;
    }
    return true;
  };

  return {
    async readExactly(length: number): Promise<Uint8Array> {
      while (buffered < length) {
        if (!(await pull())) {
          throw new Error(`stream ended after ${buffered} bytes, expected ${length}`);
        }
      }

      const out = new Uint8Array(length);
      let offset = 0;
      while (offset < length) {
        const chunk = chunks[0];
        const take = Math.min(chunk.length, length - offset);
        out.set(chunk.subarray(0, take), offset);
        offset += take;
        if (take === chunk.length) {
          chunks.shift();
        } else {
          chunks[0] = chunk.subarray(take);
        }
      }
      buffered -= length;
      return out;
    },
    async cancel(reason?: unknown) {
      chunks = [];
      buffered = 0;
      await reader.cancel(reason).catch(() => undefined);
    },
  };
};

export type StreamUploadInput = Omit<CreateStreamRequest, 'h' | 'size' | 'frames'> & {
  content: Uint8Array | Blob | ByteSource;
  metadata: Omit<StreamMetadata, 'size'>;
  password?: string;
  frameSizeLog2?: number;
  onProgress?: (event: ProgressEvent) => void;
  signal?: AbortSignal;
};

/**
 * A part is a whole number of frames, so a failed part can be re-encrypted
 * byte-for-byte and retried without touching its neighbours. Part 1 also
 * carries the container header.
 *
 * Every part except the last must clear the storage minimum, which is what
 * decides how many frames get grouped together.
 */
export const planParts = (args: {
  headerLength: number;
  frameCount: number;
  frameSize: number;
  lastFrameSize: number;
  minPartSize?: number;
}): Array<{ firstFrame: number; lastFrame: number; bytes: number }> => {
  const { headerLength, frameCount, frameSize, lastFrameSize } = args;
  const minPartSize = args.minPartSize ?? MIN_PART_SIZE;
  const sealedFrameSize = frameSize + TAG_LENGTH;

  const parts: Array<{ firstFrame: number; lastFrame: number; bytes: number }> = [];
  let firstFrame = 1;
  let bytes = headerLength;

  for (let frame = 1; frame <= frameCount; frame++) {
    bytes += frame === frameCount ? lastFrameSize + TAG_LENGTH : sealedFrameSize;

    const isLastFrame = frame === frameCount;
    // Close the part once it clears the minimum, or when the payload runs out.
    if (bytes >= minPartSize || isLastFrame) {
      parts.push({ firstFrame, lastFrame: frame, bytes });
      firstFrame = frame + 1;
      bytes = 0;
    }
  }

  // If the tail part came out below the minimum it cannot stand alone unless it
  // is the only part, so fold it into its predecessor.
  if (parts.length > 1) {
    const tail = parts[parts.length - 1];
    if (tail.bytes < minPartSize) {
      const previous = parts[parts.length - 2];
      previous.lastFrame = tail.lastFrame;
      previous.bytes += tail.bytes;
      parts.pop();
    }
  }

  return parts;
};

/**
 * Drives the streamed upload and download flows: container framing, part
 * planning, and the three-call transport. Deliberately free of browser APIs so
 * it runs in the CLI and under test; a worker or a UI wraps it rather than
 * reimplementing it.
 */
export class StreamClient {
  private readonly apiUrl: string;
  private readonly keyLength: number;
  private readonly xClient: string | undefined;

  constructor({
    apiUrl,
    keyLength = 32,
    xClient,
  }: {
    apiUrl: string;
    keyLength?: number;
    xClient?: string;
  }) {
    this.apiUrl = apiUrl;
    this.keyLength = keyLength;
    this.xClient = xClient;
  }

  private headers(contentType = 'application/json') {
    const headers: Record<string, string> = { 'Content-Type': contentType };
    if (this.xClient) {
      headers['X-Client'] = this.xClient;
    }
    return headers;
  }

  async create(input: StreamUploadInput): Promise<CreateVaultResponse & { key: string }> {
    const {
      content,
      metadata,
      password,
      frameSizeLog2 = DEFAULT_FRAME_SIZE_LOG2,
      onProgress,
      signal,
      ...vaultFields
    } = input;

    const source = toByteSource(content);
    const rawKey = await generateRandomString(this.keyLength);
    const hasPassword = password !== undefined && password !== '';

    const encryptor = await createStreamEncryptor({
      key: rawKey,
      password: hasPassword ? password : undefined,
      plaintextLength: source.size,
      metadata: { ...metadata, size: source.size },
      frameSizeLog2,
    });

    const frameSize = encryptor.frameSize;
    const frameCount = encryptor.frameCount;
    const lastFrameSize = source.size - (frameCount - 1) * frameSize;
    const parts = planParts({
      headerLength: encryptor.header.length,
      frameCount,
      frameSize,
      lastFrameSize,
    });
    const totalBytes = parts.reduce((sum, part) => sum + part.bytes, 0);

    const opened = await fetch(`${this.apiUrl}/vault/stream`, {
      method: 'POST',
      headers: this.headers(),
      signal,
      body: JSON.stringify({
        ...vaultFields,
        h: hasPassword
          ? await deriveVerificationHash('v2', rawKey, password)
          : await deriveVerificationHash('legacy', rawKey),
        size: totalBytes,
        frames: frameCount,
      }),
    });
    if (!opened.ok) {
      throw new ErrorUnexpectedStatus(opened.status);
    }
    const session = (await opened.json()) as CreateStreamResponse;

    let uploaded = 0;
    for (const [index, part] of parts.entries()) {
      const chunks: Uint8Array[] = [];
      if (index === 0) {
        chunks.push(encryptor.header);
      }

      for (let frame = part.firstFrame; frame <= part.lastFrame; frame++) {
        const start = (frame - 1) * frameSize;
        // Only this frame is resident; a File is read from disk on demand.
        const plaintext = await source.slice(start, Math.min(start + frameSize, source.size));
        chunks.push(await encryptor.encryptFrame(frame, plaintext));
        onProgress?.({
          phase: 'encrypting',
          bytes: Math.min(frame * frameSize, source.size),
          total: source.size,
        });
      }

      const body = concat(chunks);
      const res = await fetch(
        `${this.apiUrl}/vault/stream/${session.id}/parts/${index + 1}?ut=${encodeURIComponent(session.ut)}`,
        { method: 'PUT', headers: this.headers('application/octet-stream'), body, signal },
      );
      if (!res.ok) {
        throw new ErrorUnexpectedStatus(res.status);
      }

      uploaded += body.length;
      onProgress?.({ phase: 'uploading', bytes: uploaded, total: totalBytes });
    }

    const completed = await fetch(`${this.apiUrl}/vault/stream/${session.id}/complete`, {
      method: 'POST',
      headers: this.headers(),
      signal,
      body: JSON.stringify({ ut: session.ut }),
    });
    if (!completed.ok) {
      throw new ErrorUnexpectedStatus(completed.status);
    }

    return {
      id: session.id,
      dt: session.dt,
      key: hasPassword ? `${KEY_VERSION_2_PREFIX}${rawKey}` : rawKey,
    };
  }

  /**
   * Streams a payload straight into a sink, decrypting frame by frame.
   *
   * Nothing larger than one frame is ever resident, so this is what a
   * multi-gigabyte download has to use — `read` below buffers the whole
   * container and is only appropriate for payloads that fit in memory.
   *
   * The sink applies backpressure through its writer, so a slow disk throttles
   * the network rather than filling the heap.
   */
  /** The shared key is version-prefixed when a password is required. */
  private async credentials(key: string, password: string | undefined) {
    const hasVersionPrefix = key.startsWith(KEY_VERSION_2_PREFIX);
    const rawKey = hasVersionPrefix ? key.slice(KEY_VERSION_2_PREFIX.length) : key;
    return {
      rawKey,
      h: hasVersionPrefix
        ? await deriveVerificationHash('v2', rawKey, password)
        : await deriveVerificationHash('legacy', rawKey),
    };
  }

  async readToSink(
    id: string,
    key: string,
    password: string | undefined,
    options: {
      sink: WritableStream<Uint8Array>;
      /**
       * Fires once the header authenticates and before any payload byte is
       * written. The filename lives inside the encrypted container, so this is
       * the earliest a caller can name the download.
       */
      onMetadata?: (metadata: StreamMetadata) => void | Promise<void>;
      onProgress?: (event: ProgressEvent) => void;
      signal?: AbortSignal;
    },
  ): Promise<{ metadata: StreamMetadata; burned: boolean }> {
    const { rawKey, h } = await this.credentials(key, password);

    const res = await fetch(`${this.apiUrl}/vault/${id}?h=${h}`, {
      headers: this.headers(),
      signal: options.signal,
    });
    if (!res.ok) {
      if (res.status === 400) throw new ErrorInvalidKeyAndOrPassword();
      if (res.status === 404) throw new ErrorNotFound();
      throw new ErrorUnexpectedStatus(res.status);
    }
    if (!res.body) {
      throw new Error('response carried no body');
    }
    if (res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('this secret is stored inline; use read() instead');
    }

    const burned = res.headers.get('x-crypt-burned') === 'true';
    const reader = createByteReader(res.body);
    const writer = options.sink.getWriter();

    try {
      // The header is variable length: read the fixed head, learn the wrapped
      // key length, then the rest of the prefix and the metadata frame.
      const head = await reader.readExactly(HEADER_FIXED_LENGTH);
      const wrappedKeyLength = readWrappedKeyLength(head);
      const rest = await reader.readExactly(28 + wrappedKeyLength - HEADER_FIXED_LENGTH);

      const prefix = new Uint8Array(head.length + rest.length);
      prefix.set(head, 0);
      prefix.set(rest, head.length);

      const parsed = parseStreamHeader(prefix);
      const metaFrame = await reader.readExactly(parsed.metaLength);

      const headerBytes = new Uint8Array(prefix.length + metaFrame.length);
      headerBytes.set(prefix, 0);
      headerBytes.set(metaFrame, prefix.length);

      const decryptor = await openStream(headerBytes, rawKey, password);
      const { header } = decryptor;
      await options.onMetadata?.(decryptor.metadata);
      let written = 0;

      for (let frame = 1; frame <= header.frameCount; frame++) {
        const isFinal = frame === header.frameCount;
        const plaintextLength = isFinal
          ? header.plaintextLength - (header.frameCount - 1) * header.frameSize
          : header.frameSize;

        const sealed = await reader.readExactly(plaintextLength + TAG_LENGTH);
        const opened = await decryptor.decryptFrame(frame, sealed);

        // Backpressure lives here: a slow sink slows the whole pipeline.
        await writer.write(opened);
        written += opened.length;
        options.onProgress?.({
          phase: 'downloading',
          bytes: written,
          total: header.plaintextLength,
        });
      }

      if (written !== header.plaintextLength) {
        throw new Error(`recovered ${written} bytes, header declares ${header.plaintextLength}`);
      }

      await writer.close();
      return { metadata: decryptor.metadata, burned };
    } catch (error) {
      await reader.cancel(error);
      await writer.abort(error).catch(() => undefined);
      throw error;
    }
  }

  async read(
    id: string,
    key: string,
    password?: string,
    options: { onProgress?: (event: ProgressEvent) => void; signal?: AbortSignal } = {},
  ): Promise<{ content: Uint8Array; metadata: StreamMetadata; burned: boolean }> {
    const { rawKey, h } = await this.credentials(key, password);

    const res = await fetch(`${this.apiUrl}/vault/${id}?h=${h}`, {
      headers: this.headers(),
      signal: options.signal,
    });
    if (!res.ok) {
      if (res.status === 400) throw new ErrorInvalidKeyAndOrPassword();
      if (res.status === 404) throw new ErrorNotFound();
      throw new ErrorUnexpectedStatus(res.status);
    }

    const container = new Uint8Array(await res.arrayBuffer());
    const burned = res.headers.get('x-crypt-burned') === 'true';

    const decryptor = await openStream(container, rawKey, password);
    const { header } = decryptor;
    const content = new Uint8Array(header.plaintextLength);
    let written = 0;

    for (let frame = 1; frame <= header.frameCount; frame++) {
      const start = header.headerLength + (frame - 1) * (header.frameSize + TAG_LENGTH);
      const isFinal = frame === header.frameCount;
      const end = isFinal ? container.length : start + header.frameSize + TAG_LENGTH;
      const opened = await decryptor.decryptFrame(frame, container.subarray(start, end));
      content.set(opened, written);
      written += opened.length;
      options.onProgress?.({
        phase: 'decrypting',
        bytes: written,
        total: header.plaintextLength,
      });
    }

    if (written !== header.plaintextLength) {
      throw new Error(`recovered ${written} bytes, header declares ${header.plaintextLength}`);
    }

    return { content, metadata: decryptor.metadata, burned };
  }
}

const concat = (chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

export { frameCountFor, parseStreamHeader };
