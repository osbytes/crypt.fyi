import fs from 'node:fs';
import vm from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_CHROME_COLOR,
  THEME_STORAGE_KEY,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
} from './index';

const read = (file: string) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

const fakeStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
};

const runThemeInit = ({ stored, osDark }: { stored?: string; osDark: boolean }) => {
  const toggle = vi.fn();
  const setAttribute = vi.fn();
  vm.runInNewContext(read('./theme-init.js'), {
    window: {
      localStorage: fakeStorage(stored ? { [THEME_STORAGE_KEY]: stored } : {}),
      matchMedia: () => ({ matches: osDark }),
    },
    document: {
      documentElement: { classList: { toggle } },
      querySelector: () => ({ setAttribute }),
    },
  });
  return { isDark: toggle.mock.calls[0]?.[1], chromeColor: setAttribute.mock.calls[0]?.[1] };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveTheme', () => {
  it('prefers an explicit choice over the OS', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the OS for the system preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('isThemePreference', () => {
  it('rejects anything but the known preferences', () => {
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('stored preference', () => {
  it('falls back to system for missing or invalid values', () => {
    vi.stubGlobal('localStorage', fakeStorage({ [THEME_STORAGE_KEY]: 'sepia' }));
    expect(readStoredPreference()).toBe('system');
  });

  it('falls back to system when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readStoredPreference()).toBe('system');
  });

  it('stores explicit choices and clears the key for system', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    writeStoredPreference('dark');
    expect(readStoredPreference()).toBe('dark');
    writeStoredPreference('system');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});

describe('theme-init.js', () => {
  it.each([
    { stored: 'dark', osDark: false, isDark: true },
    { stored: 'light', osDark: true, isDark: false },
    { stored: undefined, osDark: true, isDark: true },
    { stored: 'sepia', osDark: false, isDark: false },
  ])('resolves stored=$stored osDark=$osDark to dark=$isDark', ({ stored, osDark, isDark }) => {
    expect(runThemeInit({ stored, osDark }).isDark).toBe(isDark);
  });

  // The script cannot import, so its colors are copies. Fail here rather than flash wrong colors.
  it('uses the same chrome colors as index.ts', () => {
    expect(runThemeInit({ stored: 'dark', osDark: false }).chromeColor).toBe(
      THEME_CHROME_COLOR.dark,
    );
    expect(runThemeInit({ stored: 'light', osDark: true }).chromeColor).toBe(
      THEME_CHROME_COLOR.light,
    );
  });
});

describe('tokens.css', () => {
  it('uses the chrome colors as --background', () => {
    const backgrounds = [...read('./tokens.css').matchAll(/--background: (#[0-9a-f]{6});/g)].map(
      (match) => match[1],
    );
    expect(backgrounds).toEqual([THEME_CHROME_COLOR.light, THEME_CHROME_COLOR.dark]);
  });
});
