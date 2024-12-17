import { useEffect, useState } from 'react';
import { z } from 'zod';

const themeSchema = z.enum(['dark', 'light']);
type Theme = z.infer<typeof themeSchema>;

export function useTheme() {
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
  }, [setTheme]);

  return [theme, setTheme] as const;
}
