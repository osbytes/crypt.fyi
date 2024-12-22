import { z } from 'zod';

const configSchema = z.object({
  apiUrl: z.string().url().default('https://api.crypt.fyi'),
  webUrl: z.string().url().default('https://crypt.fyi'),
});

export type Config = z.infer<typeof configSchema>;

export const config = configSchema.parse({
  apiUrl: process.env.CRYPT_FYI_API_URL,
  webUrl: process.env.CRYPT_FYI_WEB_URL,
});
