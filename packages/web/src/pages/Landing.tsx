import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button/button';
import {
  IconLock,
  IconShare,
  IconFlame,
  IconBrandGithub,
  IconShieldLock,
  IconEyeOff,
  IconClock,
  IconKey,
  IconFiles,
  IconWebhook,
  IconWorld,
  IconNumbers,
  IconQrcode,
  IconTerminal2,
  IconBrandDocker,
  IconBrandChrome,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { config } from '@/config';
import { useTranslation } from 'react-i18next';

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4">{t('landing.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{t('landing.subtitle')}</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/new">{t('common.createSecret')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">{t('common.learnMore')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mb-16"
      >
        <a
          href={config.CRYPT_FYI_GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <IconBrandGithub className="w-5 h-5" />
          <span>{t('common.starOnGithub')}</span>
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <IconLock className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">{t('landing.steps.encrypt.title')}</h2>
            <p className="text-muted-foreground">{t('landing.steps.encrypt.description')}</p>
          </div>
          <div className="text-center">
            <IconShare className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">{t('landing.steps.share.title')}</h2>
            <p className="text-muted-foreground">{t('landing.steps.share.description')}</p>
          </div>
          <div className="text-center">
            <IconFlame className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">{t('landing.steps.autoDelete.title')}</h2>
            <p className="text-muted-foreground">{t('landing.steps.autoDelete.description')}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-32"
      >
        <h2 className="text-2xl font-bold text-center mb-8">{t('common.features')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconShieldLock className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.encryption.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.encryption.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconLock className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.security.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.security.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconEyeOff className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.zeroKnowledge.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.zeroKnowledge.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconFlame className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.burn.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.burn.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconFlame className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.failedAttempts.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.failedAttempts.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconClock className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.expiration.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.expiration.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconKey className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.password.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.password.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconFiles className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.files.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.files.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconWebhook className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.webhooks.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.webhooks.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconWorld className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.ipControl.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.ipControl.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconNumbers className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.readLimits.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.readLimits.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconQrcode className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.qrCode.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.qrCode.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconTerminal2 className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              <a
                href="https://www.npmjs.com/package/@crypt.fyi/cli"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('landing.features.cli.title')}
              </a>
            </h3>
            <p className="text-sm text-muted-foreground">{t('landing.features.cli.description')}</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconBrandChrome className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              <a
                href="https://chromewebstore.google.com/detail/cryptfyi/hkmbmkjfjfdbpohlllleaacjkacfhald"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('landing.features.chromeExtension.title')}
              </a>
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.chromeExtension.description')}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">
              <IconBrandDocker className="inline mr-2 w-5 h-5 text-primary flex-shrink-0" />
              {t('landing.features.docker.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.features.docker.description')}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex justify-center mt-16"
      >
        <Button asChild size="lg">
          <Link to="/new">{t('common.createSecret')}</Link>
        </Button>
      </motion.div>
    </div>
  );
}
