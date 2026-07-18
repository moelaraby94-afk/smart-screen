'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  className?: string;
};

export function AdminCosmicLoader({ label, className }: Props) {
  return (
    <div
      className={cn(
        'flex min-h-[120px] items-center justify-center gap-3 text-sm text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-6 w-6 shrink-0 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
