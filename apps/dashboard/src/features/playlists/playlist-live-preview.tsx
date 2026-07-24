'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Row } from '@/features/playlists/playlist-timeline';
import {
  type TransitionType,
  type PlaylistOrientation,
  getMotionVariant,
} from '@/features/playlists/playlist-transitions';
import { cn } from '@/lib/utils';

type Props = {
  rows: Row[];
  defaultTransition: TransitionType;
  transitionDuration?: number;
  orientation: PlaylistOrientation;
  layoutType: 'single' | 'multi_zone';
  className?: string;
};

const ORIENTATION_ASPECT: Record<PlaylistOrientation, string> = {
  landscape: '16 / 9',
  portrait: '9 / 16',
  square: '1 / 1',
};

export function PlaylistLivePreview({
  rows,
  defaultTransition,
  transitionDuration = 0.6,
  orientation,
  className,
}: Props) {
  const t = useTranslations('playlistStudioClient');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = rows[index];

  useEffect(() => {
    if (rows.length === 0) {
      setIndex(0);
      return;
    }
    if (index >= rows.length) {
      setIndex(0);
    }
  }, [rows, index]);

  const goNext = () => {
    setDirection(1);
    setIndex((i) => (i + 1) % rows.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setIndex((i) => (i - 1 + rows.length) % rows.length);
  };

  useEffect(() => {
    if (!playing || rows.length === 0) return;
    const dur = (rows[index]?.durationSec ?? 5) * 1000;
    timerRef.current = setTimeout(() => {
      goNext();
    }, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, rows]);

  const currentTransition = current?.transition ?? defaultTransition;
  const variant = getMotionVariant(currentTransition, transitionDuration);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{t('preview')}</span>
          {rows.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {index + 1} / {rows.length}
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Wand2 className="h-3 w-3" />
              {currentTransition}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-lg border-2 border-border bg-black shadow-lg"
        style={{ aspectRatio: ORIENTATION_ASPECT[orientation] }}
      >
        {rows.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/30">
            <Play className="h-8 w-8" strokeWidth={1.5} />
            <p className="text-xs">{t('previewEmpty')}</p>
          </div>
        ) : current ? (
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={current.clientId}
              custom={direction}
              initial={variant.initial}
              animate={variant.animate}
              exit={variant.exit}
              transition={variant.transition}
              className="relative flex h-full w-full items-center justify-center"
              style={{ perspective: 1000 }}
            >
              {current.kind === 'media' ? (
                current.media.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.media.publicUrl}
                    alt={current.media.originalName}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <video
                    src={current.media.publicUrl}
                    className="max-h-full max-w-full object-contain"
                    autoPlay
                    muted
                    playsInline
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/70">
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/20 bg-white/5">
                    <span className="text-2xl font-bold">{current.canvas.name.charAt(0)}</span>
                  </div>
                  <p className="text-sm font-semibold">{current.canvas.name}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}

        {rows.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute start-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/10"
              aria-label={t('prevItem')}
              onClick={goPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/10"
              aria-label={t('nextItem')}
              onClick={goNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {rows.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {rows.map((r, i) => (
            <button
              key={r.clientId}
              type="button"
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
