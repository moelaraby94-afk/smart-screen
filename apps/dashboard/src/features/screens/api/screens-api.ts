import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
import type { ScreenRow } from '../useApiScreens';

export type PlaylistOption = {
  id: string;
  name: string;
  isPublished: boolean;
};

export type ScreenUpdateInput = {
  name?: string;
  location?: string | null;
  status?: string;
  activePlaylistId?: string | null;
  playerTicker?: string | null;
  playlistGroupId?: string | null;
  playerPlatform?: string;
  resolutionWidth?: number;
  resolutionHeight?: number;
  orientation?: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
};

export type RemoteCommand = 'identify' | 'refresh_content' | 'restart';

export async function fetchScreenById(
  workspaceId: string,
  screenId: string,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function fetchScreens(
  workspaceId: string,
  opts?: { playlistGroupId?: string },
): Promise<ScreenRow[]> {
  const params = new URLSearchParams({
    workspaceId,
    limit: '500',
    page: '1',
  });
  if (opts?.playlistGroupId) params.set('playlistGroupId', opts.playlistGroupId);
  const res = await apiFetch(`/screens?${params.toString()}`, { method: 'GET' });
  if (!res.ok) return [];
  const payload = (await res.json()) as ScreenRow[] | { items: ScreenRow[] };
  const items = Array.isArray(payload) ? payload : payload.items;
  return Array.isArray(items) ? items : [];
}

export async function fetchPlaylistOptions(
  workspaceId: string,
): Promise<PlaylistOption[]> {
  const res = await apiFetch(
    `/playlists?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  if (!res.ok) return [];
  return readPageItems<PlaylistOption>(res);
}

export async function createScreen(
  workspaceId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch('/screens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, ...data }),
  });
}

export async function updateScreen(
  workspaceId: string,
  screenId: string,
  data: ScreenUpdateInput,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export async function deleteScreen(
  workspaceId: string,
  screenId: string,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function sendRemoteCommand(
  workspaceId: string,
  screenId: string,
  command: RemoteCommand,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/remote-command?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    },
  );
}

export type PerScreenAnalytics = {
  id: string;
  name: string;
  serialNumber: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  location: string | null;
  lastSeenAt: string | null;
  activePlaylist: string | null;
  isOfflineCacheMode: boolean;
  uptimeSec: number;
};

export type PlaylistDistributionItem = {
  id: string;
  name: string;
  count: number;
};

export type HourlyActivityItem = {
  hour: number;
  count: number;
};

export type ScreenAnalytics = {
  total: number;
  byStatus: { ONLINE: number; OFFLINE: number; MAINTENANCE: number };
  uptimePercent: number;
  withPlaylist: number;
  withoutPlaylist: number;
  newestSeen: string | null;
  oldestSeen: string | null;
  perScreen: PerScreenAnalytics[];
  playlistDistribution: PlaylistDistributionItem[];
  hourlyActivity: HourlyActivityItem[];
  peakHours: HourlyActivityItem[];
};

export async function fetchScreenAnalytics(
  workspaceId: string,
): Promise<ScreenAnalytics | null> {
  const res = await apiFetch(
    `/screens/analytics?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  if (!res.ok) return null;
  return (await res.json()) as ScreenAnalytics;
}
