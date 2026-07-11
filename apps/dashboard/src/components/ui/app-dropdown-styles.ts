import { cn } from '@/lib/utils';

/** Shared visual tokens for dropdown triggers (workspace switcher, filters, etc.) */
export const appDropdownTriggerClass = cn(
  'flex h-10 min-h-10 w-full max-w-[min(100%,280px)] items-center gap-2 rounded-lg border px-2.5 transition-colors',
  'border-border bg-card',
  'text-start outline-none ring-offset-background',
  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
  'data-[state=open]:border-primary/40',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const appDropdownContentClass = cn(
  'min-w-[260px] max-w-[min(100vw-2rem,340px)] rounded-lg border border-border p-1.5 shadow-lg',
  'bg-card',
);
