import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  clearSettings,
  isAllowedEndpoint,
  loadSettings,
  normalizeEndpoint,
  parseSettings,
  saveSettings,
} from './settings';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe('isAllowedEndpoint', () => {
  it.each([
    'https://api.crypt.fyi',
    'https://secrets.internal.example:8443/api',
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    'http://[::1]:4321',
  ])('allows %s', (url) => {
    expect(isAllowedEndpoint(url)).toBe(true);
  });

  it.each([
    'http://api.crypt.fyi',
    'http://192.168.1.10:4321',
    'ftp://api.crypt.fyi',
    'javascript:alert(1)',
    'https://user:pass@api.crypt.fyi',
    'https://api.crypt.fyi/?x=1',
    'https://api.crypt.fyi/#frag',
    'not a url',
    '',
  ])('rejects %j', (url) => {
    expect(isAllowedEndpoint(url)).toBe(false);
  });
});

describe('normalizeEndpoint', () => {
  it('trims whitespace and trailing slashes', () => {
    expect(normalizeEndpoint('  https://api.crypt.fyi//  ')).toBe('https://api.crypt.fyi');
  });
});

describe('parseSettings', () => {
  it('returns defaults for empty or non-object input', () => {
    expect(parseSettings(undefined)).toEqual({ settings: DEFAULT_SETTINGS, errors: [] });
    expect(parseSettings('nope')).toEqual({ settings: DEFAULT_SETTINGS, errors: [] });
  });

  it('accepts and normalizes valid values', () => {
    const { settings, errors } = parseSettings({
      apiUrl: 'https://api.example.com/',
      webUrl: 'https://example.com',
      shortcut: 'CommandOrControl+Shift+K',
      ttl: '3600000',
      burn: false,
      prefillFromClipboard: false,
      language: 'de',
    });
    expect(errors).toEqual([]);
    expect(settings).toEqual({
      apiUrl: 'https://api.example.com',
      webUrl: 'https://example.com',
      shortcut: 'CommandOrControl+Shift+K',
      ttl: 3600000,
      burn: false,
      prefillFromClipboard: false,
      language: 'de',
    });
  });

  it('falls back per field and reports each invalid one', () => {
    const { settings, errors } = parseSettings({
      apiUrl: 'http://evil.example',
      webUrl: 'https://example.com',
      shortcut: 'K',
      ttl: 42,
      language: 'xx',
    });
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, webUrl: 'https://example.com' });
    expect(errors.map((e) => [e.field, e.message])).toEqual([
      ['apiUrl', 'invalidUrl'],
      ['shortcut', 'invalidShortcut'],
      ['ttl', 'invalidTtl'],
      ['language', expect.any(String)],
    ]);
  });

  it('ignores unknown keys', () => {
    expect(parseSettings({ password: 'hunter2' }).settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('settings storage', () => {
  it('round-trips through the store', () => {
    const store = memoryStore();
    const settings = { ...DEFAULT_SETTINGS, burn: false, language: 'fr' as const };
    saveSettings(store, settings);
    expect(loadSettings(store)).toEqual(settings);
    clearSettings(store);
    expect(store.data.has(SETTINGS_STORAGE_KEY)).toBe(false);
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
  });

  it('recovers from corrupt JSON', () => {
    const store = memoryStore({ [SETTINGS_STORAGE_KEY]: '{not json' });
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
  });
});
