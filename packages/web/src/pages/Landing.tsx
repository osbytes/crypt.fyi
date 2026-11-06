import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button/button';
import { Pill } from '@/components/ui/pill';
import {
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

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/** Illustrative only: never derived from real key material or a real secret. */
const DEMO_PLAINTEXT = 'API_TOKEN=demo-not-a-real-token';
const DEMO_CIPHERTEXT = '9fK2xQ7vLp0tRz4mWb8sYc1NeH6uJd3AoG5iTq…';

function DemoRow({
  label,
  children,
  aside,
  sunken,
}: {
  label: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  sunken?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5 ${sunken ? 'bg-muted' : ''}`}
    >
      <div className="min-w-0 space-y-1.5">
        <p className="font-mono text-xs text-muted-foreground">{label}</p>
        <div className="break-all font-mono text-[13px]">{children}</div>
      </div>
      {aside}
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();

  const steps = [
    { key: 'encrypt', title: t('landing.steps.encrypt.title') },
    { key: 'share', title: t('landing.steps.share.title') },
    { key: 'autoDelete', title: t('landing.steps.autoDelete.title') },
  ] as const;

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
    <div className="space-y-16 sm:space-y-20">
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.4 }}
        className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
      >
        <div className="flex flex-col items-start gap-5">
          <Pill tone="sealed">{t('landing.demo.badge')}</Pill>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            {t('landing.title')}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{t('landing.subtitle')}</p>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Button asChild size="lg" className="flex-1 sm:flex-none">
              <Link to="/new">{t('common.createSecret')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
              <Link to="/about">{t('common.learnMore')}</Link>
            </Button>
          </div>
        </div>
        <div
          role="img"
          aria-label={t('landing.demo.ariaLabel')}
          className="divide-y overflow-hidden rounded-xl border bg-card shadow-[var(--card-shadow)]"
        >
          <DemoRow label={t('landing.demo.browser')}>{DEMO_PLAINTEXT}</DemoRow>
          <DemoRow label={t('landing.demo.server')} sunken>
            <span className="text-muted-foreground">{DEMO_CIPHERTEXT}</span>
          </DemoRow>
          <DemoRow
            label={t('landing.demo.afterRead')}
            aside={
              <Pill tone="ember">
                <IconFlame aria-hidden />
                {t('landing.demo.burned')}
              </Pill>
            }
          >
            <span className="text-muted-foreground">{t('landing.demo.nothing')}</span>
          </DemoRow>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid gap-8 border-t pt-8 md:grid-cols-3"
      >
        {steps.map(({ key, title }) => (
          <div key={key}>
            <h2 className="mb-1.5 font-display text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{t(`landing.steps.${key}.description`)}</p>
          </div>
        ))}
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">
          {t('landing.pillars.title')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="mb-3 size-5 text-muted-foreground" aria-hidden />
              <h3 className="mb-1.5 font-display text-lg font-semibold tracking-tight">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t('landing.alsoIncludes.label')}: </span>
          {alsoIncludes.join(' · ')}
        </p>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid items-center gap-6 rounded-xl border bg-card p-6 sm:p-10 md:grid-cols-[1fr_auto]"
      >
        <div>
          <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight">
            {t('landing.selfHost.title')}
          </h2>
          <p className="max-w-xl text-muted-foreground">{t('landing.selfHost.description')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={config.CRYPT_FYI_RAILWAY_DEPLOY_URL} target="_blank" rel="noopener noreferrer">
              {t('landing.selfHost.deployOnRailway')}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={config.CRYPT_FYI_DOCKER_DOCS_URL} target="_blank" rel="noopener noreferrer">
              <IconBrandDocker />
              {t('landing.selfHost.dockerCompose')}
            </a>
          </Button>
        </div>
      </motion.section>

      <nav
        aria-label="Ecosystem"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
      >
        {[
          {
            href: config.CRYPT_FYI_CLI_URL,
            icon: IconTerminal2,
            label: t('landing.ecosystem.cli'),
          },
          {
            href: config.CRYPT_FYI_CHROME_EXTENSION_URL,
            icon: IconBrandChrome,
            label: t('landing.ecosystem.chromeExtension'),
          },
          {
            href: config.CRYPT_FYI_GITHUB_URL,
            icon: IconBrandGithub,
            label: t('landing.ecosystem.github'),
          },
        ].map(({ href, icon: Icon, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
