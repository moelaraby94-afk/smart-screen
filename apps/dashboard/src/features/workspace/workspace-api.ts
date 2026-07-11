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
