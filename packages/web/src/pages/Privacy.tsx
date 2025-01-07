import { config } from '@/config';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">{t('privacy.title')}</h1>

      <section className="mb-12">
        <p className="text-lg mb-4">{t('privacy.intro')}</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.doNotCollect.title')}</h2>
        <div className="space-y-4">
          <p className="text-lg">{t('privacy.doNotCollect.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>{t('privacy.doNotCollect.items.secrets')}</li>
            <li>{t('privacy.doNotCollect.items.keys')}</li>
            <li>{t('privacy.doNotCollect.items.urls')}</li>
            <li>{t('privacy.doNotCollect.items.content')}</li>
            <li>{t('privacy.doNotCollect.items.recipients')}</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.collect.title')}</h2>
        <div className="space-y-4">
          <p className="text-lg">{t('privacy.collect.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>{t('privacy.collect.items.encrypted')}</li>
            <li>{t('privacy.collect.items.hashes')}</li>
            <li>{t('privacy.collect.items.metadata')}</li>
            <li>{t('privacy.collect.items.webhooks')}</li>
          </ul>
          <p className="text-muted-foreground mt-4">{t('privacy.collect.note')}</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.usage.title')}</h2>
        <div className="space-y-4">
          <p className="text-lg">{t('privacy.usage.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>{t('privacy.usage.items.transmission')}</li>
            <li>{t('privacy.usage.items.rateLimits')}</li>
            <li>{t('privacy.usage.items.ipControl')}</li>
            <li>{t('privacy.usage.items.notifications')}</li>
            <li>{t('privacy.usage.items.security')}</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.security.title')}</h2>
        <div className="space-y-4">
          <p className="text-lg">{t('privacy.security.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>{t('privacy.security.items.encryption')}</li>
            <li>{t('privacy.security.items.csp')}</li>
            <li>{t('privacy.security.items.tls')}</li>
            <li>{t('privacy.security.items.expiration')}</li>
            <li>{t('privacy.security.items.deletion')}</li>
            <li>{t('privacy.security.items.storage')}</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.thirdParty.title')}</h2>
        <div className="space-y-4">
          <p className="text-lg">{t('privacy.thirdParty.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>{t('privacy.thirdParty.items.webhooks')}</li>
            <li>{t('privacy.thirdParty.items.infrastructure')}</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.rights.title')}</h2>
        <div className="space-y-4">
          <p className="text-lg">{t('privacy.rights.description')}</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>{t('privacy.rights.items.expiration')}</li>
            <li>{t('privacy.rights.items.burn')}</li>
            <li>{t('privacy.rights.items.password')}</li>
            <li>{t('privacy.rights.items.ip')}</li>
            <li>{t('privacy.rights.items.readLimits')}</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.changes.title')}</h2>
        <p className="text-lg">{t('privacy.changes.description')}</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('privacy.contact.title')}</h2>
        <p className="text-lg">
          {t('privacy.contact.description')}{' '}
          <a
            href={config.CRYPT_FYI_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub repository
          </a>
          .
        </p>
      </section>

      <section>
        <div className="flex justify-center mt-12">
          <Link
            to="/new"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('common.createSecret')}
          </Link>
        </div>
      </section>
    </div>
  );
}
