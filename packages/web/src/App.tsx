import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientProvider } from './context/client';
import { ThemeProvider, useTheme } from './theme';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { TooltipProvider } from './components/ui/tooltip';

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

interface AppProps {
  legacyQueryKeyMigrated?: boolean;
}

export default function App({ legacyQueryKeyMigrated = false }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <ClientProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
            <ThemedToaster />
            {legacyQueryKeyMigrated && <LegacyQueryKeyWarning />}
          </ClientProvider>
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

function ThemedToaster() {
  const { resolved } = useTheme();

  return (
    <Toaster
      theme={resolved}
      toastOptions={{
        classNames: {
          toast: '!bg-popover !border-border !rounded-lg',
          title: '!text-foreground',
          description: '!text-muted-foreground',
          closeButton: '!text-foreground',
          actionButton: '!text-foreground',
          cancelButton: '!text-foreground',
          icon: '!text-foreground',
        },
      }}
    />
  );
}

function LegacyQueryKeyWarning() {
  const { t } = useTranslation();

  useEffect(() => {
    toast.warning(t('view.legacyKey.warning'), {
      id: 'legacy-query-key-migrated',
      closeButton: true,
      duration: Infinity,
    });
  }, [t]);

  return null;
}
