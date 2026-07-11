import { apiFetch } from '@/features/auth/session';

export async function fetchCanvases(workspaceId: string): Promise<Response> {
  return apiFetch(`/canvases?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function fetchCanvas(workspaceId: string, id: string): Promise<Response> {
  return apiFetch(`/canvases/${id}?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function updateCanvas(
  workspaceId: string,
  canvasId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(
    `/canvases/${canvasId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export async function createCanvas(
  workspaceId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(
    `/canvases?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

// ─── Playlists ────────────────────────────────────────────────────
export async function fetchPlaylists(workspaceId: string): Promise<Response> {
  return apiFetch(`/playlists?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function fetchPlaylistDetail(
  workspaceId: string,
  id: string,
): Promise<Response> {
  return apiFetch(
    `/playlists/${id}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function createPlaylist(
  workspaceId: string,
  name: string,
): Promise<Response> {
  return apiFetch('/playlists', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, name }),
  });
}

export async function updatePlaylistItems(
  workspaceId: string,
  playlistId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(
    `/playlists/${playlistId}/items?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}
