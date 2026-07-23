'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-sm',
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-8 w-8 text-primary" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="space-y-2">
        <p className="max-w-sm text-lg font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <Button variant="default" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
