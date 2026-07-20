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

export async function fetchCanvasVersions(
  workspaceId: string,
  canvasId: string,
): Promise<Response> {
  return apiFetch(
    `/canvases/${canvasId}/versions?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function restoreCanvasVersion(
  workspaceId: string,
  canvasId: string,
  versionId: string,
): Promise<Response> {
  return apiFetch(
    `/canvases/${canvasId}/restore/${versionId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}

export async function deleteCanvas(
  workspaceId: string,
  canvasId: string,
): Promise<Response> {
  return apiFetch(
    `/canvases/${canvasId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

// ─── Playlists ────────────────────────────────────────────────────
export async function fetchPlaylists(workspaceId?: string, groupId?: string): Promise<Response> {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (groupId) params.set('groupId', groupId);
  const qs = params.toString();
  return apiFetch(`/playlists${qs ? `?${qs}` : ''}`);
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
  workspaceId: string | null,
  name: string,
  groupId?: string | null,
): Promise<Response> {
  return apiFetch('/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId: workspaceId ?? undefined, name, groupId: groupId ?? undefined }),
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

export async function updatePlaylistMeta(
  workspaceId: string,
  playlistId: string,
  data: { name?: string; isPublished?: boolean },
): Promise<Response> {
  return apiFetch(
    `/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

// ─── Playlist Groups (account-level) ──────────────────────────────
export async function fetchPlaylistGroups(): Promise<Response> {
  return apiFetch('/playlists/groups');
}

export async function createPlaylistGroup(name: string, parentGroupId?: string | null): Promise<Response> {
  return apiFetch('/playlists/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parentGroupId: parentGroupId ?? null }),
  });
}

export async function renamePlaylistGroup(groupId: string, name: string): Promise<Response> {
  return apiFetch(`/playlists/groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function movePlaylistGroup(groupId: string, newParentId: string | null): Promise<Response> {
  return apiFetch(`/playlists/groups/${groupId}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newParentId }),
  });
}

export async function deletePlaylistGroup(groupId: string): Promise<Response> {
  return apiFetch(`/playlists/groups/${groupId}`, {
    method: 'DELETE',
  });
}
