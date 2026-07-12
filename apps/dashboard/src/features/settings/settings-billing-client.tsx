'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchAccountBilling,
  fetchCurrentSubscription,
  createStripePortal as apiCreateStripePortal,
} from '@/features/billing/billing-api';
import { useWorkspace } from '@/features/workspace/workspace-context';

type Payment = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string | null;
  invoiceRef: string | null;
  paidAt: string | null;
  createdAt: string;
};

type BillingPayload = {
  currentPlan: {
    userSubscriptionStatus: string;
    subscriptionEndDate: string | null;
    workspacePlan: string | null;
    workspaceStatus: string | null;
    seats: number | null;
    screenLimit: number | null;
  };
  payments: Payment[];
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

export function SettingsBillingClient() {
  const t = useTranslations('settingsBillingClient');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [data, setData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalAvailable, setPortalAvailable] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetchAccountBilling();
      if (!res.ok) {
        toast.error(t('loadFailed'));
        setLoading(false);
        return;
      }
      setData((await res.json()) as BillingPayload);
      setLoading(false);
    })();
  }, [t]);

  useEffect(() => {
    void (async () => {
      if (!workspaceId) {
        setPortalAvailable(false);
        return;
      }
      const res = await fetchCurrentSubscription(workspaceId);
      if (!res.ok) {
        setPortalAvailable(false);
        return;
      }
      const sub = (await res.json()) as { billingPortalAvailable?: boolean };
      setPortalAvailable(Boolean(sub.billingPortalAvailable));
    })();
  }, [workspaceId, workspaceDataEpoch]);

  const openBillingPortal = useCallback(async () => {
    if (!workspaceId) {
      toast.error(t('selectWorkspace'));
      return;
    }
    setPortalBusy(true);
    try {
      const res = await apiCreateStripePortal(workspaceId, locale);
      if (!res.ok) {
        toast.error(t('portalFailed'));
        return;
      }
      const body = (await res.json()) as { url?: string | null };
      if (body.url) window.location.href = body.url;
      else toast.error(t('portalFailed'));
    } finally {
      setPortalBusy(false);
    }
  }, [workspaceId, locale, t]);

  if (loading) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;

  if (!data) return null;

  const cp = data.currentPlan;
  const isCancelled = cp.userSubscriptionStatus === 'CANCELED';
  const isPastDue = cp.userSubscriptionStatus === 'PAST_DUE';
  const isSuspended = cp.workspaceStatus === 'SUSPENDED';
  const showRetention = isCancelled || isPastDue || isSuspended;

  return (
    <div className="space-y-8">
      {showRetention && (
        <div className={`rounded-2xl border p-6 shadow-sm ${isCancelled ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`mt-0.5 h-5 w-5 ${isCancelled ? 'text-destructive' : 'text-amber-600'}`} />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {isCancelled ? t('retentionCancelledTitle') : t('retentionPastDueTitle')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isCancelled ? t('retentionCancelledBody') : t('retentionPastDueBody')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {portalAvailable ? (
                  <Button
                    type="button"
                    variant="cta"
                    className="rounded-xl font-semibold"
                    disabled={portalBusy}
                    onClick={() => void openBillingPortal()}
                  >
                    <RefreshCw className="me-2 h-4 w-4" />
                    {t('retentionReactivate')}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => window.location.href = '/en/billing'}
                >
                  {t('retentionUpgrade')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t('currentPlan')}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t('accountTier')}</dt>
            <dd className="font-medium">{cp.userSubscriptionStatus}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('renewsEnds')}</dt>
            <dd className="font-medium">
              {cp.subscriptionEndDate
                ? new Date(cp.subscriptionEndDate).toLocaleDateString(locale)
                : t('dash')}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('workspacePlan')}</dt>
            <dd className="font-medium">{cp.workspacePlan ?? t('dash')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('workspaceStatus')}</dt>
            <dd className="font-medium">{cp.workspaceStatus ?? t('dash')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('seatsScreens')}</dt>
            <dd className="font-medium">
              {t('seatsScreensValue', {
                seats: cp.seats ?? t('dash'),
                screens: cp.screenLimit ?? t('dash'),
              })}
            </dd>
          </div>
        </dl>
        {portalAvailable ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              disabled={portalBusy}
              onClick={() => void openBillingPortal()}
            >
              {portalBusy ? t('openingPortal') : t('manageBilling')}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="vc-card-surface overflow-hidden rounded-2xl border border-border">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold">{t('paymentHistory')}</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.date')}</TableHead>
                <TableHead>{t('table.description')}</TableHead>
                <TableHead>{t('table.invoice')}</TableHead>
                <TableHead className="text-end">{t('table.amount')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString(locale)
                      : new Date(p.createdAt).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell>{p.description ?? t('dash')}</TableCell>
                  <TableCell className="font-mono text-xs">{p.invoiceRef ?? t('dash')}</TableCell>
                  <TableCell className="text-end font-mono text-sm">
                    {money(p.amountCents, p.currency)}
                  </TableCell>
                  <TableCell>{p.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : null}
      </div>
    </div>
  );
}
