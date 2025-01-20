import { IconApi, IconBrandGithub, IconMoon, IconPlus, IconSun } from '@tabler/icons-react';
import { Button } from './ui/button';
import { Logo } from './Logo';
import { useTheme } from '@/theme';
import { Link, Outlet } from 'react-router-dom';
import { ErrorBoundary } from './error-boundary';
import { config } from '@/config';
import { useTranslation } from 'react-i18next';
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
                <Logo className="w-12 py-2" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/about">
                <Button variant="ghost" size="sm">
                  {t('about.title')}
                </Button>
              </Link>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </Button>
              <Select
                name="language"
                value={i18n.resolvedLanguage}
                onValueChange={(value) => {
                  if (value === 'lang-request-new-or-fix') {
                    window.open(
                      `${config.CRYPT_FYI_GITHUB_URL}/issues/new?title=Language%20Request%20%2F%20Translation%20Fix&labels=enhancement,i18n&body=Please%20select%20one%3A%0A-%20%5B%20%5D%20Request%20new%20language%0A-%20%5B%20%5D%20Fix%20existing%20translations%0A%0AIf%20requesting%20new%20language%3A%0A-%20Language%20name%3A%20%0A-%20Language%20code%20%28e.g.%20en%2C%20es%2C%20fr%29%3A%20%0A%0AIf%20fixing%20translations%3A%0A-%20Language%3A%20%0A-%20Issues%20to%20fix%3A%0A%20%20-%20%0A%20%20-%20%0A`,
                      '_blank',
                    );
                  } else {
                    i18n.changeLanguage(value);
                  }
                }}
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
                  <SelectItem
                    key="lang-request-new-or-fix"
                    value="lang-request-new-or-fix"
                    className="border-t flex items-center gap-1"
                  >
                    <IconPlus className="w-4 h-4 inline" />{' '}
                    {t('common.requestNewLanguage', 'Request new or fix translations')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4 flex-1">
          <Outlet />
        </main>
        <footer className="border-t p-4">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('about.title')}
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('privacy.title')}
              </Link>
              <a
                href={config.CRYPT_FYI_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Github
              </a>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {t('common.footer.tagline')}
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
