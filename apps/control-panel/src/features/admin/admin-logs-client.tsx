'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ScrollText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { AdminCosmicLoader } from '@/components/admin/admin-cosmic-loader';
import { fetchAdminLogs } from './admin-api';
import { adminGlassTable } from '@/lib/admin-glass-table';
import { cn } from '@/lib/utils';

type LogRow = {
  id: string;
  action?: string;
  adminName?: string;
  targetCustomer?: string;
  ipAddress?: string;
  timestamp?: string;
};

const LOG_ACTION_TO_KEY: Record<
  string,
  'superAdminLoggedIn' | 'impersonationEnd' | 'impersonationStart'
> = {
  'Super Admin Logged In': 'superAdminLoggedIn',
  IMPERSONATION_END: 'impersonationEnd',
  IMPERSONATION_START: 'impersonationStart',
};

function formatLogAction(
  action: string | undefined,
  t: (key: string) => string,
): string {
  if (!action) return t('dash');
  const k = LOG_ACTION_TO_KEY[action];
  if (k) return t(`logActions.${k}`);
  return action;
}

export function AdminLogsClient() {
  const locale = useLocale();
  const t = useTranslations('adminLogs');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const res = await fetchAdminLogs();
      if (!res.ok) {
        if (mounted) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const data = (await res.json()) as LogRow[];
      if (mounted) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        [r.action, r.adminName, r.targetCustomer, r.ipAddress]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      if (!matchesSearch) return false;
      if (!r.timestamp) return fromTime === null && toTime === null;
      const ts = new Date(r.timestamp).getTime();
      if (fromTime !== null && ts < fromTime) return false;
      if (toTime !== null && ts > toTime) return false;
      return true;
    });
  }, [rows, search, dateFrom, dateTo]);

  if (loading) {
    return <AdminCosmicLoader label={t('loading')} />;
  }

  const showEmpty = rows.length === 0;
  const showSearchEmpty = !showEmpty && filtered.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="rounded-xl border-border bg-background ps-9"
            disabled={rows.length === 0}
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder={t('dateFrom')}
            className="max-w-[150px] rounded-xl border-border bg-background"
            disabled={rows.length === 0}
            aria-label={t('dateFrom')}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder={t('dateTo')}
            className="max-w-[150px] rounded-xl border-border bg-background"
            disabled={rows.length === 0}
            aria-label={t('dateTo')}
          />
        </div>
      </div>
      <div className={adminGlassTable.wrap}>
        {showEmpty ? (
          <AdminEmptyState
            icon={ScrollText}
            title={t('empty')}
            description={t('emptyDescription')}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={adminGlassTable.theadRow}>
                    <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                      {t('columns.event')}
                    </TableHead>
                    <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                      {t('columns.actor')}
                    </TableHead>
                    <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                      {t('columns.target')}
                    </TableHead>
                    <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                      {t('columns.datetime')}
                    </TableHead>
                    <TableHead className={cn(adminGlassTable.th, 'text-start')}>
                      {t('columns.ip')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id} className={adminGlassTable.tbodyRow}>
                      <TableCell className="max-w-[220px] font-medium">
                        {formatLogAction(row.action, t)}
                      </TableCell>
                      <TableCell className="text-sm">{row.adminName ?? t('dash')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.targetCustomer ?? t('dash')}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.timestamp
                          ? new Intl.DateTimeFormat(locale, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(new Date(row.timestamp))
                          : t('dash')}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.ipAddress ?? t('dash')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {showSearchEmpty ? (
              <div className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
                {t('emptySearch')}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
