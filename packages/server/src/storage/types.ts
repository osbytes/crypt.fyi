import type { Readable } from 'node:stream';

/**
 * Object storage for streamed ciphertext.
 *
 * The API mirrors S3 multipart deliberately: parts arrive as independent HTTP
 * requests (a single body would exceed proxy limits and would have to be
 * buffered), and each one is relayed straight through. Nothing here ever holds
 * a whole payload — implementations must stream.
 *
 * Storage endpoints are never exposed to clients. Presigned URLs are not part
 * of this interface by design; every byte is relayed by the API so the bucket
 * stays private.
 */
export interface BlobStorage {
  readonly kind: string;

  /**
   * Opens a multipart upload and returns the storage-side upload id.
   *
   * `retain` is written as an object tag so lifecycle rules can distinguish
   * ephemeral objects — reapable days after their TTL — from ones deliberately
   * kept past a burn. Redis key expiry is silent, so lifecycle rules are the
   * only reliable backstop against orphans.
   */
  createUpload(key: string, options?: { retain?: boolean }): Promise<string>;

  /**
   * Relays one part. `contentLength` is required because S3 cannot size a
   * stream, and it is the value validated against the declared total.
   */
  uploadPart(args: {
    key: string;
    uploadId: string;
    partNumber: number;
    body: Readable;
    contentLength: number;
  }): Promise<string>;

  /** Assembles the parts into a single object. */
  completeUpload(args: { key: string; uploadId: string; parts: UploadedPart[] }): Promise<void>;

  /** Discards an incomplete upload and any parts already stored. */
  abortUpload(args: { key: string; uploadId: string }): Promise<void>;

  getStream(args: {
    key: string;
    range?: { start: number; end?: number };
  }): Promise<BlobReadResult | undefined>;

  head(key: string): Promise<{ size: number } | undefined>;

  delete(key: string): Promise<void>;
}

export type UploadedPart = {
  partNumber: number;
  etag: string;
};

export type BlobReadResult = {
  body: Readable;
  /** Bytes in this response — the range length when a range was requested. */
  contentLength: number;
  /** Bytes in the whole object, regardless of range. */
  totalLength: number;
};

/** S3's floor for every part except the last. */
export const MIN_PART_SIZE = 5 * 1024 * 1024;
/** S3's ceiling on parts per multipart upload. */
export const MAX_PARTS = 10_000;

export class BlobNotFoundError extends Error {
  constructor(key: string) {
    super(`blob not found: ${key}`);
    this.name = 'BlobNotFoundError';
  }
}

export class UploadNotFoundError extends Error {
  constructor(uploadId: string) {
    super(`upload not found: ${uploadId}`);
    this.name = 'UploadNotFoundError';
  }
}
