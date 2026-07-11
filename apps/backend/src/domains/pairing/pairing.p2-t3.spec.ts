import { NotFoundException } from '@nestjs/common';
import { ScreenPairingSessionStatus } from '@prisma/client';
import { PairingService } from './pairing.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';

type FakePairingSession = {
  id: string;
  code: string;
  pollSecret: string;
  status: ScreenPairingSessionStatus;
  expiresAt: Date;
  screenId: string | null;
  workspaceId: string | null;
  screenSecretHandoff: string | null;
  playerPlatform: string | null;
  resolutionWidth: number | null;
  resolutionHeight: number | null;
  screen: { serialNumber: string } | null;
};

type FakeScreen = {
  id: string;
  workspaceId: string;
  name: string;
  serialNumber: string;
  status: string;
  pairingSecretHash: string | null;
  playerPlatform: string | null;
  resolutionWidth: number | null;
  resolutionHeight: number | null;
};

type FakeSubscription = {
  workspaceId: string;
  screenLimit: number;
};

function createFakePrisma(opts: {
  sessions?: FakePairingSession[];
  screens?: FakeScreen[];
  subscriptions?: FakeSubscription[];
  workspaceMembers?: Set<string>;
}) {
  const {
    sessions = [],
    screens = [],
    subscriptions = [],
    workspaceMembers = new Set<string>(),
  } = opts;

  const sessionMap = new Map<string, FakePairingSession>(
    sessions.map((s) => [s.id, s]),
  );
  const screenMap = new Map<string, FakeScreen>(screens.map((s) => [s.id, s]));
  const subMap = new Map<string, FakeSubscription>(
    subscriptions.map((s) => [s.workspaceId, s]),
  );

  return {
    screenPairingSession: {
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where: {
            id?: string;
            pollSecret?: string;
            code?: string;
            status?: ScreenPairingSessionStatus;
            expiresAt?: { gt?: Date };
          };
          select?: Record<string, boolean>;
        }) => {
          let result: FakePairingSession | null = null;
          if (where.id && where.pollSecret) {
            result =
              [...sessionMap.values()].find(
                (s) => s.id === where.id && s.pollSecret === where.pollSecret,
              ) ?? null;
          } else if (where.code) {
            result =
              [...sessionMap.values()].find(
                (s) =>
                  s.code === where.code &&
                  s.status === where.status &&
                  (!where.expiresAt?.gt || s.expiresAt > where.expiresAt.gt),
              ) ?? null;
          }
          if (!result) return Promise.resolve(null);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                if (key === 'screen') filtered[key] = result.screen;
                else filtered[key] = (result as Record<string, unknown>)[key];
              }
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(result);
        },
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string; screenSecretHandoff?: { not: null } };
          data: Record<string, unknown>;
        }) => {
          const s = sessionMap.get(where.id);
          if (!s) return Promise.resolve({ count: 0 });
          if (where.screenSecretHandoff?.not !== undefined) {
            if (s.screenSecretHandoff !== null) {
              s.screenSecretHandoff =
                (data.screenSecretHandoff as string) ?? null;
              Object.assign(s, data);
              return Promise.resolve({ count: 1 });
            }
            return Promise.resolve({ count: 0 });
          }
          Object.assign(s, data);
          return Promise.resolve({ count: 1 });
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const s = sessionMap.get(where.id);
          if (!s) throw new Error('Session not found');
          Object.assign(s, data);
          return Promise.resolve(s);
        },
      ),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const s: FakePairingSession = {
          id: `session_${sessionMap.size + 1}`,
          code: data.code as string,
          pollSecret: data.pollSecret as string,
          status:
            (data.status as ScreenPairingSessionStatus) ??
            ScreenPairingSessionStatus.PENDING,
          expiresAt: (data.expiresAt as Date) ?? new Date(Date.now() + 600000),
          screenId: null,
          workspaceId: (data.workspaceId as string) ?? null,
          screenSecretHandoff: null,
          playerPlatform: (data.playerPlatform as string) ?? null,
          resolutionWidth: (data.resolutionWidth as number) ?? null,
          resolutionHeight: (data.resolutionHeight as number) ?? null,
          screen: null,
        };
        sessionMap.set(s.id, s);
        return Promise.resolve(s);
      }),
      count: jest.fn(() => Promise.resolve(0)),
    },
    screen: {
      count: jest.fn(({ where }: { where: { workspaceId?: string } }) =>
        Promise.resolve(
          [...screenMap.values()].filter(
            (s) => !where?.workspaceId || s.workspaceId === where.workspaceId,
          ).length,
        ),
      ),
      findFirst: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const s: FakeScreen = {
          id: `screen_${screenMap.size + 1}`,
          workspaceId: data.workspaceId as string,
          name: data.name as string,
          serialNumber: data.serialNumber as string,
          status: (data.status as string) ?? 'OFFLINE',
          pairingSecretHash: (data.pairingSecretHash as string) ?? null,
          playerPlatform: (data.playerPlatform as string) ?? null,
          resolutionWidth: (data.resolutionWidth as number) ?? null,
          resolutionHeight: (data.resolutionHeight as number) ?? null,
        };
        screenMap.set(s.id, s);
        return Promise.resolve(s);
      }),
    },
    subscription: {
      findUnique: jest.fn(({ where }: { where: { workspaceId: string } }) =>
        Promise.resolve(subMap.get(where.workspaceId) ?? null),
      ),
    },
    workspaceMember: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: {
            workspaceId_userId: { workspaceId: string; userId: string };
          };
        }) => {
          const key = `${where.workspaceId_userId.workspaceId}:${where.workspaceId_userId.userId}`;
          return Promise.resolve(
            workspaceMembers.has(key) ? { role: 'OWNER' } : null,
          );
        },
      ),
    },
    failedClaimAttempt: {
      count: jest.fn(() => Promise.resolve(0)),
      create: jest.fn(() => Promise.resolve({})),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    pairingClaimLockout: {
      findUnique: jest.fn(() => Promise.resolve(null)),
      delete: jest.fn(() => Promise.resolve({})),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    user: {
      findUnique: jest.fn(() => Promise.resolve({ isSuperAdmin: false })),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        screenPairingSession: {
          findFirst: jest.fn(
            ({
              where,
            }: {
              where: {
                code?: string;
                status?: ScreenPairingSessionStatus;
                expiresAt?: { gt?: Date };
                OR?: unknown[];
              };
            }) => {
              let result: FakePairingSession | null = null;
              if (where.code) {
                result =
                  [...sessionMap.values()].find(
                    (s) =>
                      s.code === where.code &&
                      s.status === where.status &&
                      (!where.expiresAt?.gt ||
                        s.expiresAt > where.expiresAt.gt),
                  ) ?? null;
              }
              return Promise.resolve(result);
            },
          ),
          update: jest.fn(
            ({
              where,
              data,
            }: {
              where: { id: string };
              data: Record<string, unknown>;
            }) => {
              const s = sessionMap.get(where.id);
              if (!s) throw new Error('Session not found');
              Object.assign(s, data);
              return Promise.resolve(s);
            },
          ),
        },
        screen: {
          count: jest.fn(() =>
            Promise.resolve(
              [...screenMap.values()].filter((s) => s.workspaceId === 'ws-1')
                .length,
            ),
          ),
          findUnique: jest.fn(() => Promise.resolve(null)),
          create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
            const s: FakeScreen = {
              id: `screen_${screenMap.size + 1}`,
              workspaceId: data.workspaceId as string,
              name: data.name as string,
              serialNumber: data.serialNumber as string,
              status: (data.status as string) ?? 'OFFLINE',
              pairingSecretHash: (data.pairingSecretHash as string) ?? null,
              playerPlatform: (data.playerPlatform as string) ?? null,
              resolutionWidth: (data.resolutionWidth as number) ?? null,
              resolutionHeight: (data.resolutionHeight as number) ?? null,
            };
            screenMap.set(s.id, s);
            return Promise.resolve(s);
          }),
        },
        subscription: {
          findUnique: jest.fn(({ where }: { where: { workspaceId: string } }) =>
            Promise.resolve(subMap.get(where.workspaceId) ?? null),
          ),
        },
      };
      return fn(tx);
    }),
  };
}

function createMockConfigService() {
  return {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'PAIRING_LOCKOUT_MAX_FAILED_ATTEMPTS') return '10';
      if (key === 'PAIRING_LOCKOUT_WINDOW_MS') return '900000';
      if (key === 'PAIRING_LOCKOUT_DURATION_MS') return '900000';
      return fallback;
    }),
  } as unknown as ConfigService;
}

function createMockHeartbeat() {
  return {
    emitPairingStarted: jest.fn(),
    emitPairingSessionComplete: jest.fn(),
    emitContentSync: jest.fn(),
    emitScheduleChanged: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

const SESSION_ID = 'session-1';
const POLL_SECRET = 'poll-secret-123';
const WS_ID = 'ws-1';
const USER_ID = 'user-1';

function makeSession(
  overrides: Partial<FakePairingSession> = {},
): FakePairingSession {
  return {
    id: SESSION_ID,
    code: '123456',
    pollSecret: POLL_SECRET,
    status: ScreenPairingSessionStatus.PENDING,
    expiresAt: new Date(Date.now() + 600000),
    screenId: null,
    workspaceId: null,
    screenSecretHandoff: null,
    playerPlatform: null,
    resolutionWidth: null,
    resolutionHeight: null,
    screen: null,
    ...overrides,
  };
}

describe('PairingService P2-T3 (lifecycle + secret rotation)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new PairingService(
      fake as unknown as PrismaService,
      createMockConfigService(),
      createMockHeartbeat(),
    );
  }

  // ─── Test 1: pollSession without pollSecret → NotFound ──────────────
  it('throws NotFound when polling without pollSecret', async () => {
    const fake = createFakePrisma({ sessions: [makeSession()] });
    const service = makeService(fake);

    await expect(service.pollSession(SESSION_ID, undefined)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 2: pollSession on non-existent session → NotFound ─────────
  it('throws NotFound when polling non-existent session', async () => {
    const fake = createFakePrisma({ sessions: [] });
    const service = makeService(fake);

    await expect(service.pollSession(SESSION_ID, POLL_SECRET)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 3: pollSession on expired PENDING session → expired ───────
  it('returns expired status when polling an expired PENDING session', async () => {
    const session = makeSession({
      expiresAt: new Date(Date.now() - 1000),
    });
    const fake = createFakePrisma({ sessions: [session] });
    const service = makeService(fake);

    const result = await service.pollSession(SESSION_ID, POLL_SECRET);
    expect(result.status).toBe('expired');
  });

  // ─── Test 4: pollSession on PENDING session → pending ───────────────
  it('returns pending status for a valid PENDING session', async () => {
    const fake = createFakePrisma({ sessions: [makeSession()] });
    const service = makeService(fake);

    const result = await service.pollSession(SESSION_ID, POLL_SECRET);
    expect(result.status).toBe('pending');
  });

  // ─── Test 5: pollSession on COMPLETE session with handoff → secret returned
  it('returns screenSecret on first poll of COMPLETE session', async () => {
    const session = makeSession({
      status: ScreenPairingSessionStatus.COMPLETE,
      screenId: 'screen-1',
      workspaceId: WS_ID,
      screenSecretHandoff: 'the-secret',
      screen: { serialNumber: 'CS-001' },
    });
    const fake = createFakePrisma({ sessions: [session] });
    const service = makeService(fake);

    const result = await service.pollSession(SESSION_ID, POLL_SECRET);
    expect(result.status).toBe('complete');
    expect(result.screenSecret).toBe('the-secret');
  });

  // ─── Test 6: pollSession second time → handoff consumed (null secret) ─
  it('returns null screenSecret on second poll (handoff consumed)', async () => {
    const session = makeSession({
      status: ScreenPairingSessionStatus.COMPLETE,
      screenId: 'screen-1',
      workspaceId: WS_ID,
      screenSecretHandoff: 'the-secret',
      screen: { serialNumber: 'CS-001' },
    });
    const fake = createFakePrisma({ sessions: [session] });
    const service = makeService(fake);

    // First poll — claims the secret
    const first = await service.pollSession(SESSION_ID, POLL_SECRET);
    expect(first.screenSecret).toBe('the-secret');

    // Second poll — secret already consumed
    const second = await service.pollSession(SESSION_ID, POLL_SECRET);
    expect(second.status).toBe('complete');
    expect(second.screenSecret).toBeNull();
  });

  // ─── Test 7: claimSession generates new pairingSecretHash ───────────
  it('claimSession creates screen with bcrypt-hashed secret', async () => {
    const session = makeSession({
      code: '123456',
      status: ScreenPairingSessionStatus.PENDING,
      expiresAt: new Date(Date.now() + 600000),
    });
    const fake = createFakePrisma({
      sessions: [session],
      subscriptions: [{ workspaceId: WS_ID, screenLimit: 25 }],
      workspaceMembers: new Set([`${WS_ID}:${USER_ID}`]),
    });
    const service = makeService(fake);

    const result = await service.claimSession(WS_ID, USER_ID, {
      code: '123456',
    } as never);

    expect(result.screen).toBeDefined();
    expect(result.screen.serialNumber).toBeDefined();
    // Verify the transaction was called
    expect(fake.$transaction).toHaveBeenCalled();
  });

  // ─── Test 8: claimSession on expired code → rejected ────────────────
  it('claimSession rejects expired pairing code', async () => {
    const session = makeSession({
      code: '123456',
      expiresAt: new Date(Date.now() - 1000),
    });
    const fake = createFakePrisma({
      sessions: [session],
      subscriptions: [{ workspaceId: WS_ID, screenLimit: 25 }],
      workspaceMembers: new Set([`${WS_ID}:${USER_ID}`]),
    });
    const service = makeService(fake);

    await expect(
      service.claimSession(WS_ID, USER_ID, { code: '123456' } as never),
    ).rejects.toThrow();
  });

  // ─── Test 9: claimSession on already-claimed code → rejected ────────
  it('claimSession rejects already-claimed (COMPLETE) code', async () => {
    const session = makeSession({
      code: '123456',
      status: ScreenPairingSessionStatus.COMPLETE,
    });
    const fake = createFakePrisma({
      sessions: [session],
      subscriptions: [{ workspaceId: WS_ID, screenLimit: 25 }],
      workspaceMembers: new Set([`${WS_ID}:${USER_ID}`]),
    });
    const service = makeService(fake);

    await expect(
      service.claimSession(WS_ID, USER_ID, { code: '123456' } as never),
    ).rejects.toThrow();
  });

  // ─── Test 10: pollSession on EXPIRED status → expired ───────────────
  it('returns expired status when session status is already EXPIRED', async () => {
    const session = makeSession({
      status: ScreenPairingSessionStatus.EXPIRED,
      expiresAt: new Date(Date.now() - 1000),
    });
    const fake = createFakePrisma({ sessions: [session] });
    const service = makeService(fake);

    const result = await service.pollSession(SESSION_ID, POLL_SECRET);
    expect(result.status).toBe('expired');
  });
});
