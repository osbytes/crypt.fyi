import { config } from '../../config';
import { Client } from '@crypt.fyi/core';
import { ReactNode, useMemo } from 'react';
import { ClientContext } from './client';

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const client = useMemo(
    () =>
      new Client({
        apiUrl: config.API_URL,
        keyLength: 32,
        xClient: `@crypt.fyi/web:${config.GIT_HASH?.substring(0, 8) || config.VERSION || 'unknown'}`,
      }),
    [],
  );

  return <ClientContext.Provider value={{ client }}>{children}</ClientContext.Provider>;
};
