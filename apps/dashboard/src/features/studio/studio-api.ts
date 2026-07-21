import { apiFetch } from '@/features/auth/session';

// ─── Canvas CRUD ────────────────────────────────────────────────────
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
