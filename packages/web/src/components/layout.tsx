import { IconApi, IconBrandGithub, IconMoon, IconSun } from '@tabler/icons-react';
import { Button } from './ui/button';
import { useTheme } from '@/theme';
import { Link, Outlet } from 'react-router-dom';
import { ErrorBoundary } from './error-boundary';
import { config } from '@/config';
import { useTranslation, Trans } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supportedLanguagesOptions } from '@crypt.fyi/core';

export function Layout() {
  const [theme, setTheme] = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b p-2">
          <div className="container flex items-center justify-between mx-auto">
            <div>
              <Link to="/">
                <h1 className="text-xl font-bold">crypt.fyi</h1>
              </Link>
              <p className="hidden md:block text-xs text-muted-foreground">
                <Trans
                  i18nKey="common.header.tagline"
                  components={{
                    aesLink: (
                      <a
                        href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard"
                        target="_blank"
                      />
                    ),
                    e2eLink: (
                      <a
                        href="https://en.wikipedia.org/wiki/End-to-end_encryption"
                        target="_blank"
                      />
                    ),
                  }}
                />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/about">
                <Button variant="ghost" size="sm">
                  {t('about.title')}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </Button>
              <Button variant="ghost" size="icon" asChild title="OpenAPI specification">
                <a href={`${config.API_URL}/docs`} target="_blank" rel="noopener noreferrer">
                  <IconApi />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild title="View source on GitHub">
                <a href={config.CRYPT_FYI_GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <IconBrandGithub />
                </a>
              </Button>
              <Select
                name="language"
                value={i18n.resolvedLanguage}
                onValueChange={(value) => i18n.changeLanguage(value)}
              >
                <SelectTrigger aria-label="Language" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguagesOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4 flex-1">
          <Outlet />
        </main>
        <footer className="border-t mt-auto">
          <div className="container mx-auto py-6 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
                  {t('about.title')}
                </Link>
                <a
                  href={config.CRYPT_FYI_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </a>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                {t('common.footer.tagline')}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
