'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Clock3,
  Database,
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
  type HealthKey,
  type InsightsBranch,
  type InsightsPayload,
  branchHealth,
  canDeleteBranch,
  canManageBranch,
  formatBytes,
  formatBytesLocale,
  healthBadgeClass,
} from '@/features/dashboard/home-dashboard-types';

type WorkspaceSummarySectionProps = {
  currentWsRow: InsightsBranch;
  currentWsName: string;
  loading: boolean;
  locale: string;
};

export function WorkspaceSummarySection({
  currentWsRow,
  currentWsName,
  loading,
  locale,
}: WorkspaceSummarySectionProps) {
  const tWs = useTranslations('clientHome.workspaceSummary');
  const storageQuota = currentWsRow.capabilities.storage.limitBytes ?? null;
  const storagePct = currentWsRow.capabilities.storage.usedPct ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="vc-card-surface rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      <p className="vc-page-kicker">{tWs('kicker')}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {tWs('title', { name: currentWsName || currentWsRow.name })}
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {tWs('screensLabel')}
          </p>
          <p className="mt-2 font-mono-nums text-3xl font-bold tabular-nums text-foreground">
            {loading ? '…' : tWs('screensValue', { count: currentWsRow.screens })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {tWs('storageLabel')}
          </p>
          <p className="mt-2 text-sm text-foreground ">
            {loading
              ? '…'
              : storageQuota != null && storageQuota > 0
                ? tWs('storageUsedOf', {
                    used: formatBytesLocale(currentWsRow.storageBytes, locale),
                    quota: formatBytesLocale(storageQuota, locale),
                  })
                : tWs('storageUsedNoQuota', {
                    used: formatBytesLocale(currentWsRow.storageBytes, locale),
                  })}
          </p>
          {storagePct != null ? (
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={storagePct}
              aria-label={tWs('storageBarAria')}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
                style={{ width: `${storagePct}%` }}
              />
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">{tWs('storageNoQuotaHint')}</p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

type TotalsSectionProps = {
  totals: InsightsPayload['totals'];
  loading: boolean;
  daysRemaining: number | null;
};

export function TotalsSection({ totals, loading, daysRemaining }: TotalsSectionProps) {
  const t = useTranslations('clientHome');

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground ">
            {t('totalsTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('totalsSub')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: t('totalBranches'), value: loading ? '…' : String(totals.branches), icon: Network },
          { label: t('totalScreens'), value: loading ? '…' : String(totals.screens), icon: Monitor },
          { label: t('totalPlaylists'), value: loading ? '…' : String(totals.playlists), icon: ListMusic },
          { label: t('totalMedia'), value: loading ? '…' : String(totals.mediaCount), icon: ImageIcon },
          { label: t('totalStorage'), value: loading ? '…' : formatBytes(totals.storageBytes), icon: HardDrive },
          {
            label: t('subscriptionDaysLeft'),
            value: loading ? '…' : daysRemaining == null ? t('notSet') : String(daysRemaining),
            icon: Clock3,
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="vc-card-surface rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-foreground ">
                  {item.value}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <item.icon className="h-[18px] w-[18px] text-primary" strokeWidth={ICON_STROKE} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t('screenStatusSummary')}
        </p>
        <p className="mt-2 text-sm text-foreground ">
          {t('screenStatusValues', {
            online: totals.screenStatus.online,
            offline: totals.screenStatus.offline,
            maintenance: totals.screenStatus.maintenance,
          })}
        </p>
      </div>
    </section>
  );
}

type BranchDetailBodyProps = {
  row: InsightsBranch;
  loading: boolean;
  locale: string;
  onOpenBranch: (workspaceId: string) => void;
};

export function BranchDetailBody({ row, loading, locale, onOpenBranch }: BranchDetailBodyProps) {
  const t = useTranslations('clientHome');
  const tMetrics = useTranslations('overviewMetrics');

  const detailMetrics = [
    { label: tMetrics('screens'), value: loading ? '…' : String(row.screens), sub: tMetrics('screensSub'), icon: Monitor },
    { label: tMetrics('media'), value: loading ? '…' : String(row.mediaCount), sub: tMetrics('mediaSub'), icon: Database },
    { label: tMetrics('storage'), value: loading ? '…' : formatBytes(row.storageBytes), sub: tMetrics('storageSub'), icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      <div className={cn('inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase', healthBadgeClass(branchHealth(row)))}>
        {t(`health.${branchHealth(row)}`)}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {detailMetrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="vc-card-surface rounded-xl border border-border bg-card p-5"
          >
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="vc-page-kicker">{metric.label}</p>
                <p className="mt-3 font-mono-nums text-2xl font-bold tracking-tight text-foreground  sm:text-3xl">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{metric.sub}</p>
              </div>
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 sm:h-12 sm:w-12">
                <metric.icon className="h-5 w-5 text-primary sm:h-[22px] sm:w-[22px]" strokeWidth={ICON_STROKE} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground">{t('card.playlists')}</p>
          <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-foreground">
            {loading ? '…' : row.playlists}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground">{t('card.online')}</p>
          <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-foreground">
            {loading ? '…' : row.screenStatus.online}
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" className="w-full rounded-xl" asChild>
        <Link
          href={`/${locale}/branches/${row.workspaceId}` as Route}
          onClick={() => onOpenBranch(row.workspaceId)}
        >
          {t('openBranchDashboard')}
        </Link>
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">{t('branchCardMenuHint')}</p>
    </div>
  );
}

type BranchCardsSectionProps = {
  branches: InsightsBranch[];
  workspaces: WorkspaceSummary[];
  loading: boolean;
  locale: string;
  isSuperAdmin: boolean;
  selectedBranch: InsightsBranch | null;
  setSelectedBranch: (v: InsightsBranch | null) => void;
  pauseBusyId: string | null;
  onOpenBranch: (workspaceId: string) => void;
  onRename: (row: InsightsBranch) => void;
  onTogglePause: (row: InsightsBranch) => void;
  onDelete: (row: InsightsBranch) => void;
  onSeedDemo: (row: InsightsBranch) => void;
  seedDemoBusyId: string | null;
};

export function BranchCardsSection(props: BranchCardsSectionProps) {
  const t = useTranslations('clientHome');
  const cardChrome =
    'group relative flex min-h-[160px] cursor-pointer flex-col rounded-xl border border-border bg-card p-5 pe-12 shadow-sm transition-colors duration-200 hover:border-primary/30 hover:shadow-md';

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground ">
            {t('branchesTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('branchesSub')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {props.branches.map((row, i: number) => {
          const w = props.workspaces.find((x: WorkspaceSummary) => x.id === row.workspaceId);
          if (!w) return null;
          const branchHref = `/${props.locale}/branches/${row.workspaceId}`;
          const h = branchHealth(row);
          const selected = props.selectedBranch?.workspaceId === row.workspaceId;
          const showMenu = canManageBranch(row.role);
          const pauseBusy = props.pauseBusyId === row.workspaceId;
          return (
            <motion.div
              key={w.id}
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className={cn(
                cardChrome,
                'bg-gradient-to-br from-card via-card to-primary/[0.03]',
                selected && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
              )}
              onClick={() => props.setSelectedBranch(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  props.setSelectedBranch(row);
                }
              }}
            >
              {showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-2 top-2 z-20 h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      aria-label={t('branchCardActionsAria')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" strokeWidth={ICON_STROKE} />
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
                        props.setSelectedBranch(row);
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
                          className="gap-2 font-semibold text-red-600 focus:text-red-600"
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
              <div className="relative z-[1] flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={branchHref as Route}
                    className="block truncate font-semibold text-foreground underline-offset-4 hover:underline "
                    aria-label={t('openBranchAria', { name: w.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onOpenBranch(row.workspaceId);
                    }}
                  >
                    {w.name}
                  </Link>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                    healthBadgeClass(h),
                  )}
                >
                  {t(`health.${h}`)}
                </span>
              </div>
              <div className="relative z-[1] mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t('card.screens')}</p>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {props.loading ? '…' : row.screens}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t('card.playlists')}</p>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {props.loading ? '…' : row.playlists}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t('card.media')}</p>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {props.loading ? '…' : row.mediaCount}
                  </p>
                </div>
              </div>
              <div className="relative z-[1] mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t('card.storage')}</p>
                  <p className="font-mono text-xs font-semibold tabular-nums">
                    {props.loading ? '…' : formatBytes(row.storageBytes)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t('card.online')}</p>
                  <p className="font-mono text-xs font-semibold tabular-nums">
                    {props.loading ? '…' : row.screenStatus.online}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="vc-card-surface rounded-xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight text-foreground ">
          {t('branchPanelTitle')}
        </h3>
        {props.selectedBranch ? (
          <div className="mt-4">
            <BranchDetailBody
              row={props.selectedBranch}
              loading={props.loading}
              locale={props.locale}
              onOpenBranch={props.onOpenBranch}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t('selectBranchHint')}</p>
        )}
      </div>
    </section>
  );
}
