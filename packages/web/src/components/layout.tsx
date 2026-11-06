import { IconApi, IconBrandGithub, IconLanguage, IconPlus } from '@tabler/icons-react';
import { Button } from './ui/button';
import { Logo } from './Logo';
import { Link, useRouterState } from '@tanstack/react-router';
import { ErrorBoundary } from './error-boundary';
import { config } from '@/config';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supportedLanguagesOptions } from '@crypt.fyi/core';
import { ThemeToggle } from './ThemeToggle';

const LANGUAGE_REQUEST_URL = `${config.CRYPT_FYI_GITHUB_URL}/issues/new?title=Language%20Request%20%2F%20Translation%20Fix&labels=enhancement,i18n&body=Please%20select%20one%3A%0A-%20%5B%20%5D%20Request%20new%20language%0A-%20%5B%20%5D%20Fix%20existing%20translations%0A%0AIf%20requesting%20new%20language%3A%0A-%20Language%20name%3A%20%0A-%20Language%20code%20%28e.g.%20en%2C%20es%2C%20fr%29%3A%20%0A%0AIf%20fixing%20translations%3A%0A-%20Language%3A%20%0A-%20Issues%20to%20fix%3A%0A%20%20-%20%0A%20%20-%20%0A`;

const footerLinkClass = 'text-muted-foreground transition-colors hover:text-foreground';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background">
        <a
          href="#main"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
        >
          {t('common.skipToContent')}
        </a>
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-md font-display text-base font-semibold tracking-tight text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo className="w-9" />
              <span className="hidden sm:inline">crypt.fyi</span>
              <span className="sr-only sm:hidden">crypt.fyi</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/about">{t('about.title')}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/privacy">{t('privacy.title')}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title="OpenAPI specification"
                  className="size-9"
                >
                  <a
                    href={`${config.API_URL}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="OpenAPI specification"
                  >
                    <IconApi />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title="View source on GitHub"
                  className="size-9"
                >
                  <a
                    href={config.CRYPT_FYI_GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source on GitHub"
                  >
                    <IconBrandGithub />
                  </a>
                </Button>
              </nav>
              <ThemeToggle />
              <Select
                name="language"
                value={i18n.resolvedLanguage}
                onValueChange={(value) => {
                  if (value === 'lang-request-new-or-fix') {
                    window.open(LANGUAGE_REQUEST_URL, '_blank');
                  } else {
                    i18n.changeLanguage(value);
                  }
                }}
              >
                <SelectTrigger aria-label="Language" className="h-9 w-auto gap-1.5 bg-card px-2.5">
                  <IconLanguage className="size-4 text-muted-foreground" aria-hidden />
                  <span className="max-sm:sr-only">
                    <SelectValue />
                  </span>
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
                    className="flex items-center gap-1 border-t"
                  >
                    <IconPlus className="inline h-4 w-4" />{' '}
                    {t('common.requestNewLanguage', 'Request new or fix translations')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {pathname !== '/new' && (
                <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
                  <Link to="/new">{t('common.newSecret')}</Link>
                </Button>
              )}
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 text-sm sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link to="/about" className={footerLinkClass}>
                {t('about.title')}
              </Link>
              <Link to="/privacy" className={footerLinkClass}>
                {t('privacy.title')}
              </Link>
              <a
                href={config.CRYPT_FYI_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={footerLinkClass}
              >
                GitHub
              </a>
              <a
                href={`${config.API_URL}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className={footerLinkClass}
              >
                API
              </a>
              <a
                href="https://www.osbytes.io"
                target="_blank"
                rel="noopener noreferrer"
                title="osbytes - open source bytes"
                className={footerLinkClass}
              >
                <img
                  src="https://www.osbytes.io/badge.svg"
                  alt="osbytes - open source bytes"
                  width="24"
                  height="24"
                  className="rounded-sm"
                />
              </a>
            </div>
            <p className="text-muted-foreground">{t('common.footer.tagline')}</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
