import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { MediaService } from '../media/media.service';
import { CanvasesService } from '../canvases/canvases.service';
import { SchedulingService } from '../schedules/scheduling.service';

/**
 * In-memory stand-in for PrismaService covering playlist, playlistItem,
 * media, canvas, screen, schedule, and workspaceMember delegates.
 */

type FakePlaylist = {
  id: string;
  workspaceId: string;
  name: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: FakePlaylistItem[];
};

type FakePlaylistItem = {
  id: string;
  playlistId: string;
  mediaId: string | null;
  canvasId: string | null;
  orderIndex: number;
  durationSec: number;
};

function createFakePrisma(opts: {
  playlists?: FakePlaylist[];
  screens?: { id: string; activePlaylistId: string | null }[];
  schedules?: {
    playlistId: string;
    screenId: string | null;
    enabled: boolean;
  }[];
  mediaCount?: number;
  canvasCount?: number;
  workspaceMembers?: Set<string>;
}) {
  const {
    playlists = [],
    screens = [],
    schedules = [],
    mediaCount = 0,
    canvasCount = 0,
    workspaceMembers = new Set<string>(),
  } = opts;

  const playlistMap = new Map<string, FakePlaylist>(
    playlists.map((p) => [p.id, p]),
  );
  let itemCounter = 0;

  return {
    playlist: {
      create: jest.fn(
        ({
          data,
        }: {
          data: { workspaceId: string; name: string; isPublished?: boolean };
        }) => {
          const p: FakePlaylist = {
            id: `pl_${playlistMap.size + 1}`,
            workspaceId: data.workspaceId,
            name: data.name,
            isPublished: data.isPublished ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [],
          };
          playlistMap.set(p.id, p);
          return Promise.resolve(p);
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          include,
        }: {
          where: { id?: string; workspaceId?: string };
          include?: Record<string, unknown>;
        }) => {
          const result = [...playlistMap.values()].find(
            (p) =>
              (!where.id || p.id === where.id) &&
              (!where.workspaceId || p.workspaceId === where.workspaceId),
          );
          if (!result) return Promise.resolve(null);
          if (include?.items) {
            return Promise.resolve({
              ...result,
              items: result.items.map((i) => ({
                ...i,
                media: null,
                canvas: null,
              })),
              _count: { items: result.items.length, screensInGroup: 0 },
            });
          }
          return Promise.resolve(result);
        },
      ),
      findMany: jest.fn(() => Promise.resolve([...playlistMap.values()])),
      count: jest.fn(({ where }: { where: { workspaceId?: string } }) =>
        Promise.resolve(
          [...playlistMap.values()].filter(
            (p) => !where?.workspaceId || p.workspaceId === where.workspaceId,
          ).length,
        ),
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const p = playlistMap.get(where.id);
          if (!p) throw new Error('Playlist not found');
          Object.assign(p, data);
          return Promise.resolve(p);
        },
      ),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const p = playlistMap.get(where.id);
        if (!p) throw new Error('Playlist not found');
        playlistMap.delete(where.id);
        return Promise.resolve(p);
      }),
    },
    playlistItem: {
      deleteMany: jest.fn(({ where }: { where: { playlistId: string } }) => {
        const p = playlistMap.get(where.playlistId);
        if (p) p.items = [];
        return Promise.resolve({ count: p?.items.length ?? 0 });
      }),
      createMany: jest.fn(
        ({ data }: { data: Array<Omit<FakePlaylistItem, 'id'>> }) => {
          const items = data.map((d) => ({
            id: `item_${++itemCounter}`,
            ...d,
          }));
          if (items.length > 0) {
            const p = playlistMap.get(items[0].playlistId);
            if (p) p.items.push(...items);
          }
          return Promise.resolve({ count: items.length });
        },
      ),
      create: jest.fn(({ data }: { data: Omit<FakePlaylistItem, 'id'> }) => {
        const item: FakePlaylistItem = {
          id: `item_${++itemCounter}`,
          ...data,
        };
        const p = playlistMap.get(item.playlistId);
        if (p) p.items.push(item);
        return Promise.resolve(item);
      }),
    },
    media: {
      count: jest.fn(() => Promise.resolve(mediaCount)),
    },
    canvas: {
      count: jest.fn(() => Promise.resolve(canvasCount)),
    },
    screen: {
      count: jest.fn(({ where }: { where: { activePlaylistId?: string } }) =>
        Promise.resolve(
          screens.filter((s) => s.activePlaylistId === where.activePlaylistId)
            .length,
        ),
      ),
      findMany: jest.fn(
        ({ where }: { where: { workspaceId?: string; OR?: unknown[] } }) => {
          let result = screens;
          if (where?.workspaceId) {
            result = result.filter(() => {
              const p = [...playlistMap.values()].find(
                (pl) => pl.workspaceId === where.workspaceId,
              );
              return p !== undefined;
            });
          }
          return Promise.resolve(result.map((s) => ({ id: s.id })));
        },
      ),
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    schedule: {
      count: jest.fn(
        ({
          where,
        }: {
          where: { playlistId?: string; screenId?: null; enabled?: boolean };
        }) =>
          Promise.resolve(
            schedules.filter(
              (s) =>
                s.playlistId === where?.playlistId &&
                (where?.screenId === undefined ||
                  s.screenId === where.screenId) &&
                (where?.enabled === undefined || s.enabled === where.enabled),
            ).length,
          ),
      ),
      findMany: jest.fn(() => Promise.resolve([])),
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
          return Promise.resolve(workspaceMembers.has(key) ? {} : null);
        },
      ),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const self = {
        playlist: {
          create: jest.fn(
            ({
              data,
            }: {
              data: {
                workspaceId: string;
                name: string;
                isPublished?: boolean;
              };
            }) => {
              const p: FakePlaylist = {
                id: `pl_${playlistMap.size + 1}`,
                workspaceId: data.workspaceId,
                name: data.name,
                isPublished: data.isPublished ?? false,
                createdAt: new Date(),
                updatedAt: new Date(),
                items: [],
              };
              playlistMap.set(p.id, p);
              return Promise.resolve(p);
            },
          ),
        },
        playlistItem: {
          deleteMany: jest.fn(
            ({ where }: { where: { playlistId: string } }) => {
              const p = playlistMap.get(where.playlistId);
              if (p) p.items = [];
              return Promise.resolve({ count: p?.items.length ?? 0 });
            },
          ),
          createMany: jest.fn(
            ({ data }: { data: Array<Omit<FakePlaylistItem, 'id'>> }) => {
              const items = data.map((d) => ({
                id: `item_${++itemCounter}`,
                ...d,
              }));
              if (items.length > 0) {
                const p = playlistMap.get(items[0].playlistId);
                if (p) p.items.push(...items);
              }
              return Promise.resolve({ count: items.length });
            },
          ),
          create: jest.fn(
            ({ data }: { data: Omit<FakePlaylistItem, 'id'> }) => {
              const item: FakePlaylistItem = {
                id: `item_${++itemCounter}`,
                ...data,
              };
              const p = playlistMap.get(item.playlistId);
              if (p) p.items.push(item);
              return Promise.resolve(item);
            },
          ),
        },
      };
      return fn(self);
    }),
  };
}

function createMockHeartbeat() {
  return {
    emitContentSync: jest.fn(),
    emitScheduleChanged: jest.fn(),
    emitPairingStarted: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

function createMockMediaService() {
  return {
    toResponse: jest.fn((m: unknown) => m),
    duplicateMediaToWorkspace: jest.fn(() =>
      Promise.resolve({ id: 'media-dup' }),
    ),
  } as unknown as MediaService;
}

function createMockCanvasesService() {
  return {
    toCompiledPayload: jest.fn((c: unknown) => c),
    duplicateCanvasToWorkspace: jest.fn(() =>
      Promise.resolve({ id: 'canvas-dup' }),
    ),
  } as unknown as CanvasesService;
}

function createMockScheduling() {
  return {
    resolveEffectivePlaylistId: jest.fn(() =>
      Promise.resolve({ playlistId: null, source: 'default' }),
    ),
  } as unknown as SchedulingService;
}

const WS_ID = 'ws-1';
const PL_ID = 'pl-1';

function makePlaylist(overrides: Partial<FakePlaylist> = {}): FakePlaylist {
  return {
    id: PL_ID,
    workspaceId: WS_ID,
    name: 'Test Playlist',
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
}

describe('PlaylistsService (P1-T6)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new PlaylistsService(
      fake as unknown as PrismaService,
      createMockHeartbeat(),
      createMockMediaService(),
      createMockCanvasesService(),
      createMockScheduling(),
    );
  }

  // ─── Test 1: create ─────────────────────────────────────────────────
  it('creates a playlist in the workspace', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    const result = await service.create(WS_ID, 'My Playlist');
    expect(result.workspaceId).toBe(WS_ID);
    expect(result.name).toBe('My Playlist');
  });

  // ─── Test 2: update with no fields → BadRequest ─────────────────────
  it('throws BadRequest when update has no fields', async () => {
    const fake = createFakePrisma({ playlists: [makePlaylist()] });
    const service = makeService(fake);

    await expect(service.update(WS_ID, PL_ID, {} as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Test 3: replaceItems with both mediaId and canvasId → BadRequest
  it('throws BadRequest when an item has both mediaId and canvasId', async () => {
    const fake = createFakePrisma({ playlists: [makePlaylist()] });
    const service = makeService(fake);

    await expect(
      service.replaceItems(WS_ID, PL_ID, {
        items: [
          { mediaId: 'm1', canvasId: 'c1', orderIndex: 0, durationSec: 10 },
        ],
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 4: replaceItems with duplicate orderIndex → BadRequest ────
  it('throws BadRequest when orderIndex values are duplicated', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylist()],
      mediaCount: 2,
    });
    const service = makeService(fake);

    await expect(
      service.replaceItems(WS_ID, PL_ID, {
        items: [
          { mediaId: 'm1', orderIndex: 0, durationSec: 10 },
          { mediaId: 'm2', orderIndex: 0, durationSec: 10 },
        ],
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 5: remove playlist in use by screens → BadRequest ─────────
  it('throws BadRequest when removing a playlist assigned to screens (no force)', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylist()],
      screens: [{ id: 'screen-1', activePlaylistId: PL_ID }],
    });
    const service = makeService(fake);

    await expect(service.remove(WS_ID, PL_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Test 6: remove playlist in use by schedules → BadRequest ───────
  it('throws BadRequest when removing a playlist referenced by schedules (no force)', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylist()],
      schedules: [{ playlistId: PL_ID, screenId: 'screen-1', enabled: true }],
    });
    const service = makeService(fake);

    await expect(service.remove(WS_ID, PL_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Test 7: remove unused playlist → success ──────────────────────
  it('removes an unused playlist successfully', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylist()],
    });
    const service = makeService(fake);

    await expect(service.remove(WS_ID, PL_ID)).resolves.toBeUndefined();
  });

  // ─── Test 8: getOne on non-existent playlist → NotFound ─────────────
  it('throws NotFound when getting a non-existent playlist', async () => {
    const fake = createFakePrisma({ playlists: [] });
    const service = makeService(fake);

    await expect(service.getOne(WS_ID, 'nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 9: duplicateInWorkspace ──────────────────────────────────
  it('duplicates a playlist within the same workspace', async () => {
    const original = makePlaylist({
      items: [
        {
          id: 'item-1',
          playlistId: PL_ID,
          mediaId: 'm1',
          canvasId: null,
          orderIndex: 0,
          durationSec: 10,
        },
      ],
    });
    const fake = createFakePrisma({ playlists: [original] });
    const service = makeService(fake);

    const result = await service.duplicateInWorkspace(WS_ID, PL_ID);
    expect(result.name).toContain('(copy)');
  });
});
