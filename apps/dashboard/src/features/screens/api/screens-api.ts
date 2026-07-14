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

export type ContentRemoteCommand = 'identify' | 'refresh_content';

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

export async function setScreenOverride(
  workspaceId: string,
  screenId: string,
  data: { playlistId: string | null; durationMinutes?: number },
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/override?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

// ─── Playlist Assignments ───

export type PlaylistAssignment = {
  id: string;
  screenId: string;
  playlistId: string;
  orderIndex: number;
  playlist: { id: string; name: string; isPublished: boolean };
};

export async function fetchAssignments(
  workspaceId: string,
  screenId: string,
): Promise<PlaylistAssignment[]> {
  const res = await apiFetch(
    `/screens/${encodeURIComponent(screenId)}/assignments?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  if (!res.ok) return [];
  return (await res.json()) as PlaylistAssignment[];
}

export async function addAssignment(
  workspaceId: string,
  screenId: string,
  playlistId: string,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/assignments?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlistId }),
    },
  );
}

export async function removeAssignment(
  workspaceId: string,
  screenId: string,
  assignmentId: string,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/assignments/${encodeURIComponent(assignmentId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function reorderAssignments(
  workspaceId: string,
  screenId: string,
  items: { id: string; orderIndex: number }[],
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/assignments/reorder?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );
}

// ─── Override Rules ───

export type OverrideRule = {
  id: string;
  workspaceId: string;
  screenId: string;
  playlistId: string;
  recurrence: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  daysOfWeek: number[];
  daysOfMonth: number[];
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  enabled: boolean;
  createdAt: string;
  playlist: { id: string; name: string };
};

export type OverrideConflict = {
  ruleId: string;
  playlistName: string;
  reason: string;
};

export async function fetchOverrideRules(
  workspaceId: string,
  screenId: string,
): Promise<OverrideRule[]> {
  const res = await apiFetch(
    `/screens/${encodeURIComponent(screenId)}/override-rules?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  if (!res.ok) return [];
  return (await res.json()) as OverrideRule[];
}

export async function createOverrideRule(
  workspaceId: string,
  screenId: string,
  data: {
    playlistId: string;
    recurrence: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    startDate?: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    enabled?: boolean;
  },
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/override-rules?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export async function updateOverrideRule(
  workspaceId: string,
  screenId: string,
  ruleId: string,
  data: Partial<{
    playlistId: string;
    recurrence: string;
    daysOfWeek: number[];
    daysOfMonth: number[];
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/override-rules/${encodeURIComponent(ruleId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export async function deleteOverrideRule(
  workspaceId: string,
  screenId: string,
  ruleId: string,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}/override-rules/${encodeURIComponent(ruleId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function checkOverrideConflicts(
  workspaceId: string,
  screenId: string,
  data: {
    playlistId: string;
    recurrence: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    startDate?: string;
    endDate?: string;
    startTime: string;
    endTime: string;
  },
): Promise<OverrideConflict[]> {
  const res = await apiFetch(
    `/screens/${encodeURIComponent(screenId)}/override-rules/check-conflicts?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) return [];
  return (await res.json()) as OverrideConflict[];
}
