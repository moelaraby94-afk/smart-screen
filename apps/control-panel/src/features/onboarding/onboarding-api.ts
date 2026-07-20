import { apiFetch } from '@/features/auth/session';

export async function fetchOnboardingProgress(workspaceId: string): Promise<Response> {
  return apiFetch(`/onboarding?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function completeOnboardingStep(
  workspaceId: string,
  step: string,
): Promise<Response> {
  return apiFetch(`/onboarding/complete-step?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step }),
  });
}

export async function dismissOnboarding(workspaceId: string): Promise<Response> {
  return apiFetch(`/onboarding/dismiss?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
  });
}

export async function resetOnboarding(workspaceId: string): Promise<Response> {
  return apiFetch(`/onboarding/reset?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'POST',
  });
}

export async function fetchAllFeatureFlags(): Promise<Response> {
  return apiFetch('/admin/feature-flags');
}

export async function fetchWorkspaceFeatureFlags(workspaceId: string): Promise<Response> {
  return apiFetch(`/admin/feature-flags/${encodeURIComponent(workspaceId)}`);
}

export async function setFeatureFlag(
  workspaceId: string,
  module: string,
  enabled: boolean,
): Promise<Response> {
  return apiFetch(`/admin/feature-flags/${encodeURIComponent(workspaceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module, enabled }),
  });
}
