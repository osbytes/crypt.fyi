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
});
export type ReadVaultQuery = z.infer<typeof readVaultQuerySchema>;

export const readVaultResponseSchema = vaultValueSchema.pick({
  c: true,
  b: true,
  ttl: true,
  cd: true,
  m: true,
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
