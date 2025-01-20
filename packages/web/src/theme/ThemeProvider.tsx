import { useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeContext } from './theme';
import { themeSchema } from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedThemeResult = themeSchema.safeParse(localStorage.getItem('theme'));
    return savedThemeResult.success ? savedThemeResult.data : 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newThemeResult = themeSchema.safeParse(e.newValue);
        if (newThemeResult.success) {
          setTheme(newThemeResult.data);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = { theme, setTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
