'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock3,
  HardDrive,
  Image as ImageIcon,
  ListMusic,
  Loader2,
  Monitor,
  MoreVertical,
  Network,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';
import {
  type InsightsBranch,
  type InsightsPayload,
  branchHealth,
  canDeleteBranch,
  canManageBranch,
  formatBytes,
  healthBadgeClass,
} from '@/features/dashboard/home-dashboard-types';

type WorkspaceCardsSectionProps = {
  branches: InsightsBranch[];
  workspaces: WorkspaceSummary[];
  loading: boolean;
  locale: string;
  isSuperAdmin: boolean;
  pauseBusyId: string | null;
  onOpenBranch: (workspaceId: string) => void;
  onRename: (row: InsightsBranch) => void;
  onTogglePause: (row: InsightsBranch) => void;
  onDelete: (row: InsightsBranch) => void;
  onSeedDemo: (row: InsightsBranch) => void;
  seedDemoBusyId: string | null;
};

export function WorkspaceCardsSection(props: WorkspaceCardsSectionProps) {
  const t = useTranslations('clientHome');

  return (
    <section className="space-y-4" role="region" aria-label={t('branchesTitle')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t('branchesTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('branchesSub')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {props.branches.map((row, i) => {
          const w = props.workspaces.find((x: WorkspaceSummary) => x.id === row.workspaceId);
          if (!w) return null;
          const branchHref = `/${props.locale}/branches`;
          const h = branchHealth(row);
          const showMenu = canManageBranch(row.role);
          const pauseBusy = props.pauseBusyId === row.workspaceId;

          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.25 }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-fast hover:border-primary/30 hover:shadow-lg"
            >
              {/* Header */}
              <div className="relative flex items-center justify-between gap-2 p-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={branchHref as Route}
                    className="block truncate text-sm font-bold text-foreground underline-offset-4 hover:underline"
                    aria-label={t('openBranchAria', { name: w.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onOpenBranch(row.workspaceId);
                    }}
                  >
                    {w.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase',
                        healthBadgeClass(h),
                      )}
                    >
                      {t(`health.${h}`)}
                    </span>
                    {row.isPaused === true && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-warning">
                        <span className="h-1 w-1 rounded-full bg-warning" />
                        {t('health.paused')}
                      </span>
                    )}
                  </div>
                </div>
                {showMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative z-20 h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        aria-label={t('branchCardActionsAria')}
                      >
                        <MoreVertical className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[12rem]"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <DropdownMenuItem
                        className="gap-2 font-semibold"
                        onSelect={(e) => {
                          e.preventDefault();
                          props.onRename(row);
                        }}
                      >
                        {t('renameBranch')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 font-semibold"
                        disabled={pauseBusy}
                        onSelect={(e) => {
                          e.preventDefault();
                          void props.onTogglePause(row);
                        }}
                      >
                        {pauseBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
                        ) : row.isPaused === true ? (
                          t('resumeBranch')
                        ) : (
                          t('pauseBranch')
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 font-semibold"
                        disabled={props.seedDemoBusyId === row.workspaceId}
                        onSelect={(e) => {
                          e.preventDefault();
                          void props.onSeedDemo(row);
                        }}
                      >
                        {props.seedDemoBusyId === row.workspaceId ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
                        ) : (
                          <Wand2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                        )}
                        {t('seedDemo')}
                      </DropdownMenuItem>
                      {canDeleteBranch(row.role, props.isSuperAdmin) ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 font-semibold text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              props.onDelete(row);
                            }}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                            {t('deleteBranch')}
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              {/* Stats row */}
              <div className="relative grid grid-cols-4 gap-px border-t border-border bg-border">
                <div className="bg-card px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Monitor className="h-3 w-3 text-primary" strokeWidth={ICON_STROKE} />
                  </div>
                  <p className="mt-1 font-mono text-base font-bold tabular-nums text-foreground">
                    {props.loading ? '…' : row.screens}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">{t('card.screens')}</p>
                </div>
                <div className="bg-card px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ListMusic className="h-3 w-3 text-success" strokeWidth={ICON_STROKE} />
                  </div>
                  <p className="mt-1 font-mono text-base font-bold tabular-nums text-foreground">
                    {props.loading ? '…' : row.playlists}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">{t('card.playlists')}</p>
                </div>
                <div className="bg-card px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ImageIcon className="h-3 w-3 text-warning" strokeWidth={ICON_STROKE} />
                  </div>
                  <p className="mt-1 font-mono text-base font-bold tabular-nums text-foreground">
                    {props.loading ? '…' : row.mediaCount}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">{t('card.media')}</p>
                </div>
                <div className="bg-card px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <HardDrive className="h-3 w-3 text-primary" strokeWidth={ICON_STROKE} />
                  </div>
                  <p className="mt-1 font-mono text-xs font-bold tabular-nums text-foreground">
                    {props.loading ? '…' : formatBytes(row.storageBytes)}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">{t('card.storage')}</p>
                </div>
              </div>

              {/* Bottom bar: online + open */}
              <div className="relative flex items-center justify-between border-t border-border px-3.5 py-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    row.screenStatus.online > 0 ? 'bg-success' : 'bg-muted-foreground/30',
                  )} />
                  <span className="text-xs text-muted-foreground">{t('card.online')}</span>
                  <span className="font-mono text-xs font-bold tabular-nums text-foreground">
                    {props.loading ? '…' : row.screenStatus.online}
                  </span>
                </div>
                <Link
                  href={branchHref as Route}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onOpenBranch(row.workspaceId);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {t('openBranchDashboard')}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" strokeWidth={ICON_STROKE} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

type TotalsSectionProps = {
  totals: InsightsPayload['totals'];
  loading: boolean;
  daysRemaining: number | null;
};

export function TotalsSection({ totals, loading, daysRemaining }: TotalsSectionProps) {
  const t = useTranslations('clientHome');

  const cards = [
    { label: t('totalBranches'), value: loading ? '…' : String(totals.branches), icon: Network, accent: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/15 text-primary' },
    { label: t('totalScreens'), value: loading ? '…' : String(totals.screens), icon: Monitor, accent: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/15 text-primary' },
    { label: t('totalPlaylists'), value: loading ? '…' : String(totals.playlists), icon: ListMusic, accent: 'from-success/20 to-success/5', iconBg: 'bg-success/15 text-success' },
    { label: t('totalMedia'), value: loading ? '…' : String(totals.mediaCount), icon: ImageIcon, accent: 'from-warning/20 to-warning/5', iconBg: 'bg-warning/15 text-warning' },
    { label: t('totalStorage'), value: loading ? '…' : formatBytes(totals.storageBytes), icon: HardDrive, accent: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/15 text-primary' },
    { label: t('subscriptionDaysLeft'), value: loading ? '…' : daysRemaining == null ? t('notSet') : String(daysRemaining), icon: Clock3, accent: 'from-warning/20 to-warning/5', iconBg: 'bg-warning/15 text-warning' },
  ];

  const totalScreens = totals.screenStatus.online + totals.screenStatus.offline + totals.screenStatus.maintenance;
  const onlinePct = totalScreens > 0 ? (totals.screenStatus.online / totalScreens) * 100 : 0;
  const offlinePct = totalScreens > 0 ? (totals.screenStatus.offline / totalScreens) * 100 : 0;
  const maintenancePct = totalScreens > 0 ? (totals.screenStatus.maintenance / totalScreens) * 100 : 0;

  return (
    <section className="space-y-4" role="region" aria-label={t('totalsTitle')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t('totalsTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('totalsSub')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.3 }}
            className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-fast hover:border-primary/30 hover:shadow-lg"
            aria-label={`${item.label}: ${item.value}`}
          >
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60', item.accent)} />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
              </div>
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', item.iconBg)}>
                <item.icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Screen status bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t('screenStatusSummary')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('screenStatusValues', {
              online: totals.screenStatus.online,
              offline: totals.screenStatus.offline,
              maintenance: totals.screenStatus.maintenance,
            })}
          </p>
        </div>
        {totalScreens > 0 && (
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
            <div className="bg-success transition-all duration-500" style={{ width: `${onlinePct}%` }} />
            <div className="bg-destructive/70 transition-all duration-500" style={{ width: `${offlinePct}%` }} />
            <div className="bg-warning/70 transition-all duration-500" style={{ width: `${maintenancePct}%` }} />
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            {t('totalScreens')}: <span className="font-bold text-foreground">{totals.screenStatus.online}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-destructive/70" />
            {t('statusOffline')}: <span className="font-bold text-foreground">{totals.screenStatus.offline}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-warning/70" />
            {t('statusMaintenance')}: <span className="font-bold text-foreground">{totals.screenStatus.maintenance}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
