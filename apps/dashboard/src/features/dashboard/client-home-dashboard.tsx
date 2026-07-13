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
  WorkspaceSummarySection,
  TotalsSection,
  BranchCardsSection,
} from '@/features/dashboard/home-dashboard-sections';
import { RecentActivityFeed } from '@/features/dashboard/recent-activity-feed';
import { OnboardingProgressWidget } from '@/features/onboarding/onboarding-progress-widget';
import { PrayerTimesWidget } from '@/features/islamic/prayer-times-widget';
import {
  RenameBranchDialog,
  DeleteBranchDialog,
} from '@/features/dashboard/home-dashboard-dialogs';

export function ClientHomeDashboard() {
  const t = useTranslations('clientHome');
  const router = useRouter();
  const { toastResponseError } = useApiErrorToast();
  const {
    workspaceId,
    workspaces,
    setWorkspaceId,
    isSuperAdmin,
    bumpWorkspaceDataEpoch,
  } = useWorkspace();

  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<InsightsBranch | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InsightsBranch | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pauseBusyId, setPauseBusyId] = useState<string | null>(null);
  const [seedDemoBusyId, setSeedDemoBusyId] = useState<string | null>(null);

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

  const currentWsRow = useMemo(
    () => insights?.branches.find((b) => b.workspaceId === workspaceId) ?? null,
    [insights, workspaceId],
  );

  const currentWsName = useMemo(
    () => workspaces.find((w) => w.id === workspaceId)?.name ?? '',
    [workspaces, workspaceId],
  );

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
      router.push(`/${locale}/branches/${wsId}` as never as Route);
    },
    [setWorkspaceId, router],
  );

  const onRename = useCallback((row: InsightsBranch) => {
    setRenameValue(row.name);
    setRenameOpen(true);
  }, []);

  const submitRename = useCallback(async () => {
    if (!selectedBranch) return;
    const name = renameValue.trim();
    if (name.length < 2) {
      toast.error(t('toastNameMin'));
      return;
    }
    setRenameBusy(true);
    try {
      const res = await updateWorkspace(selectedBranch.workspaceId, { name });
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('toastRenamed'));
      setRenameOpen(false);
      bumpWorkspaceDataEpoch();
      await load();
    } catch {
      toast.error(t('toastRenameFailed'));
    } finally {
      setRenameBusy(false);
    }
  }, [selectedBranch, renameValue, t, toastResponseError, bumpWorkspaceDataEpoch, load]);

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
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">{t('loadFailed')}</p>
        <button
          type="button"
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          onClick={() => void load()}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <OnboardingProgressWidget />
      <PrayerTimesWidget />

      {currentWsRow ? (
        <WorkspaceSummarySection
          currentWsRow={currentWsRow}
          currentWsName={currentWsName}
          loading={loading}
          locale={typeof window !== 'undefined' ? document.documentElement.lang || 'en' : 'en'}
        />
      ) : null}

      <TotalsSection
        totals={insights.totals}
        loading={loading}
        daysRemaining={daysRemaining}
      />

      <RecentActivityFeed />

      <BranchCardsSection
        branches={insights.branches}
        workspaces={workspaces}
        loading={loading}
        locale={typeof window !== 'undefined' ? document.documentElement.lang || 'en' : 'en'}
        isSuperAdmin={isSuperAdmin}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        pauseBusyId={pauseBusyId}
        onOpenBranch={onOpenBranch}
        onRename={onRename}
        onTogglePause={onTogglePause}
        onSeedDemo={onSeedDemo}
        seedDemoBusyId={seedDemoBusyId}
        onDelete={onDelete}
      />

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
