'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Check, CreditCard, Download, Minus, Monitor, RefreshCw, Sparkles, Zap } from 'lucide-react';
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
  fetchInvoicePdfUrl,
  createStripePortal as apiCreateStripePortal,
  createStripeCheckout as apiCreateStripeCheckout,
  setMockPlan as apiSetMockPlan,
} from '@/features/billing/billing-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/utils';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';

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

type SubPayload = {
  workspaceId: string;
  plan: string;
  status: string;
  seats: number;
  screenLimit: number;
  currentPeriodEnd: string | null;
  startedAt: string;
  billingPortalAvailable?: boolean;
  activeScreenCount?: number;
  perScreenPricing?: {
    basePrice: number;
    includedScreens: number;
    perScreenPrice: number;
    currency: string;
  };
  estimatedMonthlyTotal?: number;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

export function SettingsBillingClient() {
  const t = useTranslations('settingsBillingClient');
  const tBilling = useTranslations('billingClient');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [data, setData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalAvailable, setPortalAvailable] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [sub, setSub] = useState<SubPayload | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | boolean>(false);
  const allowMockBilling =
    process.env.NEXT_PUBLIC_ALLOW_MOCK_BILLING === 'true';

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
        setSub(null);
        setSubLoading(false);
        return;
      }
      const res = await fetchCurrentSubscription(workspaceId);
      if (!res.ok) {
        setPortalAvailable(false);
        setSub(null);
        setSubLoading(false);
        return;
      }
      const body = (await res.json()) as SubPayload & { billingPortalAvailable?: boolean };
      setPortalAvailable(Boolean(body.billingPortalAvailable));
      setSub(body);
      setSubLoading(false);
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

  const downloadInvoice = useCallback(async (invoiceRef: string) => {
    try {
      const res = await fetchInvoicePdfUrl(invoiceRef);
      if (!res.ok) {
        toast.error(t('invoiceDownloadFailed'));
        return;
      }
      const data = (await res.json()) as { url?: string | null };
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error(t('invoiceDownloadFailed'));
      }
    } catch {
      toast.error(t('invoiceDownloadFailed'));
    }
  }, [t]);

  const applyMockPlan = useCallback(
    async (next: 'FREE' | 'PRO') => {
      if (!workspaceId) return;
      setSavingPlan(next);
      const res = await apiSetMockPlan(workspaceId, next);
      if (!res.ok) {
        toast.error(tBilling('mockPlanSaveFailed'));
        setSavingPlan(false);
        return;
      }
      toast.success(
        next === 'PRO' ? tBilling('mockPlanUpgraded') : tBilling('mockPlanDowngraded'),
      );
      const subRes = await fetchCurrentSubscription(workspaceId);
      if (subRes.ok) {
        setSub((await subRes.json()) as SubPayload);
      }
      setSavingPlan(false);
    },
    [workspaceId, tBilling],
  );

  const startStripeCheckout = useCallback(async (planName: string) => {
    if (!workspaceId) return;
    setSavingPlan(planName);
    try {
      const res = await apiCreateStripeCheckout(workspaceId, planName);
      if (!res.ok) {
        toast.error(tBilling('stripeCheckoutFailed'));
        return;
      }
      const data = (await res.json()) as { url: string | null };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(tBilling('stripeCheckoutFailed'));
    } finally {
      setSavingPlan(false);
    }
  }, [workspaceId, tBilling]);

  if (loading) return <CardGridSkeleton count={2} />;

  if (!data) return null;

  const cp = data.currentPlan;
  const isCancelled = cp.userSubscriptionStatus === 'CANCELED';
  const isPastDue = cp.userSubscriptionStatus === 'PAST_DUE';
  const isSuspended = cp.workspaceStatus === 'SUSPENDED';
  const showRetention = isCancelled || isPastDue || isSuspended;
  const plan = sub?.plan ?? 'FREE';
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE';

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
                  onClick={() => {
                    const el = document.getElementById('plans-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
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
                <TableHead className="text-center">{t('table.download')}</TableHead>
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
                  <TableCell className="text-center">
                    {p.invoiceRef ? (
                      <button
                        type="button"
                        onClick={() => void downloadInvoice(p.invoiceRef!)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
                        aria-label={t('downloadInvoice')}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : null}
      </div>

      {/* Plan selection — ported from BillingClient */}
      <motion.section
        id="plans-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-glass vc-card-surface rounded-3xl p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="vc-page-kicker">{tBilling('kicker')}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{tBilling('title')}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {tBilling('description')}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 px-5 py-4">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {tBilling('currentPlan')}
                </p>
                <p className="font-mono-nums text-xs text-muted-foreground">
                  {subLoading ? '…' : sub?.status ?? tBilling('dash')}
                </p>
              </div>
            </div>
            {!subLoading && sub?.billingPortalAvailable ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 rounded-2xl border-border/80"
                disabled={!!savingPlan || portalBusy}
                onClick={() => void openBillingPortal()}
              >
                {portalBusy ? t('openingPortal') : t('manageBilling')}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border p-6',
              !isPro
                ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-md'
                : 'border-border bg-card',
            )}
          >
            {!isPro ? (
              <span className="absolute end-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {tBilling('current')}
              </span>
            ) : null}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{tBilling('free')}</h3>
                <p className="font-mono-nums text-2xl font-bold text-foreground">
                  $0
                  <span className="text-sm font-normal text-muted-foreground">{tBilling('perMonth')}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[tBilling('freeFeatures.seat'), tBilling('freeFeatures.scheduling'), tBilling('freeFeatures.support')].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
            {!isPro ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                {tBilling('currentFreePlan')}
              </p>
            ) : allowMockBilling ? (
              <Button
                type="button"
                variant="outline"
                className="mt-8 w-full rounded-xl border-border"
                disabled={!!savingPlan}
                onClick={() => void applyMockPlan('FREE')}
              >
                {tBilling('switchToFree')}
              </Button>
            ) : (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                {tBilling('downgradeViaStripePortal')}
              </p>
            )}
          </div>

          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border p-6',
              plan === 'STARTER'
                ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-md'
                : 'border-border bg-card',
            )}
          >
            {plan === 'STARTER' ? (
              <span className="absolute end-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {tBilling('current')}
              </span>
            ) : null}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{tBilling('starter')}</h3>
                <p className="font-mono-nums text-2xl font-bold text-foreground">
                  $19
                  <span className="text-sm font-normal text-muted-foreground">{tBilling('perMonth')}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[tBilling('starterFeatures.seats'), tBilling('starterFeatures.screens'), tBilling('starterFeatures.scheduling')].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="mt-8 w-full rounded-xl font-semibold"
              disabled={!!savingPlan || plan === 'STARTER'}
              onClick={() => void startStripeCheckout('STARTER')}
            >
              {savingPlan === 'STARTER' ? tBilling('redirectingToStripe') : tBilling('chooseStarter')}
            </Button>
          </div>

          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border p-6',
              isPro
                ? 'border-primary/45 bg-gradient-to-br from-primary/15 to-accent/10 shadow-lg'
                : 'border-border bg-gradient-to-br from-muted/40 to-card',
            )}
          >
            {isPro ? (
              <span className="absolute end-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {tBilling('current')}
              </span>
            ) : null}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{tBilling('pro')}</h3>
                <p className="font-mono-nums text-2xl font-bold text-foreground">
                  $49
                  <span className="text-sm font-normal text-muted-foreground">{tBilling('perMonth')}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                tBilling('proFeatures.unlimited'),
                tBilling('proFeatures.advanced'),
                tBilling('proFeatures.prioritySync'),
                tBilling('proFeatures.portal'),
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Button
                type="button"
                className="w-full rounded-xl font-semibold" variant="cta"
                disabled={!!savingPlan || isPro}
                onClick={() => void startStripeCheckout('PRO')}
              >
                {savingPlan === 'PRO' ? tBilling('redirectingToStripe') : tBilling('subscribeWithCard')}
              </Button>
              {allowMockBilling ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-dashed border-primary/40"
                  disabled={!!savingPlan || isPro}
                  onClick={() => void applyMockPlan('PRO')}
                >
                  {tBilling('demoUpgradePro')}
                </Button>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border p-6',
              plan === 'ENTERPRISE'
                ? 'border-primary/45 bg-gradient-to-br from-primary/15 to-accent/10 shadow-lg'
                : 'border-border bg-gradient-to-br from-muted/40 to-card',
            )}
          >
            {plan === 'ENTERPRISE' ? (
              <span className="absolute end-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {tBilling('current')}
              </span>
            ) : null}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{tBilling('enterprise')}</h3>
                <p className="font-mono-nums text-2xl font-bold text-foreground">
                  $199
                  <span className="text-sm font-normal text-muted-foreground">{tBilling('perMonth')}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[tBilling('enterpriseFeatures.seats'), tBilling('enterpriseFeatures.screens'), tBilling('enterpriseFeatures.support'), tBilling('enterpriseFeatures.sso')].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="mt-8 w-full rounded-xl font-semibold"
              disabled={!!savingPlan || plan === 'ENTERPRISE'}
              onClick={() => void startStripeCheckout('ENTERPRISE')}
            >
              {savingPlan === 'ENTERPRISE' ? tBilling('redirectingToStripe') : tBilling('chooseEnterprise')}
            </Button>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {tBilling('usageSnapshot')}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-muted-foreground">{tBilling('plan')}</p>
              <p className="font-mono-nums text-lg font-semibold">{subLoading ? '…' : plan}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{tBilling('seats')}</p>
              <p className="font-mono-nums text-lg font-semibold">
                {subLoading ? '…' : sub?.seats ?? tBilling('dash')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{tBilling('screenLimit')}</p>
              <p className="font-mono-nums text-lg font-semibold">
                {subLoading ? '…' : sub?.screenLimit ?? tBilling('dash')}
              </p>
            </div>
          </div>
        </div>

        {sub?.perScreenPricing && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold tracking-tight">{tBilling('perScreenBilling')}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {tBilling('activeScreens')}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {sub.activeScreenCount ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {tBilling('includedScreens')}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {sub.perScreenPricing.includedScreens}
                </p>
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {tBilling('perScreenPrice')}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {sub.perScreenPricing.perScreenPrice > 0
                    ? `$${(sub.perScreenPricing.perScreenPrice / 100).toFixed(2)}`
                    : tBilling('included')}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-4 ring-1 ring-primary/20">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {tBilling('estimatedMonthly')}
                </p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {sub.estimatedMonthlyTotal != null
                    ? `$${(sub.estimatedMonthlyTotal / 100).toFixed(2)}`
                    : '—'}
                </p>
              </div>
            </div>

            {sub.perScreenPricing.perScreenPrice > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (sub.activeScreenCount ?? 0) > sub.perScreenPricing.includedScreens
                        ? 'bg-amber-500'
                        : 'bg-emerald-500',
                    )}
                    style={{
                      width: `${Math.min(100, ((sub.activeScreenCount ?? 0) / sub.screenLimit) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {sub.activeScreenCount ?? 0} / {sub.screenLimit}
                </span>
              </div>
            )}

            {sub.perScreenPricing.perScreenPrice > 0 &&
              (sub.activeScreenCount ?? 0) > sub.perScreenPricing.includedScreens && (
                <p className="mt-3 text-xs text-amber-600">
                  {tBilling('overageWarning', {
                    count: (sub.activeScreenCount ?? 0) - sub.perScreenPricing.includedScreens,
                    price: `$${((sub.perScreenPricing.perScreenPrice / 100) * ((sub.activeScreenCount ?? 0) - sub.perScreenPricing.includedScreens)).toFixed(2)}`,
                  })}
                </p>
              )}
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="vc-card-surface overflow-hidden rounded-2xl border border-border"
      >
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="text-lg font-semibold tracking-tight">{tBilling('comparisonTitle')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-6 py-4 text-start font-medium text-muted-foreground">{tBilling('comparisonFeature')}</th>
                <th className="px-4 py-4 text-center font-semibold">{tBilling('free')}</th>
                <th className="px-4 py-4 text-center font-semibold">{tBilling('starter')}</th>
                <th className="px-4 py-4 text-center font-semibold">{tBilling('pro')}</th>
                <th className="px-4 py-4 text-center font-semibold">{tBilling('enterprise')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {[
                { label: tBilling('cmp.screens'), values: ['25', '100', '500', '2000'] },
                { label: tBilling('cmp.seats'), values: ['5', '15', '25', '100'] },
                { label: tBilling('cmp.storage'), values: ['5 GB', '50 GB', '200 GB', '1 TB'] },
                { label: tBilling('cmp.scheduling'), values: [true, true, true, true] },
                { label: tBilling('cmp.analytics'), values: [false, true, true, true] },
                { label: tBilling('cmp.apiAccess'), values: [false, false, true, true] },
                { label: tBilling('cmp.prioritySync'), values: [false, false, true, true] },
                { label: tBilling('cmp.sso'), values: [false, false, false, true] },
                { label: tBilling('cmp.support'), values: [tBilling('cmp.community'), tBilling('cmp.email'), tBilling('cmp.priority'), tBilling('cmp.dedicated')] },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-6 py-3.5 font-medium text-foreground">{row.label}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className="px-4 py-3.5 text-center">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <Check className="mx-auto h-4 w-4 text-primary" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="text-muted-foreground">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
