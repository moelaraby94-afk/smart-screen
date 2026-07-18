'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminCosmicLoader } from '@/components/admin/admin-cosmic-loader';
import { Input } from '@/components/ui/input';
import {
  fetchAllFeatureFlags,
  setFeatureFlag,
} from '@/features/onboarding/onboarding-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { ICON_STROKE } from '@/lib/icon-stroke';

type ModuleFlag = { module: string; enabled: boolean };

type WorkspaceFlags = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  modules: ModuleFlag[];
};

export function FeatureFlagsClient() {
  const t = useTranslations('featureFlags');
  const { toastResponseError } = useApiErrorToast();
  const prefersReduced = useReducedMotion();
  const [data, setData] = useState<WorkspaceFlags[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchAllFeatureFlags();
      if (!res.ok) {
        toast.error(t('loadFailed'));
        return;
      }
      const json = (await res.json()) as WorkspaceFlags[];
      setData(json);
    } catch {
      toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = useCallback(
    async (workspaceId: string, module: string, currentEnabled: boolean) => {
      const key = `${workspaceId}:${module}`;
      setToggling(key);
      try {
        const res = await setFeatureFlag(workspaceId, module, !currentEnabled);
        if (!res.ok) {
          await toastResponseError(res);
          return;
        }
        setData((prev) =>
          prev.map((ws) =>
            ws.workspaceId === workspaceId
              ? {
                  ...ws,
                  modules: ws.modules.map((m) =>
                    m.module === module ? { ...m, enabled: !currentEnabled } : m,
                  ),
                }
              : ws,
          ),
        );
        toast.success(
          !currentEnabled
            ? t(`modules.${module}.enabled`)
            : t(`modules.${module}.disabled`),
        );
      } finally {
        setToggling(null);
      }
    },
    [t, toastResponseError],
  );

  const filtered = data.filter((ws) =>
    ws.workspaceName.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <AdminCosmicLoader label={t('loading')} />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {t('title')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={ICON_STROKE} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="ps-9"
        />
      </div>

      {/* Workspace cards */}
      <div className="space-y-4">
        {filtered.map((ws, idx) => (
          <motion.div
            key={ws.workspaceId}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReduced ? { duration: 0 } : { delay: 0.03 * idx }}
            className="vc-card-surface rounded-2xl border border-border p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">{ws.workspaceName}</h3>
                <p className="text-xs text-muted-foreground">{ws.workspaceSlug}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {ws.modules.filter((m) => m.enabled).length}/{ws.modules.length} {t('active')}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ws.modules.map((mod) => {
                const key = `${ws.workspaceId}:${mod.module}`;
                const isToggling = toggling === key;
                return (
                  <button
                    key={mod.module}
                    type="button"
                    role="switch"
                    aria-checked={mod.enabled}
                    aria-label={t(`modules.${mod.module}.label`)}
                    disabled={isToggling}
                    onClick={() => void handleToggle(ws.workspaceId, mod.module, mod.enabled)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-sm transition disabled:opacity-50 ${
                      mod.enabled
                        ? 'border-success/30 bg-success/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <span className={`font-medium ${mod.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t(`modules.${mod.module}.label`)}
                    </span>
                    {isToggling ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : mod.enabled ? (
                      <ToggleRight className="h-5 w-5 text-success" strokeWidth={ICON_STROKE} />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" strokeWidth={ICON_STROKE} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">{t('noResults')}</p>
      )}
    </div>
  );
}
