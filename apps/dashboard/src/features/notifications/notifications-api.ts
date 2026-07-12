import { apiFetch } from '@/features/auth/session';

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export async function fetchNotifications(): Promise<{ items: NotificationRow[]; unreadCount: number }> {
  const res = await apiFetch('/notifications');
  if (!res.ok) return { items: [], unreadCount: 0 };
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/notifications/mark-all-read', { method: 'POST' });
}
