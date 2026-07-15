'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { ListVideo, CheckCircle2, FileEdit } from 'lucide-react';

type PlaylistHeaderProps = {
  total: number;
  published: number;
  draft: number;
};

export function PlaylistHeader({ total, published, draft }: PlaylistHeaderProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <header className="space-y-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t('pageTitle')}</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{t('pageDescription')}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-1.5">
          <ListVideo className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">{t('totalPlaylists')}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-foreground">{published}</span>
          <span className="text-xs text-muted-foreground">{t('publishedPlaylists')}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-1.5">
          <FileEdit className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">{draft}</span>
          <span className="text-xs text-muted-foreground">{t('draftPlaylists')}</span>
        </div>
      </div>
    </header>
  );
}
