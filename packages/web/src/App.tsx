import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ClientProvider } from './context/client';
import { ThemeProvider } from './theme';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

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
          <RouterProvider router={router} />
          <Toaster
            toastOptions={{
              classNames: {
                toast: 'bg-background p-2 rounded-lg outline-accent border-accent',
                title: 'text-foreground',
                description: 'text-muted-foreground',
                closeButton: 'text-foreground',
                actionButton: 'text-foreground',
                cancelButton: 'text-foreground',
                icon: 'text-foreground',
              },
            }}
          />
        </ClientProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
