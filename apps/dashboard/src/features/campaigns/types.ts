export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'ENDED';

export type CampaignHistoryEntry = {
  id: string;
  campaignId: string;
  actorId: string;
  action: string;
  fromStatus: CampaignStatus;
  toStatus: CampaignStatus;
  comment: string | null;
  createdAt: string;
};

export type Campaign = {
  id: string;
  workspaceId: string;
  createdById: string;
  approvedById: string | null;
  name: string;
  description: string | null;
  playlistId: string | null;
  screenId: string | null;
  status: CampaignStatus;
  reviewComment: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string } | null;
  approvedBy: { id: string; fullName: string } | null;
  playlist: { id: string; name: string } | null;
  screen: { id: string; name: string } | null;
  history?: CampaignHistoryEntry[];
};

export type CampaignFormData = {
  name: string;
  description?: string;
  playlistId?: string;
  screenId?: string;
  startDate?: string;
  endDate?: string;
};
