import { apiFetch } from '@/features/auth/session';

// ─── API Keys ─────────────────────────────────────────────────────
export async function fetchApiKeys(workspaceId: string): Promise<Response> {
  return apiFetch(`/api-keys?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createApiKey(
  workspaceId: string,
  name: string,
  scopes: string,
): Promise<Response> {
  return apiFetch(`/api-keys?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'POST',
    body: JSON.stringify({ name, scopes }),
  });
}

export async function revokeApiKey(
  workspaceId: string,
  keyId: string,
): Promise<Response> {
  return apiFetch(
    `/api-keys/${encodeURIComponent(keyId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

// ─── Webhooks ─────────────────────────────────────────────────────
export async function fetchWebhooks(workspaceId: string): Promise<Response> {
  return apiFetch(`/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createWebhook(
  workspaceId: string,
  url: string,
  events: string,
): Promise<Response> {
  return apiFetch(`/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'POST',
    body: JSON.stringify({ url, events }),
  });
}

export async function deleteWebhook(
  workspaceId: string,
  endpointId: string,
): Promise<Response> {
  return apiFetch(
    `/webhooks/${encodeURIComponent(endpointId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function toggleWebhook(
  workspaceId: string,
  endpointId: string,
  enabled: boolean,
): Promise<Response> {
  return apiFetch(
    `/webhooks/${encodeURIComponent(endpointId)}/toggle?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    },
  );
}

export async function testWebhook(
  workspaceId: string,
  endpointId: string,
): Promise<Response> {
  return apiFetch(
    `/webhooks/${encodeURIComponent(endpointId)}/test?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}
