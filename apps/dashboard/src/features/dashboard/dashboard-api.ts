import { apiFetch } from '@/features/auth/session';
import { readPage } from '@/features/api/page';

export async function fetchAccountInsights(): Promise<Response> {
  return apiFetch('/account/insights');
}

export async function updateWorkspace(
  workspaceId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteWorkspace(workspaceId: string): Promise<Response> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: 'DELETE',
  });
}

export async function fetchMediaStats(workspaceId: string): Promise<Response> {
  return apiFetch(`/media/stats?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function fetchScreenCount(workspaceId: string): Promise<number> {
  const res = await apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}&page=1&limit=1`);
  if (!res.ok) return 0;
  return (await readPage(res)).total;
}
