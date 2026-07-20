import { apiFetch } from '@/features/auth/session';

export async function fetchCurrentUser(): Promise<Response> {
  return apiFetch('/auth/me', { method: 'GET' });
}

export async function createWorkspace(name: string): Promise<Response> {
  return apiFetch('/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function bootstrapDemoWorkspace(): Promise<Response> {
  return apiFetch('/workspaces/bootstrap-demo', { method: 'POST' });
}

export async function seedDemoContent(workspaceId: string): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}/seed-demo`, { method: 'POST' });
}

export async function fetchWorkspaceDetails(workspaceId: string): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}`, { method: 'GET' });
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; isPaused?: boolean; timezone?: string; defaultLocale?: string },
): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
