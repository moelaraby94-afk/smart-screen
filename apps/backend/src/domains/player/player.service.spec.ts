import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PlayerService } from './player.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { CanvasesService } from '../canvases/canvases.service';
import { PrayerTimesService } from '../islamic/prayer-times.service';
import { DomainException } from '../../common/errors/domain.exception';

type FakeScreen = {
  id: string;
  serialNumber: string;
  workspaceId: string;
  playerTicker: string | null;
  pairingSecretHash: string | null;
  workspace: { isPaused: boolean; name: string };
};

function createFakePrisma(opts: {
  screens?: FakeScreen[];
  users?: Map<string, { isSuperAdmin: boolean }>;
  workspaces?: Map<string, { id: string; isPaused: boolean; name: string }>;
  memberships?: Set<string>;
}) {
  const {
    screens = [],
    users = new Map<string, { isSuperAdmin: boolean }>(),
    workspaces = new Map<
      string,
      { id: string; isPaused: boolean; name: string }
    >(),
    memberships = new Set<string>(),
  } = opts;

  return {
    screen: {
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where: { serialNumber?: string; workspaceId?: string };
          select?: Record<string, boolean>;
        }) => {
          let result = screens;
          if (where.serialNumber) {
            result = result.filter(
              (s) => s.serialNumber === where.serialNumber,
            );
          }
          if (where.workspaceId) {
            result = result.filter((s) => s.workspaceId === where.workspaceId);
          }
          const found = result[0];
          if (!found) return Promise.resolve(null);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                if (key === 'workspace') {
                  filtered[key] = found.workspace;
                } else {
                  filtered[key] = (found as Record<string, unknown>)[key];
                }
              }
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(found);
        },
      ),
    },
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const u = users.get(where.id);
        return Promise.resolve(
          u ? { id: where.id, isSuperAdmin: u.isSuperAdmin } : null,
        );
      }),
    },
    workspace: {
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id?: string; name?: string };
          select?: Record<string, boolean>;
        }) => {
          let result: { id: string; isPaused: boolean; name: string } | null =
            null;
          if (where.id) {
            result = workspaces.get(where.id) ?? null;
          } else if (where.name) {
            result =
              [...workspaces.values()].find((w) => w.name === where.name) ??
              null;
          }
          if (!result) return Promise.resolve(null);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key])
                filtered[key] = (result as Record<string, unknown>)[key];
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(result);
        },
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
          return Promise.resolve(memberships.has(key) ? {} : null);
        },
      ),
    },
  };
}

function createMockConfigService(
  sharedSecret: string = 'dev-player-heartbeat-secret',
) {
  return {
    get: jest.fn((key: string, fallback?: string) =>
      key === 'PLAYER_HEARTBEAT_SECRET' ? sharedSecret : fallback,
    ),
  } as unknown as ConfigService;
}

function createMockPlaylistsService() {
  return {
    getPlaylistPayloadForScreen: jest.fn(() =>
      Promise.resolve({
        workspaceId: 'ws-1',
        screenId: 'screen-1',
        playlistId: 'pl-1',
        name: 'Test Playlist',
        items: [],
      }),
    ),
  } as unknown as PlaylistsService;
}

function createMockCanvasesService() {
  return {
    getCompiledForPlayer: jest.fn(() =>
      Promise.resolve({
        id: 'canvas-1',
        name: 'Test Canvas',
        width: 1920,
        height: 1080,
        layoutData: {},
        durationSec: 15,
      }),
    ),
  } as unknown as CanvasesService;
}

const SCREEN_ID = 'screen-1';
const SERIAL = 'CS-TEST-001';
const WS_ID = 'ws-1';

function makeScreen(overrides: Partial<FakeScreen> = {}): FakeScreen {
  return {
    id: SCREEN_ID,
    serialNumber: SERIAL,
    workspaceId: WS_ID,
    playerTicker: 'Hello World',
    pairingSecretHash: null,
    workspace: { isPaused: false, name: 'Test WS' },
    ...overrides,
  };
}

describe('PlayerService (P1-T6)', () => {
  function makeService(
    fake: ReturnType<typeof createFakePrisma>,
    config?: ReturnType<typeof createMockConfigService>,
  ) {
    return new PlayerService(
      fake as unknown as PrismaService,
      config ?? createMockConfigService(),
      createMockPlaylistsService(),
      createMockCanvasesService(),
      {
        checkPrayerPause: jest.fn().mockResolvedValue({
          paused: false,
          prayer: null,
          remainingMinutes: 0,
        }),
      } as unknown as PrayerTimesService,
    );
  }

  // ─── Test 1: getBootstrap without serialNumber → NotFound ──────────
  it('throws NotFound when serialNumber is missing', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(service.getBootstrap(undefined, 'secret')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 2: getBootstrap with unknown serial → NotFound ────────────
  it('throws NotFound when screen does not exist', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(service.getBootstrap('CS-UNKNOWN', 'secret')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 3: getBootstrap without secret → Unauthorized ────────────
  it('throws Unauthorized when no secret is provided', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    await expect(service.getBootstrap(SERIAL, undefined)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── Test 4: getBootstrap with wrong shared secret → Unauthorized ──
  it('throws Unauthorized when shared secret is wrong (no per-screen hash)', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    await expect(service.getBootstrap(SERIAL, 'wrong-secret')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── Test 5: getBootstrap without per-screen hash → Unauthorized ──
  it('rejects shared secret fallback when no per-screen hash (Phase 2)', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    await expect(
      service.getBootstrap(SERIAL, 'dev-player-heartbeat-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ─── Test 6: getBootstrap with per-screen secret hash → success ────
  it('authenticates with per-screen bcrypt secret', async () => {
    const secretHash = await bcrypt.hash('my-screen-secret', 10);
    const fake = createFakePrisma({
      screens: [makeScreen({ pairingSecretHash: secretHash })],
    });
    const service = makeService(fake);

    const result = await service.getBootstrap(SERIAL, 'my-screen-secret');
    expect(result.screenId).toBe(SCREEN_ID);
  });

  // ─── Test 7: getBootstrap with wrong per-screen secret → Unauthorized
  it('throws Unauthorized when per-screen secret is wrong', async () => {
    const secretHash = await bcrypt.hash('correct-secret', 10);
    const fake = createFakePrisma({
      screens: [makeScreen({ pairingSecretHash: secretHash })],
    });
    const service = makeService(fake);

    await expect(service.getBootstrap(SERIAL, 'wrong-secret')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── Test 8: getBootstrap on paused workspace → WORKSPACE_PAUSED ────
  it('throws WORKSPACE_PAUSED when workspace is paused', async () => {
    const secretHash = await bcrypt.hash('test-secret', 10);
    const fake = createFakePrisma({
      screens: [
        makeScreen({
          pairingSecretHash: secretHash,
          workspace: { isPaused: true, name: 'Paused WS' },
        }),
      ],
    });
    const service = makeService(fake);

    await expect(service.getBootstrap(SERIAL, 'test-secret')).rejects.toThrow(
      DomainException,
    );
  });

  // ─── Test 9: getCompiledCanvas success ──────────────────────────────
  it('returns compiled canvas for authenticated screen', async () => {
    const secretHash = await bcrypt.hash('test-secret', 10);
    const fake = createFakePrisma({
      screens: [makeScreen({ pairingSecretHash: secretHash })],
    });
    const service = makeService(fake);

    const result = await service.getCompiledCanvas(
      SERIAL,
      'test-secret',
      'canvas-1',
    );
    expect(result.id).toBe('canvas-1');
  });

  // ─── Test 10: getBootstrapForAuthenticatedUser — non-member → Forbidden
  it('throws Forbidden when non-member tries to get bootstrap', async () => {
    const fake = createFakePrisma({
      users: new Map([['user-1', { isSuperAdmin: false }]]),
      workspaces: new Map([
        ['ws-1', { id: 'ws-1', isPaused: false, name: 'Test WS' }],
      ]),
      memberships: new Set(),
    });
    const service = makeService(fake);

    await expect(
      service.getBootstrapForAuthenticatedUser(
        { sub: 'user-1' } as never,
        'ws-1',
        undefined,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── Test 11: getBootstrapForAuthenticatedUser — super admin → success
  it('allows super admin to get bootstrap without membership', async () => {
    const fake = createFakePrisma({
      users: new Map([['admin-1', { isSuperAdmin: true }]]),
      workspaces: new Map([
        ['ws-1', { id: 'ws-1', isPaused: false, name: 'Test WS' }],
      ]),
      screens: [makeScreen()],
    });
    const service = makeService(fake);

    const result = await service.getBootstrapForAuthenticatedUser(
      { sub: 'admin-1' } as never,
      'ws-1',
      undefined,
    );
    expect(result.screenId).toBe(SCREEN_ID);
  });

  // ─── Test 12: getBootstrapForAuthenticatedUser — paused → WORKSPACE_PAUSED
  it('throws WORKSPACE_PAUSED for authenticated user on paused workspace', async () => {
    const fake = createFakePrisma({
      users: new Map([['admin-1', { isSuperAdmin: true }]]),
      workspaces: new Map([
        ['ws-1', { id: 'ws-1', isPaused: true, name: 'Paused WS' }],
      ]),
    });
    const service = makeService(fake);

    await expect(
      service.getBootstrapForAuthenticatedUser(
        { sub: 'admin-1' } as never,
        'ws-1',
        undefined,
      ),
    ).rejects.toThrow(DomainException);
  });
});
