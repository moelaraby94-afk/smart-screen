'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Clapperboard,
  Copy,
  FolderTree,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Monitor,
  MoreVertical,
  PenLine,
  Play,
  Power,
  Radio,
  Settings,
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
import { useBranchActivity } from '@/features/branches/use-branch-activity';

type StatsSectionProps = {
  stats: BranchScreenStats;
  loading: boolean;
  showHero?: boolean;
};

export function BranchStatsSection({ stats, loading, showHero = true }: StatsSectionProps) {
  const t = useTranslations('branchDetail');
  const tWs = useTranslations('workspaceSettings');
  const locale = useLocale();
  const { workspaceId, workspaces } = useWorkspace();
  const wsCounts = useWorkspaceStats(workspaceId, 0);
  const branch = workspaces.find((w) => w.id === workspaceId);
  const activity = useBranchActivity(workspaceId);

  const onlinePct = stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0;
  const inactivePct = stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0;

  const statCards = [
    {
      label: t('statTotal'),
      value: loading ? '…' : String(stats.total),
      icon: Monitor,
      accent: 'from-violet-600/20 to-violet-900/5',
      iconBg: 'bg-violet-500/15 text-violet-400',
    },
    {
      label: t('statOnline'),
      value: loading ? '…' : String(stats.online),
      icon: Radio,
      accent: 'from-success/20 to-success/5',
      iconBg: 'bg-success/15 text-success',
      progress: onlinePct,
    },
    {
      label: t('statInactive'),
      value: loading ? '…' : String(stats.inactive),
      icon: Power,
      accent: 'from-rose-600/20 to-rose-900/5',
      iconBg: 'bg-rose-500/15 text-rose-400',
      sub: loading
        ? undefined
        : t('inactiveDetail', {
            offline: stats.offline,
            maintenance: stats.maintenance,
          }),
      progress: inactivePct,
    },
    {
      label: t('statPlaylists'),
      value: String(wsCounts.playlists),
      icon: Clapperboard,
      accent: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/15 text-primary',
    },
    {
      label: t('statMedia'),
      value: String(wsCounts.media),
      icon: ImageIcon,
      accent: 'from-warning/20 to-warning/5',
      iconBg: 'bg-warning/15 text-warning',
    },
  ];

  // ── Compact mode (branches page context) ──
  if (!showHero) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{loading ? '…' : stats.total}</span>
          <span className="text-muted-foreground">{t('statScreens')}</span>
        </span>
        <span className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-success" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{loading ? '…' : stats.online}</span>
          <span className="text-muted-foreground">{t('statOnline')}</span>
        </span>
        <span className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{wsCounts.playlists}</span>
          <span className="text-muted-foreground">{t('statPlaylists')}</span>
        </span>
        <span className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-warning" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{wsCounts.media}</span>
          <span className="text-muted-foreground">{t('statMedia')}</span>
        </span>
        {stats.total > 0 && !loading && (
          <div className="ms-auto flex h-1.5 w-24 overflow-hidden rounded-full bg-muted/50">
            <div className="bg-success" style={{ width: `${onlinePct}%` }} />
            <div className="bg-destructive/70" style={{ width: `${inactivePct}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* ── Hero workspace card ── */}
      {showHero && branch && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 lg:p-8"
        >
          <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <FolderTree className="h-8 w-8 text-primary" strokeWidth={ICON_STROKE} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">{branch.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                    branch.isPaused
                      ? 'bg-warning/15 text-warning'
                      : 'bg-success/15 text-success',
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', branch.isPaused ? 'bg-warning' : 'bg-success animate-pulse')} />
                    {branch.isPaused ? tWs('statusPaused') : tWs('statusActive')}
                  </span>
                  {branch.role && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {branch.role}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t('workspaceIdLabel', { id: branch.id.slice(0, 8) })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-2">
                <Link href={`/${locale}/settings/workspace` as Route}>
                  <Settings className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  {t('settingsLink')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-2">
                <Link href={`/${locale}/team` as Route}>
                  <Users className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  {t('teamLink')}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
          >
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60', item.accent)} />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
                {'sub' in item && item.sub ? (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.sub}</p>
                ) : null}
                {'progress' in item && typeof item.progress === 'number' && item.progress >= 0 ? (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.progress > 60 ? 'bg-success' : item.progress > 30 ? 'bg-warning' : 'bg-destructive',
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', item.iconBg)}>
                <item.icon className="h-5 w-5" strokeWidth={ICON_STROKE} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Screen health + workspace info ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Screen health bar */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{t('screenHealthTitle')}</h3>
            <span className="text-xs text-muted-foreground">
              {loading ? '…' : t('screenHealthSummary', { online: stats.online, total: stats.total })}
            </span>
          </div>
          {loading ? (
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-muted" />
          ) : stats.total > 0 ? (
            <>
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted/50">
                <div className="bg-success transition-all duration-500" style={{ width: `${onlinePct}%` }} />
                <div className="bg-destructive/70 transition-all duration-500" style={{ width: `${inactivePct}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  {t('statOnline')}: <span className="font-bold text-foreground">{stats.online}</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-destructive/70" />
                  {t('statInactive')}: <span className="font-bold text-foreground">{stats.inactive}</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  {t('offlineLabel')}: <span className="font-bold text-foreground">{stats.offline}</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-warning/70" />
                  {t('maintenanceLabel')}: <span className="font-bold text-foreground">{stats.maintenance}</span>
                </span>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t('noScreensForHealth')}</p>
          )}
        </div>

        {/* Storage & resources */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground">{t('resourcesTitle')}</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clapperboard className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('statPlaylists')}</p>
                <p className="font-mono text-lg font-bold text-foreground">{wsCounts.playlists}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <ImageIcon className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('statMedia')}</p>
                <p className="font-mono text-lg font-bold text-foreground">{wsCounts.media}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <HardDrive className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('storageUsed')}</p>
                <p className="font-mono text-lg font-bold text-foreground">{t('storageCalculating')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{t('activityTitle')}</h3>
          {activity.isLoading && <span className="text-xs text-muted-foreground">…</span>}
        </div>
        {activity.isLoading && activity.items.length === 0 ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-2 w-20 animate-pulse rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('activityEmpty')}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {activity.items.slice(0, 8).map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 text-sm">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  item.type === 'screen' ? 'bg-violet-500/10 text-violet-400'
                    : item.type === 'media' ? 'bg-amber-500/10 text-amber-400'
                    : item.type === 'playlist' ? 'bg-blue-500/10 text-blue-400'
                    : item.type === 'schedule' ? 'bg-cyan-500/10 text-cyan-400'
                    : 'bg-pink-500/10 text-pink-400',
                )}>
                  {item.type === 'screen' ? <Monitor className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    : item.type === 'media' ? <ImageIcon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    : item.type === 'playlist' ? <Clapperboard className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    : item.type === 'schedule' ? <CalendarClock className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    : <Users className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
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
  canEditPlaylist: boolean;
  canDeletePlaylist: boolean;
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
        <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
          {t('playlistsTitle')}
        </h2>
        <ListSkeleton count={4} />
      </section>
    );
  }

  if (props.playlists.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
          {t('playlistsTitle')}
        </h2>
        <div className="vc-card-surface rounded-lg border border-dashed border-border p-10 text-center">
          <Clapperboard className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
          <p className="mt-3 text-sm font-medium text-foreground">{t('noPlaylists')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('noPlaylistsHint')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
        {t('playlistsTitle')}
      </h2>
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
                href={`/${props.locale}/content/playlists/${pl.id}/studio` as Route}
                className={cn(
                  'flex flex-col rounded-lg border border-border bg-card p-5 pe-12 transition-all duration-200',
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
                      className="absolute end-2 top-2 z-card h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('playlistActionsAria')}
                      onClick={(e: ReactMouseEvent) => e.preventDefault()}
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
                      onClick={() => props.onEdit(pl)}
                    >
                      <PenLine className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('playlistEdit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 font-semibold"
                      onClick={() => void props.onDuplicate(pl)}
                    >
                      <Copy className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('playlistDuplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 font-semibold"
                      onClick={() => props.onMove(pl)}
                    >
                      <Monitor className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('playlistMoveToBranch')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 font-semibold"
                      asChild
                    >
                      <Link href={`/${props.locale}/content/playlists/${pl.id}/studio` as Route} className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                        {t('openInStudio')}
                      </Link>
                    </DropdownMenuItem>
                    {props.canDeletePlaylist ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 font-semibold text-destructive focus:text-destructive"
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
        <div className="vc-card-surface rounded-lg border border-dashed border-border p-10 text-center">
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
            className="vc-card-surface rounded-lg border border-border/60 p-4 dark:border-white/10"
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
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-lg px-3 font-semibold"
                variant="cta"
                onClick={() => props.onQuickEdit(screen)}
              >
                {t('screenQuickEdit')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    aria-label={t('screenActionsAria')}
                  >
                    <MoreVertical className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem className="gap-2 font-semibold" asChild>
                    <Link href={`/${props.locale}/screens/${screen.id}` as Route}>
                      <PenLine className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                      {t('screenFullEditor')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 font-semibold text-destructive focus:text-destructive"
                    onClick={() => void props.onDeleteScreen(screen)}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                    {t('screenDelete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type MediaSectionProps = {
  mediaItems: { id: string; originalName: string; mimeType: string; sizeBytes?: number; publicUrl?: string; createdAt?: string }[];
  isLoading: boolean;
};

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/');
}

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
        <div className="vc-card-surface rounded-lg border border-dashed border-border p-10 text-center">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {mediaItems.map((item) => {
          const hasThumb = item.publicUrl && (isImageMime(item.mimeType) || isVideoMime(item.mimeType));
          return (
            <div
              key={item.id}
              className="vc-card-surface overflow-hidden rounded-lg border border-border/60 dark:border-white/10"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
                {hasThumb && item.publicUrl ? (
                  isImageMime(item.mimeType) ? (
                    <img
                      src={item.publicUrl}
                      alt={item.originalName}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.publicUrl}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {isVideoMime(item.mimeType) ? (
                      <Monitor className="h-8 w-8 text-muted-foreground" strokeWidth={ICON_STROKE} />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" strokeWidth={ICON_STROKE} />
                    )}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-foreground dark:text-white">{item.originalName}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(item.sizeBytes)}</span>
                  <span aria-hidden>·</span>
                  <span className="truncate">{item.mimeType}</span>
                </div>
                {item.createdAt ? (
                  <p className="mt-1 text-[10px] text-muted-foreground/80">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
