'use client';

import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { ICON_STROKE } from '@/lib/icon-stroke';

type Props = {
  content: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
};

export function InfoTooltip({ content, side = 'top', className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex ${className ?? ''}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground transition hover:text-foreground"
        aria-label="Info"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 w-56 rounded-xl border border-border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg ${
            side === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
