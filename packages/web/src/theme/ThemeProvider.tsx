import { ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  ResolvedTheme,
  THEME_CHROME_COLOR,
  THEME_STORAGE_KEY,
  ThemeContext,
  ThemePreference,
  themePreferenceSchema,
} from './theme';

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function subscribeToSystemTheme(onChange: () => void) {
  const query = darkQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readStoredPreference(): ThemePreference {
  try {
    const result = themePreferenceSchema.safeParse(localStorage.getItem(THEME_STORAGE_KEY));
    return result.success ? result.data : 'system';
  } catch {
    return 'system';
  }
}

function writeStoredPreference(preference: ThemePreference) {
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

function applyResolvedTheme(resolved: ResolvedTheme) {
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const systemIsDark = useSyncExternalStore(subscribeToSystemTheme, () => darkQuery().matches);
  const resolved: ResolvedTheme =
    preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    applyResolvedTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // A null key means another tab cleared storage entirely.
      if (e.key === THEME_STORAGE_KEY || e.key === null) {
        setPreferenceState(readStoredPreference());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference: (next: ThemePreference) => {
        writeStoredPreference(next);
        setPreferenceState(next);
      },
    }),
    [preference, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
