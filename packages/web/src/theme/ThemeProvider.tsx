import { ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  applyResolvedTheme,
  readStoredPreference,
  resolveTheme,
  subscribeToStoredPreference,
  subscribeToSystemTheme,
  systemPrefersDark,
  ThemePreference,
  writeStoredPreference,
} from '@crypt.fyi/theme';
import { ThemeContext } from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const systemIsDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark);
  const resolved = resolveTheme(preference, systemIsDark);

  useEffect(() => {
    applyResolvedTheme(resolved);
  }, [resolved]);

  useEffect(
    () => subscribeToStoredPreference(() => setPreferenceState(readStoredPreference())),
    [],
  );

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
