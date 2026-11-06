import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

/** Shared shell for every "here is what happened, here is what to do" recipient state. */
export function StatusCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl pt-4 sm:pt-12">
      <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && <div className="text-muted-foreground">{description}</div>}
        </div>
        {children}
      </Card>
    </div>
  );
}
