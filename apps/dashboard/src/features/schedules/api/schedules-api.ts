import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';

export type ScheduleRow = {
  id: string;
  screenId: string | null;
  playlist: { id: string; name: string };
};

export async function fetchSchedules(workspaceId: string): Promise<ScheduleRow[]> {
  const res = await apiFetch(`/schedules?workspaceId=${encodeURIComponent(workspaceId)}`);
  if (!res.ok) return [];
  return readPageItems<ScheduleRow>(res);
}

export async function updateSchedule(
  workspaceId: string,
  scheduleId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(
    `/schedules/${encodeURIComponent(scheduleId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export async function createSchedule(
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch('/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(
  workspaceId: string,
  scheduleId: string,
): Promise<Response> {
  return apiFetch(
    `/schedules/${encodeURIComponent(scheduleId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function fetchScheduleOverlaps(
  workspaceId: string,
): Promise<{ pairs: Array<[string, string]> }> {
  const res = await apiFetch(`/schedules/overlaps?workspaceId=${encodeURIComponent(workspaceId)}`);
  if (!res.ok) return { pairs: [] };
  return res.json();
}

export async function setScreenOverride(
  workspaceId: string,
  screenId: string,
  data: { playlistId: string; durationMinutes: number },
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
