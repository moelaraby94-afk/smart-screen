'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Row } from '@/features/playlists/playlist-timeline';

type Props = {
  open: boolean;
  onClose: () => void;
  rows: Row[];
};

export function PlaylistPreviewOverlay({ open, onClose, rows }: Props) {
  const t = useTranslations('playlistStudioClient');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = rows[index];

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setPlaying(true);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !playing || rows.length === 0) return;
    const dur = (rows[index]?.durationSec ?? 5) * 1000;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % rows.length);
    }, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, playing, index, rows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
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

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-white/60">{t('previewEmpty')}</p>
        ) : current ? (
          <div className="relative h-full w-full flex items-center justify-center">
            {current.kind === 'media' ? (
              current.media.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.clientId}
                  src={current.media.publicUrl}
                  alt={current.media.originalName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  key={current.clientId}
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
          </div>
        ) : null}

        {rows.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute start-4 text-white hover:bg-white/10"
              aria-label={t('prevItem')}
              onClick={() => setIndex((i) => (i - 1 + rows.length) % rows.length)}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-4 text-white hover:bg-white/10"
              aria-label={t('nextItem')}
              onClick={() => setIndex((i) => (i + 1) % rows.length)}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex justify-center gap-1.5 px-6 py-4">
          {rows.map((r, i) => (
            <button
              key={r.clientId}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
