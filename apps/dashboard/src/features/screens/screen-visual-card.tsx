'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  Loader2,
  MapPin,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Monitor,
  Zap,
  BadgeAlert,
  Trash2,
  ListMusic,
  FolderTree,
  Maximize,
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
  onAssignContent,
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
  onRemote: (id: string, c: 'refresh_content' | 'identify') => void;
  onAssignContent: (s: ScreenRow) => void;
  playlists: PlaylistOption[];
  canAssignPlayback: boolean;
  assignPlaylistBusy: boolean;
  onAssignPlaybackPlaylist: (screenId: string, playlistId: string | null) => Promise<void>;
  selected?: boolean;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
}) {
  const t = useTranslations('screensClient');
  const prefersReducedMotion = useReducedMotion();
  const { previewUrl, loading, previewRev } = useScreenActivePreview(
    screen.id,
    workspaceId,
  );
  const reach = deriveFleetReachability(screen.status, screen.lastSeenAt);
  const statusText = reach === 'online' ? t('fleetStatus.online')
    : reach === 'stale' ? t('fleetStatus.stale')
    : reach === 'maintenance' ? t('fleetStatus.maintenance')
    : t('fleetStatus.offline');

  const reachDotColor =
    reach === 'online' ? 'bg-success'
    : reach === 'stale' ? 'bg-warning'
    : reach === 'maintenance' ? 'bg-warning'
    : 'bg-destructive';

  return (
    <motion.article
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.04, type: 'spring', stiffness: 420, damping: 28 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      role="button"
      tabIndex={0}
      aria-label={`${screen.name}, ${statusText}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCardClick(screen);
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl',
        'border border-border bg-card',
        'shadow-[0_2px_8px_hsl(220_26%_14%/0.06)]',
        'transition-all duration-300 hover:border-primary/25 hover:shadow-[0_8px_24px_hsl(220_26%_14%/0.10)]',
        reach === 'online' && 'ngl-screen-card-live',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      {onToggleSelect && (
        <div className="absolute start-2.5 top-2.5 z-card">
          <Checkbox
            checked={selected ?? false}
            onCheckedChange={() => onToggleSelect(screen.id, false)}
            onClick={(e) => { e.stopPropagation(); if (e.shiftKey) { onToggleSelect(screen.id, true); } }}
            aria-label={t('selectScreenAria', { name: screen.name })}
          />
        </div>
      )}

      {/* ── Preview area ── */}
      <button
        type="button"
        onClick={() => onCardClick(screen)}
        className="relative block w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${previewUrl}-${previewRev}`}
              src={previewUrl}
              alt={t('screenPreviewAlt', { name: screen.name })}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/60 to-muted/20">
              <Monitor className="h-14 w-14 text-muted-foreground/30" strokeWidth={1} />
              <span className="text-xs font-medium text-muted-foreground/40">{t('noContentAssigned')}</span>
            </div>
          )}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Loader2 className="h-6 w-6 animate-spin text-white/80" />
            </div>
          ) : null}

          {/* Status badge — top end */}
          <div className="absolute end-3 top-3 z-card">
            <ScreenFleetStatusBadge
              status={screen.status}
              lastSeenAt={screen.lastSeenAt}
              locale={locale}
            />
          </div>

          {/* Bottom gradient overlay with name + meta */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pb-3 pt-12">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white drop-shadow-lg">{screen.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-white/60">{screen.serialNumber}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', reachDotColor, reach === 'online' && 'animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]')} />
              </div>
            </div>
            {(screen.playlistGroup?.name || screen.location || (screen.resolutionWidth && screen.resolutionHeight)) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/55">
                {screen.playlistGroup?.name && (
                  <span className="inline-flex items-center gap-1">
                    <FolderTree className="h-3 w-3" strokeWidth={1.5} />
                    {screen.playlistGroup.name}
                  </span>
                )}
                {screen.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    {screen.location}
                  </span>
                )}
                {screen.resolutionWidth && screen.resolutionHeight && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize className="h-3 w-3" strokeWidth={1.5} />
                    {screen.resolutionWidth}×{screen.resolutionHeight}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Playlist selector */}
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <ListMusic className="h-3 w-3" />
            {t('playbackPlaylist')}
          </label>
          <div className="relative">
            <select
              className={cn(
                'h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-background px-3 pe-9 text-sm font-medium text-foreground outline-none transition-colors',
                'hover:border-primary/30',
                'focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              disabled={!canAssignPlayback || assignPlaylistBusy}
              value={screen.activePlaylistId ?? ''}
              aria-label={t('playbackPlaylistAria')}
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
            <div className="pointer-events-none absolute end-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground">
              {assignPlaylistBusy ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {screen.overridePlaylistId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
              <Zap className="h-3 w-3" />
              {t('overrideBadge')}
            </span>
          )}
          {!screen.overridePlaylistId && !screen.activePlaylistId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {t('noContentAssigned')}
            </span>
          )}
        </div>

        {/* Action bar */}
        <div className="mt-auto flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 rounded-xl border-border text-xs font-semibold transition-all hover:border-primary/30 hover:bg-primary/5"
            onClick={() => onRemote(screen.id, 'refresh_content')}
          >
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            {t('syncContent')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 rounded-xl border-border text-xs font-semibold transition-all hover:border-primary/30 hover:bg-primary/5"
            onClick={() => onRemote(screen.id, 'identify')}
          >
            <BadgeAlert className="me-1.5 h-3.5 w-3.5" />
            {t('identifyScreen')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t('screenActionsAria')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem] rounded-xl">
              <DropdownMenuItem className="gap-2 rounded-lg font-medium" onClick={() => onCardClick(screen)}>
                <Monitor className="h-4 w-4 text-primary" />
                {t('viewDetail')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 rounded-lg font-medium" onClick={() => onEdit(screen)}>
                <PenLine className="h-4 w-4 text-primary" />
                {t('renameScreen')}
              </DropdownMenuItem>
              {canAssignPlayback && (
                <DropdownMenuItem className="gap-2 rounded-lg font-medium" onClick={() => onAssignContent(screen)}>
                  <ListMusic className="h-4 w-4 text-primary" />
                  {t('assignContent')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2 rounded-lg font-medium" onClick={() => onRemote(screen.id, 'refresh_content')}>
                <RefreshCw className="h-4 w-4 text-primary" />
                {t('syncContent')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 rounded-lg font-medium" onClick={() => onRemote(screen.id, 'identify')}>
                <BadgeAlert className="h-4 w-4 text-primary" />
                {t('identify')}
              </DropdownMenuItem>
              {canAssignPlayback && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 rounded-lg font-medium text-destructive focus:text-destructive"
                    onClick={() => onDelete(screen.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('deleteScreen')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.article>
  );
}
