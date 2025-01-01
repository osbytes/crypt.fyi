import { Client } from '@crypt.fyi/core';
import { config } from '../../config';
import { createContext, useContext } from 'react';

type ClientContext = {
  client: Client;
};

export const ClientContext = createContext<ClientContext>({
  client: new Client({
    apiUrl: config.API_URL,
    keyLength: 32,
    encrypt: () => Promise.resolve(''),
    decrypt: () => Promise.resolve(''),
  }),
});

export const useClient = () => useContext(ClientContext);
