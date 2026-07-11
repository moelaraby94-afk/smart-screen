'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Building2,
  Calendar,
  Gauge,
  HardDrive,
  LayoutGrid,
  Mail,
  MapPin,
  Monitor,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminGlassTable } from '@/lib/admin-glass-table';
import { cn } from '@/lib/utils';
import {
  type BranchRow,
  type Lifecycle,
  type ProfilePayload,
  type ProfileTabId,
  type SubStatus,
  formatBytes,
} from '@/features/admin/admin-customer-profile-types';

export function lifecycleBadge(lifecycle: Lifecycle, t: (key: string) => string) {
  if (lifecycle === 'suspended') {
    return (
      <span className="rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
        {t('lifecycle.suspended')}
      </span>
    );
  }
  if (lifecycle === 'expired') {
    return (
      <span className="rounded-full border border-amber-500/40 bg-amber-500/12 px-3 py-1 text-xs font-semibold text-amber-100">
        {t('lifecycle.expired')}
      </span>
    );
  }
  if (lifecycle === 'trial') {
    return (
      <span className="rounded-full border border-primary/45 bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
        {t('lifecycle.trial')}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
      {t('lifecycle.active')}
    </span>
  );
}

type OverviewTabProps = {
  data: ProfilePayload;
};

export function OverviewTab({ data }: OverviewTabProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <div role="tabpanel" id="customer-panel-overview" aria-labelledby="customer-tab-overview" className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {t('heroKicker')}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                {data.fullName}
              </h1>
              {lifecycleBadge(data.customerLifecycle, t)}
            </div>
            {data.businessName ? (
              <p className="text-sm font-medium text-primary">{data.businessName}</p>
            ) : null}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2 text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <span className="font-mono text-xs text-foreground/90">{data.email}</span>
              </div>
              {data.phone ? (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                  <span className="text-foreground/90">{data.phone}</span>
                </div>
              ) : null}
              {(data.country || data.city) && (
                <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                  <span className="text-foreground/90">
                    {[data.city, data.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2 text-muted-foreground">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <span>
                  {t('accountLabel')}:{' '}
                  <span className="text-foreground/90">
                    {data.isActive ? t('enabled') : t('disabled')}
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <span>
                  {t('joined')}{' '}
                  {new Date(data.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                <span>
                  {t('plan')}:{' '}
                  <span className="font-medium text-primary/90">
                    {data.subscriptionStatus === 'ACTIVE'
                      ? t('subscriptionPlan.ACTIVE')
                      : data.subscriptionStatus === 'TRIAL'
                        ? t('subscriptionPlan.TRIAL')
                        : t('subscriptionPlan.EXPIRED')}
                  </span>
                  {data.subscriptionEndDate ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {t('ends')}{' '}
                      {new Date(data.subscriptionEndDate).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          </div>

          <div className="grid min-w-[220px] gap-3 rounded-2xl border border-border/15 bg-muted/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('usageTitle')}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4 text-primary" />
                {t('screens')}
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                {data.usage.totalScreens}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4 text-primary" />
                {t('storage')}
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums text-primary">
                {formatBytes(data.usage.totalStorageBytes)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/15 bg-muted/15 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">{t('overviewKpiTitle')}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/10 bg-muted/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('kpiBranches')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {data.branches.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-muted/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('screens')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {data.usage.totalScreens}
            </p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-muted/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('kpiPlaylists')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {data.analytics.totalPlaylists}
            </p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-muted/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('kpiMediaItems')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {data.analytics.totalMedia}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

type SubscriptionTabProps = {
  subStatus: SubStatus;
  setSubStatus: (v: SubStatus) => void;
  subEndLocal: string;
  setSubEndLocal: (v: string) => void;
  accountEnabled: boolean;
  setAccountEnabled: (v: boolean) => void;
  savingSub: boolean;
  onSave: () => void;
};

export function SubscriptionTab(props: SubscriptionTabProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <div role="tabpanel" id="customer-panel-subscription" aria-labelledby="customer-tab-subscription" className="space-y-6">
      <section className="rounded-3xl border border-border/15 bg-muted/15 p-4 shadow-inner sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Gauge className="h-5 w-5 text-primary" />
          {t('subscriptionTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="sub-status">{t('planStatus')}</Label>
            <select
              id="sub-status"
              value={props.subStatus}
              onChange={(e) => props.setSubStatus(e.target.value as SubStatus)}
              className={cn(
                'flex h-10 w-full rounded-xl border border-primary/25 bg-background px-3 text-sm',
                'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              )}
            >
              <option value="ACTIVE">{t('subscriptionPlan.ACTIVE')}</option>
              <option value="TRIAL">{t('subscriptionPlan.TRIAL')}</option>
              <option value="EXPIRED">{t('subscriptionPlan.EXPIRED')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-end">{t('planEnd')}</Label>
            <Input
              id="sub-end"
              type="datetime-local"
              value={props.subEndLocal}
              onChange={(e) => props.setSubEndLocal(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">{t('clearEndHint')}</p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-primary/40"
                checked={props.accountEnabled}
                onChange={(e) => props.setAccountEnabled(e.target.checked)}
              />
              {t('accountAccessEnabled')}
            </label>
            <Button
              type="button"
              className="rounded-xl font-semibold"
              variant="cta"
              disabled={props.savingSub}
              onClick={props.onSave}
            >
              {props.savingSub ? t('savingSubscription') : t('saveSubscription')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

type UsageTabProps = {
  data: ProfilePayload;
};

export function UsageTab({ data }: UsageTabProps) {
  const t = useTranslations('adminCustomerProfile');
  const statusEntries = Object.entries(data.analytics.screensByStatus).filter(([, n]) => n > 0);

  return (
    <div role="tabpanel" id="customer-panel-usage" aria-labelledby="customer-tab-usage" className="space-y-6">
      <section className="rounded-3xl border border-border/15 bg-card/40 p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t('analyticsTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/10 bg-muted/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('playlists')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {data.analytics.totalPlaylists}
            </p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-muted/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('mediaFiles')}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {data.analytics.totalMedia}
            </p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-muted/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('mediaStorage')}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-primary">
              {formatBytes(data.analytics.totalMediaBytes)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/10 bg-muted/20 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('screensByStatus')}
            </p>
            {statusEntries.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t('noScreensYet')}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {statusEntries.map(([status, count]) => (
                  <li key={status} className="flex justify-between gap-2 font-mono text-xs">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="tabular-nums text-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type WorkspacesTabProps = {
  data: ProfilePayload;
  customerId: string;
  locale: string;
  impersonatingWs: string | null;
  onAdd: () => void;
  onEdit: (b: BranchRow) => void;
  onDelete: (b: BranchRow) => void;
  onImpersonate: (workspaceId: string) => void;
};

export function WorkspacesTab(props: WorkspacesTabProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <div role="tabpanel" id="customer-panel-workspaces" aria-labelledby="customer-tab-workspaces" className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">{t('branchesTitle')}</h2>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-xl font-semibold"
            variant="cta"
            onClick={props.onAdd}
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('addBranch')}
          </Button>
        </div>
        <div className={cn(adminGlassTable.wrap, 'shadow-[0_0_40px_-12px_rgba(255, 107, 0,0.25)]')}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={adminGlassTable.theadRow}>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colBranch')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colCreated')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-end tabular-nums')}>{t('colScreens')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-end')}>{t('colStorage')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'w-[220px] text-end')}>{t('colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.data.branches.map((b) => (
                  <TableRow key={b.id} className={adminGlassTable.tbodyRow}>
                    <TableCell>
                      <Link
                        href={`/${props.locale}/admin/customers/${props.customerId}/workspace/${b.id}` as Route}
                        className="group block max-w-[min(100%,280px)] rounded-lg outline-none ring-offset-background transition hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-label={t('openBranchDetails')}
                      >
                        <p className="font-medium group-hover:underline">{b.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{b.slug}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-end font-mono text-sm tabular-nums">
                      {b.screenCount}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs tabular-nums text-muted-foreground">
                      {formatBytes(b.storageBytes)}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-primary/30 px-2"
                          onClick={() => props.onEdit(b)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-red-500/30 px-2 text-red-400 hover:bg-red-500/10"
                          onClick={() => props.onDelete(b)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-lg px-2 font-semibold"
                          variant="cta"
                          disabled={props.impersonatingWs === b.id}
                          onClick={() => props.onImpersonate(b.id)}
                        >
                          {t('open')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {props.data.branches.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('emptyBranches')}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type TabBarProps = {
  activeTab: ProfileTabId;
  setActiveTab: (v: ProfileTabId) => void;
};

export function ProfileTabBar({ activeTab, setActiveTab }: TabBarProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <div
      role="tablist"
      aria-label={t('tabsAria')}
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0"
    >
      {(['overview', 'subscription', 'usage', 'workspaces'] as ProfileTabId[]).map((tabId) => (
        <button
          key={tabId}
          type="button"
          role="tab"
          id={`customer-tab-${tabId}`}
          aria-selected={activeTab === tabId}
          aria-controls={`customer-panel-${tabId}`}
          onClick={() => setActiveTab(tabId)}
          className={cn(
            'shrink-0 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all sm:px-4',
            activeTab === tabId
              ? 'border-primary/55 bg-primary/15 text-primary shadow-sm'
              : 'border-border bg-card/30 text-muted-foreground hover:border-primary/30 hover:text-foreground',
          )}
        >
          {tabId === 'overview' && t('tabs.overview')}
          {tabId === 'subscription' && t('tabs.subscription')}
          {tabId === 'usage' && t('tabs.usage')}
          {tabId === 'workspaces' && t('tabs.workspaces')}
        </button>
      ))}
    </div>
  );
}
