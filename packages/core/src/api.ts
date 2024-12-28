import { z } from 'zod';

export const createVaultRequestSchema = z.object({
  c: z.string().describe('encrypted content'),
  h: z.string().describe('sha256 hash of the encryption key + optional password'),
  b: z.boolean().default(true).describe('burn after reading'),
  ttl: z.number().describe('time to live (TTL) in milliseconds'),
  ips: z.string().default('').optional().describe('IP address or CIDR block restrictions'),
  rc: z.number().optional().describe('maximum number of times the secret can be read'),
  wh: z
    .object({
      u: z.string().url().describe('url of the webhook'),
      n: z.string().min(1).max(50).describe('name of the secret').optional(),
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
export type CreateVaultRequest = z.infer<typeof createVaultRequestSchema>;

export const createVaultResponseSchema = z.object({
  id: z.string().describe('vault id'),
  dt: z.string().describe('delete token'),
});
export type CreateVaultResponse = z.infer<typeof createVaultResponseSchema>;

export const getVaultParamsSchema = z.object({
  vaultId: z.string(),
});
export type GetVaultParams = z.infer<typeof getVaultParamsSchema>;

export const getVaultQuerySchema = z.object({
  h: z.string().describe('sha256 hash of the encryption key + optional password'),
});
export type GetVaultQuery = z.infer<typeof getVaultQuerySchema>;

export const getVaultResponseSchema = z.object({
  c: z.string().describe('encrypted content'),
  b: z.boolean().describe('burn after reading'),
  ttl: z.number().describe('time to live (TTL) in milliseconds'),
  cd: z.number().describe('created date time'),
});
export type GetVaultResponse = z.infer<typeof getVaultResponseSchema>;

export const deleteVaultParamsSchema = z.object({
  vaultId: z.string(),
});
export type DeleteVaultParams = z.infer<typeof deleteVaultParamsSchema>;

export const deleteVaultRequestSchema = z.object({
  dt: z.string(),
});
export type DeleteVaultRequest = z.infer<typeof deleteVaultRequestSchema>;
