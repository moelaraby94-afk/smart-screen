import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-lg border bg-card text-foreground outline-none transition-colors duration-fast placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input hover:border-border-strong focus:border-ring focus:ring-2 focus:ring-ring/20',
        error: 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20 bg-destructive/5',
      },
      size: {
        sm: 'h-8 px-2 text-sm',
        default: 'h-9 px-3 text-base',
        lg: 'h-10 px-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants> & {
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    inputClassName?: string;
  };

function Input({ className, variant, size, leftIcon: LeftIcon, rightIcon: RightIcon, inputClassName, ...props }: InputProps) {
  if (LeftIcon || RightIcon) {
    const iconClass = 'h-4 w-4 text-muted-foreground';
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-card transition-colors duration-fast',
          variant === 'error' ? 'border-destructive bg-destructive/5' : 'border-input hover:border-border-strong',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
          'disabled:opacity-50',
          size === 'sm' ? 'h-8 px-2' : size === 'lg' ? 'h-10 px-3' : 'h-9 px-3',
          className,
        )}
      >
        {LeftIcon && <LeftIcon className={cn(iconClass, 'shrink-0')} aria-hidden />}
        <input
          className={cn(
            'w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed',
            size === 'sm' ? 'text-sm' : 'text-base',
            inputClassName,
          )}
          aria-invalid={variant === 'error' || undefined}
          {...props}
        />
        {RightIcon && <RightIcon className={cn(iconClass, 'shrink-0')} aria-hidden />}
      </div>
    );
  }

  return (
    <input
      className={cn(inputVariants({ variant, size }), className)}
      aria-invalid={variant === 'error' || undefined}
      {...props}
    />
  );
}

export { Input, inputVariants };
