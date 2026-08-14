import { z } from 'zod';
import { isValidWebhookUrl } from './ssrf';

export const processingMetadataSchema = z
  .object({
    compression: z
      .object({
        algorithm: z.enum(['zlib:pako', 'none']),
      })
      .optional(),
    encryption: z.object({
      algorithm: z.enum([
        'aes-256-gcm',
        'ml-kem-768',
        'ml-kem-768-2',
        'ml-kem-768-argon2',
        // Framed AEAD container for payloads above the inline threshold. The
        // ciphertext lives in object storage rather than in `c`; both password
        // and key layers wrap the content key, so no passwordAlgorithm is used.
        'ml-kem-768-stream',
      ]),
      // Optional algorithm for the user-password encryption layer. The primary
      // `algorithm` encrypts the high-entropy URL key layer (which needs no
      // memory-hard KDF); when a password is used, this hardens only that layer.
      // Absent on legacy entries, which encrypt both layers with `algorithm`.
      passwordAlgorithm: z
        .enum(['aes-256-gcm', 'ml-kem-768', 'ml-kem-768-2', 'ml-kem-768-argon2'])
        .optional(),
    }),
  })
  .describe('processing metadata including compression and encryption algorithms');
export type ProcessingMetadata = z.infer<typeof processingMetadataSchema>;

/**
 * Where a streamed payload's ciphertext lives. Present instead of `c` on the
 * object-storage path; the two are mutually exclusive and exactly one must be
 * set (enforced by {@link assertSinglePayload}).
 */
export const blobDescriptorSchema = z
  .object({
    k: z.string().min(1).describe('storage object key'),
    s: z.number().int().nonnegative().describe('ciphertext byte length'),
    n: z.number().int().positive().describe('data frame count'),
    r: z.boolean().default(false).describe('retain the object after the link is burned'),
  })
  .describe('object storage descriptor for streamed payloads');
export type BlobDescriptor = z.infer<typeof blobDescriptorSchema>;

export const vaultValueSchema = z.object({
  // Optional because streamed entries carry `blob` instead. The schema stays a
  // plain object (no superRefine) so `.pick()` / `.omit()` keep working for the
  // request and response contracts derived from it.
  c: z.string().describe('encrypted content').optional(),
  blob: blobDescriptorSchema.optional(),
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
      u: z
        .string()
        .url()
        .refine((url) => isValidWebhookUrl(url, { requireHttps: false }), {
          message:
            'Webhook URL must be a public http(s) URL and must not target a private or reserved address',
        })
        .describe('url of the webhook'),
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

/** A vault entry carries its ciphertext inline or in object storage, never both. */
export const assertSinglePayload = (value: Pick<VaultValue, 'c' | 'blob'>): void => {
  const hasInline = typeof value.c === 'string';
  const hasBlob = value.blob !== undefined;
  if (hasInline === hasBlob) {
    throw new Error(
      hasInline
        ? 'vault entry must not carry both inline content and a blob descriptor'
        : 'vault entry must carry either inline content or a blob descriptor',
    );
  }
};

export type VaultReadResult = Pick<VaultValue, 'c' | 'b' | 'ttl' | 'cd' | 'm' | 'blob'> & {
  /**
   * Whether this read consumed the entry. Callers need it to know when a stored
   * object may be released — the entry is gone, but its bytes are not, and only
   * the caller knows when the transfer finished.
   */
  burned: boolean;
};

export interface Vault {
  set(
    value: Omit<VaultValue, 'dt' | 'cd'> & { ttl: number },
    tokens?: { id: string; dt: string },
  ): Promise<{ id: string; dt: string }>;
  get(id: string, h: string, ip: string): Promise<VaultReadResult | undefined>;
  del(id: string, dt: string): Promise<{ deleted: boolean; blob?: BlobDescriptor }>;
  exists(id: string): Promise<boolean>;
}
