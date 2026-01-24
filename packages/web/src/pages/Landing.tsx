import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button/button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button asChild size="lg">
          <Link to="/new">{t('common.createSecret')}</Link>
        </Button>
      </motion.div>
    </div>
  );
}
