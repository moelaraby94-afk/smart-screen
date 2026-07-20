import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from './lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-lg text-sm font-semibold tracking-tight transition-all duration-fast ease-default active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        cta: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-muted-foreground hover:bg-muted hover:text-foreground',
        outline:
          'border border-border bg-card text-foreground hover:bg-muted',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-5 text-base',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const iconSizeMap: Record<string, string> = {
  sm: 'h-3.5 w-3.5',
  default: 'h-4 w-4',
  lg: 'h-[18px] w-[18px]',
  icon: 'h-[18px] w-[18px]',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      fullWidth = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const iconClass = iconSizeMap[size ?? 'default'] ?? iconSizeMap.default;

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || undefined}
        {...props}
      >
        {loading && <Loader2 className={cn(iconClass, 'animate-spin')} aria-hidden />}
        {!loading && LeftIcon && <LeftIcon className={iconClass} aria-hidden />}
        {children}
        {!loading && RightIcon && <RightIcon className={iconClass} aria-hidden />}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
