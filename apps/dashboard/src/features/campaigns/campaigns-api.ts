import { apiFetch } from '@/features/auth/session';

export async function fetchCampaigns(
  workspaceId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function fetchCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function createCampaign(
  data: {
    workspaceId: string;
    name: string;
    description?: string;
    playlistId?: string;
    screenId?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<Response> {
  return apiFetch('/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(
  workspaceId: string,
  campaignId: string,
  data: {
    name?: string;
    description?: string;
    playlistId?: string | null;
    screenId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  },
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export async function deleteCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'DELETE' },
  );
}

export async function submitCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/submit?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}

export async function approveCampaign(
  workspaceId: string,
  campaignId: string,
  comment?: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/approve?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: comment ?? undefined }),
    },
  );
}

export async function rejectCampaign(
  workspaceId: string,
  campaignId: string,
  comment?: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/reject?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: comment ?? undefined }),
    },
  );
}

export async function publishCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/publish?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}

export async function pauseCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/pause?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}

export async function resumeCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/resume?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}

export async function endCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<Response> {
  return apiFetch(
    `/campaigns/${encodeURIComponent(campaignId)}/end?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'POST' },
  );
}
