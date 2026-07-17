'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Row } from '@/features/playlists/playlist-timeline';
import {
  type TransitionType,
  type PlaylistOrientation,
  getMotionVariant,
} from '@/features/playlists/playlist-transitions';
import { cn } from '@/lib/utils';

export type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  rowsByZone: Record<string, Row[]>;
  zones: Zone[];
  defaultTransition: TransitionType;
  transitionDuration?: number;
  orientation: PlaylistOrientation;
  layoutType: 'single' | 'multi_zone';
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  canvasWidth: number;
  canvasHeight: number;
};

const ORIENTATION_ASPECT: Record<PlaylistOrientation, string> = {
  landscape: '16 / 9',
  portrait: '9 / 16',
  square: '1 / 1',
};

function ZoneContent({
  rows,
  defaultTransition,
  transitionDuration,
  playing,
}: {
  rows: Row[];
  defaultTransition: TransitionType;
  transitionDuration: number;
  playing: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = rows[index];

  useEffect(() => {
    if (index >= rows.length) setIndex(0);
  }, [rows, index]);

  useEffect(() => {
    if (!playing || rows.length === 0) return;
    const dur = (rows[index]?.durationSec ?? 5) * 1000;
    timerRef.current = setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % rows.length);
    }, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, rows]);

  if (rows.length === 0 || !current) {
    return <div className="flex h-full w-full items-center justify-center bg-black/40 text-[10px] text-white/20">Empty</div>;
  }

  const currentTransition = current.transition ?? defaultTransition;
  const variant = getMotionVariant(currentTransition, transitionDuration);

  return (
    <AnimatePresence mode="popLayout" custom={direction}>
      <motion.div
        key={current.clientId}
        custom={direction}
        initial={variant.initial}
        animate={variant.animate}
        exit={variant.exit}
        transition={variant.transition}
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        style={{ perspective: 800 }}
      >
        {current.kind === 'media' ? (
          current.media.mimeType.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.media.publicUrl} alt={current.media.originalName} className="max-h-full max-w-full object-contain" />
          ) : (
            <video src={current.media.publicUrl} className="max-h-full max-w-full object-contain" autoPlay muted playsInline />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 text-white/60">
            <span className="text-lg font-bold">{current.canvas.name.charAt(0)}</span>
            <span className="text-[8px]">{current.canvas.name}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function PlaylistZonePreview({
  rowsByZone,
  zones,
  defaultTransition,
  transitionDuration = 0.6,
  orientation,
  layoutType,
  selectedZoneId,
  onSelectZone,
  canvasWidth,
  canvasHeight,
}: Props) {
  const t = useTranslations('playlistStudioClient');
  const [playing, setPlaying] = useState(true);

  const singleZone: Zone = {
    id: 'full',
    name: 'Full Screen',
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
  };

  const activeZones = layoutType === 'single' ? [singleZone] : zones;
  const singleRows = rowsByZone['full'] ?? rowsByZone['__default__'] ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{t('preview')}</span>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-lg px-2.5" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span className="text-xs">{playing ? t('pause') : t('play')}</span>
        </Button>
      </div>

      {/* Preview canvas — aspect-ratio is the single source of truth for proportions.
          One max-width constraint per orientation; height derives from the ratio.
          No maxHeight, no arbitrary sizing — the preview is geometrically accurate. */}
      <div className="flex justify-center rounded-2xl border border-border/40 bg-muted/20 p-3">
        <div
          className="relative overflow-hidden rounded-xl border-2 border-border bg-black shadow-xl"
          style={{
            aspectRatio: ORIENTATION_ASPECT[orientation],
            width: '100%',
            maxWidth: orientation === 'portrait' ? '260px' : orientation === 'square' ? '420px' : '640px',
          }}
        >
          {layoutType === 'single' ? (
            <div
              className={cn(
                'absolute inset-0 cursor-pointer transition-all',
                selectedZoneId === 'full' && 'ring-2 ring-primary ring-inset',
              )}
              onClick={() => onSelectZone('full')}
            >
              <ZoneContent rows={singleRows} defaultTransition={defaultTransition} transitionDuration={transitionDuration} playing={playing} />
            </div>
          ) : (
            activeZones.map((zone) => {
              const zoneRows = rowsByZone[zone.id] ?? [];
              const isSelected = selectedZoneId === zone.id;
              return (
                <div
                  key={zone.id}
                  className={cn(
                    'absolute cursor-pointer border-2 transition-all',
                    isSelected
                      ? 'border-primary border-solid z-card shadow-lg'
                      : 'border-white/20 border-dashed hover:border-white/40',
                  )}
                  style={{
                    left: `${(zone.x / canvasWidth) * 100}%`,
                    top: `${(zone.y / canvasHeight) * 100}%`,
                    width: `${(zone.width / canvasWidth) * 100}%`,
                    height: `${(zone.height / canvasHeight) * 100}%`,
                  }}
                  onClick={() => onSelectZone(zone.id)}
                >
                  {/* Zone label */}
                  <div className={cn(
                    'absolute start-1 top-1 z-card rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm',
                    isSelected ? 'bg-primary text-white' : 'bg-black/50 text-white/80',
                  )}>
                    {zone.name}
                  </div>

                  {/* Zone content */}
                  <ZoneContent rows={zoneRows} defaultTransition={defaultTransition} transitionDuration={transitionDuration} playing={playing} />

                  {/* Empty state overlay when selected */}
                  {isSelected && zoneRows.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                      <span className="text-[10px] font-medium text-primary/60">{t('clickToAssign')}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Zone tabs for multi-zone */}
      {layoutType === 'multi_zone' && activeZones.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeZones.map((zone) => {
            const count = (rowsByZone[zone.id] ?? []).length;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                  selectedZoneId === zone.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <span>{zone.name}</span>
                <span className={cn(
                  'rounded-full px-1.5 text-[9px] font-bold',
                  selectedZoneId === zone.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
