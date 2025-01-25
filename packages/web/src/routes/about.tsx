import { createFileRoute } from '@tanstack/react-router';
import { About } from '@/pages/About';

export const Route = createFileRoute('/about')({
  component: About,
});
