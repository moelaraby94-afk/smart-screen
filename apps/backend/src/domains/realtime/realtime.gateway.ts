import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Logger,
  OnModuleDestroy,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ScreenPairingSessionStatus, ScreenStatus } from '@prisma/client';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as bcrypt from 'bcryptjs';
import { parse as cookieParse } from 'cookie';
import type { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Redis } from 'ioredis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { createCorsOriginChecker } from '../../common/config/cors-config';
import type { JwtAudience } from '../../common/auth/current-user.decorator';
import { ScreenHeartbeatService } from './screen-heartbeat.service';
import { ScreenRegisterDto } from './dto/screen-register.dto';
import { ScreenHeartbeatDto } from './dto/screen-heartbeat.dto';
import { DashboardSubscribeDto } from './dto/dashboard-subscribe.dto';
import { PairingWatchDto } from './dto/pairing-watch.dto';
import { PlayerBindScreenDto } from './dto/player-bind-screen.dto';
import { ScreenClientErrorDto } from './dto/screen-client-error.dto';
import { OfflineEventQueueService } from './offline-event-queue.service';
import { WsThrottlerGuard } from '../../common/throttler/ws-throttler.guard';

type JwtAccessPayload = {
  sub: string;
  email: string;
  aud?: JwtAudience;
  isSuperAdmin?: boolean;
  platformStaffRole?: import('@prisma/client').PlatformStaffRole;
  /** See TokenPayload in auth.service.ts. Absent on pre-`typ` tokens. */
  typ?: 'access' | 'refresh';
};

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: createCorsOriginChecker(),
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@UseGuards(WsThrottlerGuard)
export class RealtimeGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly log = new Logger(RealtimeGateway.name);

  /** Per-IP connection count for rate-limiting. */
  private readonly ipConnectionCounts = new Map<string, number>();
  /** Sockets that have passed authentication via any handler. */
  private readonly authedSockets = new Set<string>();
  /** Idle timeout handles for sockets that haven't authenticated yet. */
  private readonly unauthTimers = new Map<string, NodeJS.Timeout>();
  /** Redis adapter pub/sub clients — stored for cleanup on shutdown. */
  private adapterPubClient: Redis | null = null;
  private adapterSubClient: Redis | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly heartbeat: ScreenHeartbeatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly offlineEventQueue: OfflineEventQueueService,
  ) {}

  afterInit(): Promise<void> {
    this.heartbeat.setServer(this.server);

    /**
     * Redis adapter for Socket.IO — enables broadcasting events across
     * multiple backend instances. Only activated when REDIS_URL is set.
     *
     * Official source: Socket.IO docs —
     * https://socket.io/docs/v4/redis-adapter/
     */
    const redisClient = this.redisService.getClient();
    if (redisClient) {
      this.adapterPubClient = redisClient.duplicate();
      this.adapterSubClient = redisClient.duplicate();
      // this.server is a Namespace (gateway uses namespace: '/realtime'),
      // so access the underlying Server via .server to call adapter().
      (this.server as unknown as { server: Server }).server.adapter(
        createAdapter(this.adapterPubClient, this.adapterSubClient),
      );
      this.log.log('WebSocket: Redis adapter enabled.');
    }
    return Promise.resolve();
  }

  async onModuleDestroy(): Promise<void> {
    /**
     * Close the Redis adapter pub/sub clients to prevent connection leaks.
     * The underlying RedisService connection is closed separately by its own
     * OnModuleDestroy hook.
     *
     * Official source: Socket.IO Redis Adapter —
     * https://socket.io/docs/v4/redis-adapter/#graceful-close
     */
    if (this.adapterPubClient) {
      await this.adapterPubClient.quit().catch(() => {});
      this.adapterPubClient = null;
    }
    if (this.adapterSubClient) {
      await this.adapterSubClient.quit().catch(() => {});
      this.adapterSubClient = null;
    }
  }

  handleConnection(client: Socket): void {
    const ip = this.getClientIp(client);
    const max = Number(
      this.configService.get<string>('WS_MAX_CONNECTIONS_PER_IP', '20'),
    );
    const current = this.ipConnectionCounts.get(ip) ?? 0;
    if (current >= max) {
      this.log.warn(
        `WS connection from ${ip} rejected: per-IP limit (${current}/${max}) reached`,
      );
      client.emit('connected', { message: 'Too many connections' });
      client.disconnect(true);
      return;
    }
    this.ipConnectionCounts.set(ip, current + 1);

    const timeoutMs = Number(
      this.configService.get<string>('WS_UNAUTH_TIMEOUT_MS', '30000'),
    );
    const timer = setTimeout(() => {
      if (!this.authedSockets.has(client.id) && client.connected) {
        this.log.warn(
          `WS socket ${client.id} from ${ip} disconnected: unauthenticated timeout`,
        );
        client.disconnect(true);
      }
    }, timeoutMs);
    this.unauthTimers.set(client.id, timer);

    client.emit('connected', { message: 'Realtime channel connected' });
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const timer = this.unauthTimers.get(client.id);
    if (timer) {
      clearTimeout(timer);
      this.unauthTimers.delete(client.id);
    }
    this.authedSockets.delete(client.id);

    const ip = this.getClientIp(client);
    const count = this.ipConnectionCounts.get(ip);
    if (count !== undefined) {
      if (count <= 1) {
        this.ipConnectionCounts.delete(ip);
      } else {
        this.ipConnectionCounts.set(ip, count - 1);
      }
    }

    const binding = this.heartbeat.getBinding(client.id);
    this.heartbeat.unbindSocket(client.id);

    if (binding) {
      await this.prisma.screen.update({
        where: { id: binding.screenId },
        data: { status: ScreenStatus.OFFLINE, isOfflineCacheMode: false },
      });
      this.heartbeat.emitScreenStatus(binding.workspaceId, {
        screenId: binding.screenId,
        serialNumber: binding.serialNumber,
        status: ScreenStatus.OFFLINE,
        lastSeenAt: new Date().toISOString(),
        isOfflineCacheMode: false,
      });
    }
  }

  /**
   * JWT / dashboard-token players: join `screen:{id}` to receive `player:ticker`
   * and other screen-targeted events without kiosk `screen:register`.
   */
  @SubscribeMessage('player:bind_screen')
  async handlePlayerBindScreen(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: PlayerBindScreenDto,
  ): Promise<void> {
    const user = this.parseUserFromSocket(client);
    if (!user) {
      client.emit('screen:error', { code: 'UNAUTHORIZED' });
      return;
    }
    const screenId =
      typeof body?.screenId === 'string' ? body.screenId.trim() : '';
    if (!screenId) {
      client.emit('screen:error', { code: 'VALIDATION' });
      return;
    }
    const screen = await this.prisma.screen.findFirst({
      where: { id: screenId },
      select: { id: true, workspaceId: true },
    });
    if (!screen) {
      client.emit('screen:error', { code: 'SCREEN_NOT_FOUND' });
      return;
    }

    // Backward compat: old tokens without aud default to 'customer'
    const aud: JwtAudience = user.aud ?? 'customer';

    // Platform staff can bind to any screen
    if (aud === 'platform' && (user.isSuperAdmin || user.platformStaffRole)) {
      this.markAuthed(client);
      await client.join(`screen:${screen.id}`);
      client.emit('player:bound', { screenId: screen.id });
      return;
    }

    // Customer users must be a member of the screen's workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: screen.workspaceId,
          userId: user.sub,
        },
      },
      select: { userId: true },
    });
    if (!membership) {
      client.emit('screen:error', { code: 'FORBIDDEN_BIND' });
      return;
    }
    this.markAuthed(client);
    await client.join(`screen:${screen.id}`);
    client.emit('player:bound', { screenId: screen.id });
  }

  /**
   * Validates the per-screen secret against Screen.pairingSecretHash.
   * Screens must have a per-screen secret hash — the shared
   * PLAYER_HEARTBEAT_SECRET fallback has been removed in Phase 2.
   */
  private async assertScreenSecret(
    screen: {
      id: string;
      serialNumber: string;
      pairingSecretHash: string | null;
    },
    secret: string,
  ): Promise<boolean> {
    if (screen.pairingSecretHash) {
      return bcrypt.compare(secret, screen.pairingSecretHash);
    }
    return false;
  }

  @SubscribeMessage('screen:register')
  async handleScreenRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ScreenRegisterDto,
  ): Promise<void> {
    if (!payload?.serialNumber || !payload.secret) {
      client.emit('screen:error', { code: 'UNAUTHORIZED' });
      client.disconnect(true);
      return;
    }

    const screen = await this.prisma.screen.findFirst({
      where: { serialNumber: payload.serialNumber },
      select: {
        id: true,
        workspaceId: true,
        serialNumber: true,
        playerTicker: true,
        pairingSecretHash: true,
      },
    });

    if (!screen) {
      client.emit('screen:error', { code: 'SCREEN_NOT_FOUND' });
      return;
    }

    const authorized = await this.assertScreenSecret(screen, payload.secret);
    if (!authorized) {
      client.emit('screen:error', { code: 'UNAUTHORIZED' });
      client.disconnect(true);
      return;
    }

    this.markAuthed(client);

    this.heartbeat.bindPlayerSocket(client, {
      screenId: screen.id,
      workspaceId: screen.workspaceId,
      serialNumber: screen.serialNumber,
    });

    const now = new Date();
    await this.prisma.screen.update({
      where: { id: screen.id },
      data: {
        status: ScreenStatus.ONLINE,
        lastSeenAt: now,
        isOfflineCacheMode: false,
        ...(payload.playerVersion
          ? { playerVersion: payload.playerVersion }
          : {}),
      },
    });

    this.heartbeat.emitScreenStatus(screen.workspaceId, {
      screenId: screen.id,
      serialNumber: screen.serialNumber,
      status: ScreenStatus.ONLINE,
      lastSeenAt: now.toISOString(),
      isOfflineCacheMode: false,
    });

    await client.join(`screen:${screen.id}`);

    // Drain offline events that were queued while screen was offline
    const queuedEvents = await this.offlineEventQueue.drain(screen.id);
    for (const evt of queuedEvents) {
      client.emit(evt.event, evt.payload);
    }
    if (queuedEvents.length > 0) {
      this.log.log(
        `Drained ${queuedEvents.length} offline events for screen ${screen.id}`,
      );
    }

    client.emit('screen:registered', {
      screenId: screen.id,
      ticker: screen.playerTicker ?? null,
    });
  }

  /**
   * Player-reported playback / asset failures (distinct from server-emitted
   * `screen:error` registration failures).
   */
  @SubscribeMessage('screen:error')
  handleScreenClientErrorReport(
    @ConnectedSocket() client: Socket,
    @MessageBody() body?: ScreenClientErrorDto,
  ): void {
    const binding = this.heartbeat.getBinding(client.id);
    if (!binding) return;
    const meta =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    this.log.warn(
      `screen playback error screenId=${binding.screenId} serial=${binding.serialNumber} workspaceId=${binding.workspaceId} meta=${JSON.stringify(meta)}`,
    );
  }

  @SubscribeMessage('screen:heartbeat')
  async handleScreenHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body?: ScreenHeartbeatDto,
  ): Promise<void> {
    const ok = this.heartbeat.touchHeartbeat(client.id);
    if (!ok) {
      client.emit('screen:error', { code: 'NOT_REGISTERED' });
      return;
    }
    const isOfflineMode =
      body &&
      typeof body === 'object' &&
      typeof (body as { isOfflineMode?: unknown }).isOfflineMode === 'boolean'
        ? (body as { isOfflineMode: boolean }).isOfflineMode
        : false;
    await this.heartbeat.applyHeartbeatFromSocket(client.id, {
      isOfflineMode,
    });

    // Track player version and diagnostics if reported
    const bodyObj =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const playerVersion =
      typeof bodyObj.playerVersion === 'string'
        ? bodyObj.playerVersion
        : undefined;
    const diagnostics: Record<string, unknown> = {};
    if (typeof bodyObj.batteryLevel === 'number')
      diagnostics.batteryLevel = bodyObj.batteryLevel;
    if (typeof bodyObj.batteryCharging === 'boolean')
      diagnostics.batteryCharging = bodyObj.batteryCharging;
    if (typeof bodyObj.uptimeSeconds === 'number')
      diagnostics.uptimeSeconds = bodyObj.uptimeSeconds;
    if (typeof bodyObj.networkType === 'string')
      diagnostics.networkType = bodyObj.networkType;
    if (typeof bodyObj.resolutionWidth === 'number')
      diagnostics.resolutionWidth = bodyObj.resolutionWidth;
    if (typeof bodyObj.resolutionHeight === 'number')
      diagnostics.resolutionHeight = bodyObj.resolutionHeight;

    if (playerVersion || Object.keys(diagnostics).length > 0) {
      const binding = this.heartbeat.getBinding(client.id);
      if (binding) {
        const data: Record<string, unknown> = {};
        if (playerVersion) data.playerVersion = playerVersion;
        Object.assign(data, diagnostics);
        await this.prisma.screen
          .update({
            where: { id: binding.screenId },
            data,
          })
          .catch(() => {});
      }
    }
  }

  /** Legacy ping — treated as heartbeat for players already registered. */
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket): Promise<void> {
    if (this.heartbeat.getBinding(client.id)) {
      await this.handleScreenHeartbeat(client, undefined);
    } else {
      client.emit('pong', { at: new Date().toISOString() });
    }
  }

  /** Unauthenticated: join `pairing:{sessionId}` after validating poll secret (player TV / kiosk). */
  @SubscribeMessage('pairing:watch')
  async handlePairingWatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PairingWatchDto,
  ): Promise<void> {
    const sessionId = payload?.sessionId?.trim();
    const pollSecret = payload?.pollSecret?.trim();
    if (!sessionId || !pollSecret) {
      client.emit('pairing:error', { code: 'VALIDATION' });
      return;
    }
    const row = await this.prisma.screenPairingSession.findFirst({
      where: {
        id: sessionId,
        pollSecret,
        status: ScreenPairingSessionStatus.PENDING,
      },
      select: { id: true, expiresAt: true },
    });
    if (!row || row.expiresAt < new Date()) {
      client.emit('pairing:error', { code: 'NOT_FOUND_OR_EXPIRED' });
      return;
    }
    this.markAuthed(client);
    await client.join(`pairing:${row.id}`);
    client.emit('pairing:watching', { sessionId: row.id });
  }

  @SubscribeMessage('dashboard:subscribe')
  async handleDashboardSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DashboardSubscribeDto,
  ): Promise<void> {
    const user = this.parseUserFromSocket(client);
    if (!user) {
      client.emit('dashboard:error', { code: 'UNAUTHORIZED' });
      return;
    }

    if (!payload?.workspaceId) {
      client.emit('dashboard:error', { code: 'WORKSPACE_REQUIRED' });
      return;
    }

    // Backward compat: old tokens without aud default to 'customer'
    const aud: JwtAudience = user.aud ?? 'customer';

    // Platform staff can subscribe to any workspace
    if (aud === 'platform' && (user.isSuperAdmin || user.platformStaffRole)) {
      this.markAuthed(client);
      await client.join(`workspace:${payload.workspaceId}`);
      await client.join(`user:${user.sub}`);
      client.emit('dashboard:subscribed', { workspaceId: payload.workspaceId });
      return;
    }

    // Customer users must be a member of the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: payload.workspaceId,
          userId: user.sub,
        },
      },
      select: { userId: true },
    });

    if (!membership) {
      client.emit('dashboard:error', { code: 'FORBIDDEN' });
      return;
    }

    this.markAuthed(client);
    await client.join(`workspace:${payload.workspaceId}`);
    await client.join(`user:${user.sub}`);
    client.emit('dashboard:subscribed', { workspaceId: payload.workspaceId });
  }

  /** Emit a notification event to a specific user's room. */
  emitNotificationToUser(userId: string, notification: unknown): void {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  private getClientIp(client: Socket): string {
    const xff = client.handshake.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
      return xff.split(',')[0].trim();
    }
    return client.handshake.address || 'unknown';
  }

  private markAuthed(client: Socket): void {
    this.authedSockets.add(client.id);
    const timer = this.unauthTimers.get(client.id);
    if (timer) {
      clearTimeout(timer);
      this.unauthTimers.delete(client.id);
    }
  }

  private parseUserFromSocket(client: Socket): JwtAccessPayload | null {
    const secret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev-access-secret',
    );

    /** Mirrors JwtStrategy.validate: a refresh token is not a socket credential. */
    const verifyAccessToken = (token: string): JwtAccessPayload | null => {
      try {
        const payload = this.jwtService.verify<JwtAccessPayload>(token, {
          secret,
        });
        return payload.typ === 'refresh' ? null : payload;
      } catch {
        return null;
      }
    };

    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return verifyAccessToken(authToken);

    const raw = client.handshake.headers.cookie;
    if (!raw) return null;
    const cookies = cookieParse(raw);
    const token =
      cookies['__Host-cs_customer_access'] ??
      cookies['__Host-cs_platform_access'] ??
      cookies['cs_customer_access'] ??
      cookies['cs_platform_access'] ??
      cookies['cs_access_token'];
    return token ? verifyAccessToken(token) : null;
  }
}
