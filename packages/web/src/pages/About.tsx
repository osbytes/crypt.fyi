import { config } from '@/config';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button/button';

export function About() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">{t('about.title')}</h1>

      <section className="mb-14 space-y-4">
        <p className="text-lg leading-relaxed text-foreground/90">{t('about.what.description')}</p>
        <h2 className="text-xl font-semibold pt-2">{t('about.what.traditionalTitle')}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t('about.what.traditionalDescription')}
        </p>
      </section>

      <section className="mb-14 border-l-2 border-foreground/15 pl-6 py-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-5">
          {t('about.letter.title')}
        </p>
        <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
          <p>{t('about.letter.p1')}</p>
          <p>{t('about.letter.p2')}</p>
          <p>{t('about.letter.p3')}</p>
        </div>
      </section>

      <section className="mb-10 space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          {t('about.openSource.description')}{' '}
          <a
            href={config.CRYPT_FYI_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            GitHub
          </a>
          .
        </p>
        <p className="text-muted-foreground leading-relaxed">
          {t('about.technical.prompt')}{' '}
          <a
            href={config.CRYPT_FYI_SPEC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            {t('about.technical.specLink')}
          </a>
          .
        </p>
      </section>

      <div className="flex justify-center pt-4">
        <Button asChild size="lg">
          <Link to="/new">{t('common.createSecret')}</Link>
        </Button>
      </div>
    </div>
  );
}
