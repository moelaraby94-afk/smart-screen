import { apiFetch } from '@/features/auth/session';

// ─── Billing / Subscriptions ──────────────────────────────────────
export async function fetchCurrentSubscription(workspaceId: string): Promise<Response> {
  return apiFetch(`/subscriptions/current?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function setMockPlan(workspaceId: string, plan: string): Promise<Response> {
  return apiFetch(`/subscriptions/mock-plan?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

export async function createStripePortal(workspaceId: string, locale: string): Promise<Response> {
  return apiFetch('/stripe/portal', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, locale }),
  });
}

export async function createStripeCheckout(workspaceId: string, plan: string): Promise<Response> {
  return apiFetch('/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, plan }),
  });
}

// ─── Account ──────────────────────────────────────────────────────
export async function fetchAccountBilling(): Promise<Response> {
  return apiFetch('/account/billing');
}

export async function updateProfile(data: Record<string, unknown>): Promise<Response> {
  return apiFetch('/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function requestEmailChange(newEmail: string): Promise<Response> {
  return apiFetch('/account/email/request', {
    method: 'POST',
    body: JSON.stringify({ newEmail }),
  });
}

export async function verifyEmailChange(newEmail: string, code: string): Promise<Response> {
  return apiFetch('/account/email/verify', {
    method: 'POST',
    body: JSON.stringify({ newEmail, code }),
  });
}
