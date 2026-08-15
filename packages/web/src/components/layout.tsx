import { IconMoon, IconSun } from '@tabler/icons-react';
import { Button } from './ui/button';
import { useTheme } from '@/theme';
import { Link } from '@tanstack/react-router';
import { ErrorBoundary } from './error-boundary';
import { config } from '@/config';
import { useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [theme, setTheme] = useTheme();

  // The static <title> in index.html cannot see build-time config, so keep the
  // tab in step with the header.
  useEffect(() => {
    document.title = config.APP_NAME;
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b p-2">
          <div className="container flex items-center justify-between mx-auto">
            <Link to="/" className="no-underline">
              <span
                className="text-xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                {config.APP_NAME}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </Button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">{children}</main>
      </div>
    </ErrorBoundary>
  );
}
