import { config } from '@/config';
import { Link } from '@tanstack/react-router';
import { IconBrandGithub, IconFileDescription } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button/button';

export function About() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl space-y-10 sm:space-y-14">
      <header className="max-w-3xl space-y-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('about.title')}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {t('about.what.description')}
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        <section className="space-y-3 lg:pt-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('about.what.traditionalTitle')}
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {t('about.what.traditionalDescription')}
          </p>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)] sm:p-8">
          <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">
            {t('about.letter.title')}
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>{t('about.letter.p1')}</p>
            <p>{t('about.letter.p2')}</p>
            <p>{t('about.letter.p3')}</p>
          </div>
          <p className="mt-5 font-display font-semibold">{t('about.letter.signOff')}</p>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border bg-card p-6">
          <IconBrandGithub className="size-5 text-muted-foreground" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">
            {t('about.openSource.description')}{' '}
            <a
              href={config.CRYPT_FYI_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link"
            >
              GitHub
            </a>
            .
          </p>
        </section>
        <section className="space-y-3 rounded-xl border bg-card p-6">
          <IconFileDescription className="size-5 text-muted-foreground" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">
            {t('about.technical.prompt')}{' '}
            <a
              href={config.CRYPT_FYI_SPEC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="prose-link"
            >
              {t('about.technical.specLink')}
            </a>
            .
          </p>
        </section>
      </div>

      <Button asChild size="lg">
        <Link to="/new">{t('common.createSecret')}</Link>
      </Button>
    </div>
  );
}
