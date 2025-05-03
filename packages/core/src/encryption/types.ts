import { ProcessingMetadata } from '../vault';

export type Encrypt = (data: string, key: string) => Promise<string>;
export type Decrypt = (data: string, key: string) => Promise<string>;
export type Compress = (data: Uint8Array) => Uint8Array;
export type Decompress = (data: Uint8Array) => Uint8Array;

export interface EncryptionAlgorithm {
  name: string;
  encrypt: Encrypt;
  decrypt: Decrypt;
}

export interface CompressionAlgorithm {
  name: string;
  compress: Compress;
  decompress: Decompress;
}

export interface EncodedContent {
  metadata: ProcessingMetadata;
  data: string; // Base64 encoded encrypted/compressed data
}

export class DecryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('decrypt error');
    this.name = 'DecryptError';
    this.error = error;
  }
}

export class EncryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('encrypt error');
    this.name = 'EncryptError';
    this.error = error;
  }
}

export class CompressionError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('compression error');
    this.name = 'CompressionError';
    this.error = error;
  }
}

export class DecompressionError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('decompression error');
    this.name = 'DecompressionError';
    this.error = error;
  }
}
