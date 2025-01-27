import { z } from 'zod';
import { vaultValueSchema } from './vault';

export const createVaultRequestSchema = vaultValueSchema.omit({
  cd: true,
  dt: true,
});
export type CreateVaultRequest = z.infer<typeof createVaultRequestSchema>;

export const createVaultResponseSchema = z.object({
  id: z.string().describe('vault id'),
  dt: z.string().describe('delete token'),
});
export type CreateVaultResponse = z.infer<typeof createVaultResponseSchema>;

export const readVaultParamsSchema = z.object({
  vaultId: z.string(),
});
export type ReadVaultParams = z.infer<typeof readVaultParamsSchema>;

export const readVaultQuerySchema = z.object({
  h: z.string().describe('sha512 hash of the encryption key + optional password'),
  h2: z.string().describe('sha256 hash of the encryption key + optional password').optional(),
});
export type ReadVaultQuery = z.infer<typeof readVaultQuerySchema>;

export const readVaultResponseSchema = z.object({
  c: z.string().describe('encrypted content'),
  b: z.boolean().describe('burn after reading'),
  ttl: z.number().describe('time to live (TTL) in milliseconds'),
  cd: z.number().describe('created date time'),
});
export type ReadVaultResponse = z.infer<typeof readVaultResponseSchema>;

export const deleteVaultParamsSchema = z.object({
  vaultId: z.string(),
});
export type DeleteVaultParams = z.infer<typeof deleteVaultParamsSchema>;

export const deleteVaultRequestSchema = z.object({
  dt: z.string(),
});
export type DeleteVaultRequest = z.infer<typeof deleteVaultRequestSchema>;
