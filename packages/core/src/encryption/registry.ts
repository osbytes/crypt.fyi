import { EncryptionAlgorithm, CompressionAlgorithm } from './types';
import { encrypt as gcmEncrypt, decrypt as gcmDecrypt } from './gcm';
import { encrypt as mlkemEncrypt, decrypt as mlkemDecrypt } from './mlkem';
import { deflate, inflate } from 'pako';
import { ProcessingMetadata } from '../vault';

export const encryptionRegistry: Record<string, EncryptionAlgorithm> = {
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
};

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

export function getEncryptionAlgorithm(name: string): EncryptionAlgorithm {
  const algorithm = encryptionRegistry[name];
  if (!algorithm) {
    throw new Error(`Encryption algorithm ${name} not found in registry`);
  }
  return algorithm;
}

export function getCompressionAlgorithm(name: string): CompressionAlgorithm {
  const algorithm = compressionRegistry[name];
  if (!algorithm) {
    throw new Error(`Compression algorithm ${name} not found in registry`);
  }
  return algorithm;
}

export function validateMetadata(metadata: ProcessingMetadata): void {
  if (metadata.compression?.algorithm && !compressionRegistry[metadata.compression.algorithm]) {
    throw new Error(
      `Compression algorithm ${metadata.compression.algorithm} not found in registry`,
    );
  }

  if (!metadata.encryption?.algorithm || !encryptionRegistry[metadata.encryption.algorithm]) {
    throw new Error(`Encryption algorithm ${metadata.encryption?.algorithm} not found in registry`);
  }
}
