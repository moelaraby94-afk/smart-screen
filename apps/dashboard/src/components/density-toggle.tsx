'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gauge, LayoutGrid } from 'lucide-react';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

type Density = 'comfortable' | 'compact';

const STORAGE_KEY = 'cs-density';

export function DensityToggle() {
  const t = useTranslations('density');
  const [density, setDensity] = useState<Density>('comfortable');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Density | null;
    if (saved === 'compact' || saved === 'comfortable') {
      setDensity(saved);
      document.documentElement.setAttribute('data-density', saved);
    }
  }, []);

  const toggle = useCallback(() => {
    setDensity((prev) => {
      const next: Density = prev === 'comfortable' ? 'compact' : 'comfortable';
      document.documentElement.setAttribute('data-density', next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isCompact = density === 'compact';

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
      )}
      aria-label={isCompact ? t('switchToComfortable') : t('switchToCompact')}
      aria-pressed={isCompact}
      title={isCompact ? t('switchToComfortable') : t('switchToCompact')}
    >
      {isCompact ? (
        <LayoutGrid className="h-4 w-4" strokeWidth={ICON_STROKE} />
      ) : (
        <Gauge className="h-4 w-4" strokeWidth={ICON_STROKE} />
      )}
    </button>
  );
}
