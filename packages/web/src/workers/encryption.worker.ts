import { encrypt } from '@crypt.fyi/core';

export type EncryptMessage = {
  type: 'encrypt';
  content: string;
  password: string;
};

export type EncryptMessageResult =
  | {
      type: 'success';
      result: string;
    }
  | {
      type: 'error';
      error: string;
    };

self.onmessage = async (e: MessageEvent<EncryptMessage>) => {
  if (e.data.type === 'encrypt') {
    try {
      const { content, password } = e.data;
      const result = await encrypt(content, password);
      self.postMessage({
        type: 'success',
        result,
      } as EncryptMessageResult);
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as EncryptMessageResult);
    }
  }
};

export {};
