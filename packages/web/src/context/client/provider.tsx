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
        xClient: `@crypt.fyi/web:${config.GIT_HASH?.substring(0, 8) || config.VERSION || 'unknown'}`,
      }),
    [encrypt, decrypt],
  );

  return <ClientContext.Provider value={{ client }}>{children}</ClientContext.Provider>;
};
