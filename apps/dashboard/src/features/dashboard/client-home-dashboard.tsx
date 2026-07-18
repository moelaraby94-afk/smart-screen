'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchAccountInsights,
  updateWorkspace,
  deleteWorkspace,
} from '@/features/dashboard/dashboard-api';
import { seedDemoContent as apiSeedDemoContent } from '@/features/workspace/workspace-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import {
  type InsightsBranch,
  type InsightsPayload,
} from '@/features/dashboard/home-dashboard-types';
import {
  WorkspaceCardsSection,
  TotalsSection,
} from '@/features/dashboard/home-dashboard-sections';
import { RecentActivityFeed } from '@/features/dashboard/recent-activity-feed';
import { QuickActionsSection } from '@/features/dashboard/quick-actions-section';
import { ScreenHealthSection } from '@/features/dashboard/screen-health-section';
import { SubscriptionSummarySection } from '@/features/dashboard/subscription-summary-section';
import { OnboardingProgressWidget } from '@/features/onboarding/onboarding-progress-widget';
import { PrayerTimesWidget } from '@/features/islamic/prayer-times-widget';
import { HijriDateWidget } from '@/features/islamic/hijri-date-widget';
import { ActiveContentWidget } from '@/features/dashboard/active-content-widget';
import { OnboardingCard } from '@/features/dashboard/onboarding-card';
import {
  RenameBranchDialog,
  DeleteBranchDialog,
} from '@/features/dashboard/home-dashboard-dialogs';
import { Button } from '@/components/ui/button';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';
import { UsageIndicator } from '@/components/usage-indicator';
import { fetchMediaStats } from '@/features/dashboard/dashboard-api';

export function ClientHomeDashboard() {
  const t = useTranslations('clientHome');
  const router = useRouter();
  const { toastResponseError } = useApiErrorToast();
  const {
    workspaces,
    workspaceId,
    setWorkspaceId,
    isSuperAdmin,
    bumpWorkspaceDataEpoch,
  } = useWorkspace();

  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameTarget, setRenameTarget] = useState<InsightsBranch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InsightsBranch | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pauseBusyId, setPauseBusyId] = useState<string | null>(null);
  const [seedDemoBusyId, setSeedDemoBusyId] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState<number | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAccountInsights();
      if (!res.ok) {
        toast.error(t('toastLoadFailed'));
        setInsights(null);
        return;
      }
      const json = (await res.json()) as InsightsPayload;
      setInsights(json);
    } catch {
      toast.error(t('toastLoadFailed'));
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadStorage = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetchMediaStats(workspaceId);
      if (res.ok) {
        const data = (await res.json()) as { totalSizeBytes?: number };
        setStorageUsed(data.totalSizeBytes ?? 0);
      }
    } catch {
      // silent — storage indicator is optional
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadStorage();
  }, [loadStorage]);

  const daysRemaining = useMemo(() => {
    if (!insights) return null;
    const end = insights.account.subscriptionEndDate;
    if (!end) return null;
    const diff = new Date(end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [insights]);

  const onOpenBranch = useCallback(
    (wsId: string) => {
      setWorkspaceId(wsId);
      const locale = typeof window !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
      router.push(`/${locale}/branches` as never as Route);
    },
    [setWorkspaceId, router],
  );

  const onRename = useCallback((row: InsightsBranch) => {
    setRenameTarget(row);
    setRenameValue(row.name);
    setRenameOpen(true);
  }, []);

  const submitRename = useCallback(async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (name.length < 2) {
      toast.error(t('toastNameMin'));
      return;
    }
    setRenameBusy(true);
    try {
      const res = await updateWorkspace(renameTarget.workspaceId, { name });
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('toastRenamed'));
      setRenameOpen(false);
      setRenameTarget(null);
      bumpWorkspaceDataEpoch();
      await load();
    } catch {
      toast.error(t('toastRenameFailed'));
    } finally {
      setRenameBusy(false);
    }
  }, [renameTarget, renameValue, t, toastResponseError, bumpWorkspaceDataEpoch, load]);

  const onTogglePause = useCallback(
    async (row: InsightsBranch) => {
      setPauseBusyId(row.workspaceId);
      try {
        const res = await updateWorkspace(row.workspaceId, {
          isPaused: row.isPaused !== true,
        });
        if (!res.ok) {
          await toastResponseError(res);
          return;
        }
        toast.success(row.isPaused === true ? t('toastResumed') : t('toastPaused'));
        bumpWorkspaceDataEpoch();
        await load();
      } catch {
        toast.error(t('toastPauseFailed'));
      } finally {
        setPauseBusyId(null);
      }
    },
    [t, toastResponseError, bumpWorkspaceDataEpoch, load],
  );

  const onSeedDemo = useCallback(
    async (row: InsightsBranch) => {
      setSeedDemoBusyId(row.workspaceId);
      try {
        const res = await apiSeedDemoContent(row.workspaceId);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toast.error(data?.message ?? t('toastSeedDemoFailed'));
          return;
        }
        toast.success(t('toastSeedDemoOk'));
        bumpWorkspaceDataEpoch();
        await load();
      } catch {
        toast.error(t('toastSeedDemoFailed'));
      } finally {
        setSeedDemoBusyId(null);
      }
    },
    [t, bumpWorkspaceDataEpoch, load],
  );

  const onDelete = useCallback((row: InsightsBranch) => {
    setDeleteTarget(row);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const res = await deleteWorkspace(deleteTarget.workspaceId);
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('toastDeleted'));
      setDeleteTarget(null);
      bumpWorkspaceDataEpoch();
      await load();
    } catch {
      toast.error(t('toastDeleteFailed'));
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, t, toastResponseError, bumpWorkspaceDataEpoch, load]);

  if (loading && !insights) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-card" />
          ))}
        </div>
        <CardGridSkeleton count={6} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 rounded-lg border border-border bg-card" />
          <div className="h-48 rounded-lg border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center"
        role="alert"
      >
        <p className="text-sm font-medium text-muted-foreground">{t('loadFailed')}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load()}
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  const totalScreens = insights?.totals.screens ?? 0;

  return (
    <div className="space-y-6" role="region" aria-label={t('dashboardAria')}>
      {totalScreens === 0 ? (
        <OnboardingCard />
      ) : (
        <>
          <OnboardingProgressWidget />

          <QuickActionsSection />

          <UsageIndicator screenCount={totalScreens} storageUsedBytes={storageUsed} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ScreenHealthSection />
            <RecentActivityFeed />
            <div className="lg:col-span-1">
              <SubscriptionSummarySection />
            </div>
          </div>

          <ActiveContentWidget />

          <TotalsSection
            totals={insights.totals}
            loading={loading}
            daysRemaining={daysRemaining}
          />

          <WorkspaceCardsSection
            branches={insights.branches}
            workspaces={workspaces}
            loading={loading}
            locale={typeof window !== 'undefined' ? document.documentElement.lang || 'en' : 'en'}
            isSuperAdmin={isSuperAdmin}
            pauseBusyId={pauseBusyId}
            onOpenBranch={onOpenBranch}
            onRename={onRename}
            onTogglePause={onTogglePause}
            onSeedDemo={onSeedDemo}
            seedDemoBusyId={seedDemoBusyId}
            onDelete={onDelete}
          />

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <PrayerTimesWidget />
            <HijriDateWidget />
          </div>
        </>
      )}

      <RenameBranchDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        value={renameValue}
        setValue={setRenameValue}
        busy={renameBusy}
        onSubmit={submitRename}
      />

      <DeleteBranchDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
