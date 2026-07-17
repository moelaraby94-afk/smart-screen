import type { CampaignStatus } from './types';

export const STATUS_BADGE_VARIANT: Record<
  CampaignStatus,
  'muted' | 'warning' | 'success' | 'destructive'
> = {
  DRAFT: 'muted',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  PUBLISHED: 'success',
  PAUSED: 'warning',
  ENDED: 'muted',
};

export type CampaignAction =
  | 'edit'
  | 'submit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'pause'
  | 'resume'
  | 'end';

export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export function getAvailableActions(
  status: CampaignStatus,
  role: Role,
): CampaignAction[] {
  const canApprove = role === 'OWNER' || role === 'ADMIN';
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';

  if (!canManage) return [];

  switch (status) {
    case 'DRAFT':
      return ['edit', 'submit', 'delete'];
    case 'PENDING_APPROVAL':
      return canApprove ? ['approve', 'reject'] : [];
    case 'APPROVED':
      return ['publish', 'delete'];
    case 'REJECTED':
      return ['edit', 'delete'];
    case 'PUBLISHED':
      return ['pause', 'end'];
    case 'PAUSED':
      return ['resume', 'end'];
    case 'ENDED':
      return ['delete'];
    default:
      return [];
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
