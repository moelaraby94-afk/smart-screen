'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchCurrentSubscription } from '@/features/billing/billing-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { formatBytesLocale } from '@/features/dashboard/home-dashboard-types';
import { useLocale } from 'next-intl';

type SubData = {
  screenLimit: number;
  storageLimitBytes: number | null;
};

type Props = {
  /** Current screen count (for screen indicator). Omit if not showing screen indicator. */
  screenCount?: number;
  /** Current storage used in bytes (for storage indicator). Omit if not showing storage indicator. */
  storageUsedBytes?: number;
  /** Account-level screen limit (sum of all branches). If provided, skips per-workspace API call. */
  accountScreenLimit?: number;
  /** Account-level storage limit in bytes (sum of all branches). If provided, skips per-workspace API call. */
  accountStorageLimitBytes?: number | null;
};

export function UsageIndicator({
  screenCount,
  storageUsedBytes,
  accountScreenLimit,
  accountStorageLimitBytes,
}: Props) {
  const t = useTranslations('usageIndicator');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [sub, setSub] = useState<SubData | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetchCurrentSubscription(workspaceId);
    if (res.ok) {
      const data = (await res.json()) as SubData;
      setSub(data);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const effectiveSub: SubData | null =
    accountScreenLimit !== undefined
      ? {
          screenLimit: accountScreenLimit,
          storageLimitBytes: accountStorageLimitBytes ?? null,
        }
      : sub;

  if (!effectiveSub) return null;

  const showScreen = screenCount !== undefined;
  const showStorage = storageUsedBytes !== undefined;

  if (!showScreen && !showStorage) return null;

  const screenPct = showScreen && effectiveSub.screenLimit > 0
    ? Math.min(100, Math.round((100 * screenCount!) / effectiveSub.screenLimit))
    : null;
  const storagePct = showStorage && effectiveSub.storageLimitBytes != null && effectiveSub.storageLimitBytes > 0
    ? Math.min(100, Math.round((100 * storageUsedBytes!) / effectiveSub.storageLimitBytes))
    : null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {showScreen && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2">
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('screens')}
            </p>
            <p className="text-sm font-medium">
              {screenCount} / {effectiveSub.screenLimit}
              {screenPct != null && screenPct >= 70 && (
                <span className={`ms-2 text-xs font-semibold ${screenPct >= 90 ? 'text-destructive' : 'text-warning'}`}>{t('nearLimit')}</span>
              )}
            </p>
          </div>
          {screenPct != null && (
            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={screenPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${screenPct >= 90 ? 'bg-destructive' : screenPct >= 70 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${screenPct}%` }}
              />
            </div>
          )}
        </div>
      )}
      {showStorage && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2">
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('storage')}
            </p>
            <p className="text-sm font-medium">
              {effectiveSub.storageLimitBytes != null && effectiveSub.storageLimitBytes > 0
                ? `${formatBytesLocale(storageUsedBytes!, locale)} / ${formatBytesLocale(effectiveSub.storageLimitBytes, locale)}`
                : formatBytesLocale(storageUsedBytes!, locale)}
              {storagePct != null && storagePct >= 70 && (
                <span className={`ms-2 text-xs font-semibold ${storagePct >= 90 ? 'text-destructive' : 'text-warning'}`}>{t('nearLimit')}</span>
              )}
            </p>
          </div>
          {storagePct != null && (
            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={storagePct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${storagePct >= 90 ? 'bg-destructive' : storagePct >= 70 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
