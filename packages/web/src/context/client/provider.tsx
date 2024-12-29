import { useEncryptionWorker } from '@/hooks/useEncryptionWorker';
import { config } from '../../config';
import { Client } from '@crypt.fyi/core';
import { ReactNode, useMemo } from 'react';
import { ClientContext } from './client';

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const { encrypt, decrypt } = useEncryptionWorker();

  const client = useMemo(
    () =>
      new Client({
        apiUrl: config.API_URL,
        keyLength: 32,
        encrypt,
        decrypt,
      }),
    [encrypt, decrypt],
  );

  return <ClientContext.Provider value={{ client }}>{children}</ClientContext.Provider>;
};
