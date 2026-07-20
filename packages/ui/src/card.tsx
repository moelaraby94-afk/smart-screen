import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/utils';

const cardVariants = cva(
  'relative rounded-lg text-card-foreground transition-shadow duration-normal',
  {
    variants: {
      variant: {
        default: 'border border-border bg-card shadow-xs',
        elevated: 'bg-card shadow-sm',
        outline: 'border border-border-strong bg-card',
        interactive:
          'border border-border bg-card shadow-xs hover:shadow-sm hover:border-border-strong cursor-pointer',
        danger: 'border border-destructive/20 bg-destructive/5',
        muted: 'border border-border bg-muted',
      },
      size: {
        compact: '',
        default: '',
        large: '',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const cardPadding: Record<string, string> = {
  compact: 'p-3',
  default: 'p-5',
  large: 'p-6',
  none: '',
};

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants> & {
    selected?: boolean;
  };

function Card({ className, variant, size, selected, ...props }: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ variant, size }),
        selected && 'border-2 border-primary bg-primary/5',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 border-b border-border p-5', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-tight tracking-tight text-card-foreground', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center border-t border-border p-5 pt-0', className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants, cardPadding };
