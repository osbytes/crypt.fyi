import { z } from 'zod';

export const processingMetadataSchema = z
  .object({
    compression: z
      .object({
        algorithm: z.enum(['zlib:pako', 'none']),
      })
      .optional(),
    encryption: z.object({
      algorithm: z.enum(['aes-256-gcm', 'ml-kem-768', 'ml-kem-768-2']),
    }),
  })
  .describe('processing metadata including compression and encryption algorithms');
export type ProcessingMetadata = z.infer<typeof processingMetadataSchema>;

export const vaultValueSchema = z.object({
  c: z.string().describe('encrypted content'),
  h: z.string().describe('sha256 hash of the encryption key + optional password'),
  m: processingMetadataSchema.optional(),
  b: z.boolean().describe('burn after reading'),
  dt: z.string().describe('delete token'),
  ttl: z.number().describe('time to live (TTL) in milliseconds'),
  cd: z.number().describe('created date time'),
  ips: z.string().describe('ip/cidr allow-list').optional(),
  rc: z.number().describe('maximum number of times the secret can be read').optional(),
  fc: z.number().min(1).max(10).describe('burn after n failed attempts').optional(),
  wh: z
    .object({
      u: z.string().url().describe('url of the webhook'),
      n: z.string().max(50).describe('name of the secret').optional(),
      r: z.boolean().default(true).describe('should the webhook be called on read'),
      fpk: z
        .boolean()
        .default(false)
        .describe('should the webhook be called for failure to read based on password or key'),
      fip: z
        .boolean()
        .default(false)
        .describe('should the webhook be called for failure to read based on ip address'),
      b: z.boolean().default(false).describe('should the webhook be called for secret burn'),
    })
    .describe('webhook configuration')
    .optional(),
});
export type VaultValue = z.infer<typeof vaultValueSchema>;

export interface Vault {
  set(value: Omit<VaultValue, 'dt' | 'cd'> & { ttl: number }): Promise<{ id: string; dt: string }>;
  get(
    id: string,
    h: string,
    ip: string,
  ): Promise<Pick<VaultValue, 'c' | 'b' | 'ttl' | 'cd' | 'm'> | undefined>;
  del(id: string, dt: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
