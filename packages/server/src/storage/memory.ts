import { Readable } from 'node:stream';
import { randomUUID, createHash } from 'node:crypto';
import {
  BlobNotFoundError,
  UploadNotFoundError,
  type BlobStorage,
  type BlobReadResult,
  type UploadedPart,
} from './types.js';

/**
 * In-process blob storage.
 *
 * Exists so the streaming routes can be exercised end to end — including part
 * ordering, size accounting, and range reads — without standing up MinIO. It is
 * also a usable single-node development backend. It is not a production
 * backend: everything is lost on restart and bounded by heap.
 */
export const createMemoryBlobStorage = (): BlobStorage & {
  size(): number;
  clear(): void;
  patch(key: string, offset: number, value: number): void;
  keys(): string[];
} => {
  const objects = new Map<string, Buffer>();
  const uploads = new Map<string, { key: string; parts: Map<number, Buffer> }>();

  const drain = async (stream: Readable): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  };

  return {
    kind: 'memory',

    async createUpload(key) {
      const uploadId = randomUUID();
      uploads.set(uploadId, { key, parts: new Map() });
      return uploadId;
    },

    async uploadPart({ key, uploadId, partNumber, body, contentLength }) {
      const upload = uploads.get(uploadId);
      if (!upload || upload.key !== key) {
        throw new UploadNotFoundError(uploadId);
      }

      const buffer = await drain(body);
      if (buffer.length !== contentLength) {
        throw new Error(
          `part ${partNumber} declared ${contentLength} bytes but carried ${buffer.length}`,
        );
      }

      upload.parts.set(partNumber, buffer);
      return `"${createHash('md5').update(buffer).digest('hex')}"`;
    },

    async completeUpload({ key, uploadId, parts }) {
      const upload = uploads.get(uploadId);
      if (!upload || upload.key !== key) {
        throw new UploadNotFoundError(uploadId);
      }

      const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);
      const buffers: Buffer[] = [];
      for (const { partNumber } of ordered) {
        const part = upload.parts.get(partNumber);
        if (!part) {
          throw new Error(`part ${partNumber} was never uploaded`);
        }
        buffers.push(part);
      }

      objects.set(key, Buffer.concat(buffers));
      uploads.delete(uploadId);
    },

    async abortUpload({ uploadId }) {
      uploads.delete(uploadId);
    },

    async getStream({ key, range }): Promise<BlobReadResult | undefined> {
      const object = objects.get(key);
      if (!object) {
        return undefined;
      }

      const start = range?.start ?? 0;
      const end = range?.end ?? object.length - 1;
      if (start >= object.length || start > end) {
        throw new Error(`range ${start}-${end} is outside the object`);
      }

      const slice = object.subarray(start, end + 1);
      return {
        body: Readable.from(slice),
        contentLength: slice.length,
        totalLength: object.length,
      };
    },

    async head(key) {
      const object = objects.get(key);
      return object ? { size: object.length } : undefined;
    },

    async delete(key) {
      objects.delete(key);
    },

    size() {
      return objects.size;
    },

    /**
     * Test affordance: flip a byte in a stored object so a reader has to
     * detect it. There is no production path that mutates stored bytes.
     */
    patch(key: string, offset: number, value: number) {
      const object = objects.get(key);
      if (!object) {
        throw new BlobNotFoundError(key);
      }
      object[offset] = value;
    },

    keys() {
      return [...objects.keys()];
    },

    clear() {
      objects.clear();
      uploads.clear();
    },
  };
};

export const assertBlobExists = (
  result: BlobReadResult | undefined,
  key: string,
): BlobReadResult => {
  if (!result) {
    throw new BlobNotFoundError(key);
  }
  return result;
};

export type { UploadedPart };
