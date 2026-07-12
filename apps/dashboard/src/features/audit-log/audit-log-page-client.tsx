'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ScrollText, Shield, Globe } from 'lucide-react';
import { fetchAuditLog, type AuditLogRow } from './audit-log-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
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

  useEffect(() => {
    if (!workspaceId) return;
    void (async () => {
      setLoading(true);
      const data = await fetchAuditLog(workspaceId);
      setItems(data.items);
      setLoading(false);
    })();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
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
    <div className="space-y-3">
      {items.map((item, i) => {
        const colorClass = ACTION_COLORS[item.action] ?? 'bg-muted text-muted-foreground';
        const metaStr = formatMetadata(item.metadata);
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.01 * i, duration: 0.2 }}
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
                  {item.action}
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
  );
}
