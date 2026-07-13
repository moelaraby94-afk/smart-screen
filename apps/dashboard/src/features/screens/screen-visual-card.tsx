'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Loader2,
  MapPin,
  MoreHorizontal,
  PenLine,
  Power,
  RefreshCw,
  Monitor,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useScreenActivePreview } from '@/features/screens/use-screen-active-preview';
import {
  deriveFleetReachability,
  ScreenFleetStatusBadge,
} from '@/features/screens/screen-fleet-status';
import type { ScreenRow } from './useApiScreens';
import type { PlaylistOption as ApiPlaylistOption } from '@/features/screens/api/screens-api';

type PlaylistOption = ApiPlaylistOption;

export function ScreenVisualCard({
  screen,
  locale,
  workspaceId,
  index,
  onCardClick,
  onEdit,
  onDelete,
  onRemote,
  playlists,
  canAssignPlayback,
  assignPlaylistBusy,
  onAssignPlaybackPlaylist,
  selected,
  onToggleSelect,
}: {
  screen: ScreenRow;
  locale: string;
  workspaceId: string;
  index: number;
  onCardClick: (s: ScreenRow) => void;
  onEdit: (s: ScreenRow) => void;
  onDelete: (id: string) => void;
  onRemote: (id: string, c: 'refresh_content' | 'restart') => void;
  playlists: PlaylistOption[];
  canAssignPlayback: boolean;
  assignPlaylistBusy: boolean;
  onAssignPlaybackPlaylist: (screenId: string, playlistId: string | null) => Promise<void>;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const t = useTranslations('screensClient');
  const { previewUrl, loading, previewRev } = useScreenActivePreview(
    screen.id,
    workspaceId,
  );
  const reach = deriveFleetReachability(screen.status, screen.lastSeenAt);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 420, damping: 28 }}
      whileHover={{ scale: 1.015, y: -2 }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'border border-border bg-card shadow-sm',
        'transition-colors duration-200 hover:border-primary/30 hover:shadow-md',
        reach === 'online' && 'ngl-screen-card-live',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      {onToggleSelect && (
        <div className="absolute end-2 top-2 z-10">
          <Checkbox
            checked={selected ?? false}
            onCheckedChange={() => onToggleSelect(screen.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('selectScreen')}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => onCardClick(screen)}
        className="relative block w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${previewUrl}-${previewRev}`}
              src={previewUrl}
              alt={t('screenPreviewAlt', { name: screen.name })}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Monitor className="h-12 w-12 text-white/25" strokeWidth={1.25} />
            </div>
          )}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-medium text-foreground backdrop-blur-[1px]">
              {t('loadingPreview')}
            </div>
          ) : null}
          <div className="absolute start-3 top-3">
            <ScreenFleetStatusBadge
              status={screen.status}
              lastSeenAt={screen.lastSeenAt}
              locale={locale}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 pt-10">
            <p className="truncate text-base font-semibold text-white drop-shadow-md">{screen.name}</p>
            <p className="font-mono text-[11px] text-white/70">{screen.serialNumber}</p>
            {(screen.location || (screen.resolutionWidth && screen.resolutionHeight)) && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/60">
                {screen.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    {screen.location}
                  </span>
                )}
                {screen.resolutionWidth && screen.resolutionHeight && (
                  <span className="inline-flex items-center gap-1">
                    <Monitor className="h-3 w-3" strokeWidth={1.5} />
                    {screen.resolutionWidth}×{screen.resolutionHeight}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-3 border-t border-border bg-card p-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('playbackPlaylist')}
          </label>
          <div className="relative">
            <select
              className={cn(
                'h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-background px-3 pe-9 text-[13px] font-medium text-foreground outline-none',
                'focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              disabled={!canAssignPlayback || assignPlaylistBusy}
              value={screen.activePlaylistId ?? ''}
              aria-label={t('playbackPlaylistAria')}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const v = e.target.value;
                void onAssignPlaybackPlaylist(screen.id, v || null);
              }}
            >
              <option value="">{t('playbackPlaylistNone')}</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            {assignPlaylistBusy ? (
              <span className="pointer-events-none absolute end-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-xl" aria-label={t('screenActionsAria')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem] rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(screen)}>{t('screenSettings')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(screen.id)}
              >
                {t('deleteScreen')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 rounded-xl text-[13px] font-semibold"
            asChild
          >
            <Link href={`/${locale}/studio` as Route}>
              <PenLine className="me-1.5 h-3.5 w-3.5" />
              {t('editDesign')}
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 rounded-xl text-[13px] font-medium"
            onClick={() => onRemote(screen.id, 'refresh_content')}
          >
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            {t('refresh')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 rounded-xl border-destructive/30 bg-destructive/5 text-[13px] font-medium text-destructive hover:bg-destructive/10"
            onClick={() => onRemote(screen.id, 'restart')}
          >
            <Power className="me-1.5 h-3.5 w-3.5" />
            {t('powerOff')}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
