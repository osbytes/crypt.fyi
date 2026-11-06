import { config } from '@/config';
import { Link } from '@tanstack/react-router';
import { IconCheck, IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button/button';

const LIST_SECTIONS = [
  {
    id: 'usage',
    items: ['transmission', 'rateLimits', 'ipControl', 'notifications', 'security'],
  },
  {
    id: 'security',
    items: ['encryption', 'csp', 'tls', 'expiration', 'deletion', 'storage'],
  },
  { id: 'thirdParty', items: ['webhooks', 'infrastructure'] },
  { id: 'rights', items: ['expiration', 'burn', 'password', 'ip', 'readLimits'] },
] as const;

function MarkedList({ items, marker }: { items: string[]; marker: 'check' | 'cross' | 'dot' }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
          {marker === 'dot' ? (
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
          ) : marker === 'check' ? (
            <IconCheck className="mt-0.5 size-4 shrink-0 text-sealed" aria-hidden />
          ) : (
            <IconX className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden />
          )}
          <span className={marker === 'dot' ? 'text-muted-foreground' : undefined}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 space-y-3">
      <h2 id={`${id}-title`} className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Privacy() {
  const { t } = useTranslation();

  const contents = [
    ...LIST_SECTIONS.map(({ id }) => id),
    'changes' as const,
    'contact' as const,
  ].map((id) => ({ id, title: t(`privacy.${id}.title`) }));

  return (
    <div className="mx-auto max-w-5xl space-y-10 sm:space-y-14">
      <header className="max-w-2xl space-y-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('privacy.title')}
        </h1>
        <p className="text-lg text-muted-foreground">{t('privacy.intro')}</p>
      </header>

      {/* The answer most readers came for, before any of the policy detail. */}
      <div className="grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="not-collected-title"
          className="space-y-3 rounded-xl border bg-card p-6"
        >
          <h2
            id="not-collected-title"
            className="font-display text-xl font-semibold tracking-tight"
          >
            {t('privacy.doNotCollect.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('privacy.doNotCollect.description')}</p>
          <MarkedList
            marker="cross"
            items={(['secrets', 'keys', 'urls', 'content', 'recipients'] as const).map((item) =>
              t(`privacy.doNotCollect.items.${item}`),
            )}
          />
        </section>
        <section
          aria-labelledby="collected-title"
          className="space-y-3 rounded-xl border bg-card p-6"
        >
          <h2 id="collected-title" className="font-display text-xl font-semibold tracking-tight">
            {t('privacy.collect.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('privacy.collect.description')}</p>
          <MarkedList
            marker="check"
            items={(['encrypted', 'hashes', 'metadata', 'webhooks'] as const).map((item) =>
              t(`privacy.collect.items.${item}`),
            )}
          />
          <p className="border-t pt-3 text-sm text-muted-foreground">{t('privacy.collect.note')}</p>
        </section>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <nav aria-label={t('privacy.title')} className="lg:sticky lg:top-6">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
            {contents.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="block rounded-md border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring lg:border-transparent"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-2xl space-y-10">
          {LIST_SECTIONS.map(({ id, items }) => (
            <PolicySection key={id} id={id} title={t(`privacy.${id}.title`)}>
              <p>{t(`privacy.${id}.description`)}</p>
              <MarkedList
                marker="dot"
                items={items.map((item) => t(`privacy.${id}.items.${item}`))}
              />
            </PolicySection>
          ))}
          <PolicySection id="changes" title={t('privacy.changes.title')}>
            <p className="text-muted-foreground">{t('privacy.changes.description')}</p>
          </PolicySection>
          <PolicySection id="contact" title={t('privacy.contact.title')}>
            <p className="text-muted-foreground">
              {t('privacy.contact.description')}{' '}
              <a
                href={config.CRYPT_FYI_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="prose-link"
              >
                GitHub repository
              </a>
              .
            </p>
          </PolicySection>
          <Button asChild size="lg">
            <Link to="/new">{t('common.createSecret')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
