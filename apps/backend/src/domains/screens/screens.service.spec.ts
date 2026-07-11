import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScreensService } from './screens.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { SchedulingService } from '../schedules/scheduling.service';

type FakeScreen = {
  id: string;
  workspaceId: string;
  name: string;
  serialNumber: string;
  status: string;
  location: string | null;
  activePlaylistId: string | null;
  overridePlaylistId: string | null;
  overrideExpiresAt: Date | null;
  playlistGroupId: string | null;
  playerTicker: string | null;
  playerPlatform: string | null;
  resolutionWidth: number | null;
  resolutionHeight: number | null;
  lastSeenAt: Date | null;
  isOfflineCacheMode: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function createFakePrisma(opts: {
  screens?: FakeScreen[];
  playlists?: Set<string>;
  screenLimit?: number;
  screenCount?: number;
}) {
  const {
    screens = [],
    playlists = new Set<string>(),
    screenLimit = 25,
    screenCount,
  } = opts;

  const screenMap = new Map<string, FakeScreen>(screens.map((s) => [s.id, s]));

  return {
    subscription: {
      findUnique: jest.fn(() => Promise.resolve({ screenLimit })),
    },
    screen: {
      count: jest.fn(
        ({
          where,
        }: {
          where: { workspaceId?: string; activePlaylistId?: string };
        }) => {
          if (where?.activePlaylistId) {
            return Promise.resolve(
              screens.filter(
                (s) => s.activePlaylistId === where.activePlaylistId,
              ).length,
            );
          }
          return Promise.resolve(screenCount ?? screens.length);
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id?: string; workspaceId?: string; serialNumber?: string };
          select?: Record<string, boolean>;
        }) => {
          const result = [...screenMap.values()].find(
            (s) =>
              (!where.id || s.id === where.id) &&
              (!where.workspaceId || s.workspaceId === where.workspaceId) &&
              (!where.serialNumber || s.serialNumber === where.serialNumber),
          );
          if (!result) return Promise.resolve(null);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                if (key === 'playlistGroup') filtered[key] = null;
                else if (key === 'activePlaylist') filtered[key] = null;
                else filtered[key] = (result as Record<string, unknown>)[key];
              }
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(result);
        },
      ),
      findMany: jest.fn(() => Promise.resolve([...screenMap.values()])),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const s: FakeScreen = {
          id: `screen_${screenMap.size + 1}`,
          workspaceId: data.workspaceId as string,
          name: data.name as string,
          serialNumber: data.serialNumber as string,
          status: (data.status as string) ?? 'OFFLINE',
          location: (data.location as string) ?? null,
          activePlaylistId: null,
          overridePlaylistId: null,
          overrideExpiresAt: null,
          playlistGroupId: null,
          playerTicker: null,
          playerPlatform: (data.playerPlatform as string) ?? null,
          resolutionWidth: (data.resolutionWidth as number) ?? null,
          resolutionHeight: (data.resolutionHeight as number) ?? null,
          lastSeenAt: null,
          isOfflineCacheMode: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        screenMap.set(s.id, s);
        return Promise.resolve(s);
      }),
      update: jest.fn(
        ({
          where,
          data,
          select,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
          select?: Record<string, boolean>;
        }) => {
          const s = screenMap.get(where.id);
          if (!s) throw new Error('Screen not found');
          Object.assign(s, data);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                if (key === 'playlistGroup') filtered[key] = null;
                else if (key === 'activePlaylist') filtered[key] = null;
                else filtered[key] = (s as Record<string, unknown>)[key];
              }
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(s);
        },
      ),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const s = screenMap.get(where.id);
        if (!s) throw new Error('Screen not found');
        screenMap.delete(where.id);
        return Promise.resolve(s);
      }),
    },
    playlist: {
      findFirst: jest.fn(
        ({ where }: { where: { id: string; workspaceId?: string } }) =>
          Promise.resolve(playlists.has(where.id) ? { id: where.id } : null),
      ),
    },
  };
}

function createMockPlaylistsService() {
  return {
    getPlaylistPayloadForScreen: jest.fn(() =>
      Promise.resolve({ playlistId: 'pl-1', items: [] }),
    ),
    emitPlaylistForScreen: jest.fn(() => Promise.resolve()),
  } as unknown as PlaylistsService;
}

function createMockHeartbeat() {
  return {
    emitPlayerTicker: jest.fn(),
    emitRemoteCommand: jest.fn(),
    emitContentSync: jest.fn(),
    emitScheduleChanged: jest.fn(),
    emitPairingStarted: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

function createMockScheduling() {
  return {
    resolveEffectivePlaylistId: jest.fn(() =>
      Promise.resolve({ playlistId: 'pl-1', source: 'default' }),
    ),
  } as unknown as SchedulingService;
}

const WS_ID = 'ws-1';
const SCREEN_ID = 'screen-1';

function makeScreen(overrides: Partial<FakeScreen> = {}): FakeScreen {
  return {
    id: SCREEN_ID,
    workspaceId: WS_ID,
    name: 'Test Screen',
    serialNumber: 'CS-TEST-001',
    status: 'ONLINE',
    location: 'Lobby',
    activePlaylistId: 'pl-1',
    overridePlaylistId: null,
    overrideExpiresAt: null,
    playlistGroupId: null,
    playerTicker: null,
    playerPlatform: null,
    resolutionWidth: 1920,
    resolutionHeight: 1080,
    lastSeenAt: null,
    isOfflineCacheMode: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ScreensService (P1-T6)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new ScreensService(
      fake as unknown as PrismaService,
      createMockPlaylistsService(),
      createMockHeartbeat(),
      createMockScheduling(),
    );
  }

  // ─── Test 1: getById on non-existent → NotFound ─────────────────────
  it('throws NotFound when screen does not exist', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(service.getById(WS_ID, 'nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 2: getById on screen from different workspace → NotFound ──
  it('throws NotFound when screen is from a different workspace', async () => {
    const fake = createFakePrisma({
      screens: [makeScreen({ workspaceId: 'other-ws' })],
    });
    const service = makeService(fake);

    await expect(service.getById(WS_ID, SCREEN_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 3: getById on existing screen → success ───────────────────
  it('returns screen when found in workspace', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    const result = await service.getById(WS_ID, SCREEN_ID);
    expect(result.id).toBe(SCREEN_ID);
  });

  // ─── Test 4: create → success ───────────────────────────────────────
  it('creates a screen when within limit', async () => {
    const fake = createFakePrisma({
      screens: [],
      screenLimit: 25,
      screenCount: 0,
    });
    const service = makeService(fake);

    const result = await service.create({
      workspaceId: WS_ID,
      name: 'New Screen',
      serialNumber: 'CS-NEW-001',
    } as never);
    expect(result.name).toBe('New Screen');
  });

  // ─── Test 5: setPlaylistOverride with valid playlist → success ─────
  it('sets playlist override with valid playlist', async () => {
    const fake = createFakePrisma({
      screens: [makeScreen()],
      playlists: new Set(['pl-2']),
    });
    const service = makeService(fake);

    const result = await service.setPlaylistOverride(WS_ID, SCREEN_ID, {
      playlistId: 'pl-2',
      durationMinutes: 60,
    } as never);
    expect(result.overridePlaylistId).toBe('pl-2');
  });

  // ─── Test 6: setPlaylistOverride with null → clears override ────────
  it('clears playlist override when null is passed', async () => {
    const fake = createFakePrisma({
      screens: [
        makeScreen({
          overridePlaylistId: 'pl-2',
          overrideExpiresAt: new Date(),
        }),
      ],
    });
    const service = makeService(fake);

    const result = await service.setPlaylistOverride(WS_ID, SCREEN_ID, {
      playlistId: null,
    } as never);
    expect(result.overridePlaylistId).toBeNull();
  });

  // ─── Test 7: setPlaylistOverride with invalid playlist → BadRequest ─
  it('throws BadRequest when override playlist is not in workspace', async () => {
    const fake = createFakePrisma({
      screens: [makeScreen()],
      playlists: new Set(),
    });
    const service = makeService(fake);

    await expect(
      service.setPlaylistOverride(WS_ID, SCREEN_ID, {
        playlistId: 'nonexistent',
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 8: update with invalid activePlaylistId → BadRequest ──────
  it('throws BadRequest when updating to a non-existent activePlaylistId', async () => {
    const fake = createFakePrisma({
      screens: [makeScreen()],
      playlists: new Set(),
    });
    const service = makeService(fake);

    await expect(
      service.update(WS_ID, SCREEN_ID, {
        activePlaylistId: 'nonexistent',
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 9: update name → success ──────────────────────────────────
  it('updates screen name', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    const result = await service.update(WS_ID, SCREEN_ID, {
      name: 'Updated Screen',
    } as never);
    expect(result.name).toBe('Updated Screen');
  });

  // ─── Test 10: sendRemoteCommand 'identify' → success ────────────────
  it('sends identify remote command', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    const result = await service.sendRemoteCommand(WS_ID, SCREEN_ID, {
      command: 'identify',
    } as never);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('identify');
  });

  // ─── Test 11: sendRemoteCommand 'refresh_content' → success ─────────
  it('sends refresh_content remote command', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    const result = await service.sendRemoteCommand(WS_ID, SCREEN_ID, {
      command: 'refresh_content',
    } as never);
    expect(result.ok).toBe(true);
  });

  // ─── Test 12: sendRemoteCommand on non-existent screen → NotFound ───
  it('throws NotFound when sending command to non-existent screen', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(
      service.sendRemoteCommand(WS_ID, 'nonexistent', {
        command: 'identify',
      } as never),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── Test 13: remove → success ──────────────────────────────────────
  it('removes a screen successfully', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const service = makeService(fake);

    await expect(service.remove(WS_ID, SCREEN_ID)).resolves.toBeUndefined();
  });

  // ─── Test 14: remove non-existent → NotFound ────────────────────────
  it('throws NotFound when removing a non-existent screen', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(service.remove(WS_ID, 'nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
