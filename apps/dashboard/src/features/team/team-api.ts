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

export async function fetchInvites(workspaceId: string): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}/invites`);
}

export async function cancelInvite(
  workspaceId: string,
  inviteId: string,
): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}/invites/${inviteId}`, {
    method: 'DELETE',
  });
}

export async function resendInvite(
  workspaceId: string,
  inviteId: string,
): Promise<Response> {
  return apiFetch(`/workspaces/${workspaceId}/invites/${inviteId}/resend`, {
    method: 'POST',
  });
}

export async function updateMemberRole(
  workspaceId: string,
  membershipId: string,
  role: string,
): Promise<Response> {
  return apiFetch(
    `/workspaces/${workspaceId}/members/${membershipId}/role`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeMember(
  workspaceId: string,
  membershipId: string,
): Promise<Response> {
  return apiFetch(
    `/workspaces/${workspaceId}/members/${membershipId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function acceptInvite(token: string): Promise<Response> {
  return apiFetch('/workspaces/invites/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

// ─── Account-level member management ──────────────────────────────

export async function fetchAccountMembers(): Promise<Response> {
  return apiFetch('/workspaces/account/members');
}

export async function fetchAccountWorkspaces(): Promise<Response> {
  return apiFetch('/workspaces/account/workspaces');
}

export async function createAccountMember(dto: {
  email: string;
  fullName: string;
  password: string;
  role: string;
  phone?: string;
  country?: string;
  city?: string;
  workspaceScopes?: Array<{ workspaceId: string; role: string }>;
}): Promise<Response> {
  return apiFetch('/workspaces/account/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export async function addAccountMember(
  userId: string,
  role: string,
  workspaceScopes?: Array<{ workspaceId: string; role: string }>,
): Promise<Response> {
  return apiFetch('/workspaces/account/members/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role, workspaceScopes }),
  });
}

export async function updateAccountMemberRole(
  membershipId: string,
  role: string,
): Promise<Response> {
  return apiFetch(
    `/workspaces/account/members/${membershipId}/role`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeAccountMember(membershipId: string): Promise<Response> {
  return apiFetch(
    `/workspaces/account/members/${membershipId}`,
    { method: 'DELETE' },
  );
}
