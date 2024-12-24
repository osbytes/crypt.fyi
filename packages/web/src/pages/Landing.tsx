import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button/button';
import { IconLock, IconShare, IconFlame, IconBrandGithub } from '@tabler/icons-react';
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
    </div>
  );
}
