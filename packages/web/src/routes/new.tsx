import { createFileRoute } from '@tanstack/react-router';
import { CreatePage } from '@/pages/Create';

export const Route = createFileRoute('/new')({
  component: CreatePage,
});
