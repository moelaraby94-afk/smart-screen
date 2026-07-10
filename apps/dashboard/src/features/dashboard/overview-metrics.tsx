'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Database, HardDrive, Monitor } from 'lucide-react';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { apiFetch } from '@/features/auth/session';
import { readPage } from '@/features/api/page';
import { useWorkspace } from '@/features/workspace/workspace-context';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Mirrors GET /media/stats — counted in the database. */
type MediaStats = {
  count: number;
  storageBytes: number;
};

export function OverviewMetrics() {
  const t = useTranslations('overviewMetrics');
  const { workspaceId } = useWorkspace();
  const [screens, setScreens] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [storageBytes, setStorageBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setScreens(0);
      setMediaCount(0);
      setStorageBytes(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const ws = encodeURIComponent(workspaceId);
        /**
         * Both numbers come from the database. This used to fetch up to 500
         * screens and the entire media library, then compute `arr.length` and
         * `arr.reduce(...)` in the browser to render two tiles.
         */
        const [sRes, mRes] = await Promise.all([
          apiFetch(`/screens?workspaceId=${ws}&page=1&limit=1`),
          apiFetch(`/media/stats?workspaceId=${ws}`),
        ]);
        if (cancelled) return;
        setScreens((await readPage(sRes)).total);
        if (mRes.ok) {
          const stats = (await mRes.json()) as MediaStats;
          setMediaCount(stats.count);
          setStorageBytes(stats.storageBytes);
        } else {
          setMediaCount(0);
          setStorageBytes(0);
        }
      } catch {
        if (!cancelled) {
          setScreens(0);
          setMediaCount(0);
          setStorageBytes(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const metrics = [
    {
      label: t('screens'),
      value: loading ? '…' : String(screens),
      sub: t('screensSub'),
      icon: Monitor,
    },
    {
      label: t('media'),
      value: loading ? '…' : String(mediaCount),
      sub: t('mediaSub'),
      icon: Database,
    },
    {
      label: t('storage'),
      value: loading ? '…' : formatBytes(storageBytes),
      sub: t('storageSub'),
      icon: HardDrive,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 * i, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="vc-card-surface vc-stat-card-glow group rounded-3xl p-8 transition hover:border-[#FF6B00]/20"
        >
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="vc-page-kicker">{metric.label}</p>
              <p className="mt-4 font-mono-nums text-3xl font-bold tracking-tight text-foreground dark:text-white">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground dark:text-white/60">{metric.sub}</p>
            </div>
            <div className="vc-icon-glass-circle relative flex h-14 w-14 shrink-0 items-center justify-center ring-1 ring-white/10">
              <metric.icon
                className="h-[26px] w-[26px] text-[#FF6B00]"
                strokeWidth={ICON_STROKE}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
