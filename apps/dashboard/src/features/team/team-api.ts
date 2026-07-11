import { apiFetch } from '@/features/auth/session';

export async function fetchMembers(workspaceId: string): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}/members`);
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: string,
): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
}
