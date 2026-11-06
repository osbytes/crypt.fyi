export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const THEME_STORAGE_KEY = 'theme';

/** Browser chrome colors; mirror --background in tokens.css and theme-init.js. */
export const THEME_CHROME_COLOR: Record<ResolvedTheme, string> = {
  light: '#f5f6f7',
  dark: '#0e0f12',
};

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

export function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  if (preference !== 'system') return preference;
  return systemIsDark ? 'dark' : 'light';
}

export function systemPrefersDark() {
  return darkQuery().matches;
}

export function subscribeToSystemTheme(onChange: () => void) {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredPreference(preference: ThemePreference) {
  try {
    if (preference === 'system') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Blocked storage only costs persistence; the choice still applies to this page.
  }
}

/** Fires when another tab changes the stored preference. */
export function subscribeToStoredPreference(onChange: () => void) {
  const handleStorageChange = (e: StorageEvent) => {
    // A null key means another tab cleared storage entirely.
    if (e.key === THEME_STORAGE_KEY || e.key === null) {
      onChange();
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  // Repainting every token at once should be instant, not a staggered color fade.
  root.classList.add('theme-switching');
  root.classList.toggle('dark', resolved === 'dark');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_CHROME_COLOR[resolved]);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove('theme-switching'));
  });
}
