import { createBrowserRouter, redirect, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CreatePage } from '@/pages/Create';
import { ViewPage } from '@/pages/View';
import { About } from '@/pages/About';
import { Privacy } from '@/pages/Privacy';
import { Layout } from '@/components/layout';
import { LandingPage } from './pages/Landing';
import { ClientProvider } from './context/client';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/new',
        element: <CreatePage />,
      },
      {
        path: '/about',
        element: <About />,
      },
      {
        path: '/privacy',
        element: <Privacy />,
      },
      {
        path: '/:id',
        element: <ViewPage />,
      },
      {
        path: '*',
        loader: () => redirect('/'),
        element: null,
      },
    ],
  },
]);

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
