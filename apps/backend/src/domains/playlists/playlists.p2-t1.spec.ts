import { BadRequestException } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { PlaylistGroupsService } from './playlist-groups.service';
import { PlaylistResolutionService } from './playlist-resolution.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MediaService } from '../media/media.service';
import { CanvasesService } from '../canvases/canvases.service';
import { SchedulingService } from '../schedules/scheduling.service';

/**
 * P2-T1: Playlists — duplicate/clone-to-workspace/orphan/orderIndex
 *
 * Audit + tests for:
 * 1. duplicate preserves item order (orderIndex)
 * 2. clone-to-workspace copies media/canvas to target workspace only (isolation)
 * 3. clone-to-workspace rejects same source/target workspace
 * 4. replaceItems rejects orphaned media (mediaId not in workspace)
 * 5. replaceItems rejects orphaned canvas (canvasId not in workspace)
 * 6. duplicate preserves durationSec
 */

type FakePlaylistItem = {
  id: string;
  playlistId: string;
  mediaId: string | null;
  canvasId: string | null;
  orderIndex: number;
  durationSec: number;
};

type FakePlaylist = {
  id: string;
  workspaceId: string;
  name: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: FakePlaylistItem[];
};

function createFakePrisma(opts: {
  playlists?: FakePlaylist[];
  mediaCount?: number;
  canvasCount?: number;
  workspaceMembers?: Set<string>;
}) {
  const {
    playlists = [],
    mediaCount = 0,
    canvasCount = 0,
    workspaceMembers = new Set<string>(),
  } = opts;

  const playlistMap = new Map<string, FakePlaylist>(
    playlists.map((p) => [p.id, p]),
  );
  let itemCounter = 0;
  let playlistCounter = playlistMap.size;

  function createPlaylistInTx(data: {
    workspaceId: string;
    name: string;
    isPublished?: boolean;
  }): FakePlaylist {
    const p: FakePlaylist = {
      id: `pl_${++playlistCounter}`,
      workspaceId: data.workspaceId,
      name: data.name,
      isPublished: data.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };
    playlistMap.set(p.id, p);
    return p;
  }

  return {
    playlist: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const p = createPlaylistInTx({
          workspaceId: data.workspaceId as string,
          name: data.name as string,
          isPublished: data.isPublished as boolean | undefined,
        });
        return Promise.resolve(p);
      }),
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
              items: result.items
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((i) => ({ ...i, media: null, canvas: null })),
              _count: { items: result.items.length, screensInGroup: 0 },
            });
          }
          return Promise.resolve(result);
        },
      ),
      findMany: jest.fn(() => Promise.resolve([...playlistMap.values()])),
      count: jest.fn(() => Promise.resolve(playlistMap.size)),
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
        const count = p?.items.length ?? 0;
        if (p) p.items = [];
        return Promise.resolve({ count });
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
      count: jest.fn(() => Promise.resolve(0)),
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    schedule: {
      count: jest.fn(() => Promise.resolve(0)),
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
      const tx = {
        playlist: {
          create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
            const p = createPlaylistInTx({
              workspaceId: data.workspaceId as string,
              name: data.name as string,
              isPublished: data.isPublished as boolean | undefined,
            });
            return Promise.resolve(p);
          }),
        },
        playlistItem: {
          deleteMany: jest.fn(
            ({ where }: { where: { playlistId: string } }) => {
              const p = playlistMap.get(where.playlistId);
              const count = p?.items.length ?? 0;
              if (p) p.items = [];
              return Promise.resolve({ count });
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
      return fn(tx);
    }),
  };
}

function createMockHeartbeat() {
  return {
    emit: jest.fn(),
  } as unknown as EventEmitter2;
}

function createMockMediaService() {
  const calls: Array<{
    sourceWorkspaceId: string;
    mediaId: string;
    targetWorkspaceId: string;
  }> = [];
  return {
    toResponse: jest.fn((m: unknown) => m),
    duplicateMediaToWorkspace: jest.fn(
      (params: {
        sourceWorkspaceId: string;
        mediaId: string;
        targetWorkspaceId: string;
      }) => {
        calls.push(params);
        return Promise.resolve({ id: `media-dup-${params.mediaId}` });
      },
    ),
    _calls: calls,
  } as unknown as MediaService & { _calls: typeof calls };
}

function createMockCanvasesService() {
  const calls: Array<{
    sourceWorkspaceId: string;
    canvasId: string;
    targetWorkspaceId: string;
  }> = [];
  return {
    toCompiledPayload: jest.fn((c: unknown) => c),
    duplicateCanvasToWorkspace: jest.fn(
      (params: {
        sourceWorkspaceId: string;
        canvasId: string;
        targetWorkspaceId: string;
      }) => {
        calls.push(params);
        return Promise.resolve({ id: `canvas-dup-${params.canvasId}` });
      },
    ),
    _calls: calls,
  } as unknown as CanvasesService & { _calls: typeof calls };
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

function makePlaylistWithItems(): FakePlaylist {
  return {
    id: PL_ID,
    workspaceId: WS_ID,
    name: 'Test Playlist',
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        playlistId: PL_ID,
        mediaId: 'm1',
        canvasId: null,
        orderIndex: 0,
        durationSec: 10,
      },
      {
        id: 'item-2',
        playlistId: PL_ID,
        mediaId: 'm2',
        canvasId: null,
        orderIndex: 1,
        durationSec: 15,
      },
      {
        id: 'item-3',
        playlistId: PL_ID,
        mediaId: null,
        canvasId: 'c1',
        orderIndex: 2,
        durationSec: 20,
      },
    ],
  };
}

describe('PlaylistsService P2-T1 (duplicate/clone/orphan/orderIndex)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    const media = createMockMediaService();
    const canvases = createMockCanvasesService();
    const prisma = fake as unknown as PrismaService;
    const accountContext = {
      resolveOwnerId: jest.fn().mockResolvedValue('owner-1'),
    } as unknown as AccountContextHelper;
    const groupsService = new PlaylistGroupsService(prisma, accountContext);
    const resolutionService = new PlaylistResolutionService(
      prisma,
      media,
      canvases,
    );
    const service = new PlaylistsService(
      prisma,
      createMockHeartbeat(),
      media,
      canvases,
      createMockScheduling(),
      accountContext,
      groupsService,
      resolutionService,
    );
    return { service, media, canvases };
  }

  // ─── Test 1: duplicate preserves item order ─────────────────────────
  it('duplicate preserves orderIndex of items', async () => {
    const fake = createFakePrisma({ playlists: [makePlaylistWithItems()] });
    const { service } = makeService(fake);

    await service.duplicateInWorkspace(WS_ID, PL_ID);

    const findFirstMock = fake.playlist.findFirst as jest.Mock;
    const lastResult = (await findFirstMock.mock.results[
      findFirstMock.mock.results.length - 1
    ].value) as FakePlaylist & { items: FakePlaylistItem[] };
    expect(lastResult.items).toHaveLength(3);
    expect(lastResult.items[0].orderIndex).toBe(0);
    expect(lastResult.items[1].orderIndex).toBe(1);
    expect(lastResult.items[2].orderIndex).toBe(2);
  });

  // ─── Test 2: duplicate preserves durationSec ────────────────────────
  it('duplicate preserves durationSec of items', async () => {
    const fake = createFakePrisma({ playlists: [makePlaylistWithItems()] });
    const { service } = makeService(fake);

    await service.duplicateInWorkspace(WS_ID, PL_ID);

    const findFirstMock = fake.playlist.findFirst as jest.Mock;
    const lastResult = (await findFirstMock.mock.results[
      findFirstMock.mock.results.length - 1
    ].value) as FakePlaylist & { items: FakePlaylistItem[] };
    expect(lastResult.items[0].durationSec).toBe(10);
    expect(lastResult.items[1].durationSec).toBe(15);
    expect(lastResult.items[2].durationSec).toBe(20);
  });

  // ─── Test 3: clone-to-workspace rejects same source/target ──────────
  it('cloneToWorkspace rejects same source and target workspace', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylistWithItems()],
      workspaceMembers: new Set([`${WS_ID}:user-1`]),
    });
    const { service } = makeService(fake);

    await expect(
      service.cloneToWorkspace('user-1', WS_ID, PL_ID, WS_ID),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 4: clone-to-workspace copies media to target workspace only
  it('cloneToWorkspace duplicates media to target workspace (isolation)', async () => {
    const original = makePlaylistWithItems();
    const fake = createFakePrisma({
      playlists: [original],
      workspaceMembers: new Set([`${WS_ID}:user-1`, `ws-2:user-1`]),
    });
    const { service, media, canvases } = makeService(fake);

    await service.cloneToWorkspace('user-1', WS_ID, PL_ID, 'ws-2');

    // Media should be duplicated to ws-2, not ws-1
    expect(media._calls).toHaveLength(2); // m1 and m2
    expect(media._calls[0].targetWorkspaceId).toBe('ws-2');
    expect(media._calls[0].sourceWorkspaceId).toBe(WS_ID);
    expect(media._calls[1].targetWorkspaceId).toBe('ws-2');

    // Canvas should be duplicated to ws-2
    expect(canvases._calls).toHaveLength(1); // c1
    expect(canvases._calls[0].targetWorkspaceId).toBe('ws-2');
  });

  // ─── Test 5: clone-to-workspace rejects non-member ──────────────────
  it('cloneToWorkspace rejects user without access to source workspace', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylistWithItems()],
      workspaceMembers: new Set([`ws-2:user-1`]), // not member of source
    });
    const { service } = makeService(fake);

    await expect(
      service.cloneToWorkspace('user-1', WS_ID, PL_ID, 'ws-2'),
    ).rejects.toThrow(); // ForbiddenException
  });

  // ─── Test 6: replaceItems rejects orphaned media ────────────────────
  it('replaceItems rejects mediaId not in workspace (orphan prevention)', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylistWithItems()],
      mediaCount: 1, // only 1 media exists, but we reference 2
    });
    const { service } = makeService(fake);

    await expect(
      service.replaceItems(WS_ID, PL_ID, {
        items: [
          { mediaId: 'm1', orderIndex: 0, durationSec: 10 },
          { mediaId: 'm-nonexistent', orderIndex: 1, durationSec: 10 },
        ],
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 7: replaceItems rejects orphaned canvas ───────────────────
  it('replaceItems rejects canvasId not in workspace (orphan prevention)', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylistWithItems()],
      canvasCount: 0, // no canvases exist
    });
    const { service } = makeService(fake);

    await expect(
      service.replaceItems(WS_ID, PL_ID, {
        items: [{ canvasId: 'c-nonexistent', orderIndex: 0, durationSec: 10 }],
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 8: duplicate name generation ──────────────────────────────
  it('duplicate appends (copy) to name on first duplicate', async () => {
    const fake = createFakePrisma({ playlists: [makePlaylistWithItems()] });
    const { service } = makeService(fake);

    const result = await service.duplicateInWorkspace(WS_ID, PL_ID);
    expect(result.name).toContain('(copy)');
  });

  // ─── Test 9: clone-to-workspace appends (imported) to name ──────────
  it('cloneToWorkspace appends (imported) to name', async () => {
    const fake = createFakePrisma({
      playlists: [makePlaylistWithItems()],
      workspaceMembers: new Set([`${WS_ID}:user-1`, `ws-2:user-1`]),
    });
    const { service } = makeService(fake);

    const result = await service.cloneToWorkspace(
      'user-1',
      WS_ID,
      PL_ID,
      'ws-2',
    );
    expect(result.name).toContain('(imported)');
  });
});
