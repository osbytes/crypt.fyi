import { EncryptionAlgorithm, CompressionAlgorithm } from './types';
import { encrypt as gcmEncrypt, decrypt as gcmDecrypt } from './gcm';
import { encrypt as mlkemEncrypt, decrypt as mlkemDecrypt } from './mlkem';
import { encrypt as mlkem2Encrypt, decrypt as mlkem2Decrypt } from './mlkem2';
import { encrypt as mlkemArgon2Encrypt, decrypt as mlkemArgon2Decrypt } from './mlkem_argon2';
import { deflate, inflate } from 'pako';
import { ProcessingMetadata } from '../vault';

/**
 * Algorithms that transform a string into a string. The streamed container is
 * deliberately excluded: it is framed, operates on bytes, and is driven through
 * `encryption/stream.ts` rather than through this registry.
 */
export type InlineEncryptionAlgorithm = Exclude<
  ProcessingMetadata['encryption']['algorithm'],
  'ml-kem-768-stream'
>;

export const STREAM_ALGORITHM = 'ml-kem-768-stream' as const;

export const isStreamAlgorithm = (
  algorithm: ProcessingMetadata['encryption']['algorithm'],
): algorithm is typeof STREAM_ALGORITHM => algorithm === STREAM_ALGORITHM;

export const encryptionRegistry: Record<InlineEncryptionAlgorithm, EncryptionAlgorithm> = {
  'aes-256-gcm': {
    name: 'aes-256-gcm',
    encrypt: gcmEncrypt,
    decrypt: gcmDecrypt,
  },
  'ml-kem-768': {
    name: 'ml-kem-768',
    encrypt: mlkemEncrypt,
    decrypt: mlkemDecrypt,
  },
  'ml-kem-768-2': {
    name: 'ml-kem-768-2',
    encrypt: mlkem2Encrypt,
    decrypt: mlkem2Decrypt,
  },
  'ml-kem-768-argon2': {
    name: 'ml-kem-768-argon2',
    encrypt: mlkemArgon2Encrypt,
    decrypt: mlkemArgon2Decrypt,
  },
} as const;

export const compressionRegistry: Record<string, CompressionAlgorithm> = {
  'zlib:pako': {
    name: 'zlib:pako',
    compress: deflate,
    decompress: inflate,
  },
  none: {
    name: 'none',
    compress: (data) => data,
    decompress: (data) => data,
  },
};

export function validateMetadata(metadata: ProcessingMetadata): void {
  if (metadata.compression?.algorithm && !compressionRegistry[metadata.compression.algorithm]) {
    throw new Error(
      `Compression algorithm ${metadata.compression.algorithm} not found in registry`,
    );
  }

  if (!metadata.encryption?.algorithm) {
    throw new Error('Encryption algorithm is required');
  }

  // Streamed payloads never travel through the inline encrypt/decrypt path, so
  // they are valid metadata but have no registry entry.
  if (isStreamAlgorithm(metadata.encryption.algorithm)) {
    return;
  }

  if (!encryptionRegistry[metadata.encryption.algorithm]) {
    throw new Error(`Encryption algorithm ${metadata.encryption.algorithm} not found in registry`);
  }
}
