import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useTheme } from '@/theme';

const OPTIONS = [
  { value: 'system', icon: IconDeviceDesktop },
  { value: 'light', icon: IconSun },
  { value: 'dark', icon: IconMoon },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label={t('common.theme.label')}
      className={cn('inline-flex gap-0.5 rounded-lg border bg-card p-0.5', className)}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const isSelected = preference === value;
        const label = t(`common.theme.${value}`);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'grid size-8 place-items-center rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
