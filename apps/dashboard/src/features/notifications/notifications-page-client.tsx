'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Monitor,
  Upload,
  AlertTriangle,
  CalendarClock,
  CreditCard,
  UserPlus,
  CheckCircle,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications } from './notification-provider';
import { markAllNotificationsRead } from './notifications-api';

const iconForType = (type: string) => {
  switch (type) {
    case 'screen_offline':
      return { icon: AlertTriangle, class: 'bg-amber-500/15 text-amber-600' };
    case 'screen_online':
      return { icon: Monitor, class: 'bg-emerald-500/15 text-emerald-600' };
    case 'upload_complete':
      return { icon: Upload, class: 'bg-blue-500/15 text-blue-600' };
    case 'subscription_updated':
      return { icon: CreditCard, class: 'bg-purple-500/15 text-purple-600' };
    case 'schedule_changed':
      return { icon: CalendarClock, class: 'bg-indigo-500/15 text-indigo-600' };
    case 'pairing_started':
      return { icon: UserPlus, class: 'bg-cyan-500/15 text-cyan-600' };
    default:
      return { icon: CheckCircle, class: 'bg-muted text-muted-foreground' };
  }
};

export function NotificationsPageClient() {
  const t = useTranslations('notifications');
  const tPage = useTranslations('notifications.page');
  const { notifications, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return t('justNow');
    if (diff < 3_600_000) return t('minutesAgo', { n: Math.floor(diff / 60_000) });
    if (diff < 86_400_000) return t('hoursAgo', { n: Math.floor(diff / 3_600_000) });
    return new Date(ts).toLocaleDateString();
  };

  const handleMarkAllRead = () => {
    void markAllNotificationsRead();
    window.location.reload();
  };

  const enableBrowserNotifications = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    Notification.requestPermission();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition',
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tPage('filterAll')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition',
              filter === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tPage('filterUnread')}
            {unreadCount > 0 && (
              <span className="ms-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={unreadCount === 0}
          onClick={handleMarkAllRead}
        >
          <CheckCircle className="me-1.5 h-3.5 w-3.5" />
          {tPage('markAllRead')}
        </Button>

        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={enableBrowserNotifications}
          >
            <Bell className="me-1.5 h-3.5 w-3.5" />
            {t('enableBrowser')}
          </Button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Bell className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{tPage('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const { icon: Icon, class: iconClass } = iconForType(n.type);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * i, duration: 0.25 }}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3',
                  !n.read && 'ring-1 ring-primary/20',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    iconClass,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-tight text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(n.timestamp)}</p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
