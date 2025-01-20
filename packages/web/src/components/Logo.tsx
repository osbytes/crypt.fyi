import LogoLight from '../../public/logo-light.svg?react';
import LogoDark from '../../public/logo-dark.svg?react';
import { useTheme } from '@/theme';
import { cn } from '@/lib/utils';

export function Logo({ className, animate = true }: { className?: string; animate?: boolean }) {
  const [theme] = useTheme();
  const Logo = theme === 'dark' ? LogoLight : LogoDark;

  return <Logo className={cn('h-fit', animate && 'logo-animate', className)} />;
}
