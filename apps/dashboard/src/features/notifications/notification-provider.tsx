'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Monitor, Upload, AlertTriangle, Bell } from 'lucide-react';
import { getStoredAccessToken } from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function getRealtimeBaseUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4000';
}

type ScreenStatusPayload = {
  screenId: string;
  serialNumber: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastSeenAt: string;
  isOfflineCacheMode?: boolean;
};

export type NotificationItem = {
  id: string;
  type: 'screen_offline' | 'screen_online' | 'upload_complete';
  message: string;
  timestamp: number;
  read: boolean;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { notifications: [], unreadCount: 0, markAllRead: () => {} };
  return ctx;
}

const MAX_NOTIFICATIONS = 30;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('notifications');
  const { workspaceId, isAuthenticated } = useWorkspace();
  const socketRef = useRef<Socket | null>(null);
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    setNotifications((prev) => {
      const next: NotificationItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        read: false,
      };
      return [next, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !workspaceId) return;

    const token = getStoredAccessToken();
    const socket = io(`${getRealtimeBaseUrl()}/realtime`, {
      path: '/socket.io',
      withCredentials: true,
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('dashboard:subscribe', { workspaceId });
    });

    socket.on('screen:status', (payload: ScreenStatusPayload) => {
      const prev = prevStatusRef.current.get(payload.screenId);
      if (prev && prev !== payload.status) {
        if (payload.status === 'OFFLINE') {
          toast.warning(t('screenOffline', { serial: payload.serialNumber }), {
            icon: <AlertTriangle className="h-4 w-4" />,
          });
          addNotification({
            type: 'screen_offline',
            message: t('screenOffline', { serial: payload.serialNumber }),
          });
        } else if (payload.status === 'ONLINE') {
          toast.success(t('screenOnline', { serial: payload.serialNumber }), {
            icon: <Monitor className="h-4 w-4" />,
          });
          addNotification({
            type: 'screen_online',
            message: t('screenOnline', { serial: payload.serialNumber }),
          });
        }
      }
      prevStatusRef.current.set(payload.screenId, payload.status);
    });

    socket.on('upload:complete', (payload: { fileName?: string }) => {
      toast.success(t('uploadComplete', { name: payload.fileName ?? '' }), {
        icon: <Upload className="h-4 w-4" />,
      });
      addNotification({
        type: 'upload_complete',
        message: t('uploadComplete', { name: payload.fileName ?? '' }),
      });
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') socket.connect();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, isAuthenticated, t, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationBell() {
  const t = useTranslations('notifications');
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return t('justNow');
    if (diff < 3_600_000) return t('minutesAgo', { n: Math.floor(diff / 60_000) });
    if (diff < 86_400_000) return t('hoursAgo', { n: Math.floor(diff / 3_600_000) });
    return new Date(ts).toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
          aria-label={t('bellLabel')}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
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
              className="text-[10px] font-semibold text-primary hover:underline"
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
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex items-start gap-2 py-2.5"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  n.type === 'screen_offline' && 'bg-amber-500/15 text-amber-600',
                  n.type === 'screen_online' && 'bg-emerald-500/15 text-emerald-600',
                  n.type === 'upload_complete' && 'bg-blue-500/15 text-blue-600',
                )}
              >
                {n.type === 'screen_offline' && <AlertTriangle className="h-3.5 w-3.5" />}
                {n.type === 'screen_online' && <Monitor className="h-3.5 w-3.5" />}
                {n.type === 'upload_complete' && <Upload className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[13px] leading-tight text-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(n.timestamp)}</p>
              </div>
              {!n.read && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
