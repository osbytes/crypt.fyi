import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { Layout } from '@/components/layout';

export const Route = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  notFoundComponent: () => {
    redirect({ to: '/' });
    return null;
  },
}); 