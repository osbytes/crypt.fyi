import { gcm } from '@crypt.fyi/core';

export type Message = {
  type: 'encrypt' | 'decrypt';
  content: string;
  password: string;
};

export type MessageResult =
  | {
      type: 'success';
      result: string;
    }
  | {
      type: 'error';
      error: string;
    };

self.onmessage = async (e: MessageEvent<Message>) => {
  if (e.data.type === 'encrypt') {
    try {
      const { content, password } = e.data;
      const result = await gcm.encrypt(content, password);
      self.postMessage({
        type: 'success',
        result,
      } as MessageResult);
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as MessageResult);
    }
  } else if (e.data.type === 'decrypt') {
    try {
      const { content, password } = e.data;
      const result = await gcm.decrypt(content, password);
      self.postMessage({
        type: 'success',
        result,
      } as MessageResult);
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as MessageResult);
    }
  }
};

export {};
