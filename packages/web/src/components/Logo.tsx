import LogoMark from '../../public/logo-light.svg?react';
import { cn } from '@/lib/utils';

/** Colored with currentColor from CSS, so it can never disagree with the active theme. */
export function Logo({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <LogoMark
      aria-hidden
      className={cn('h-fit', animate ? 'logo-animate' : 'logo-static', className)}
    />
  );
}
