'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Monitor, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminCosmicLoader } from '@/components/admin/admin-cosmic-loader';
import { setStoredAccessToken } from '@/features/auth/session';
import {
  fetchCustomerWorkspace as apiFetchCustomerWorkspace,
  impersonateUser as apiImpersonateUser,
} from './admin-api';
import { readApiError } from '@/features/api/api-error';
import { useApiErrorMessage } from '@/features/api/use-api-error-message';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { adminGlassTable } from '@/lib/admin-glass-table';
import { cn } from '@/lib/utils';

type ScreenStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

type WorkspacePayload = {
  customerId: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  screens: Array<{
    id: string;
    name: string;
    serialNumber: string;
    status: ScreenStatus;
    location: string | null;
    lastSeenAt: string | null;
    createdAt: string;
  }>;
};

type Props = {
  customerId: string;
  workspaceId: string;
};

export function AdminCustomerWorkspaceClient({ customerId, workspaceId }: Props) {
  const locale = useLocale();
  const t = useTranslations('adminCustomerWorkspace');
  const errorMessage = useApiErrorMessage();
  const tProfile = useTranslations('adminCustomerProfile');
  const { refreshWorkspaces } = useWorkspace();
  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetchCustomerWorkspace(customerId, workspaceId);
    if (!res.ok) {
      toast.error(errorMessage(await readApiError(res)));
      setData(null);
      setLoading(false);
      return;
    }
    const json = (await res.json()) as WorkspacePayload;
    setData(json);
    setLoading(false);
  }, [customerId, workspaceId, errorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const impersonate = async () => {
    if (!data) return;
    setImpersonating(true);
    try {
      const res = await apiImpersonateUser(data.customerId, { workspaceId: data.workspace.id });
      if (!res.ok) {
        toast.error(tProfile('toastImpersonateFailed'));
        return;
      }
      const payload = (await res.json()) as {
        accessToken?: string;
        workspaces?: Array<{ id: string }>;
      };
      if (payload.accessToken) {
        setStoredAccessToken(payload.accessToken);
      }
      const first = payload.workspaces?.[0]?.id ?? data.workspace.id;
      await refreshWorkspaces(first);
      toast.success(tProfile('toastEnteringWs'));
      window.location.assign(`/${locale}/media` as Route);
    } finally {
      setImpersonating(false);
    }
  };

  function statusLabel(s: ScreenStatus): string {
    if (s === 'ONLINE') return t('screenStatus.ONLINE');
    if (s === 'OFFLINE') return t('screenStatus.OFFLINE');
    return t('screenStatus.MAINTENANCE');
  }

  if (loading) {
    return <AdminCosmicLoader label={t('loading')} />;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('loadFailed')}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-xl border-border"
          asChild
        >
          <Link href={`/${locale}/admin/customers/${customerId}` as Route}>
            {tProfile('backToHub')}
          </Link>
        </Button>
      </div>
    );
  }

  const { workspace, screens } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          href={`/${locale}/admin/customers/${customerId}` as Route}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToProfile')}
        </Link>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-primary/35 bg-primary/5 hover:bg-primary/10"
          disabled={impersonating}
          onClick={() => void impersonate()}
        >
          <Send className="me-2 h-4 w-4" />
          {t('openWorkspace')}
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 md:p-8">
        <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {t('kicker')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {workspace.name}
              </h1>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {t('slugLabel')}: {workspace.slug}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('createdLabel')}:{' '}
              {new Date(workspace.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
          <div className="grid min-w-[180px] gap-2 rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {tProfile('screens')}
            </p>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                {screens.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('screensTitle')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('screensHint')}</p>
        </div>
        <div className={cn(adminGlassTable.wrap, 'shadow-[0_0_40px_-12px_rgba(255, 107, 0,0.25)]')}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={adminGlassTable.theadRow}>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colName')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colSerial')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colStatus')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colLocation')}</TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('colLastSeen')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screens.map((row) => (
                  <TableRow key={row.id} className={adminGlassTable.tbodyRow}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.serialNumber}</TableCell>
                    <TableCell className="text-sm">{statusLabel(row.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.location ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastSeenAt
                        ? new Date(row.lastSeenAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {screens.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('noScreens')}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
