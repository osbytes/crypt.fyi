import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button/button';
import { IconLock, IconShare, IconFlame, IconBrandGithub } from '@tabler/icons-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4">Share Secrets Securely</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Send passwords and sensitive information with zero-knowledge end-to-end encryption and
            automatic deletion
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/new">Create Secret</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <IconLock className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">1. Encrypt</h3>
            <p className="text-muted-foreground">
              Your secret is encrypted in your browser before being stored
            </p>
          </div>
          <div className="text-center">
            <IconShare className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">2. Share</h3>
            <p className="text-muted-foreground">Send the secure link to your intended recipient</p>
          </div>
          <div className="text-center">
            <IconFlame className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">3. Auto-Delete</h3>
            <p className="text-muted-foreground">
              Secret is permanently deleted after being viewed
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <a
          href="https://github.com/osbytes/crypt.fyi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <IconBrandGithub className="w-5 h-5" />
          <span>Star on GitHub</span>
        </a>
      </motion.div>
    </div>
  );
}
