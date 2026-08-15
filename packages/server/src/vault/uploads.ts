import { timingSafeEqual } from 'node:crypto';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { generateRandomString } from '@crypt.fyi/core';
import { MAX_PARTS, MIN_PART_SIZE } from '../storage/types.js';

/**
 * Pending streamed uploads.
 *
 * These live in their own keyspace rather than inside the vault record, so an
 * in-flight upload simply has no vault entry yet: reads, HEAD, burn counters,
 * and the Lua script all keep working untouched, and there is no window in
 * which a reader could observe a half-written object. The vault entry is
 * created only when the upload completes.
 */

const pendingUploadSchema = z.object({
  /** Upload token: bearer credential for sending parts and completing. */
  t: z.string(),
  /** Storage-side multipart upload id. Never leaves the server. */
  s: z.string(),
  /** Object key. */
  k: z.string(),
  /** Declared total ciphertext bytes. */
  e: z.number().int().positive(),
  /** Declared data frame count. */
  n: z.number().int().positive(),
  /** The vault record to write once the upload completes, as JSON. */
  v: z.string(),
  /** Delete token, handed out at init and reused by the completed entry. */
  dt: z.string(),
});
export type PendingUpload = z.infer<typeof pendingUploadSchema>;

export type RecordedPart = { partNumber: number; etag: string; size: number };

export type UploadStore = {
  create(args: {
    id: string;
    uploadToken: string;
    storageUploadId: string;
    objectKey: string;
    expectedBytes: number;
    frames: number;
    vaultRecord: string;
    deleteToken: string;
    windowMs: number;
  }): Promise<void>;
  /** Returns the pending upload only when the token matches. */
  authorize(id: string, uploadToken: string): Promise<PendingUpload | undefined>;
  addPart(id: string, part: RecordedPart, windowMs: number): Promise<void>;
  listParts(id: string): Promise<RecordedPart[]>;
  discard(id: string): Promise<void>;
};

const uploadKey = (id: string) => `upload:${id}`;
const partsKey = (id: string) => `upload:${id}:parts`;

const tokensMatch = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const createRedisUploadStore = (redis: Redis): UploadStore => ({
  async create(args) {
    const pending: PendingUpload = {
      t: args.uploadToken,
      s: args.storageUploadId,
      k: args.objectKey,
      e: args.expectedBytes,
      n: args.frames,
      v: args.vaultRecord,
      dt: args.deleteToken,
    };

    const result = await redis.set(
      uploadKey(args.id),
      JSON.stringify(pending),
      'PX',
      args.windowMs,
      'NX',
    );
    if (result !== 'OK') {
      throw new Error('upload id collision, please retry');
    }
  },

  async authorize(id, uploadToken) {
    const raw = await redis.get(uploadKey(id));
    if (!raw) {
      return undefined;
    }
    const pending = pendingUploadSchema.parse(JSON.parse(raw));
    return tokensMatch(uploadToken, pending.t) ? pending : undefined;
  },

  async addPart(id, part, windowMs) {
    const tx = redis.multi();
    tx.hset(partsKey(id), String(part.partNumber), `${part.etag}:${part.size}`);
    tx.pexpire(partsKey(id), windowMs);
    // Refresh the upload record too. Extending only the parts hash let the
    // record expire underneath an upload that was still running, so a transfer
    // longer than UPLOAD_WINDOW_MS started 404ing while parts were in flight.
    tx.pexpire(uploadKey(id), windowMs);
    await tx.exec();
  },

  async listParts(id) {
    const raw = await redis.hgetall(partsKey(id));
    return Object.entries(raw)
      .map(([partNumber, value]) => {
        // etag may itself contain ':' (it is a quoted hex string), so split on
        // the last separator rather than the first.
        const separator = value.lastIndexOf(':');
        return {
          partNumber: Number(partNumber),
          etag: value.slice(0, separator),
          size: Number(value.slice(separator + 1)),
        };
      })
      .sort((a, b) => a.partNumber - b.partNumber);
  },

  async discard(id) {
    await redis.del(uploadKey(id), partsKey(id));
  },
});

export const createUploadTokenGenerator = (length: number) => ({
  generate: () => generateRandomString(length),
});

/**
 * Validates a part before it is relayed. Parts may be any size the client
 * chooses provided each non-final part clears the storage minimum — the client
 * aligns them to container frames, which the server has no need to know about.
 */
export const validatePart = (args: {
  partNumber: number;
  contentLength: number;
  receivedBytes: number;
  expectedBytes: number;
}): { ok: true } | { ok: false; reason: string } => {
  const { partNumber, contentLength, receivedBytes, expectedBytes } = args;

  if (partNumber > MAX_PARTS) {
    return { ok: false, reason: `part number exceeds the maximum of ${MAX_PARTS}` };
  }
  if (contentLength <= 0) {
    return { ok: false, reason: 'part is empty' };
  }
  if (receivedBytes + contentLength > expectedBytes) {
    return {
      ok: false,
      reason: `part would exceed the declared size of ${expectedBytes} bytes`,
    };
  }
  // Only the part that finishes the payload may fall below the storage minimum.
  const finishesPayload = receivedBytes + contentLength === expectedBytes;
  if (!finishesPayload && contentLength < MIN_PART_SIZE) {
    return {
      ok: false,
      reason: `non-final parts must be at least ${MIN_PART_SIZE} bytes`,
    };
  }
  return { ok: true };
};
