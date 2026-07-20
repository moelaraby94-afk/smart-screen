'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Eye, MoreVertical, Pencil, Copy, Trash2, Monitor, Smartphone, Square, PenLine,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { loadPlaylistMeta } from '@/features/playlists/playlist-transitions';
import type { PlaylistSummary } from '../types';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';

type PlaylistCardProps = {
  playlist: PlaylistSummary;
  workspace?: WorkspaceSummary;
  index: number;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PlaylistCard({ playlist: p, workspace: ws, index, onOpen, onDuplicate, onDelete }: PlaylistCardProps) {
  const t = useTranslations('playlistStudioClient');
  const locale = useLocale();
  const meta = loadPlaylistMeta(p.id);
  const Icon = meta.orientation === 'portrait' ? Smartphone : meta.orientation === 'square' ? Square : Monitor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.2) }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
    >
      <button
        type="button"
        onClick={() => onOpen(p.id)}
        className="flex flex-1 flex-col text-start"
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-muted/40 to-muted/5">
          {(() => {
            const firstItem = p.items?.[0];
            if (firstItem?.media?.publicUrl && firstItem.media.mimeType.startsWith('image/')) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstItem.media.publicUrl} alt={firstItem.media.originalName} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
              );
            }
            if (firstItem?.media?.publicUrl && firstItem.media.mimeType.startsWith('video/')) {
              return <video src={firstItem.media.publicUrl} className="h-full w-full object-cover" muted playsInline />;
            }
            if (firstItem?.canvas) {
              return (
                <div className="flex flex-col items-center gap-1.5">
                  <PenLine className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
                  <span className="text-[10px] text-muted-foreground">{firstItem.canvas.name}</span>
                </div>
              );
            }
            return <Icon className="h-10 w-10 text-muted-foreground/20 transition group-hover:text-primary/40" strokeWidth={1.5} />;
          })()}

          <div className="absolute inset-x-2 top-2 flex items-center justify-between">
            {p.isPublished ? (
              <Badge variant="success" className="shadow-sm">
                <Eye className="me-1 h-2.5 w-2.5" />
                {t('publishedBadge')}
              </Badge>
            ) : (
              <Badge variant="muted" className="shadow-sm">
                {t('draftPlaylists')}
              </Badge>
            )}
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              {p._count.items} {t('itemsCount', { count: p._count.items })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-3.5">
          <h3 className="truncate text-sm font-bold text-foreground transition group-hover:text-primary">{p.name}</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {ws && <span className="truncate">{ws.name}</span>}
            <span>·</span>
            <span>{p._count.screensInGroup ?? 0} {t('screens')}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="muted" className="text-[9px]">
              {meta.orientation === 'portrait' ? (locale === 'ar' ? 'عمودي' : 'Portrait') : meta.orientation === 'square' ? (locale === 'ar' ? 'مربع' : 'Square') : (locale === 'ar' ? 'أفقي' : 'Landscape')}
            </Badge>
            <Badge variant="muted" className="text-[9px]">
              {meta.layoutType === 'single' ? t('singleZone') : t('multiZone')}
            </Badge>
          </div>
        </div>
      </button>

      <div className="absolute end-2 top-2 z-card opacity-0 transition group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-white hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onOpen(p.id)}>
              <Pencil className="me-2 h-4 w-4" />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(p.id)}>
              <Copy className="me-2 h-4 w-4" />
              {t('duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(p.id)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
