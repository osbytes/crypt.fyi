import { z } from 'zod';
import { vaultValueSchema } from './vault';

export const createVaultRequestSchema = vaultValueSchema
  .omit({
    cd: true,
    dt: true,
    blob: true,
  })
  // `c` is optional on the shared vault schema because streamed entries carry a
  // blob instead. The inline create always has content, so re-require it here.
  .extend({ c: z.string().describe('encrypted content') });
export type CreateVaultRequest = z.infer<typeof createVaultRequestSchema>;

/**
 * Opens a streamed upload. Everything the inline create takes except the
 * payload itself, plus the ciphertext geometry the server needs to size and
 * validate the transfer. The entry is not readable until the upload completes.
 */
export const createStreamRequestSchema = vaultValueSchema
  .omit({ c: true, cd: true, dt: true, blob: true })
  .extend({
    size: z.number().int().positive().describe('total ciphertext byte length'),
    frames: z.number().int().positive().describe('data frame count'),
  });
export type CreateStreamRequest = z.infer<typeof createStreamRequestSchema>;

export const createStreamResponseSchema = z.object({
  id: z.string().describe('vault id'),
  dt: z.string().describe('delete token'),
  ut: z.string().describe('upload token, required to send parts and to complete'),
  minPartSize: z.number().describe('minimum bytes per part; the final part may be smaller'),
  maxParts: z.number().describe('maximum number of parts'),
});
export type CreateStreamResponse = z.infer<typeof createStreamResponseSchema>;

export const uploadPartParamsSchema = z.object({
  vaultId: z.string(),
  partNumber: z.coerce.number().int().min(1),
});
export type UploadPartParams = z.infer<typeof uploadPartParamsSchema>;

export const uploadPartQuerySchema = z.object({
  ut: z.string().describe('upload token'),
});
export type UploadPartQuery = z.infer<typeof uploadPartQuerySchema>;

export const completeStreamParamsSchema = z.object({
  vaultId: z.string(),
});
export type CompleteStreamParams = z.infer<typeof completeStreamParamsSchema>;

export const completeStreamRequestSchema = z.object({
  ut: z.string().describe('upload token'),
});
export type CompleteStreamRequest = z.infer<typeof completeStreamRequestSchema>;

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

/**
 * What a deployment accepts. Fetched at runtime so the UI reflects the server
 * it is actually talking to, rather than whatever was baked in at build time.
 */
export const serverConfigResponseSchema = z.object({
  maxFileSize: z.number(),
  streaming: z.boolean(),
  inlineThreshold: z.number(),
});
export type ServerConfigResponse = z.infer<typeof serverConfigResponseSchema>;
