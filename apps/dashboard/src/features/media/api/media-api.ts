import { apiFetch } from '@/features/auth/session';
import { readPage, readPageItems } from '@/features/api/page';

export type MediaItem = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
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

export async function fetchMedia(workspaceId: string): Promise<MediaItem[]> {
  const res = await apiFetch(`/media?workspaceId=${encodeURIComponent(workspaceId)}`);
  if (!res.ok) return [];
  return readPageItems<MediaItem>(res);
}

export async function fetchMediaPage(
  workspaceId: string,
  page: number,
  limit = 24,
): Promise<{ items: MediaItem[]; total: number; totalPages: number }> {
  const res = await apiFetch(
    `/media?workspaceId=${encodeURIComponent(workspaceId)}&page=${page}&limit=${limit}`,
  );
  if (!res.ok) return { items: [], total: 0, totalPages: 0 };
  const data = await readPage<MediaItem>(res);
  return { items: data.items, total: data.total, totalPages: data.totalPages };
}

export async function fetchMediaFolders(workspaceId: string): Promise<MediaFolder[]> {
  const res = await apiFetch(`/media/folders/list?workspaceId=${encodeURIComponent(workspaceId)}`);
  if (!res.ok) return [];
  return readPageItems<MediaFolder>(res);
}

export async function uploadMedia(
  workspaceId: string,
  file: File,
  folderId?: string,
): Promise<Response> {
  const form = new FormData();
  form.append('file', file);
  const folderQ = folderId ? `&folderId=${encodeURIComponent(folderId)}` : '';
  return apiFetch(
    `/media/upload?workspaceId=${encodeURIComponent(workspaceId)}${folderQ}`,
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
  workspaceId: string,
  name: string,
): Promise<Response> {
  return apiFetch(`/media/folders?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function renameFolder(
  workspaceId: string,
  folderId: string,
  name: string,
): Promise<Response> {
  return apiFetch(
    `/media/folders/${encodeURIComponent(folderId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'PATCH', body: JSON.stringify({ name }) },
  );
}

export async function deleteFolder(
  workspaceId: string,
  folderId: string,
): Promise<Response> {
  return apiFetch(
    `/media/folders/${encodeURIComponent(folderId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
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
