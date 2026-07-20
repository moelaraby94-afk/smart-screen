import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ScreenHeartbeatService } from './screen-heartbeat.service';
import { RealtimeGateway } from './realtime.gateway';
import {
  PlatformEvents,
  type PairingStartedPayload,
  type PairingSessionCompletePayload,
  type ContentSyncPayload,
  type ScheduleChangedPayload,
  type WorkspaceSubscriptionUpdatedPayload,
  type PlayerTickerPayload,
  type RemoteCommandPayload,
  type CanvasLivePayload,
  type UploadCompletePayload,
  type CampaignPublishedPayload,
  type NotificationCreatedPayload,
} from '../../common/events/platform-events';

@Injectable()
export class RealtimeEventBridge {
  private readonly logger = new Logger(RealtimeEventBridge.name);

  constructor(
    private readonly heartbeat: ScreenHeartbeatService,
    private readonly gateway: RealtimeGateway,
  ) {}

  @OnEvent(PlatformEvents.PAIRING_STARTED)
  handlePairingStarted(payload: PairingStartedPayload): void {
    this.heartbeat.emitPairingStarted(payload.workspaceId, payload.payload);
  }

  @OnEvent(PlatformEvents.PAIRING_SESSION_COMPLETE)
  handlePairingSessionComplete(payload: PairingSessionCompletePayload): void {
    this.heartbeat.emitPairingSessionComplete(
      payload.sessionId,
      payload.payload,
    );
  }

  @OnEvent(PlatformEvents.CONTENT_SYNC)
  handleContentSync(payload: ContentSyncPayload): void {
    this.heartbeat.emitContentSync(payload.screenId, payload.payload);
  }

  @OnEvent(PlatformEvents.SCHEDULE_CHANGED)
  handleScheduleChanged(payload: ScheduleChangedPayload): void {
    this.heartbeat.emitScheduleChanged(payload.screenId, payload.payload);
  }

  @OnEvent(PlatformEvents.WORKSPACE_SUBSCRIPTION_UPDATED)
  handleWorkspaceSubscriptionUpdated(
    payload: WorkspaceSubscriptionUpdatedPayload,
  ): void {
    this.heartbeat.emitWorkspaceSubscriptionUpdated(
      payload.workspaceId,
      payload.payload,
    );
  }

  @OnEvent(PlatformEvents.PLAYER_TICKER)
  handlePlayerTicker(payload: PlayerTickerPayload): void {
    this.heartbeat.emitPlayerTicker(payload.screenId, payload.text);
  }

  @OnEvent(PlatformEvents.REMOTE_COMMAND)
  handleRemoteCommand(payload: RemoteCommandPayload): void {
    this.heartbeat.emitRemoteCommand(payload.screenId, payload.payload);
  }

  @OnEvent(PlatformEvents.CANVAS_LIVE)
  handleCanvasLive(payload: CanvasLivePayload): void {
    this.heartbeat.emitCanvasLive(payload.screenId, payload.payload);
  }

  @OnEvent(PlatformEvents.UPLOAD_COMPLETE)
  handleUploadComplete(payload: UploadCompletePayload): void {
    this.heartbeat.emitUploadComplete(payload.workspaceId, payload.payload);
  }

  @OnEvent(PlatformEvents.CAMPAIGN_PUBLISHED)
  handleCampaignPublished(payload: CampaignPublishedPayload): void {
    this.gateway.server
      .to(`workspace:${payload.workspaceId}`)
      .emit('campaign:push', { campaignId: payload.campaignId });
  }

  @OnEvent(PlatformEvents.NOTIFICATION_CREATED)
  handleNotificationCreated(payload: NotificationCreatedPayload): void {
    this.gateway.emitNotificationToUser(payload.userId, payload.notification);
  }
}
