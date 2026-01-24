import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { RouterProvider, createRouter } from '@tanstack/react-router';
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

export default function App() {
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
        </ClientProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
