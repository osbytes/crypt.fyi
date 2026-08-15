import { createFileRoute } from '@tanstack/react-router';
import { ViewPage } from '@/pages/View';
import { z } from 'zod';

export const Route = createFileRoute('/$id')({
  validateSearch: z.object({
    p: z.coerce.boolean().optional(),
    // Payload lives in object storage and is downloaded as a stream.
    s: z.coerce.boolean().optional(),
  }),
  component: ViewPage,
});
