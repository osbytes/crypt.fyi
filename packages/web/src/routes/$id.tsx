import { createFileRoute } from '@tanstack/react-router';
import { ViewPage } from '@/pages/View';
import { z } from 'zod';

export const Route = createFileRoute('/$id')({
  validateSearch: z.object({
    p: z.boolean({ coerce: true }).optional(),
  }),
  component: ViewPage,
});
