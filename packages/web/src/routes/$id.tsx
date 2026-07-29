import { createFileRoute, useParams, useRouterState, useSearch } from '@tanstack/react-router';
import { ViewPage } from '@/pages/View';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export const Route = createFileRoute('/$id')({
  validateSearch: z.object({
    p: z.coerce.boolean().optional(),
  }),
  remountDeps: ({ params, search }) => ({
    id: params.id,
    passwordProtected: Boolean(search.p),
  }),
  component: ViewRoute,
});

function ViewRoute() {
  const { id } = useParams({ from: '/$id' });
  const search = useSearch({ from: '/$id' });
  const navigationKey = useRouterState({
    select: (state) => state.location.state.__TSR_key,
  });
  const [nativeHashRevision, setNativeHashRevision] = useState(0);

  useEffect(() => {
    const handleHashChange = () => setNativeHashRevision((revision) => revision + 1);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Remount the key-holding view for router and native fragment navigations.
  // This identity contains only public route metadata and opaque counters,
  // never fragment contents or any other decryption-key material.
  const viewInstanceKey = [
    navigationKey ?? 'initial',
    id,
    Boolean(search.p),
    nativeHashRevision,
  ].join(':');

  return <ViewPage key={viewInstanceKey} />;
}
