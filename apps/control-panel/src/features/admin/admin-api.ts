import { apiFetch } from '@/features/auth/session';

export async function fetchAdminStats(): Promise<Response> {
  return apiFetch('/admin/stats');
}

export async function fetchAdminWorkspaces(): Promise<Response> {
  return apiFetch('/admin/workspaces');
}

export async function mockWorkspacePlan(
  workspaceId: string,
  plan: string,
): Promise<Response> {
  return apiFetch(`/admin/workspaces/${workspaceId}/subscription-mock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
}

export async function updateAdminUser(
  userId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function impersonateUser(
  userId: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/admin/users/${userId}/impersonate`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export async function exitImpersonation(): Promise<Response> {
  return apiFetch('/auth/exit-impersonation', { method: 'POST' });
}

export async function fetchAdminStaff(): Promise<Response> {
  return apiFetch('/admin/staff');
}

export async function updateStaffRole(
  userId: string,
  role: string,
): Promise<Response> {
  return apiFetch(`/admin/staff/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ adminRole: role }),
  });
}

export async function createStaff(data: Record<string, unknown>): Promise<Response> {
  return apiFetch('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchAdminSettings(): Promise<Response> {
  return apiFetch('/admin/settings');
}

export async function updateAdminSettings(
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadBrandingImage(
  variant: string,
  file: File,
): Promise<Response> {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch(
    `/admin/settings/branding/upload?variant=${encodeURIComponent(variant)}`,
    { method: 'POST', body: fd },
  );
}

export async function fetchAdminScreens(): Promise<Response> {
  return apiFetch('/admin/screens');
}

export async function fetchAdminFleetScreens(): Promise<Response> {
  return apiFetch('/admin/fleet/screens');
}

export async function fetchAdminLogs(): Promise<Response> {
  return apiFetch('/admin/logs');
}

export async function fetchAdminCustomers(q?: string): Promise<Response> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch(`/admin/customers${qs}`);
}

export async function fetchAdminCustomer(customerId: string): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}`);
}

export async function updateCustomerSubscription(
  customerId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}/subscription`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function sendCustomerReminder(
  customerId: string,
): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}/reminder`, {
    method: 'POST',
  });
}

export async function fetchCustomerWorkspace(
  customerId: string,
  workspaceId: string,
): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}/workspaces/${workspaceId}`);
}

export async function createCustomerWorkspace(
  customerId: string,
  name: string,
): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}/workspaces`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateCustomerWorkspace(
  customerId: string,
  workspaceId: string,
  data: Record<string, unknown>,
): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomerWorkspace(
  customerId: string,
  workspaceId: string,
): Promise<Response> {
  return apiFetch(`/admin/customers/${customerId}/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });
}
