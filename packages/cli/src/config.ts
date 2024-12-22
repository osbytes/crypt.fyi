import { z } from 'zod';
import Conf from 'conf';

const configSchema = z.object({
  apiUrl: z.string().url().default('https://api.crypt.fyi'),
  webUrl: z.string().url().default('https://crypt.fyi'),
});

export type Config = z.infer<typeof configSchema>;

const store = new Conf<Config>({
  projectName: 'crypt.fyi',
  defaults: {
    apiUrl: 'https://api.crypt.fyi',
    webUrl: 'https://crypt.fyi',
  },
});

export const getConfig = (): Config => {
  return configSchema.parse(store.store);
};

export const setConfig = (config: Partial<Config>) => {
  store.set(configSchema.parse({ ...store.store, ...config }));
};
