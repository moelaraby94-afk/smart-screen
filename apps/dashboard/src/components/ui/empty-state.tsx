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
        'vc-card-surface flex flex-col items-center justify-center gap-4 rounded-2xl border border-border px-6 py-16 text-center',
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
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
        <Button variant="cta" className="rounded-xl font-semibold" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
