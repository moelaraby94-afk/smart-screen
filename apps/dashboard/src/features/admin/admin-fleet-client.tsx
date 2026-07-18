'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Monitor, Search } from 'lucide-react';
import { toast } from 'sonner';
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
import { fetchAdminFleetScreens } from './admin-api';
import type { ScreenStatus } from '@/features/screens/useApiScreens';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import { adminGlassTable } from '@/lib/admin-glass-table';
import { cn } from '@/lib/utils';

const KNOWN_PLATFORMS = new Set(['WEB', 'ANDROID', 'TIZEN', 'WEBOS']);

function platformKey(p: string): 'WEB' | 'ANDROID' | 'TIZEN' | 'WEBOS' | 'UNKNOWN' {
  return KNOWN_PLATFORMS.has(p) ? (p as 'WEB' | 'ANDROID' | 'TIZEN' | 'WEBOS') : 'UNKNOWN';
}

export type GlobalFleetScreenRow = {
  id: string;
  name: string;
  serialNumber: string;
  status: ScreenStatus;
  lastSeenAt: string | null;
  playerPlatform: string;
  workspaceId: string;
  workspaceName: string;
};

export function AdminFleetClient() {
  const locale = useLocale();
  const t = useTranslations('adminFleetClient');
  const [rows, setRows] = useState<GlobalFleetScreenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const res = await fetchAdminFleetScreens();
    if (!res.ok) {
      toast.error(t('loadFailed'));
      setLoading(false);
      return;
    }
    const data = (await res.json()) as GlobalFleetScreenRow[];
    setRows(data);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    let online = 0, offline = 0, warning = 0;
    for (const s of rows) {
      if (s.status === 'ONLINE') online++;
      else if (s.status === 'OFFLINE') offline++;
      else warning++;
    }
    return { online, offline, warning, total: rows.length };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.workspaceName.toLowerCase().includes(q) ||
      s.serialNumber.toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (loading) {
    return <AdminCosmicLoader label={t('loading')} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t('hint')}</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="vc-card-surface rounded-2xl border border-border p-4" aria-label={`${t('summary.online')}: ${summary.online}`}>
          <p className="text-xs font-medium text-muted-foreground">{t('summary.online')}</p>
          <p className="mt-1 text-2xl font-bold text-success">{summary.online}</p>
        </div>
        <div className="vc-card-surface rounded-2xl border border-border p-4" aria-label={`${t('summary.offline')}: ${summary.offline}`}>
          <p className="text-xs font-medium text-muted-foreground">{t('summary.offline')}</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{summary.offline}</p>
        </div>
        <div className="vc-card-surface rounded-2xl border border-border p-4" aria-label={`${t('summary.warning')}: ${summary.warning}`}>
          <p className="text-xs font-medium text-muted-foreground">{t('summary.warning')}</p>
          <p className="mt-1 text-2xl font-bold text-warning">{summary.warning}</p>
        </div>
        <div className="vc-card-surface rounded-2xl border border-border p-4" aria-label={`${t('summary.total')}: ${summary.total}`}>
          <p className="text-xs font-medium text-muted-foreground">{t('summary.total')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{summary.total}</p>
        </div>
      </div>

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
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                    {t('workspace')}
                  </TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                    {t('screen')}
                  </TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start font-mono text-[11px]')}>
                    {t('serial')}
                  </TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                    {t('playerType')}
                  </TableHead>
                  <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                    {t('status')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((s) => (
                  <TableRow key={s.id} className={adminGlassTable.tbodyRow}>
                    <TableCell>
                      <p className="font-medium">{s.workspaceName}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{s.workspaceId}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Monitor className="h-4 w-4 text-primary" />
                        </span>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.serialNumber || '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t(`platforms.${platformKey(s.playerPlatform)}`)}
                    </TableCell>
                    <TableCell>
                      <ScreenFleetStatusBadge
                        status={s.status}
                        lastSeenAt={s.lastSeenAt}
                        locale={locale}
                        tone="card"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <AdminEmptyState icon={Monitor} title={t('empty')} description={t('emptyDescription')} />
        )}
      </div>
      {filteredRows.length === 0 && rows.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('noResults')}</p>
      )}
    </div>
  );
}
