import { z } from 'zod';
import { supportedLanguages } from '@crypt.fyi/core';
import {
  DEFAULT_API_URL,
  DEFAULT_SHORTCUT,
  DEFAULT_TTL,
  DEFAULT_WEB_URL,
  TTL_OPTIONS,
} from './config';
import { isValidAccelerator } from './shortcut';

/** Settings are preferences only. Secrets and passwords are never persisted. */
export const SETTINGS_STORAGE_KEY = 'crypt.fyi:desktop:settings';

export type LanguageCode = keyof typeof supportedLanguages;
export type LanguagePreference = 'system' | LanguageCode;

export type Settings = {
  apiUrl: string;
  webUrl: string;
  shortcut: string;
  ttl: number;
  burn: boolean;
  prefillFromClipboard: boolean;
  language: LanguagePreference;
};

export const DEFAULT_SETTINGS: Settings = {
  apiUrl: DEFAULT_API_URL,
  webUrl: DEFAULT_WEB_URL,
  shortcut: DEFAULT_SHORTCUT,
  ttl: DEFAULT_TTL,
  burn: true,
  prefillFromClipboard: true,
  language: 'system',
};

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Endpoints must be https, or http on loopback for local development and self-hosting.
 * This mirrors the CSP `connect-src` in tauri.conf.json, so a URL that passes here is also one
 * the webview is allowed to reach. Credentials in the URL are rejected because they would be
 * copied into every shared link (web URL) or sent with every request (API URL).
 */
export function isAllowedEndpoint(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password || url.search || url.hash) return false;
  if (url.protocol === 'https:') return url.hostname.length > 0;
  if (url.protocol === 'http:') return LOOPBACK_HOSTS.has(url.hostname);
  return false;
}

/** Drops trailing slashes so `${apiUrl}/vault` and `${webUrl}/${id}` never double up. */
export function normalizeEndpoint(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

const endpoint = z
  .string()
  .transform(normalizeEndpoint)
  .refine(isAllowedEndpoint, { message: 'invalidUrl' });

const ttlValues: number[] = TTL_OPTIONS.map((option) => option.value);
const languageValues = ['system', ...Object.keys(supportedLanguages)] as [string, ...string[]];

const fieldSchemas = {
  apiUrl: endpoint,
  webUrl: endpoint,
  shortcut: z.string().refine(isValidAccelerator, { message: 'invalidShortcut' }),
  ttl: z.coerce.number().refine((n) => ttlValues.includes(n), { message: 'invalidTtl' }),
  burn: z.boolean(),
  prefillFromClipboard: z.boolean(),
  language: z.enum(languageValues).transform((v) => v as LanguagePreference),
} satisfies { [K in keyof Settings]: z.ZodType<Settings[K], unknown> };

const SETTING_KEYS = Object.keys(fieldSchemas) as (keyof Settings)[];

export type SettingsError = { field: keyof Settings; message: string };

/**
 * Validates every field independently. Invalid fields fall back to the defaults so one bad
 * stored value (for example from an older version) can't lock the user out of the app.
 */
export function parseSettings(input: unknown): { settings: Settings; errors: SettingsError[] } {
  const raw = input != null && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  const errors: SettingsError[] = [];

  for (const key of SETTING_KEYS) {
    if (raw[key] === undefined) continue;
    const result = fieldSchemas[key].safeParse(raw[key]);
    if (result.success) {
      settings[key] = result.data;
    } else {
      errors.push({ field: key, message: result.error.issues[0]?.message ?? 'invalid' });
    }
  }

  return { settings: settings as Settings, errors };
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadSettings(store: KeyValueStore): Settings {
  try {
    const stored = store.getItem(SETTINGS_STORAGE_KEY);
    return parseSettings(stored ? JSON.parse(stored) : {}).settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  store.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function clearSettings(store: KeyValueStore): void {
  store.removeItem(SETTINGS_STORAGE_KEY);
}
