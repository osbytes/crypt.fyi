import { config } from '@/config';
import { IconLock, IconShare, IconFlame } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function About() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">{t('about.title')}</h1>

      <section className="mb-12">
        <p className="text-lg mb-4">{t('about.intro')}</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('about.whyCryptFyi.title')}</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {t('about.whyCryptFyi.commonPractices.title')}
            </h3>
            <p className="text-lg mb-4">{t('about.whyCryptFyi.commonPractices.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>{t('about.whyCryptFyi.commonPractices.problems.email')}</li>
              <li>{t('about.whyCryptFyi.commonPractices.problems.slack')}</li>
              <li>{t('about.whyCryptFyi.commonPractices.problems.sms')}</li>
              <li>{t('about.whyCryptFyi.commonPractices.problems.messaging')}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              {t('about.whyCryptFyi.existingSolutions.title')}
            </h3>
            <p className="text-lg mb-4">{t('about.whyCryptFyi.existingSolutions.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                {t('about.whyCryptFyi.existingSolutions.limitations.onePassword')}{' '}
                <a
                  href="https://1password.community/discussion/148998/feature-request-share-sensitive-data-from-non-1password-user-to-1password-user"
                  target="_blank"
                >
                  {t('about.whyCryptFyi.existingSolutions.limitations.onePasswordLink')}
                </a>
              </li>
              <li>
                {t('about.whyCryptFyi.existingSolutions.limitations.otherTools')}{' '}
                <a href="https://github.com/PrivateBin/PrivateBin/issues/1453" target="_blank">
                  {t('about.whyCryptFyi.existingSolutions.limitations.otherToolsConfigLink')}
                </a>{' '}
                and{' '}
                <a href="https://github.com/onetimesecret/onetimesecret/issues/859" target="_blank">
                  {t('about.whyCryptFyi.existingSolutions.limitations.otherToolsSecurityLink')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">{t('about.whyCryptFyi.approach.title')}</h3>
            <p className="text-lg">{t('about.whyCryptFyi.approach.description')}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('about.howItWorks.title')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <IconLock className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t('about.howItWorks.steps.encrypt.title')}
            </h3>
            <p>{t('about.howItWorks.steps.encrypt.description')}</p>
          </div>
          <div className="p-6 border rounded-lg">
            <IconShare className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t('about.howItWorks.steps.share.title')}
            </h3>
            <p>{t('about.howItWorks.steps.share.description')}</p>
          </div>
          <div className="p-6 border rounded-lg">
            <IconFlame className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('about.howItWorks.steps.burn.title')}</h3>
            <p>{t('about.howItWorks.steps.burn.description')}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{t('about.security.title')}</h2>
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">{t('about.security.encryption.title')}</h3>
            <p className="mb-2">{t('about.security.encryption.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('about.security.encryption.features.key')}</li>
              <li>{t('about.security.encryption.features.derivation')}</li>
              <li>{t('about.security.encryption.features.vector')}</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              {t('about.security.zeroKnowledge.title')}
            </h3>
            <p className="mb-2">{t('about.security.zeroKnowledge.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('about.security.zeroKnowledge.features.clientSide')}</li>
              <li>{t('about.security.zeroKnowledge.features.storage')}</li>
              <li>{t('about.security.zeroKnowledge.features.keys')}</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">{t('about.security.protection.title')}</h3>
            <p className="mb-2">{t('about.security.protection.description')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('about.security.protection.features.encryption')}</li>
              <li>{t('about.security.protection.features.tls')}</li>
              <li>{t('about.security.protection.features.destruction')}</li>
              <li>{t('about.security.protection.features.logging')}</li>
              <li>{t('about.security.protection.features.password')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">{t('about.openSource.title')}</h2>
        <p className="text-lg mb-8">
          {t('about.openSource.description')}{' '}
          <a
            href={config.CRYPT_FYI_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
          .
        </p>

        <div className="flex justify-center mt-12 mb-8">
          <Link
            to="/new"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('about.openSource.cta')}
          </Link>
        </div>
      </section>
    </div>
  );
}
