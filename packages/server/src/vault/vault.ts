import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import z from 'zod';
import { Config } from '../config';

const randomBytesAsync = promisify(randomBytes);

export const vaultValueSchema = z.object({
  c: z.string().describe('encrypted content'),
  h: z.string().describe('sha256 hash of the encryption key + optional password'),
  b: z.boolean().describe('burn after reading'),
  dt: z.string().describe('delete token'),
  ttl: z.number().describe('time to live (TTL) in milliseconds'),
  cd: z.number().describe('created date time'),
  ips: z.string().describe('ip/cidr allow-list').optional(),
  rc: z.number().describe('maximum number of times the secret can be read').optional(),
});
export type VaultValue = z.infer<typeof vaultValueSchema>;

export interface Vault {
  set(value: Omit<VaultValue, 'dt' | 'cd'> & { ttl: number }): Promise<{ id: string; dt: string }>;
  get(id: string, h: string, ip: string): Promise<Omit<VaultValue, 'dt' | 'h'> | undefined>;
  del(id: string, dt: string): Promise<boolean>;
}

export const createTokens = async (config: Config) => {
  const [id, dt] = await Promise.all([
    (await randomBytesAsync(config.vaultEntryIdentifierLength))
      .toString('base64url')
      .slice(0, config.vaultEntryIdentifierLength),
    (await randomBytesAsync(config.vaultEntryDeleteTokenLength))
      .toString('base64url')
      .slice(0, config.vaultEntryDeleteTokenLength),
  ]);
  return { id, dt };
};

export class InvalidKeyAndOrPasswordError extends Error {
  constructor() {
    super('invalid key and/or password');
  }
}
