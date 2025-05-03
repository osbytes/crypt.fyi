import { encryptionRegistry, compressionRegistry } from '@crypt.fyi/core';

export type Message = {
  type: 'encrypt' | 'decrypt' | 'compress' | 'decompress';
  content: string;
  password?: string;
  algorithm: string;
};

export type MessageResult =
  | {
      type: 'success';
      result?: string;
    }
  | {
      type: 'error';
      error: string;
    };

self.onmessage = async (e: MessageEvent<Message>) => {
  try {
    const { content, algorithm } = e.data;

    if (e.data.type === 'encrypt' || e.data.type === 'decrypt') {
      const algo = encryptionRegistry[algorithm];
      if (!algo) {
        throw new Error(`Encryption algorithm ${algorithm} not found`);
      }
      if (!e.data.password) {
        throw new Error('Password is required for encryption/decryption');
      }

      const result =
        e.data.type === 'encrypt'
          ? await algo.encrypt(content, e.data.password)
          : await algo.decrypt(content, e.data.password);

      self.postMessage({
        type: 'success',
        result,
      } as MessageResult);
    } else if (e.data.type === 'compress' || e.data.type === 'decompress') {
      const algo = compressionRegistry[algorithm];
      if (!algo) {
        throw new Error(`Compression algorithm ${algorithm} not found`);
      }

      const result =
        e.data.type === 'compress'
          ? Buffer.from(algo.compress(new TextEncoder().encode(content))).toString('base64')
          : new TextDecoder().decode(algo.decompress(Buffer.from(content, 'base64')));

      self.postMessage({
        type: 'success',
        result,
      } as MessageResult);
    } else {
      throw new Error(`Unknown operation type: ${e.data.type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as MessageResult);
  }
};

export {};
