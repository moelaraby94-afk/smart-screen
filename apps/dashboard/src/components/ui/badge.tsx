import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-primary/25 bg-primary/10 text-primary',
        muted: 'border-border bg-muted text-muted-foreground',
        success:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        online:
          'border-primary/25 bg-primary/10 text-primary',
        warning:
          'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
