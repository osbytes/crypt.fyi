import { z } from 'zod';
import { isValidWebhookUrl } from '@crypt.fyi/core';
import { CONFIG_KEYS, MAX_IP_RESTRICTIONS, TTL_OPTIONS } from './config';

const ttlValues = TTL_OPTIONS.map((o) => o.value);

const ipsSchema = z
  .union([z.string(), z.null()])
  .optional()
  .superRefine((val, ctx) => {
    if (val == null || !String(val).trim()) return;

    const ips = String(val)
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (ips.length > MAX_IP_RESTRICTIONS) {
      ctx.addIssue({
        code: 'custom',
        message: `At most ${MAX_IP_RESTRICTIONS} IP/CIDR entries allowed`,
      });
      return;
    }

    for (const ip of ips) {
      const isValidIP = z.union([z.ipv4(), z.ipv6()]).safeParse(ip).success;
      const isValidCIDR = z.union([z.cidrv4(), z.cidrv6()]).safeParse(ip).success;
      if (!isValidIP && !isValidCIDR) {
        ctx.addIssue({
          code: 'custom',
          message: `Invalid IP or CIDR: ${ip}`,
        });
        return;
      }
    }
  });

function publicHttpUrlRefine(label: string) {
  return (val: string, ctx: z.RefinementCtx) => {
    try {
      if (!isValidWebhookUrl(val, { requireHttps: false })) {
        ctx.addIssue({
          code: 'custom',
          message: `${label} must be a public http(s) URL and must not target a private or reserved address`,
        });
      }
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid ${label}`,
      });
    }
  };
}

const webhookUrlSchema = z
  .union([z.string(), z.null()])
  .optional()
  .superRefine((val, ctx) => {
    if (val == null || !String(val).trim()) return;
    publicHttpUrlRefine('Webhook URL')(String(val), ctx);
  });

const optionalNumber = z.union([z.number().int(), z.null()]).optional();

/** Partial overrides from storage.managed / storage.sync / import JSON. */
export const configOverrideSchema = z
  .object({
    // Same public-host rules as webhooks — blocks literal private/metadata targets.
    apiUrl: z.string().superRefine(publicHttpUrlRefine('API URL')).optional(),
    webUrl: z.string().superRefine(publicHttpUrlRefine('Web URL')).optional(),
    ttl: z
      .number()
      .refine((n) => (ttlValues as number[]).includes(n), {
        message: 'TTL must be one of the supported durations',
      })
      .optional(),
    burn: z.boolean().optional(),
    ips: ipsSchema,
    rc: optionalNumber.refine((n) => n == null || (n >= 2 && n <= 10), {
      message: 'Read count must be between 2 and 10',
    }),
    fc: optionalNumber.refine((n) => n == null || (n >= 1 && n <= 10), {
      message: 'Failure count must be between 1 and 10',
    }),
    webhookUrl: webhookUrlSchema,
    webhookName: z.union([z.string().max(50), z.null()]).optional(),
    webhookOnRead: z.boolean().optional(),
    webhookOnFailPassword: z.boolean().optional(),
    webhookOnFailIp: z.boolean().optional(),
    webhookOnBurn: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.burn === true && data.rc != null) {
      ctx.addIssue({
        code: 'custom',
        path: ['rc'],
        message: 'Read count cannot be set when burn-after-reading is enabled',
      });
    }

    const webhookUrl = data.webhookUrl == null ? '' : String(data.webhookUrl).trim();
    if (webhookUrl) {
      const onRead = data.webhookOnRead ?? true;
      const onFailPassword = data.webhookOnFailPassword ?? false;
      const onFailIp = data.webhookOnFailIp ?? false;
      const onBurn = data.webhookOnBurn ?? false;
      if (!(onRead || onFailPassword || onFailIp || onBurn)) {
        ctx.addIssue({
          code: 'custom',
          path: ['webhookUrl'],
          message: 'At least one webhook event must be enabled when a webhook URL is set',
        });
      }
    }
  });

export type ParsedConfigOverride = z.infer<typeof configOverrideSchema>;

const CONFIG_KEY_SET = new Set<string>(CONFIG_KEYS);

/**
 * Parse unknown storage/policy input. Invalid keys are dropped per-field so a
 * bad managed value does not wipe the whole config.
 *
 * `null` (and empty string for string fields) means the user explicitly cleared
 * a seeded value so it does not fall back to managed/build.
 */
export function parseConfigOverride(input: unknown): {
  data: ParsedConfigOverride;
  errors: string[];
} {
  if (input == null || typeof input !== 'object') {
    return { data: {}, errors: [] };
  }

  const errors: string[] = [];
  const raw = input as Record<string, unknown>;
  const picked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!CONFIG_KEY_SET.has(key)) {
      continue;
    }
    if (value === undefined) {
      continue;
    }
    picked[key] = value;
  }

  const result = configOverrideSchema.safeParse(picked);
  if (result.success) {
    return { data: result.data, errors: [] };
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(picked)) {
    const single = configOverrideSchema.safeParse({ [key]: value });
    if (single.success && key in single.data) {
      data[key] = (single.data as Record<string, unknown>)[key];
    } else {
      const issue = result.error.issues.find((i) => i.path[0] === key);
      errors.push(`${key}: ${issue?.message ?? 'invalid value'}`);
    }
  }

  const cross = configOverrideSchema.safeParse(data);
  if (!cross.success) {
    for (const issue of cross.error.issues) {
      const key = String(issue.path[0] ?? 'config');
      errors.push(`${key}: ${issue.message}`);
      if (issue.path[0] != null) {
        delete data[String(issue.path[0])];
      }
    }
    return { data: data as ParsedConfigOverride, errors };
  }

  return { data: cross.data, errors };
}
