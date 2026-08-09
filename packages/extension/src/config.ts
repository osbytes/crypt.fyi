/** Build-time fallbacks; runtime overrides come from storage (user > managed > build). */

// Vite injects import.meta.env at build time; Node/Jest may not define `.env`.
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

export const MINUTE = 1000 * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

export const MAX_IP_RESTRICTIONS = 3;

export const TTL_OPTIONS = [
  { label: '5 minutes', value: 5 * MINUTE },
  { label: '30 minutes', value: 30 * MINUTE },
  { label: '1 hour', value: HOUR },
  { label: '4 hours', value: 4 * HOUR },
  { label: '12 hours', value: 12 * HOUR },
  { label: '1 day', value: DAY },
  { label: '3 days', value: 3 * DAY },
  { label: '7 days', value: 7 * DAY },
] as const;

export const BUILD_DEFAULTS = {
  apiUrl: env.VITE_API_URL || 'https://api.crypt.fyi',
  webUrl: env.VITE_WEB_URL || 'https://crypt.fyi',
  ttl: getEnvNumber(env.VITE_DEFAULT_TTL, 30 * MINUTE),
  burn: true,
  ips: undefined as string | undefined,
  rc: undefined as number | undefined,
  fc: undefined as number | undefined,
  webhookUrl: undefined as string | undefined,
  webhookName: undefined as string | undefined,
  webhookOnRead: true,
  webhookOnFailPassword: false,
  webhookOnFailIp: false,
  webhookOnBurn: false,
} as const;

/** Crypto key length stays build-time only — not a user/admin dial. */
export const KEY_LENGTH = getEnvNumber(env.VITE_KEY_LENGTH, 32);

export type ExtensionConfig = {
  apiUrl: string;
  webUrl: string;
  ttl: number;
  burn: boolean;
  ips?: string;
  rc?: number;
  fc?: number;
  webhookUrl?: string;
  webhookName?: string;
  webhookOnRead: boolean;
  webhookOnFailPassword: boolean;
  webhookOnFailIp: boolean;
  webhookOnBurn: boolean;
};

/**
 * Keys that can appear in storage.sync / storage.managed.
 * `null` clears an optional so it does not fall back to a lower layer.
 */
export type ConfigOverride = {
  [K in keyof ExtensionConfig]?: ExtensionConfig[K] | null;
};

export const CONFIG_KEYS = [
  'apiUrl',
  'webUrl',
  'ttl',
  'burn',
  'ips',
  'rc',
  'fc',
  'webhookUrl',
  'webhookName',
  'webhookOnRead',
  'webhookOnFailPassword',
  'webhookOnFailIp',
  'webhookOnBurn',
] as const satisfies ReadonlyArray<keyof ExtensionConfig>;

function getEnvNumber(env: string | undefined, defaultValue: number): number {
  if (!env) {
    return defaultValue;
  }
  return parseInt(env, 10);
}
