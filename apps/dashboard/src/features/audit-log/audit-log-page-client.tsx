'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ScrollText, Shield, Globe, Search, Download } from 'lucide-react';
import { fetchAuditLog, type AuditLogRow } from './audit-log-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ListSkeleton } from '@/components/ui/skeleton-patterns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  SCREEN_DELETE: 'bg-red-500/15 text-red-600',
  SCREEN_CREATE: 'bg-emerald-500/15 text-emerald-600',
  SCREEN_UPDATE: 'bg-blue-500/15 text-blue-600',
  PLAYLIST_PUBLISH: 'bg-purple-500/15 text-purple-600',
  PLAYLIST_DELETE: 'bg-red-500/15 text-red-600',
  SCHEDULE_CHANGE: 'bg-indigo-500/15 text-indigo-600',
  MEMBER_ROLE_CHANGE: 'bg-amber-500/15 text-amber-600',
  MEMBER_INVITE: 'bg-cyan-500/15 text-cyan-600',
  MEMBER_REMOVE: 'bg-red-500/15 text-red-600',
  SUBSCRIPTION_CHANGE: 'bg-purple-500/15 text-purple-600',
  IMPERSONATE_USER: 'bg-red-500/15 text-red-600',
};

const ACTION_LABEL_KEYS: Record<string, string> = {
  SCREEN_CREATE: 'actionScreenCreate',
  SCREEN_UPDATE: 'actionScreenUpdate',
  SCREEN_DELETE: 'actionScreenDelete',
  PLAYLIST_PUBLISH: 'actionPlaylistPublish',
  PLAYLIST_DELETE: 'actionPlaylistDelete',
  SCHEDULE_CHANGE: 'actionScheduleChange',
  MEMBER_ROLE_CHANGE: 'actionMemberRoleChange',
  MEMBER_INVITE: 'actionMemberInvite',
  MEMBER_REMOVE: 'actionMemberRemove',
  SUBSCRIPTION_CHANGE: 'actionSubscriptionChange',
  IMPERSONATE_USER: 'actionImpersonateUser',
};

const PAGE_SIZE = 20;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatMetadata(meta: Record<string, unknown> | null): string {
  if (!meta) return '';
  const entries = Object.entries(meta).filter(([, v]) => v != null);
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join(', ');
}

export function AuditLogPageClient() {
  const t = useTranslations('auditLogPage');
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!workspaceId) return;
    void (async () => {
      setLoading(true);
      const data = await fetchAuditLog(workspaceId);
      setItems(data.items);
      setLoading(false);
    })();
  }, [workspaceId]);

  const availableActions = useMemo(() => {
    const set = new Set(items.map((i) => i.action));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (actionFilter !== 'all' && item.action !== actionFilter) return false;
      if (!q) return true;
      return (
        item.action.toLowerCase().includes(q) ||
        item.actorName.toLowerCase().includes(q) ||
        item.ipAddress.toLowerCase().includes(q)
      );
    });
  }, [items, search, actionFilter]);

  const visible = filtered.slice(0, visibleCount);

  const exportCsv = useCallback(() => {
    if (!filtered.length) return;
    const headers = ['Action', 'Actor', 'IP Address', 'Timestamp', 'Metadata'];
    const rows = filtered.map((item) => [
      item.action,
      item.actorName,
      item.ipAddress,
      formatTime(item.createdAt),
      formatMetadata(item.metadata),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  if (loading) {
    return <div aria-busy="true" aria-live="polite"><ListSkeleton count={6} /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <ScrollText className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            className="ps-8"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <option value="all">{t('filterAll')}</option>
          {availableActions.map((action) => {
            const labelKey = ACTION_LABEL_KEYS[action];
            return (
              <option key={action} value={action}>
                {labelKey ? t(labelKey) : action}
              </option>
            );
          })}
        </select>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!filtered.length}
          onClick={exportCsv}
        >
          <Download className="me-1.5 h-4 w-4" />
          {t('exportCsv')}
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('noSearchResults')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((item, i) => {
              const colorClass = ACTION_COLORS[item.action] ?? 'bg-muted text-muted-foreground';
              const metaStr = formatMetadata(item.metadata);
              const labelKey = ACTION_LABEL_KEYS[item.action];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.01 * i, 0.2), duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      colorClass,
                    )}
                  >
                    <Shield className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', colorClass)}>
                        {labelKey ? t(labelKey) : item.action}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.actorName}</p>
                    {metaStr && (
                      <p className="text-xs text-muted-foreground">{metaStr}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span className="font-mono">{item.ipAddress}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {visibleCount < filtered.length && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-xs text-muted-foreground">
                {t('showing', { shown: visible.length, total: filtered.length })}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
