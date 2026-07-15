'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Clapperboard,
  Copy,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Monitor,
  MoreVertical,
  PenLine,
  Plus,
  Power,
  Radio,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import { type ScreenRow } from '@/features/screens/useApiScreens';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { CardGridSkeleton, ListSkeleton } from '@/components/ui/skeleton-patterns';
import { type BranchScreenStats } from '@/features/branches/branch-stats';
import type { BranchPlaylistRow } from '@/features/branches/use-branch-playlists';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useWorkspaceStats } from '@/features/workspace/use-workspace-stats';

type StatsSectionProps = {
  stats: BranchScreenStats;
  loading: boolean;
};

export function BranchStatsSection({ stats, loading }: StatsSectionProps) {
  const t = useTranslations('branchDetail');
  const tWs = useTranslations('workspaceSettings');
  const locale = useLocale();
  const { workspaceId, workspaces } = useWorkspace();
  const wsCounts = useWorkspaceStats(workspaceId, 0);
  const branch = workspaces.find((w) => w.id === workspaceId);

  const statCards = [
    {
      label: t('statTotal'),
      value: loading ? '…' : String(stats.total),
      icon: Monitor,
      accent: 'from-primary/20 to-primary/5',
    },
    {
      label: t('statOnline'),
      value: loading ? '…' : String(stats.online),
      icon: Radio,
      accent: 'from-emerald-950/50 to-emerald-900/30',
    },
    {
      label: t('statInactive'),
      value: loading ? '…' : String(stats.inactive),
      icon: Power,
      accent: 'from-rose-500/15 to-muted',
      sub: loading
        ? undefined
        : t('inactiveDetail', {
            offline: stats.offline,
            maintenance: stats.maintenance,
          }),
    },
    {
      label: t('statPlaylists'),
      value: String(wsCounts.playlists),
      icon: Clapperboard,
      accent: 'from-blue-500/15 to-blue-900/10',
    },
    {
      label: t('statMedia'),
      value: String(wsCounts.media),
      icon: ImageIcon,
      accent: 'from-purple-500/15 to-purple-900/10',
    },
  ];

  return (
    <section className="space-y-4">
      {/* Workspace overview card */}
      {branch && (
        <div className="vc-card-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <FolderTree className="h-6 w-6 text-primary" strokeWidth={ICON_STROKE} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{branch.name}</h3>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  branch.isPaused
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-emerald-500/15 text-emerald-600',
                )}>
                  {branch.isPaused ? tWs('statusPaused') : tWs('statusActive')}
                </span>
                {branch.role && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {branch.role}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href={`/${locale}/settings/workspace` as Route}>
                {t('settingsLink')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href={`/${locale}/team` as Route}>
                <Users className="me-1.5 h-3.5 w-3.5" />
                {t('teamLink')}
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.35 }}
            className={cn(
              'vc-card-surface relative overflow-hidden rounded-2xl border border-border p-5',
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90',
                item.accent,
              )}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  {item.label}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">
                  {item.value}
                </p>
                {'sub' in item && item.sub ? (
                  <p className="mt-1 text-[11px] text-white/55">{item.sub}</p>
                ) : null}
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <item.icon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

type PlaylistsSectionProps = {
  playlists: BranchPlaylistRow[];
  isLoading: boolean;
  duplicatingId: string | null;
  onlineByPlaylistId: Map<string, number>;
  locale: string;
  workspaceIdParam: string;
  canEditPlaylist: boolean;
  canDeletePlaylist: boolean;
  onNewPlaylist: () => void;
  onDuplicate: (pl: BranchPlaylistRow) => void;
  onEdit: (pl: BranchPlaylistRow) => void;
  onMove: (pl: BranchPlaylistRow) => void;
  onDelete: (pl: BranchPlaylistRow) => void;
};

export function BranchPlaylistsSection(props: PlaylistsSectionProps) {
  const t = useTranslations('branchDetail');

  if (props.isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
              {t('playlistsTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('playlistsSub')}</p>
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition',
              'border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted',
            )}
            onClick={props.onNewPlaylist}
          >
            <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
            {t('addPlaylist')}
          </button>
        </div>
        <ListSkeleton count={4} />
      </section>
    );
  }

  if (props.playlists.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
              {t('playlistsTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('playlistsSub')}</p>
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition',
              'border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted',
            )}
            onClick={props.onNewPlaylist}
          >
            <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
            {t('addPlaylist')}
          </button>
        </div>
        <div className="vc-card-surface rounded-2xl border border-dashed border-border p-10 text-center">
          <Clapperboard className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
          <p className="mt-3 text-sm font-medium text-foreground">{t('noPlaylists')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('noPlaylistsHint')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
            {t('playlistsTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('playlistsSub')}</p>
        </div>
        <button
          type="button"
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition',
            'border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted',
          )}
          onClick={props.onNewPlaylist}
        >
          <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
          {t('addPlaylist')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.playlists.map((pl, i) => {
          const totalScreens = pl._count.screensInGroup;
          const online = props.onlineByPlaylistId.get(pl.id) ?? 0;
          const dupBusy = props.duplicatingId === pl.id;
          return (
            <motion.div
              key={pl.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.3 }}
              className="group/card relative"
            >
              <Link
                href={`/${props.locale}/branches/${props.workspaceIdParam}/playlists/${pl.id}` as Route}
                className={cn(
                  'flex flex-col rounded-2xl border border-border bg-card p-5 pe-12 transition-all duration-200',
                  'hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-md',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground dark:text-white">{pl.name}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t('playlistScreenStats', { total: totalScreens, online })}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/90">
                      {t('playlistItemsCount', { count: pl._count.items })}
                    </p>
                  </div>
                  <Clapperboard className="h-5 w-5 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
                </div>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-primary">
                  {t('openPlaylist')} →
                </span>
              </Link>
              {props.canEditPlaylist ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-2 top-2 z-20 h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('playlistActionsAria')}
                      onClick={(e) => e.preventDefault()}
                    >
                      {dupBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
                      ) : (
                        <MoreVertical className="h-4 w-4" strokeWidth={ICON_STROKE} />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[12rem]">
                    <DropdownMenuItem
                      className="gap-2 font-semibold"
                      disabled={dupBusy}
                      onClick={() => void props.onDuplicate(pl)}
                    >
                      <Copy className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('playlistDuplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 font-semibold"
                      onClick={() => props.onEdit(pl)}
                    >
                      <PenLine className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('playlistEdit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 font-semibold"
                      onClick={() => props.onMove(pl)}
                    >
                      <Monitor className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('playlistMoveToBranch')}
                    </DropdownMenuItem>
                    {props.canDeletePlaylist ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 font-semibold text-red-600 focus:text-red-600"
                          onClick={() => props.onDelete(pl)}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                          {t('playlistDelete')}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

type ScreensSectionProps = {
  screens: ScreenRow[];
  isLoading: boolean;
  locale: string;
  workspaceIdParam: string;
  canEditPlaylist: boolean;
  playlists: BranchPlaylistRow[];
  assigningScreenId: string | null;
  onAssign: (screenId: string, playlistId: string | null) => void;
  onQuickEdit: (screen: ScreenRow) => void;
  onDeleteScreen: (screen: ScreenRow) => Promise<void>;
};

export function BranchScreensSection(props: ScreensSectionProps) {
  const t = useTranslations('branchDetail');

  if (props.isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
            {t('screensTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('screensSub')}</p>
        </div>
        <CardGridSkeleton />
      </section>
    );
  }

  if (props.screens.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
            {t('screensTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('screensSub')}</p>
        </div>
        <div className="vc-card-surface rounded-2xl border border-dashed border-border p-10 text-center">
          <Monitor className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
          <p className="mt-3 text-sm font-medium text-foreground">{t('noScreens')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
          {t('screensTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('screensSub')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.screens.map((screen) => (
          <div
            key={screen.id}
            className="vc-card-surface rounded-2xl border border-border/60 p-4 dark:border-white/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground dark:text-white">{screen.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{screen.serialNumber}</p>
              </div>
              <ScreenFleetStatusBadge
                tone="card"
                status={screen.status}
                lastSeenAt={screen.lastSeenAt}
                locale={props.locale}
                className="items-end"
              />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label
                htmlFor={`screen-pl-${screen.id}`}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t('screenPlaybackPlaylist')}
              </Label>
              <div className="relative">
                <select
                  id={`screen-pl-${screen.id}`}
                  className={cn(
                    'h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-3 pe-9 text-sm outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/25',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={!props.canEditPlaylist || props.assigningScreenId === screen.id}
                  value={screen.activePlaylistId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    void props.onAssign(screen.id, v || null);
                  }}
                >
                  <option value="">{t('screenPlaybackNone')}</option>
                  {props.playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name}
                    </option>
                  ))}
                </select>
                {props.assigningScreenId === screen.id ? (
                  <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={ICON_STROKE} />
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-lg px-3 font-semibold"
                variant="cta"
                onClick={() => props.onQuickEdit(screen)}
              >
                {t('screenQuickEdit')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  window.location.assign(`/${props.locale}/studio`);
                }}
              >
                <PenLine className="me-1 h-3.5 w-3.5" />
                {t('screenFullEditor')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                onClick={() => void props.onDeleteScreen(screen)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type MediaSectionProps = {
  mediaItems: { id: string; originalName: string; mimeType: string }[];
  isLoading: boolean;
};

export function BranchMediaSection({ mediaItems, isLoading }: MediaSectionProps) {
  const t = useTranslations('branchDetail');

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
            {t('mediaTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('mediaSub')}</p>
        </div>
        <ListSkeleton count={4} />
      </section>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
            {t('mediaTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('mediaSub')}</p>
        </div>
        <div className="vc-card-surface rounded-2xl border border-dashed border-border p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
          <p className="mt-3 text-sm font-medium text-foreground">{t('noMedia')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
          {t('mediaTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('mediaSub')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mediaItems.map((item) => (
          <div
            key={item.id}
            className="vc-card-surface rounded-2xl border border-border/60 p-4 dark:border-white/10"
          >
            <p className="truncate text-sm font-semibold text-foreground dark:text-white">{item.originalName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.mimeType}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
