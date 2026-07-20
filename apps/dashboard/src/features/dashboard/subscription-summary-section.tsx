'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, Users } from 'lucide-react';
import { apiFetch } from '@/features/auth/session';
import { Button } from '@/components/ui/button';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type BillingData = {
  currentPlan: {
    userSubscriptionStatus: string;
    subscriptionEndDate: string | null;
    workspacePlan: string | null;
    workspaceStatus: string | null;
    seats: number | null;
    screenLimit: number | null;
  };
};

export function SubscriptionSummarySection() {
  const t = useTranslations('clientHome.subscription');
  const locale = useLocale();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch('/account/billing');
      if (res.ok) {
        setData(await res.json());
      } else {
        setData(null);
        setError(true);
      }
    } catch {
      setData(null);
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const daysLeft = data?.currentPlan.subscriptionEndDate
    ? Math.max(0, Math.ceil((new Date(data.currentPlan.subscriptionEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const fmtDate = (ts: string | null) => {
    if (!ts) return '—';
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(ts));
  };

  const planName = data?.currentPlan.workspacePlan ?? data?.currentPlan.userSubscriptionStatus ?? '—';

  const statusColor =
    data?.currentPlan.workspaceStatus === 'ACTIVE' || data?.currentPlan.userSubscriptionStatus === 'ACTIVE'
      ? 'bg-success/10 text-success'
      : data?.currentPlan.workspaceStatus === 'TRIALING' || data?.currentPlan.userSubscriptionStatus === 'TRIALING'
        ? 'bg-primary/10 text-primary'
        : 'bg-muted text-muted-foreground';

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4"
      role="region"
      aria-label={t('title')}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
        {data && (
          <span className={cn('rounded px-2 py-0.5 text-xs font-bold uppercase', statusColor)}>
            {data.currentPlan.workspaceStatus ?? data.currentPlan.userSubscriptionStatus}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-muted-foreground">{t('error')}</p>
          <Button variant="ghost" size="sm" onClick={() => void load()} className="text-xs">
            {t('retry')}
          </Button>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center gap-2 py-4 text-center">
          <p className="text-xs text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {/* Plan */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3 w-3 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t('plan')}
              </p>
            </div>
            <p className="mt-1.5 font-mono text-base font-bold capitalize text-foreground">
              {planName}
            </p>
          </div>

          {/* Seats */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t('seats')}
              </p>
            </div>
            <p className="mt-1.5 font-mono text-base font-bold tabular-nums text-foreground">
              {data.currentPlan.seats ?? '—'}
            </p>
          </div>

          {/* Screen limit + renewal */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t('renewsOn')}
              </p>
            </div>
            <p className="mt-1.5 text-sm font-bold text-foreground">
              {fmtDate(data.currentPlan.subscriptionEndDate)}
            </p>
            {daysLeft != null && (
              <p className={cn(
                'mt-0.5 text-xs font-semibold',
                daysLeft <= 7 ? 'text-destructive' : 'text-muted-foreground',
              )}>
                {t('daysLeft', { count: daysLeft })}
              </p>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
