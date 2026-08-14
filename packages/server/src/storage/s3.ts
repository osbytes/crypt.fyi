import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import type { BlobReadResult, BlobStorage } from './types.js';

export type S3BlobStorageOptions = {
  bucket: string;
  region: string;
  /** Set for MinIO or any other S3-compatible endpoint. */
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** MinIO and most self-hosted gateways need path-style addressing. */
  forcePathStyle: boolean;
  /** Object key prefix, e.g. `secrets`. */
  prefix: string;
};

const isNotFound = (error: unknown): boolean => {
  const meta = (error as { $metadata?: { httpStatusCode?: number }; name?: string }) ?? {};
  return (
    meta.$metadata?.httpStatusCode === 404 || meta.name === 'NoSuchKey' || meta.name === 'NotFound'
  );
};

export const createS3BlobStorage = (options: S3BlobStorageOptions): BlobStorage => {
  const client = new S3Client({
    region: options.region,
    endpoint: options.endpoint,
    forcePathStyle: options.forcePathStyle,
    credentials:
      options.accessKeyId && options.secretAccessKey
        ? { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
        : // Fall through to the default provider chain so IAM roles / IRSA work
          // without credentials in the environment.
          undefined,
  });

  const Bucket = options.bucket;

  return {
    kind: 's3',

    async createUpload(key) {
      const result = await client.send(
        new CreateMultipartUploadCommand({
          Bucket,
          Key: key,
          // The payload is already end-to-end encrypted; this is defence in
          // depth for the bytes at rest, and costs nothing.
          ServerSideEncryption: 'AES256',
        }),
      );
      if (!result.UploadId) {
        throw new Error('storage did not return an upload id');
      }
      return result.UploadId;
    },

    async uploadPart({ key, uploadId, partNumber, body, contentLength }) {
      const result = await client.send(
        new UploadPartCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: body,
          ContentLength: contentLength,
        }),
      );
      if (!result.ETag) {
        throw new Error(`storage did not return an ETag for part ${partNumber}`);
      }
      return result.ETag;
    },

    async completeUpload({ key, uploadId, parts }) {
      await client.send(
        new CompleteMultipartUploadCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: [...parts]
              .sort((a, b) => a.partNumber - b.partNumber)
              .map(({ partNumber, etag }) => ({ PartNumber: partNumber, ETag: etag })),
          },
        }),
      );
    },

    async abortUpload({ key, uploadId }) {
      await client.send(new AbortMultipartUploadCommand({ Bucket, Key: key, UploadId: uploadId }));
    },

    async getStream({ key, range }): Promise<BlobReadResult | undefined> {
      try {
        const result = await client.send(
          new GetObjectCommand({
            Bucket,
            Key: key,
            Range: range ? `bytes=${range.start}-${range.end ?? ''}` : undefined,
          }),
        );
        if (!result.Body) {
          return undefined;
        }

        const contentLength = result.ContentLength ?? 0;
        // ContentRange looks like `bytes 0-99/1234`; the tail is the full size.
        const totalLength = result.ContentRange
          ? Number(result.ContentRange.split('/')[1])
          : contentLength;

        return {
          body: result.Body as Readable,
          contentLength,
          totalLength: Number.isFinite(totalLength) ? totalLength : contentLength,
        };
      } catch (error) {
        if (isNotFound(error)) {
          return undefined;
        }
        throw error;
      }
    },

    async head(key) {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
        return { size: result.ContentLength ?? 0 };
      } catch (error) {
        if (isNotFound(error)) {
          return undefined;
        }
        throw error;
      }
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
    },
  };
};
