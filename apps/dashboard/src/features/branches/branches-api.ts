import { apiFetch } from '@/features/auth/session';

export async function fetchBranchPlaylists(workspaceId: string): Promise<Response> {
  return apiFetch(`/playlists?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createBranchPlaylist(
  workspaceId: string,
  name: string,
): Promise<Response> {
  return apiFetch('/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, name }),
  });
}

export async function createBranchScreen(
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch('/screens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteBranchScreen(
  workspaceId: string,
  screenId: string,
): Promise<Response> {
  return apiFetch(
    `/screens/${encodeURIComponent(screenId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function fetchPlaylistDetail(
  workspaceId: string,
  playlistId: string,
): Promise<Response> {
  return apiFetch(
    `/playlists/${encodeURIComponent(playlistId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}
