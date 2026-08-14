import {
  createStreamEncryptor,
  openStream,
  frameCountFor,
  parseStreamHeader,
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

export type StreamUploadInput = Omit<CreateStreamRequest, 'h' | 'size' | 'frames'> & {
  content: Uint8Array;
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

    const rawKey = await generateRandomString(this.keyLength);
    const hasPassword = password !== undefined && password !== '';

    const encryptor = await createStreamEncryptor({
      key: rawKey,
      password: hasPassword ? password : undefined,
      plaintextLength: content.length,
      metadata: { ...metadata, size: content.length },
      frameSizeLog2,
    });

    const frameSize = encryptor.frameSize;
    const frameCount = encryptor.frameCount;
    const lastFrameSize = content.length - (frameCount - 1) * frameSize;
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
        chunks.push(
          await encryptor.encryptFrame(
            frame,
            content.subarray(start, Math.min(start + frameSize, content.length)),
          ),
        );
        onProgress?.({
          phase: 'encrypting',
          bytes: Math.min(frame * frameSize, content.length),
          total: content.length,
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

  async read(
    id: string,
    key: string,
    password?: string,
    options: { onProgress?: (event: ProgressEvent) => void; signal?: AbortSignal } = {},
  ): Promise<{ content: Uint8Array; metadata: StreamMetadata; burned: boolean }> {
    const hasVersionPrefix = key.startsWith(KEY_VERSION_2_PREFIX);
    const rawKey = hasVersionPrefix ? key.slice(KEY_VERSION_2_PREFIX.length) : key;
    const h = hasVersionPrefix
      ? await deriveVerificationHash('v2', rawKey, password)
      : await deriveVerificationHash('legacy', rawKey);

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
