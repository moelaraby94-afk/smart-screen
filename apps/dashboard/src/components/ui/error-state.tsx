'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  icon: Icon = AlertCircle,
  title,
  description,
  retryLabel,
  onRetry,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-sm',
        className,
      )}
    >
      <Icon className="h-12 w-12 text-destructive" strokeWidth={1.5} aria-hidden />
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {retryLabel && onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="me-1.5 h-4 w-4" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
