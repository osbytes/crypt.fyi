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

  const encrypt = useCallback((content: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent<MessageResult>) => {
        if (e.data.type === 'success') {
          resolve(e.data.result);
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
      } satisfies Message);
    });
  }, []);

  const decrypt = useCallback((content: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent<MessageResult>) => {
        if (e.data.type === 'success') {
          resolve(e.data.result);
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
      } satisfies Message);
    });
  }, []);

  return useMemo(() => ({ encrypt, decrypt }), [encrypt, decrypt]);
}
