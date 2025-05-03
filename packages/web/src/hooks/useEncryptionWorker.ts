import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Message, MessageResult } from '@/workers/encryption.worker';

export function useEncryptionWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/encryption.worker.ts', import.meta.url), {
      type: 'module',
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const encrypt = useCallback((content: string, password: string, algorithm: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent<MessageResult>) => {
        if (e.data.type === 'success') {
          resolve(e.data.result!);
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        }
        workerRef.current?.removeEventListener('message', handleMessage);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        type: 'encrypt',
        content,
        password,
        algorithm,
      } satisfies Message);
    });
  }, []);

  const decrypt = useCallback((content: string, password: string, algorithm: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent<MessageResult>) => {
        if (e.data.type === 'success') {
          resolve(e.data.result!);
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        }
        workerRef.current?.removeEventListener('message', handleMessage);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        type: 'decrypt',
        content,
        password,
        algorithm,
      } satisfies Message);
    });
  }, []);

  const compress = useCallback((content: string, algorithm: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent<MessageResult>) => {
        if (e.data.type === 'success') {
          resolve(e.data.result!);
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        }
        workerRef.current?.removeEventListener('message', handleMessage);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        type: 'compress',
        content,
        algorithm,
      } satisfies Message);
    });
  }, []);

  const decompress = useCallback((content: string, algorithm: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent<MessageResult>) => {
        if (e.data.type === 'success') {
          resolve(e.data.result!);
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        }
        workerRef.current?.removeEventListener('message', handleMessage);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        type: 'decompress',
        content,
        algorithm,
      } satisfies Message);
    });
  }, []);

  return useMemo(() => ({ encrypt, decrypt, compress, decompress }), [encrypt, decrypt, compress, decompress]);
}
