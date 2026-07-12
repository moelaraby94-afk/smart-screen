import { apiFetch } from '@/features/auth/session';

export type AuditLogRow = {
  id: string;
  action: string;
  actorName: string;
  ipAddress: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export async function fetchAuditLog(workspaceId: string): Promise<{ items: AuditLogRow[] }> {
  const res = await apiFetch(`/audit-log?workspaceId=${encodeURIComponent(workspaceId)}`);
  if (!res.ok) return { items: [] };
  return res.json();
}
