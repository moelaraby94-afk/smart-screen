import { apiFetch } from '@/features/auth/session';
import { readPage, readPageItems } from '@/features/api/page';

export type MediaItem = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  publicUrl: string;
  createdAt: string;
  workspaceId?: string;
  workspaceName?: string;
  folderId?: string | null;
  folderName?: string | null;
};

export type MediaFolder = {
  id: string;
  name: string;
  createdAt: string;
  _count: { medias: number };
};

export async function fetchMedia(workspaceId?: string): Promise<MediaItem[]> {
  const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const res = await apiFetch(`/media${qs}`);
  if (!res.ok) return [];
  return readPageItems<MediaItem>(res);
}

export async function fetchMediaPage(
  workspaceId: string | undefined,
  page: number,
  limit = 24,
): Promise<{ items: MediaItem[]; total: number; totalPages: number }> {
  const wsQs = workspaceId ? `workspaceId=${encodeURIComponent(workspaceId)}&` : '';
  const res = await apiFetch(
    `/media?${wsQs}page=${page}&limit=${limit}`,
  );
  if (!res.ok) return { items: [], total: 0, totalPages: 0 };
  const data = await readPage<MediaItem>(res);
  return { items: data.items, total: data.total, totalPages: data.totalPages };
}

export async function fetchMediaFolders(workspaceId?: string): Promise<MediaFolder[]> {
  const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const res = await apiFetch(`/media/folders/list${qs}`);
  if (!res.ok) return [];
  return readPageItems<MediaFolder>(res);
}

export async function uploadMedia(
  workspaceId: string | null,
  file: File,
  folderId?: string,
): Promise<Response> {
  const form = new FormData();
  form.append('file', file);
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (folderId) params.set('folderId', folderId);
  const qs = params.toString();
  return apiFetch(
    `/media/upload${qs ? `?${qs}` : ''}`,
    { method: 'POST', body: form },
  );
}

export async function deleteMedia(
  workspaceId: string,
  mediaId: string,
): Promise<Response> {
  return apiFetch(`/media/${encodeURIComponent(mediaId)}?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'DELETE',
  });
}

export async function createFolder(
  workspaceId: string | null,
  name: string,
): Promise<Response> {
  const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch(`/media/folders${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function renameFolder(
  workspaceId: string | null,
  folderId: string,
  name: string,
): Promise<Response> {
  const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch(
    `/media/folders/${encodeURIComponent(folderId)}${qs}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) },
  );
}

export async function deleteFolder(
  workspaceId: string | null,
  folderId: string,
): Promise<Response> {
  const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch(
    `/media/folders/${encodeURIComponent(folderId)}${qs}`,
    { method: 'DELETE' },
  );
}

export async function moveMediaToFolder(
  workspaceId: string,
  mediaId: string,
  folderId: string | null,
): Promise<Response> {
  return apiFetch(
    `/media/${encodeURIComponent(mediaId)}/folder?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    },
  );
}

export async function seedDemoContent(workspaceId: string): Promise<Response> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/seed-demo`, {
    method: 'POST',
  });
}
