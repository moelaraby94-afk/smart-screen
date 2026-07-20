'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { ICON_STROKE } from '@/lib/icon-stroke';

type Props = {
  content: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
};

export function InfoTooltip({ content, side = 'top', className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex ${className ?? ''}`}>
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
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute z-tooltip w-56 rounded-lg border border-border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg ${
            side === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
