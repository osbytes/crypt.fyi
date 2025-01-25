import { createFileRoute } from '@tanstack/react-router';
import { ViewPage } from '@/pages/View';
import { z } from 'zod';

export const Route = createFileRoute('/$id')({
  validateSearch: z.object({
    key: z.string(),
    p: z.enum(['true', 'false']).optional(),
  }),
  component: ViewPage,
}); 