'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Building2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { AdminCosmicLoader } from '@/components/admin/admin-cosmic-loader';
import { fetchAdminWorkspaces, mockWorkspacePlan as apiMockWorkspacePlan } from './admin-api';
import { adminGlassTable } from '@/lib/admin-glass-table';
import { cn } from '@/lib/utils';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerId: string | null;
  ownerCustomerProfileId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  screenCount: number;
  mediaCount: number;
  storageBytes: number;
  subscriptionPlan: string | null;
  subscriptionScreenLimit: number | null;
  subscriptionStatus: string | null;
};

function formatBytes(n: number, locale: string): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  if (n < 1024) return `${nf.format(n)} B`;
  if (n < 1024 * 1024) return `${nf.format(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${nf.format(n / (1024 * 1024))} MB`;
  return `${nf.format(n / (1024 * 1024 * 1024))} GB`;
}

export function AdminWorkspacesClient() {
  const locale = useLocale();
  const t = useTranslations('adminWorkspaces');
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockingId, setMockingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const res = await fetchAdminWorkspaces();
    if (!res.ok) {
      toast.error(t('loadFailed'));
      setLoading(false);
      return;
    }
    const data = (await res.json()) as WorkspaceRow[];
    setRows(data);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const mockPlan = async (workspaceId: string, plan: 'FREE' | 'PRO') => {
    setMockingId(workspaceId);
    try {
      const res = await apiMockWorkspacePlan(workspaceId, plan);
      if (!res.ok) {
        toast.error(t('mockFailed'));
        return;
      }
      toast.success(t('mockSuccess', { plan }));
      await load();
    } finally {
      setMockingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((w) =>
      w.name.toLowerCase().includes(q) ||
      (w.ownerEmail ?? '').toLowerCase().includes(q) ||
      (w.ownerName ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (loading) {
    return <AdminCosmicLoader label={t('loading')} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t('auditHint')}</p>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="ps-9"
          disabled={rows.length === 0}
        />
      </div>
      <div className={adminGlassTable.wrap}>
        {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className={adminGlassTable.theadRow}>
                <TableHead className={cn(adminGlassTable.th, 'text-start')}>{t('workspace')}</TableHead>
                <TableHead className={cn(adminGlassTable.th, 'hidden text-start sm:table-cell')}>{t('owner')}</TableHead>
                <TableHead className={cn(adminGlassTable.th, 'text-end tabular-nums')}>{t('screens')}</TableHead>
                <TableHead className={cn(adminGlassTable.th, 'hidden text-end tabular-nums sm:table-cell')}>{t('media')}</TableHead>
                <TableHead className={cn(adminGlassTable.th, 'hidden text-end md:table-cell')}>{t('storage')}</TableHead>
                <TableHead className={cn(adminGlassTable.th, 'hidden text-start lg:table-cell')}>{t('subscription')}</TableHead>
                <TableHead className={cn(adminGlassTable.th, 'text-end whitespace-nowrap')}>
                  {t('mockActions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((w) => (
                <TableRow key={w.id} className={adminGlassTable.tbodyRow}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{w.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {w.ownerCustomerProfileId ? (
                      <Link
                        href={`/${locale}/admin/customers/${w.ownerCustomerProfileId}` as Route}
                        className="block font-mono text-xs text-primary underline-offset-4 hover:underline"
                      >
                        {w.ownerEmail ?? t('na')}
                      </Link>
                    ) : (
                      <div className="font-mono text-xs">{w.ownerEmail ?? t('na')}</div>
                    )}
                    {w.ownerName ? (
                      <p className="text-[11px] text-muted-foreground">{w.ownerName}</p>
                    ) : null}
                    {!w.ownerCustomerProfileId && w.ownerId ? (
                      <p className="text-[10px] text-muted-foreground">{t('staffOwner')}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-end font-mono-nums text-sm tabular-nums">
                    {w.screenCount}
                  </TableCell>
                  <TableCell className="text-end font-mono-nums text-sm tabular-nums hidden sm:table-cell">
                    {w.mediaCount}
                  </TableCell>
                  <TableCell className="text-end font-mono text-sm tabular-nums text-muted-foreground hidden md:table-cell">
                    {formatBytes(w.storageBytes, locale)}
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell">
                    <p className="font-medium">
                      {w.subscriptionPlan ?? t('na')}
                      {w.subscriptionScreenLimit != null ? (
                        <span className="ms-1 text-muted-foreground">
                          ({t('screenLimitLabel', { n: w.subscriptionScreenLimit })})
                        </span>
                      ) : null}
                    </p>
                    {w.subscriptionStatus ? (
                      <p className="text-[10px] text-muted-foreground">{w.subscriptionStatus}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px]"
                        disabled={mockingId === w.id}
                        onClick={() => void mockPlan(w.id, 'PRO')}
                      >
                        {t('mockPro')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-[11px]"
                        disabled={mockingId === w.id}
                        onClick={() => void mockPlan(w.id, 'FREE')}
                      >
                        {t('mockFree')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        ) : (
          <AdminEmptyState icon={Building2} title={t('empty')} description={t('emptyDescription')} />
        )}
      </div>
      {filteredRows.length === 0 && rows.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('noResults')}</p>
      )}
    </div>
  );
}
