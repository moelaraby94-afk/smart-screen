'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pause, Play, X, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Row } from '@/features/playlists/playlist-timeline';
import {
  type TransitionType,
  getMotionVariant,
} from '@/features/playlists/playlist-transitions';

type Props = {
  open: boolean;
  onClose: () => void;
  rows: Row[];
  defaultTransition: TransitionType;
  transitionDuration?: number;
};

export function PlaylistPreviewOverlay({ open, onClose, rows, defaultTransition, transitionDuration = 0.6 }: Props) {
  const t = useTranslations('playlistStudioClient');
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const current = rows[index];

  // Focus trap + restore
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const focusable = overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusable[0];
    if (firstFocusable) firstFocusable.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    overlay.addEventListener('keydown', handleKeyDown);
    return () => {
      overlay.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current) triggerRef.current.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setPlaying(true);
      setDirection(1);
      return;
    }
  }, [open]);

  const goNext = () => {
    setDirection(1);
    setIndex((i) => (i + 1) % rows.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setIndex((i) => (i - 1 + rows.length) % rows.length);
  };

  useEffect(() => {
    if (!open || !playing || rows.length === 0) return;
    const dur = (rows[index]?.durationSec ?? 5) * 1000;
    timerRef.current = setTimeout(() => {
      goNext();
    }, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, playing, index, rows]);

  if (!open) return null;

  const currentTransition = current?.transition ?? defaultTransition;
  const variant = getMotionVariant(currentTransition, transitionDuration);

  const overlayAnimation = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.01 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const } };

  const handleStageClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        key="preview-overlay"
        {...overlayAnimation}
        className="fixed inset-0 z-modal flex flex-col bg-black/95 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={t('previewMode')}
      >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-white">
          <span className="text-sm font-semibold">
            {t('previewMode')} — {index + 1} / {rows.length}
          </span>
          {current && (
            <span className="text-xs text-white/60">
              {current.kind === 'media' ? current.media.originalName : current.canvas.name}
              {' · '}
              {current.durationSec}s
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
            <Wand2 className="h-3 w-3" />
            {currentTransition}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            {t('exitPreview')}
          </Button>
        </div>
      </div>

      {/* Stage — click on empty area closes */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={handleStageClick}
      >
        {rows.length === 0 ? (
          <p className="text-white/60">{t('previewEmpty')}</p>
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
                <div className="flex flex-col items-center gap-4 text-white/80">
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-white/20 bg-white/5">
                    <span className="text-3xl font-bold">{current.canvas.name.charAt(0)}</span>
                  </div>
                  <p className="text-lg font-semibold">{current.canvas.name}</p>
                  <p className="text-xs text-white/50">{t('canvasPreviewPlaceholder')}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* Navigation arrows */}
        {rows.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute start-4 text-white hover:bg-white/10"
              aria-label={t('prevItem')}
              onClick={goPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-4 text-white hover:bg-white/10"
              aria-label={t('nextItem')}
              onClick={goNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Progress dots */}
      {rows.length > 0 && (
        <div className="flex justify-center gap-1.5 px-6 py-4">
          {rows.map((r, i) => (
            <button
              key={r.clientId}
              type="button"
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`${t('previewMode')} ${i + 1}`}
            />
          ))}
        </div>
      )}
      </motion.div>
    </AnimatePresence>
  );
}
