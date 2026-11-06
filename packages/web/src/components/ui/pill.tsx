import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const pillVariants = cva(
  'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-card text-muted-foreground',
        ember: 'border-transparent bg-ember-tint text-ember',
        sealed: 'border-transparent bg-sealed-tint text-sealed',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Pill({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof pillVariants>) {
  return <span className={cn(pillVariants({ tone }), className)} {...props} />;
}
