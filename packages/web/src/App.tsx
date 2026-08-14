import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientProvider } from './context/client';
import { ThemeProvider } from './theme';

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
      <ThemeProvider>
        <ClientProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 1500,
              classNames: {
                toast:
                  '!bg-foreground !text-background !py-3 !px-4 !rounded-full !shadow-lg !border-0 !min-h-0',
                title: '!text-background !font-medium !text-sm',
                description: '!text-background/80',
                closeButton: '!hidden',
                actionButton: '!text-background',
                cancelButton: '!text-background',
                icon: '!text-background !hidden',
                success: '!bg-foreground',
                info: '!bg-foreground',
              },
            }}
          />
          {legacyQueryKeyMigrated && <LegacyQueryKeyWarning />}
        </ClientProvider>
      </ThemeProvider>
    </QueryClientProvider>
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
