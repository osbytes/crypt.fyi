import { createContext, useContext } from 'react';
import { z } from 'zod';

export const themePreferenceSchema = z.enum(['system', 'light', 'dark']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const THEME_STORAGE_KEY = 'theme';

/** Browser chrome colors; mirror --background in index.css and public/theme-init.js. */
export const THEME_CHROME_COLOR: Record<ResolvedTheme, string> = {
  light: '#f5f6f7',
  dark: '#0e0f12',
};

type ThemeContextType = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
