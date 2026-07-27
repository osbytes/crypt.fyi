import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button/button';
import {
  IconLock,
  IconShare,
  IconFlame,
  IconShieldLock,
  IconClock,
  IconShieldCheck,
  IconCode,
  IconBrandGithub,
  IconBrandDocker,
  IconTerminal2,
  IconBrandChrome,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { config } from '@/config';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function LandingPage() {
  const { t } = useTranslation();

  const alsoIncludes = [
    t('landing.alsoIncludes.password'),
    t('landing.alsoIncludes.files'),
    t('landing.alsoIncludes.webhooks'),
    t('landing.alsoIncludes.qrCode'),
    t('landing.alsoIncludes.ipControl'),
    t('landing.alsoIncludes.readLimits'),
  ];

  const pillars = [
    {
      icon: IconShieldLock,
      title: t('landing.pillars.zeroKnowledge.title'),
      description: t('landing.pillars.zeroKnowledge.description'),
    },
    {
      icon: IconClock,
      title: t('landing.pillars.ephemeral.title'),
      description: t('landing.pillars.ephemeral.description'),
    },
    {
      icon: IconShieldCheck,
      title: t('landing.pillars.defense.title'),
      description: t('landing.pillars.defense.description'),
    },
    {
      icon: IconCode,
      title: t('landing.pillars.open.title'),
      description: t('landing.pillars.open.description'),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-20">
        <Logo className="w-20 mx-auto mb-6" animate />
        <h1 className="text-4xl font-bold mb-4 tracking-tight">{t('landing.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('landing.subtitle')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/new">{t('common.createSecret')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/about">{t('common.learnMore')}</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }} className="mb-24">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <IconLock className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h2 className="text-lg font-semibold mb-2">{t('landing.steps.encrypt.title')}</h2>
            <p className="text-muted-foreground text-sm">
              {t('landing.steps.encrypt.description')}
            </p>
          </div>
          <div className="text-center">
            <IconShare className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h2 className="text-lg font-semibold mb-2">{t('landing.steps.share.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('landing.steps.share.description')}</p>
          </div>
          <div className="text-center">
            <IconFlame className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h2 className="text-lg font-semibold mb-2">{t('landing.steps.autoDelete.title')}</h2>
            <p className="text-muted-foreground text-sm">
              {t('landing.steps.autoDelete.description')}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="mb-24">
        <h2 className="text-2xl font-bold text-center mb-10">{t('landing.pillars.title')}</h2>
        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-10">
          <span className="font-medium text-foreground/80">
            {t('landing.alsoIncludes.label')}:{' '}
          </span>
          {alsoIncludes.join(' · ')}
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-24 -mx-4 px-4 py-12 sm:mx-0 sm:px-10 sm:rounded-lg bg-muted/50 border-y sm:border"
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">{t('landing.selfHost.title')}</h2>
          <p className="text-muted-foreground mb-8">{t('landing.selfHost.description')}</p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Button asChild size="lg">
              <a
                href={config.CRYPT_FYI_RAILWAY_DEPLOY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('landing.selfHost.deployOnRailway')}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={config.CRYPT_FYI_DOCKER_DOCS_URL} target="_blank" rel="noopener noreferrer">
                <IconBrandDocker className="w-5 h-5" />
                {t('landing.selfHost.dockerCompose')}
              </a>
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.5 }} className="mb-16">
        <nav
          aria-label="Ecosystem"
          className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
        >
          <a
            href={config.CRYPT_FYI_CLI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <IconTerminal2 className="w-4 h-4" />
            {t('landing.ecosystem.cli')}
          </a>
          <a
            href={config.CRYPT_FYI_CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <IconBrandChrome className="w-4 h-4" />
            {t('landing.ecosystem.chromeExtension')}
          </a>
          <a
            href={config.CRYPT_FYI_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <IconBrandGithub className="w-4 h-4" />
            {t('landing.ecosystem.github')}
          </a>
        </nav>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex justify-center"
      >
        <Button asChild size="lg">
          <Link to="/new">{t('common.createSecret')}</Link>
        </Button>
      </motion.div>
    </div>
  );
}
