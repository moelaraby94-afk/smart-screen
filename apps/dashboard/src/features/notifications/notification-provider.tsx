'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import {
  Monitor,
  Upload,
  AlertTriangle,
  Bell,
  CalendarClock,
  CreditCard,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useRealtimeSocket } from '@/features/realtime/realtime-provider';
import {
  fetchNotifications,
  markAllNotificationsRead,
  type NotificationRow,
} from './notifications-api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ICON_STROKE } from '@/lib/icon-stroke';


type ScreenStatusPayload = {
  screenId: string;
  serialNumber: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastSeenAt: string;
  isOfflineCacheMode?: boolean;
};

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string | null;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { notifications: [], unreadCount: 0, markAllRead: () => {}, removeNotification: () => {}, clearAll: () => {} };
  return ctx;
}

const MAX_NOTIFICATIONS = 50;

function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // ignore
    }
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const { workspaceId, isAuthenticated } = useWorkspace();
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback(
    (item: { type: string; message: string; link?: string | null }, browserTitle?: string) => {
      setNotifications((prev) => {
        const next: NotificationItem = {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          read: false,
        };
        return [next, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
      if (browserTitle) {
        showBrowserNotification(browserTitle, item.message);
      }
    },
    [],
  );

  // Load persisted notifications on mount / workspace change
  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      const data = await fetchNotifications();
      if (data.items.length > 0) {
        setNotifications(
          data.items.map((r: NotificationRow) => ({
            id: r.id,
            type: r.type,
            message: r.message,
            timestamp: new Date(r.createdAt).getTime(),
            read: r.read,
            link: r.link,
          })),
        );
      }
    })();
  }, [isAuthenticated, workspaceId]);

  const socket = useRealtimeSocket();

  useEffect(() => {
    if (!socket || !isAuthenticated || !workspaceId) return;

    socket.on('screen:status', (payload: ScreenStatusPayload) => {
      const prev = prevStatusRef.current.get(payload.screenId);
      if (prev && prev !== payload.status) {
        if (payload.status === 'OFFLINE') {
          toast.warning(t('screenOffline', { serial: payload.serialNumber }), {
            icon: <AlertTriangle className="h-4 w-4" />,
          });
          addNotification(
            { type: 'screen_offline', message: t('screenOffline', { serial: payload.serialNumber }) },
            t('browserScreenOffline'),
          );
        } else if (payload.status === 'ONLINE') {
          toast.success(t('screenOnline', { serial: payload.serialNumber }), {
            icon: <Monitor className="h-4 w-4" />,
          });
          addNotification(
            { type: 'screen_online', message: t('screenOnline', { serial: payload.serialNumber }) },
            t('browserScreenOnline'),
          );
        }
      }
      prevStatusRef.current.set(payload.screenId, payload.status);
    });

    socket.on('upload:complete', (payload: { fileName?: string }) => {
      toast.success(t('uploadComplete', { name: payload.fileName ?? '' }), {
        icon: <Upload className="h-4 w-4" />,
      });
      addNotification(
        { type: 'upload_complete', message: t('uploadComplete', { name: payload.fileName ?? '' }) },
        t('browserUpload'),
      );
    });

    socket.on('workspace:subscription', (payload: { plan?: string; status?: string }) => {
      toast.info(t('subscriptionUpdated', { plan: payload.plan ?? '' }), {
        icon: <CreditCard className="h-4 w-4" />,
      });
      addNotification(
        {
          type: 'subscription_updated',
          message: t('subscriptionUpdated', { plan: payload.plan ?? '' }),
          link: `/${locale}/settings/billing`,
        },
        t('browserSubscription'),
      );
    });

    socket.on('schedule:changed', () => {
      toast.info(t('scheduleChanged'), {
        icon: <CalendarClock className="h-4 w-4" />,
      });
      addNotification(
        { type: 'schedule_changed', message: t('scheduleChanged'), link: `/${locale}/scheduling` },
        t('browserSchedule'),
      );
    });

    socket.on('pairing:started', () => {
      addNotification({ type: 'pairing_started', message: t('pairingStarted'), link: `/${locale}/screens` });
    });

    return () => {
      socket.off('screen:status');
      socket.off('upload:complete');
      socket.off('workspace:subscription');
      socket.off('schedule:changed');
      socket.off('pairing:started');
    };
  }, [socket, workspaceId, isAuthenticated, t, addNotification, locale]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void markAllNotificationsRead();
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

const iconForType = (type: string) => {
  switch (type) {
    case 'screen_offline':
      return { icon: AlertTriangle, class: 'bg-warning/15 text-warning' };
    case 'screen_online':
      return { icon: Monitor, class: 'bg-success/15 text-success' };
    case 'upload_complete':
      return { icon: Upload, class: 'bg-primary/15 text-primary' };
    case 'subscription_updated':
      return { icon: CreditCard, class: 'bg-primary/15 text-primary' };
    case 'schedule_changed':
      return { icon: CalendarClock, class: 'bg-primary/15 text-primary' };
    case 'pairing_started':
      return { icon: UserPlus, class: 'bg-primary/15 text-primary' };
    default:
      return { icon: CheckCircle, class: 'bg-muted text-muted-foreground' };
  }
};

export function NotificationBell() {
  const t = useTranslations('notifications');
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [bellOpen, setBellOpen] = useState(false);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return t('justNow');
    if (diff < 3_600_000) return t('minutesAgo', { n: Math.floor(diff / 60_000) });
    if (diff < 86_400_000) return t('hoursAgo', { n: Math.floor(diff / 3_600_000) });
    return new Date(ts).toLocaleDateString();
  };

  return (
    <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted"
          aria-label={unreadCount > 0 ? `${t('bellLabel')} (${unreadCount} ${t('unread')})` : t('bellLabel')}
          aria-expanded={bellOpen}
          aria-haspopup="menu"
        >
          <Bell className="h-4 w-4" strokeWidth={ICON_STROKE} />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('title')}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[10px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded"
              aria-label={t('markAllRead')}
            >
              {t('markAllRead')}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('empty')}
          </div>
        ) : (
          notifications.map((n) => {
            const { icon: Icon, class: iconClass } = iconForType(n.type);
            return (
              <DropdownMenuItem
                key={n.id}
                className="flex items-start gap-2 py-2.5"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    iconClass,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[13px] leading-tight text-foreground">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground">{formatTime(n.timestamp)}</p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
