import type { Config } from '../config.js';
import { createMemoryBlobStorage } from './memory.js';
import { createS3BlobStorage } from './s3.js';
import type { BlobStorage } from './types.js';

export * from './types.js';
export { createMemoryBlobStorage } from './memory.js';
export { createS3BlobStorage } from './s3.js';

/**
 * Date-partitioned object key: `<prefix>/YYYY/MM/DD/<blobId>`.
 *
 * The date prefix is what lifecycle rules and manual auditing key off. `blobId`
 * is generated independently of the vault id — the vault id appears in request
 * paths and therefore in access logs, so reusing it would let anyone holding
 * both logs and bucket access correlate them after a link has been burned.
 *
 * The original filename never appears here; it travels encrypted inside the
 * container's metadata frame.
 */
export const buildObjectKey = (prefix: string, blobId: string, at: Date): string => {
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, '0');
  const day = String(at.getUTCDate()).padStart(2, '0');
  const parts = [prefix.replace(/^\/+|\/+$/g, ''), year, month, day, blobId].filter(
    (part) => part !== '',
  );
  return parts.join('/');
};

export const createBlobStorage = (config: Config): BlobStorage | undefined => {
  if (!config.blobStorageEnabled) {
    return undefined;
  }

  if (config.blobStorageType === 'memory') {
    return createMemoryBlobStorage();
  }

  if (!config.s3Bucket) {
    throw new Error('S3_BUCKET is required when BLOB_STORAGE_TYPE=s3');
  }

  return createS3BlobStorage({
    bucket: config.s3Bucket,
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
    forcePathStyle: config.s3ForcePathStyle,
    prefix: config.blobKeyPrefix,
    serverSideEncryption: config.s3ServerSideEncryption,
  });
};
