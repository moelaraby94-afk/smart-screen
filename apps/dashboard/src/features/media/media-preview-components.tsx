'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Film, ImageIcon, Sparkles } from 'lucide-react';

export function MediaPreviewImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const t = useTranslations('mediaClient');
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted p-2 text-center">
        <ImageIcon className="h-8 w-8 shrink-0 text-primary/60" strokeWidth={1.5} />
        <span className="px-1 text-[10px] leading-tight text-muted-foreground">{t('previewUnavailable')}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function MediaPreviewVideo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const t = useTranslations('mediaClient');
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted p-2 text-center">
        <Film className="h-8 w-8 shrink-0 text-primary/60" strokeWidth={1.5} />
        <span className="px-1 text-[10px] leading-tight text-muted-foreground">{t('previewUnavailable')}</span>
      </div>
    );
  }
  return (
    <video
      src={src}
      className="h-full w-full object-cover"
      muted
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  );
}

export function EmptyMediaIllustration() {
  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center">
      <svg
        viewBox="0 0 400 280"
        className="h-48 w-full text-muted-foreground/20"
        aria-hidden
      >
        <defs>
          <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect x="48" y="40" width="304" height="200" rx="24" fill="url(#mg)" opacity="0.35" />
        <rect
          x="72"
          y="64"
          width="120"
          height="90"
          rx="12"
          fill="currentColor"
          opacity="0.15"
        />
        <circle cx="260" cy="96" r="28" fill="hsl(var(--primary))" opacity="0.2" />
        <path
          d="M88 200h224"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.2"
        />
        <path
          d="M88 220h160"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.12"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-8">
        <div className="rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
          <Sparkles className="mx-auto h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
