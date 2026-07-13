import { apiFetch } from '@/features/auth/session';

// ─── Prayer Times ─────────────────────────────────────────────────
export async function fetchPrayerTimes(workspaceId: string): Promise<Response> {
  return apiFetch(`/islamic/prayer-times?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function fetchPrayerConfig(workspaceId: string): Promise<Response> {
  return apiFetch(`/islamic/prayer-config?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function updatePrayerConfig(
  workspaceId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/islamic/prayer-config?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchPrayerPauseStatus(workspaceId: string): Promise<Response> {
  return apiFetch(`/islamic/prayer-pause-status?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function fetchHijriDate(workspaceId: string): Promise<Response> {
  return apiFetch(`/islamic/hijri-date?workspaceId=${encodeURIComponent(workspaceId)}`);
}

// ─── Ramadan Mode ─────────────────────────────────────────────────
export async function fetchRamadanConfig(workspaceId: string): Promise<Response> {
  return apiFetch(`/islamic/ramadan-config?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function updateRamadanConfig(
  workspaceId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/islamic/ramadan-config?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchRamadanStatus(workspaceId: string): Promise<Response> {
  return apiFetch(`/islamic/ramadan-status?workspaceId=${encodeURIComponent(workspaceId)}`);
}
