import z from 'zod';

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
  get(
    id: string,
    h: string,
    ip: string,
  ): Promise<Pick<VaultValue, 'c' | 'b' | 'ttl' | 'cd'> | undefined>;
  del(id: string, dt: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

export class InvalidKeyAndOrPasswordError extends Error {
  constructor() {
    super('invalid key and/or password');
  }
}
