export const PlatformEvents = {
  PAIRING_STARTED: 'pairing.started',
  PAIRING_SESSION_COMPLETE: 'pairing.session.complete',
  CONTENT_SYNC: 'content.sync',
  SCHEDULE_CHANGED: 'schedule.changed',
  WORKSPACE_SUBSCRIPTION_UPDATED: 'workspace.subscription.updated',
  PLAYER_TICKER: 'player.ticker',
  REMOTE_COMMAND: 'remote.command',
  CANVAS_LIVE: 'canvas.live',
  UPLOAD_COMPLETE: 'upload.complete',
  CAMPAIGN_PUBLISHED: 'campaign.published',
  NOTIFICATION_CREATED: 'notification.created',
} as const;

export type PairingStartedPayload = {
  workspaceId: string;
  payload: Record<string, unknown>;
};

export type PairingSessionCompletePayload = {
  sessionId: string;
  payload: Record<string, unknown>;
};

export type ContentSyncPayload = {
  screenId: string;
  payload: Record<string, unknown>;
};

export type ScheduleChangedPayload = {
  screenId: string;
  payload: Record<string, unknown>;
};

export type WorkspaceSubscriptionUpdatedPayload = {
  workspaceId: string;
  payload: Record<string, unknown>;
};

export type PlayerTickerPayload = {
  screenId: string;
  text: string | null;
};

export type RemoteCommandPayload = {
  screenId: string;
  payload: Record<string, unknown>;
};

export type CanvasLivePayload = {
  screenId: string;
  payload: Record<string, unknown>;
};

export type UploadCompletePayload = {
  workspaceId: string;
  payload: { fileName: string };
};

export type CampaignPublishedPayload = {
  workspaceId: string;
  campaignId: string;
};

export type NotificationCreatedPayload = {
  userId: string;
  notification: unknown;
};
