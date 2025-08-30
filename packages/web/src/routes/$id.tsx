import { createFileRoute } from '@tanstack/react-router';
import { ViewPage } from '@/pages/View';
import { z } from 'zod';

export const Route = createFileRoute('/$id')({
  validateSearch: z.object({
    p: z.coerce.boolean().optional(),
    key: z.string().optional(),
  }),
  component: ViewPage,
});
