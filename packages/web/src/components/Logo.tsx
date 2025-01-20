import LogoLight from '../../public/logo-light.svg?react';
import LogoDark from '../../public/logo-dark.svg?react';
import { useTheme } from '@/theme';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  const [theme] = useTheme();

  return theme === 'dark' ? (
    <LogoLight className={cn('h-fit', className)} />
  ) : (
    <LogoDark className={cn('h-fit', className)} />
  );
}
