import { IconEye, IconEyeOff } from '@tabler/icons-react';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RevealInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  showLabel: string;
  hideLabel: string;
}

export const RevealInput = React.forwardRef<HTMLInputElement, RevealInputProps>(
  ({ showLabel, hideLabel, className, disabled, ...props }, ref) => {
    const [isRevealed, setIsRevealed] = React.useState(false);
    const label = isRevealed ? hideLabel : showLabel;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isRevealed ? 'text' : 'password'}
          disabled={disabled}
          className={cn('pr-11', className)}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-pressed={isRevealed}
          title={label}
          onClick={() => setIsRevealed((value) => !value)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {isRevealed ? (
            <IconEyeOff className="size-4" aria-hidden />
          ) : (
            <IconEye className="size-4" aria-hidden />
          )}
        </button>
      </div>
    );
  },
);
RevealInput.displayName = 'RevealInput';
