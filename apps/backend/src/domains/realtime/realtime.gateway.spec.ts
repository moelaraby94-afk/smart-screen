/* eslint-disable @typescript-eslint/no-floating-promises */
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ScreenStatus } from '@prisma/client';
import { RealtimeGateway } from './realtime.gateway';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScreenHeartbeatService } from './screen-heartbeat.service';
import { RedisService } from '../../common/redis/redis.service';
import { OfflineEventQueueService } from './offline-event-queue.service';
import { WsThrottlerGuard } from '../../common/throttler/ws-throttler.guard';

type MockSocket = {
  id: string;
  connected: boolean;
  handshake: {
    headers: Record<string, string | undefined>;
    auth: Record<string, unknown>;
    address: string;
  };
  rooms: Set<string>;
  emit: jest.Mock;
  join: jest.Mock;
  disconnect: jest.Mock;
};

function makeSocket(
  overrides: Partial<MockSocket> & { id?: string } = {},
): MockSocket {
  return {
    id: overrides.id ?? `sock_${Math.random().toString(36).slice(2)}`,
    connected: true,
    handshake: {
      headers: overrides.handshake?.headers ?? {},
      auth: overrides.handshake?.auth ?? {},
      address: overrides.handshake?.address ?? '203.0.113.5',
    },
    rooms: new Set(),
    emit: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  };
}

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    screen: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    screenPairingSession: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    workspaceMember: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    ...overrides,
  } as unknown as PrismaService;
}

function makeHeartbeat() {
  return {
    setServer: jest.fn(),
    getBinding: jest.fn().mockReturnValue(undefined),
    unbindSocket: jest.fn(),
    bindPlayerSocket: jest.fn(),
    touchHeartbeat: jest.fn().mockReturnValue(false),
    applyHeartbeatFromSocket: jest.fn().mockResolvedValue(undefined),
    emitScreenStatus: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

describe('RealtimeGateway T2.4 (WebSocket auth hardening)', () => {
  let gateway: RealtimeGateway;
  let prisma: PrismaService;
  let heartbeat: ScreenHeartbeatService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.useFakeTimers();

    prisma = makePrisma();
    heartbeat = makeHeartbeat();
    jwtService = {
      verify: jest.fn(),
    } as unknown as JwtService;
    configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'WS_MAX_CONNECTIONS_PER_IP') return '3';
        if (key === 'WS_UNAUTH_TIMEOUT_MS') return '5000';
        if (key === 'JWT_ACCESS_SECRET') return 'test-secret';
        return fallback;
      }),
    } as unknown as ConfigService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        { provide: PrismaService, useValue: prisma },
        { provide: ScreenHeartbeatService, useValue: heartbeat },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        {
          provide: RedisService,
          useValue: {
            getClient: () => null,
            isConfigured: false,
            ping: jest.fn().mockResolvedValue(false),
            quit: jest.fn().mockResolvedValue(undefined),
          } as unknown as RedisService,
        },
        {
          provide: OfflineEventQueueService,
          useValue: {
            enqueue: jest.fn().mockResolvedValue(undefined),
            drain: jest.fn().mockResolvedValue([]),
          } as unknown as OfflineEventQueueService,
        },
        {
          provide: WsThrottlerGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          } as unknown as WsThrottlerGuard,
        },
      ],
    }).compile();
    gateway = moduleRef.get(RealtimeGateway);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── handleConnection: per-IP limit ───────────────────────────────

  it('allows connections up to the per-IP limit', () => {
    const s1 = makeSocket({ id: 's1' });
    const s2 = makeSocket({ id: 's2' });
    const s3 = makeSocket({ id: 's3' });

    gateway.handleConnection(s1 as any);
    gateway.handleConnection(s2 as any);
    gateway.handleConnection(s3 as any);

    expect(s1.disconnect).not.toHaveBeenCalled();
    expect(s2.disconnect).not.toHaveBeenCalled();
    expect(s3.disconnect).not.toHaveBeenCalled();
    expect(s1.emit).toHaveBeenCalledWith('connected', {
      message: 'Realtime channel connected',
    });
  });

  it('rejects connections exceeding the per-IP limit', () => {
    const s1 = makeSocket({ id: 's1' });
    const s2 = makeSocket({ id: 's2' });
    const s3 = makeSocket({ id: 's3' });
    const s4 = makeSocket({ id: 's4' });

    gateway.handleConnection(s1 as any);
    gateway.handleConnection(s2 as any);
    gateway.handleConnection(s3 as any);
    gateway.handleConnection(s4 as any);

    expect(s4.disconnect).toHaveBeenCalledWith(true);
    expect(s4.emit).toHaveBeenCalledWith('connected', {
      message: 'Too many connections',
    });
  });

  it('tracks IPs separately via x-forwarded-for', () => {
    const ip1Sock = makeSocket({
      id: 'ip1_s1',
      handshake: {
        headers: { 'x-forwarded-for': '10.0.0.1' },
        auth: {},
        address: '',
      },
    });
    const ip2Sock = makeSocket({
      id: 'ip2_s1',
      handshake: {
        headers: { 'x-forwarded-for': '10.0.0.2' },
        auth: {},
        address: '',
      },
    });

    gateway.handleConnection(ip1Sock as any);
    gateway.handleConnection(ip2Sock as any);

    expect(ip1Sock.disconnect).not.toHaveBeenCalled();
    expect(ip2Sock.disconnect).not.toHaveBeenCalled();
  });

  it('decrements IP count on disconnect', () => {
    const s1 = makeSocket({ id: 's1' });
    const s2 = makeSocket({ id: 's2' });
    const s3 = makeSocket({ id: 's3' });
    const s4 = makeSocket({ id: 's4' });

    gateway.handleConnection(s1 as any);
    gateway.handleConnection(s2 as any);
    gateway.handleConnection(s3 as any);
    // At limit (3). Disconnect s1, then s4 should succeed.
    gateway.handleDisconnect(s1 as any);
    gateway.handleConnection(s4 as any);

    expect(s4.disconnect).not.toHaveBeenCalled();
  });

  // ─── handleConnection: unauthenticated timeout ────────────────────

  it('disconnects sockets that do not authenticate within the timeout', () => {
    const sock = makeSocket({ id: 'timeout_sock' });
    gateway.handleConnection(sock as any);

    expect(sock.connected).toBe(true);
    jest.advanceTimersByTime(5001);

    expect(sock.disconnect).toHaveBeenCalledWith(true);
  });

  it('does not disconnect sockets that authenticate before the timeout', async () => {
    const sock = makeSocket({ id: 'authed_sock' });
    gateway.handleConnection(sock as any);

    // Simulate successful screen:register auth
    (prisma.screen.findFirst as jest.Mock).mockResolvedValue({
      id: 'screen_1',
      workspaceId: 'ws_1',
      serialNumber: 'SN001',
      playerTicker: null,
      pairingSecretHash:
        '$2b$10$P6fGjb9BSmEeLq8c.ssyeeHWuXL3L2dlSz2mEt6QL/AC9ck/EqnVW',
    });

    await gateway.handleScreenRegister(sock as any, {
      serialNumber: 'SN001',
      secret: 'test-secret',
    });

    jest.advanceTimersByTime(5001);

    expect(sock.disconnect).not.toHaveBeenCalledWith(true);
  });

  // ─── handleDisconnect: cleanup ────────────────────────────────────

  it('clears the unauth timer on disconnect', () => {
    const sock = makeSocket({ id: 'cleanup_sock' });
    gateway.handleConnection(sock as any);
    gateway.handleDisconnect(sock as any);

    // Advance time — should not cause any additional disconnect calls
    jest.advanceTimersByTime(5001);

    // disconnect was called once by handleDisconnect's screen update path
    // but NOT by the timer (timer was cleared)
    // The timer's disconnect(true) should not fire
    expect(sock.disconnect).not.toHaveBeenCalledWith(true);
  });

  it('cleans up IP count and authed set on disconnect', async () => {
    const sock = makeSocket({ id: 'cleanup2' });
    gateway.handleConnection(sock as any);

    // Simulate auth
    (prisma.screen.findFirst as jest.Mock).mockResolvedValue({
      id: 'screen_1',
      workspaceId: 'ws_1',
      serialNumber: 'SN001',
      playerTicker: null,
      pairingSecretHash:
        '$2b$10$P6fGjb9BSmEeLq8c.ssyeeHWuXL3L2dlSz2mEt6QL/AC9ck/EqnVW',
    });
    await gateway.handleScreenRegister(sock as any, {
      serialNumber: 'SN001',
      secret: 'test-secret',
    });

    gateway.handleDisconnect(sock as any);

    // Reconnect same IP — should be allowed (count was decremented)
    const sock2 = makeSocket({ id: 'cleanup2_b' });
    gateway.handleConnection(sock2 as any);
    expect(sock2.disconnect).not.toHaveBeenCalled();
  });

  // ─── screen:register marks socket as authed ───────────────────────

  it('screen:register marks socket as authed', async () => {
    const sock = makeSocket({ id: 'reg_sock' });
    gateway.handleConnection(sock as any);

    (prisma.screen.findFirst as jest.Mock).mockResolvedValue({
      id: 'screen_1',
      workspaceId: 'ws_1',
      serialNumber: 'SN001',
      playerTicker: 'ticker text',
      pairingSecretHash:
        '$2b$10$P6fGjb9BSmEeLq8c.ssyeeHWuXL3L2dlSz2mEt6QL/AC9ck/EqnVW',
    });

    await gateway.handleScreenRegister(sock as any, {
      serialNumber: 'SN001',
      secret: 'test-secret',
    });

    jest.advanceTimersByTime(5001);
    expect(sock.disconnect).not.toHaveBeenCalledWith(true);
  });

  // ─── pairing:watch marks socket as authed ─────────────────────────

  it('pairing:watch marks socket as authed', async () => {
    const sock = makeSocket({ id: 'pair_sock' });
    gateway.handleConnection(sock as any);

    (prisma.screenPairingSession.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess_1',
      expiresAt: new Date(Date.now() + 60000),
    });

    await gateway.handlePairingWatch(sock as any, {
      sessionId: 'sess_1',
      pollSecret: 'poll_secret_123',
    });

    jest.advanceTimersByTime(5001);
    expect(sock.disconnect).not.toHaveBeenCalledWith(true);
  });

  // ─── dashboard:subscribe marks socket as authed ───────────────────

  it('dashboard:subscribe marks socket as authed', async () => {
    const sock = makeSocket({
      id: 'dash_sock',
      handshake: {
        headers: {},
        auth: { token: 'valid.jwt.token' },
        address: '203.0.113.5',
      },
    });
    gateway.handleConnection(sock as any);

    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: 'user_1',
      email: 'test@test.com',
      typ: 'access',
    });
    (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user_1',
    });

    await gateway.handleDashboardSubscribe(sock as any, {
      workspaceId: 'ws_1',
    });

    jest.advanceTimersByTime(5001);
    expect(sock.disconnect).not.toHaveBeenCalledWith(true);
  });

  // ─── player:bind_screen marks socket as authed ────────────────────

  it('player:bind_screen marks socket as authed', async () => {
    const sock = makeSocket({
      id: 'bind_sock',
      handshake: {
        headers: {},
        auth: { token: 'valid.jwt.token' },
        address: '203.0.113.5',
      },
    });
    gateway.handleConnection(sock as any);

    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: 'user_1',
      email: 'test@test.com',
      typ: 'access',
      aud: 'platform',
      isSuperAdmin: true,
    });
    (prisma.screen.findFirst as jest.Mock).mockResolvedValue({
      id: 'screen_1',
      workspaceId: 'ws_1',
    });

    await gateway.handlePlayerBindScreen(sock as any, { screenId: 'screen_1' });

    jest.advanceTimersByTime(5001);
    expect(sock.disconnect).not.toHaveBeenCalledWith(true);
  });

  // ─── existing behavior preserved ──────────────────────────────────

  it('emits connected event on successful connection', () => {
    const sock = makeSocket({ id: 'normal_sock' });
    gateway.handleConnection(sock as any);

    expect(sock.emit).toHaveBeenCalledWith('connected', {
      message: 'Realtime channel connected',
    });
  });

  it('screen:register rejects missing serialNumber', async () => {
    const sock = makeSocket({ id: 'bad_reg' });
    gateway.handleConnection(sock as any);

    await gateway.handleScreenRegister(sock as any, {
      serialNumber: '',
      secret: 'some-secret',
    });

    expect(sock.emit).toHaveBeenCalledWith('screen:error', {
      code: 'UNAUTHORIZED',
    });
    expect(sock.disconnect).toHaveBeenCalledWith(true);
  });

  it('dashboard:subscribe rejects unauthenticated socket', async () => {
    const sock = makeSocket({ id: 'no_auth' });
    gateway.handleConnection(sock as any);

    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    // Provide a token so parseUserFromSocket attempts verification
    sock.handshake.auth = { token: 'invalid.token' };

    await gateway.handleDashboardSubscribe(sock as any, {
      workspaceId: 'ws_1',
    });

    expect(sock.emit).toHaveBeenCalledWith('dashboard:error', {
      code: 'UNAUTHORIZED',
    });
  });

  it('pairing:watch rejects invalid session', async () => {
    const sock = makeSocket({ id: 'bad_pair' });
    gateway.handleConnection(sock as any);

    (prisma.screenPairingSession.findFirst as jest.Mock).mockResolvedValue(
      null,
    );

    await gateway.handlePairingWatch(sock as any, {
      sessionId: 'nonexistent',
      pollSecret: 'wrong',
    });

    expect(sock.emit).toHaveBeenCalledWith('pairing:error', {
      code: 'NOT_FOUND_OR_EXPIRED',
    });
  });

  it('updates screen to OFFLINE on disconnect when binding exists', async () => {
    const sock = makeSocket({ id: 'bound_sock' });
    gateway.handleConnection(sock as any);

    (heartbeat.getBinding as jest.Mock).mockReturnValue({
      screenId: 'screen_1',
      workspaceId: 'ws_1',
      serialNumber: 'SN001',
      lastPingAt: Date.now(),
    });

    await gateway.handleDisconnect(sock as any);

    expect(prisma.screen.update).toHaveBeenCalledWith({
      where: { id: 'screen_1' },
      data: { status: ScreenStatus.OFFLINE, isOfflineCacheMode: false },
    });
  });
});
