'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
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

  return (
    <motion.article
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.04, type: 'spring', stiffness: 420, damping: 28 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.015, y: -2 }}
      role="button"
      tabIndex={0}
      aria-label={`${screen.name}, ${statusText}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCardClick(screen);
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg',
        'border border-border bg-card shadow-sm',
        'transition-colors duration-200 hover:border-primary/30 hover:shadow-md',
        reach === 'online' && 'ngl-screen-card-live',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      {onToggleSelect && (
        <div className="absolute start-2 top-2 z-card">
          <Checkbox
            checked={selected ?? false}
            onCheckedChange={() => onToggleSelect(screen.id, false)}
            onClick={(e) => { e.stopPropagation(); if (e.shiftKey) { onToggleSelect(screen.id, true); } }}
            aria-label={t('selectScreenAria', { name: screen.name })}
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
            <p className="font-mono text-xs text-white/70">{screen.serialNumber}</p>
            {(screen.playlistGroup?.name || screen.location || (screen.resolutionWidth && screen.resolutionHeight)) && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('playbackPlaylist')}
          </label>
          <div className="relative">
            <select
              className={cn(
                'h-9 w-full cursor-pointer appearance-none rounded-lg border border-border bg-background px-3 pe-9 text-sm font-medium text-foreground outline-none',
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

        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {screen.overridePlaylistId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-warning">
              <Zap className="h-3 w-3" />
              {t('overrideBadge')}
            </span>
          )}
          {!screen.overridePlaylistId && !screen.activePlaylistId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t('noContentAssigned')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 rounded-lg text-sm font-medium"
            onClick={() => onRemote(screen.id, 'refresh_content')}
          >
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            {t('syncContent')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 flex-1 rounded-lg text-sm font-medium"
            onClick={() => onRemote(screen.id, 'identify')}
          >
            <BadgeAlert className="me-1.5 h-3.5 w-3.5" />
            {t('identifyScreen')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-lg" aria-label={t('screenActionsAria')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem] rounded-lg">
              <DropdownMenuItem onClick={() => onCardClick(screen)}>
                <Monitor className="me-2 h-4 w-4" />
                {t('viewDetail')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(screen)}>
                <PenLine className="me-2 h-4 w-4" />
                {t('renameScreen')}
              </DropdownMenuItem>
              {canAssignPlayback && (
                <DropdownMenuItem onClick={() => onAssignContent(screen)}>
                  <ListMusic className="me-2 h-4 w-4" />
                  {t('assignContent')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onRemote(screen.id, 'refresh_content')}>
                <RefreshCw className="me-2 h-4 w-4" />
                {t('syncContent')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemote(screen.id, 'identify')}>
                <BadgeAlert className="me-2 h-4 w-4" />
                {t('identify')}
              </DropdownMenuItem>
              {canAssignPlayback && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(screen.id)}
                  >
                    <Trash2 className="me-2 h-4 w-4" />
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
