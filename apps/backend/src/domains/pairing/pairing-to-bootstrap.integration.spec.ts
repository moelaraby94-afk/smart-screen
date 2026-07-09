import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  PlayerPlatform,
  Prisma,
  ScreenPairingSessionStatus,
  ScreenStatus,
  UserRole,
} from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CanvasesService } from '../canvases/canvases.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { PlayerController } from '../player/player.controller';
import { PlayerService } from '../player/player.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { PairingService } from './pairing.service';

/**
 * End-to-end coverage of the pairing → playback handoff, the seam where the
 * backend and the player app agree on how a screen authenticates.
 *
 * This exists because a regression slipped through every prior check: pairing
 * started issuing a per-screen secret (Screen.pairingSecretHash) and both
 * `player/bootstrap` and the `screen:register` gateway message started
 * *requiring* it, while the player app still sent the shared
 * PLAYER_HEARTBEAT_SECRET. Every newly paired screen 401'd. It went unnoticed
 * because the seeded/demo screens are created outside the pairing flow, so they
 * have a NULL hash and keep working via the shared-secret fallback — those were
 * the only screens anyone tested with.
 *
 * The invariant under test: a screen that came out of `claimSession` can
 * authenticate with the secret the pairing poll handed it, and *cannot*
 * authenticate with the shared secret.
 *
 * No Postgres is available in this sandbox, so the Prisma delegate is faked.
 * Every layer above it — HTTP routing, PairingService, PlayerService, the
 * gateway's secret check, and real bcrypt hashing/comparison — runs for real.
 * The fake throws on any query shape it does not model, so a service changing
 * its queries fails loudly here rather than silently passing.
 */

const SHARED_SECRET = 'dev-player-heartbeat-secret';
const WORKSPACE_ID = 'ws_1';
const OWNER_ID = 'user_owner';

type ScreenRow = {
  id: string;
  workspaceId: string;
  name: string;
  serialNumber: string;
  status: ScreenStatus;
  playerPlatform: PlayerPlatform;
  resolutionWidth: number;
  resolutionHeight: number;
  pairingSecretHash: string | null;
  playerTicker: string | null;
  isOfflineCacheMode: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
};

type SessionRow = {
  id: string;
  code: string;
  pollSecret: string;
  status: ScreenPairingSessionStatus;
  expiresAt: Date;
  playerPlatform: PlayerPlatform;
  resolutionWidth: number;
  resolutionHeight: number;
  workspaceId: string | null;
  screenId: string | null;
  screenSecretHandoff: string | null;
};

function unsupported(delegate: string, args: unknown): never {
  throw new Error(
    `FakePrisma: unmodelled ${delegate} query — the service under test changed ` +
      `its query shape. Update the fake.\n${JSON.stringify(args)}`,
  );
}

function createFakePrisma() {
  const users = new Map<string, { id: string; isSuperAdmin: boolean }>();
  const memberships = new Map<string, { role: UserRole }>();
  const workspaces = new Map<
    string,
    { id: string; isPaused: boolean; name: string }
  >();
  const subscriptions = new Map<string, { screenLimit: number }>();
  const screens = new Map<string, ScreenRow>();
  const sessions = new Map<string, SessionRow>();
  const lockouts = new Map<string, { failedCount: number }>();
  let seq = 0;

  const findScreenBySerial = (serialNumber: string): ScreenRow | null =>
    [...screens.values()].find((s) => s.serialNumber === serialNumber) ?? null;

  const withWorkspace = (screen: ScreenRow) => ({
    ...screen,
    workspace: workspaces.get(screen.workspaceId),
  });

  type SessionCreateData = Pick<
    SessionRow,
    | 'code'
    | 'pollSecret'
    | 'status'
    | 'expiresAt'
    | 'playerPlatform'
    | 'resolutionWidth'
    | 'resolutionHeight'
  > &
    Partial<SessionRow>;

  const sessionDelegate = {
    create: ({ data }: { data: SessionCreateData }) => {
      if ([...sessions.values()].some((s) => s.code === data.code)) {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        });
      }
      seq += 1;
      const row: SessionRow = {
        ...data,
        id: `sess_${seq}`,
        workspaceId: data.workspaceId ?? null,
        screenId: data.screenId ?? null,
        screenSecretHandoff: data.screenSecretHandoff ?? null,
      };
      sessions.set(row.id, row);
      return row;
    },
    findFirst: ({ where }: { where: Record<string, unknown> }) => {
      // pollSession: { id, pollSecret }
      if (
        typeof where.id === 'string' &&
        typeof where.pollSecret === 'string'
      ) {
        const row = sessions.get(where.id);
        if (!row || row.pollSecret !== where.pollSecret) return null;
        const screen = row.screenId ? screens.get(row.screenId) : null;
        return {
          ...row,
          screen: screen ? { serialNumber: screen.serialNumber } : null,
        };
      }
      // claimSession: { code, status: PENDING, expiresAt: { gt: now } }
      if (typeof where.code === 'string') {
        const gt = (where.expiresAt as { gt: Date } | undefined)?.gt;
        return (
          [...sessions.values()].find(
            (s) =>
              s.code === where.code &&
              s.status === where.status &&
              (!gt || s.expiresAt > gt),
          ) ?? null
        );
      }
      return unsupported('screenPairingSession.findFirst', where);
    },
    updateMany: ({
      where,
      data,
    }: {
      where: Record<string, unknown>;
      data: Partial<SessionRow>;
    }) => {
      const row = sessions.get(where.id as string);
      if (!row) return { count: 0 };
      // The one-time handoff guard: `screenSecretHandoff: { not: null }`
      if (where.screenSecretHandoff !== undefined) {
        if (row.screenSecretHandoff === null) return { count: 0 };
      }
      if (where.status !== undefined && row.status !== where.status) {
        return { count: 0 };
      }
      Object.assign(row, data);
      return { count: 1 };
    },
    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<SessionRow>;
    }) => {
      const row = sessions.get(where.id);
      if (!row) throw new Error('session not found');
      Object.assign(row, data);
      return row;
    },
  };

  type ScreenCreateData = Pick<
    ScreenRow,
    | 'workspaceId'
    | 'name'
    | 'serialNumber'
    | 'status'
    | 'playerPlatform'
    | 'resolutionWidth'
    | 'resolutionHeight'
  > &
    Partial<ScreenRow>;

  const screenDelegate = {
    create: ({ data }: { data: ScreenCreateData }) => {
      seq += 1;
      const row: ScreenRow = {
        ...data,
        id: `screen_${seq}`,
        playerTicker: data.playerTicker ?? null,
        isOfflineCacheMode: data.isOfflineCacheMode ?? false,
        lastSeenAt: data.lastSeenAt ?? null,
        createdAt: data.createdAt ?? new Date(),
        pairingSecretHash: data.pairingSecretHash ?? null,
      };
      screens.set(row.id, row);
      return row;
    },
    findUnique: ({
      where,
    }: {
      where: { serialNumber?: string; id?: string };
    }) => {
      if (where.serialNumber) return findScreenBySerial(where.serialNumber);
      if (where.id) return screens.get(where.id) ?? null;
      return unsupported('screen.findUnique', where);
    },
    findFirst: ({ where }: { where: { serialNumber?: string } }) => {
      if (where.serialNumber) {
        const s = findScreenBySerial(where.serialNumber);
        return s ? withWorkspace(s) : null;
      }
      return unsupported('screen.findFirst', where);
    },
    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<ScreenRow>;
    }) => {
      const row = screens.get(where.id);
      if (!row) throw new Error('screen not found');
      Object.assign(row, data);
      return row;
    },
    count: ({ where }: { where: { workspaceId: string } }) =>
      [...screens.values()].filter((s) => s.workspaceId === where.workspaceId)
        .length,
  };

  const tx = {
    screenPairingSession: sessionDelegate,
    screen: screenDelegate,
    subscription: {
      findUnique: ({ where }: { where: { workspaceId: string } }) =>
        subscriptions.get(where.workspaceId) ?? null,
    },
  };

  return {
    users,
    memberships,
    workspaces,
    subscriptions,
    screens,
    sessions,
    user: {
      findUnique: ({ where }: { where: { id: string } }) =>
        users.get(where.id) ?? null,
    },
    workspaceMember: {
      findUnique: ({
        where,
      }: {
        where: { workspaceId_userId: { workspaceId: string; userId: string } };
      }) =>
        memberships.get(
          `${where.workspaceId_userId.workspaceId}:${where.workspaceId_userId.userId}`,
        ) ?? null,
    },
    workspace: {
      findUnique: ({ where }: { where: { id: string } }) =>
        workspaces.get(where.id) ?? null,
    },
    pairingClaimLockout: {
      findUnique: ({ where }: { where: { userId: string } }) =>
        lockouts.get(where.userId) ?? null,
      upsert: jest.fn(),
      deleteMany: ({ where }: { where: { userId: string } }) => {
        const existed = lockouts.delete(where.userId);
        return { count: existed ? 1 : 0 };
      },
    },
    screenPairingSession: sessionDelegate,
    screen: screenDelegate,
    $transaction: (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
  };
}

describe('pairing → player bootstrap (per-screen secret handoff)', () => {
  let app: INestApplication;
  let fakePrisma: ReturnType<typeof createFakePrisma>;
  let pairing: PairingService;
  let gateway: RealtimeGateway;
  let heartbeat: { bindPlayerSocket: jest.Mock; emitScreenStatus: jest.Mock };

  beforeAll(async () => {
    fakePrisma = createFakePrisma();
    fakePrisma.users.set(OWNER_ID, { id: OWNER_ID, isSuperAdmin: false });
    fakePrisma.memberships.set(`${WORKSPACE_ID}:${OWNER_ID}`, {
      role: UserRole.OWNER,
    });
    fakePrisma.workspaces.set(WORKSPACE_ID, {
      id: WORKSPACE_ID,
      isPaused: false,
      name: 'Test Branch',
    });
    fakePrisma.subscriptions.set(WORKSPACE_ID, { screenLimit: 25 });

    heartbeat = {
      bindPlayerSocket: jest.fn(),
      emitScreenStatus: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        PairingService,
        PlayerService,
        RealtimeGateway,
        { provide: PrismaService, useValue: fakePrisma },
        {
          provide: ScreenHeartbeatService,
          useValue: {
            ...heartbeat,
            setServer: jest.fn(),
            emitPairingStarted: jest.fn(),
            emitPairingSessionComplete: jest.fn(),
          },
        },
        {
          provide: PlaylistsService,
          useValue: {
            getPlaylistPayloadForScreen: jest.fn(() => ({
              workspaceId: WORKSPACE_ID,
              screenId: 'screen_2',
              playlistId: 'pl_1',
              name: 'Demo Loop',
              items: [],
            })),
          },
        },
        {
          provide: CanvasesService,
          useValue: { getCompiledForPlayer: jest.fn() },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: (_k: string, dflt?: unknown) => dflt },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    pairing = moduleRef.get(PairingService);
    gateway = moduleRef.get(RealtimeGateway);
  });

  afterAll(async () => {
    await app.close();
  });

  /** Drives the real flow: start → claim → poll, returning the handed-off secret. */
  async function pairAScreen(): Promise<{
    serialNumber: string;
    screenSecret: string;
  }> {
    const started = await pairing.startSession({
      playerPlatform: PlayerPlatform.WEB,
    });
    const claimed = await pairing.claimSession(WORKSPACE_ID, OWNER_ID, {
      code: started.pairingCode,
    });
    const polled = await pairing.pollSession(
      started.sessionId,
      started.pollSecret,
    );

    expect(polled.status).toBe('complete');
    if (polled.status !== 'complete') throw new Error('unreachable');

    // The regression: this field did not exist on the player's response type.
    expect(polled.screenSecret).toEqual(expect.any(String));
    expect(polled.serialNumber).toBe(claimed.screen.serialNumber);

    return {
      serialNumber: polled.serialNumber,
      screenSecret: polled.screenSecret as string,
    };
  }

  it('hands the screen secret to the first poll and never again', async () => {
    const started = await pairing.startSession({
      playerPlatform: PlayerPlatform.WEB,
    });
    await pairing.claimSession(WORKSPACE_ID, OWNER_ID, {
      code: started.pairingCode,
    });

    const first = await pairing.pollSession(
      started.sessionId,
      started.pollSecret,
    );
    const second = await pairing.pollSession(
      started.sessionId,
      started.pollSecret,
    );

    expect(first.status).toBe('complete');
    expect(second.status).toBe('complete');
    if (first.status !== 'complete' || second.status !== 'complete') {
      throw new Error('unreachable');
    }
    expect(first.screenSecret).toEqual(expect.any(String));
    expect(second.screenSecret).toBeNull();
  });

  it('stores only a bcrypt hash of the screen secret, never the plaintext', async () => {
    const { serialNumber, screenSecret } = await pairAScreen();
    const row = [...fakePrisma.screens.values()].find(
      (s) => s.serialNumber === serialNumber,
    );

    expect(row?.pairingSecretHash).toEqual(expect.any(String));
    expect(row?.pairingSecretHash).not.toBe(screenSecret);
    expect(row?.pairingSecretHash).toMatch(/^\$2[aby]\$/);
    // The one-time handoff column is cleared once consumed.
    expect(
      [...fakePrisma.sessions.values()].every(
        (s) => s.screenSecretHandoff === null,
      ),
    ).toBe(true);
  });

  it('GET /player/bootstrap succeeds with the paired screen secret', async () => {
    const { serialNumber, screenSecret } = await pairAScreen();

    const res = await request(app.getHttpServer() as Server)
      .get('/player/bootstrap')
      .query({ serialNumber })
      .set('x-player-secret', screenSecret);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      serialNumber,
      workspaceId: WORKSPACE_ID,
      workspaceName: 'Test Branch',
    });
  });

  it('GET /player/bootstrap rejects the shared secret for a paired screen', async () => {
    const { serialNumber } = await pairAScreen();

    const res = await request(app.getHttpServer() as Server)
      .get('/player/bootstrap')
      .query({ serialNumber })
      .set('x-player-secret', SHARED_SECRET);

    expect(res.status).toBe(401);
  });

  it('screen:register authorizes with the paired secret and rejects the shared one', async () => {
    const { serialNumber, screenSecret } = await pairAScreen();

    const makeClient = () => ({
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
      id: 'sock_1',
    });

    const good = makeClient();
    await gateway.handleScreenRegister(good as never, {
      serialNumber,
      secret: screenSecret,
    });
    const emitted = good.emit.mock.calls as unknown as Array<
      [event: string, payload: { screenId?: unknown }]
    >;
    const registered = emitted.find(([event]) => event === 'screen:registered');
    expect(registered).toBeDefined();
    expect(typeof registered?.[1].screenId).toBe('string');
    expect(good.disconnect).not.toHaveBeenCalled();

    const bad = makeClient();
    await gateway.handleScreenRegister(bad as never, {
      serialNumber,
      secret: SHARED_SECRET,
    });
    expect(bad.emit).toHaveBeenCalledWith('screen:error', {
      code: 'UNAUTHORIZED',
    });
    expect(bad.disconnect).toHaveBeenCalledWith(true);
  });

  it('keeps the shared-secret fallback working for screens created outside pairing', async () => {
    // Mirrors workspaces.service.ts / screens.service.ts, which create screens
    // without a pairingSecretHash (seeded + manually created screens).
    fakePrisma.screens.set('legacy', {
      id: 'legacy',
      workspaceId: WORKSPACE_ID,
      name: 'Legacy Screen',
      serialNumber: 'CS-LEGACY-001',
      status: ScreenStatus.OFFLINE,
      playerPlatform: PlayerPlatform.WEB,
      resolutionWidth: 1920,
      resolutionHeight: 1080,
      pairingSecretHash: null,
      playerTicker: null,
      isOfflineCacheMode: false,
      lastSeenAt: null,
      createdAt: new Date(),
    });

    const res = await request(app.getHttpServer() as Server)
      .get('/player/bootstrap')
      .query({ serialNumber: 'CS-LEGACY-001' })
      .set('x-player-secret', SHARED_SECRET);

    expect(res.status).toBe(200);
  });
});
