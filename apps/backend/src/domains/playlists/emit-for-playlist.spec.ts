/**
 * Regression tests for F-01: emitForPlaylist cycle protection.
 *
 * Verifies that a circular nested-playlist reference cannot cause
 * infinite recursion in the upward cascade of emitForPlaylist.
 */

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
 * Minimal fake prisma that supports the queries used by emitForPlaylist:
 * - screen.findMany (by activePlaylistId / overridePlaylistId)
 * - screenPlaylistAssignment.findMany (by playlistId)
 * - schedule.findMany (by playlistId, enabled)
 * - playlistItem.findMany (by nestedPlaylistId)
 * - screen.findMany (by workspaceId)
 *
 * The screen/assignment/schedule queries return empty arrays so the test
 * focuses purely on the recursive cascade through playlistItem.findMany.
 */

type PlaylistItemRow = { playlistId: string; nestedPlaylistId: string | null };

function createFakePrismaForEmit(items: PlaylistItemRow[]) {
  const playlistItemFindMany = jest.fn(
    ({ where }: { where: { nestedPlaylistId?: string } }) => {
      const result = items.filter(
        (i) => i.nestedPlaylistId === where.nestedPlaylistId,
      );
      return Promise.resolve(
        result.map((r) => ({ playlistId: r.playlistId })),
      );
    },
  );

  return {
    playlist: {
      create: jest.fn(),
      findFirst: jest.fn(() => Promise.resolve(null)),
      findMany: jest.fn(() => Promise.resolve([])),
      count: jest.fn(() => Promise.resolve(0)),
      update: jest.fn(),
      delete: jest.fn(),
    },
    playlistItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      findMany: playlistItemFindMany,
    },
    media: {
      count: jest.fn(() => Promise.resolve(0)),
    },
    canvas: {
      count: jest.fn(() => Promise.resolve(0)),
    },
    screen: {
      count: jest.fn(() => Promise.resolve(0)),
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    screenPlaylistAssignment: {
      findMany: jest.fn(() => Promise.resolve([])),
    },
    schedule: {
      count: jest.fn(() => Promise.resolve(0)),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    workspaceMember: {
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({});
    }),
  } as unknown as PrismaService;
}

function makeService(prisma: PrismaService): PlaylistsService {
  const media = {
    toResponse: jest.fn((m: unknown) => m),
    duplicateMediaToWorkspace: jest.fn(),
  } as unknown as MediaService;
  const canvases = {
    toCompiledPayload: jest.fn((c: unknown) => c),
    duplicateCanvasToWorkspace: jest.fn(),
  } as unknown as CanvasesService;
  const accountContext = {
    resolveOwnerId: jest.fn().mockResolvedValue('owner-1'),
  } as unknown as AccountContextHelper;
  const groupsService = new PlaylistGroupsService(prisma, accountContext);
  const resolutionService = new PlaylistResolutionService(prisma, media, canvases);
  const heartbeat = {
    emit: jest.fn(),
  } as unknown as EventEmitter2;
  const scheduling = {
    resolveEffectivePlaylistId: jest.fn(() =>
      Promise.resolve({ playlistId: null, source: 'default' }),
    ),
  } as unknown as SchedulingService;
  return new PlaylistsService(
    prisma,
    heartbeat,
    media,
    canvases,
    scheduling,
    accountContext,
    groupsService,
    resolutionService,
  );
}

describe('emitForPlaylist cycle protection (F-01)', () => {
  it('terminates when a circular nested-playlist reference exists', async () => {
    // A → B → A (circular)
    const items: PlaylistItemRow[] = [
      { playlistId: 'B', nestedPlaylistId: 'A' }, // B contains A as nested
      { playlistId: 'A', nestedPlaylistId: 'B' }, // A contains B as nested
    ];
    const prisma = createFakePrismaForEmit(items);
    const service = makeService(prisma);

    // Should complete without stack overflow
    await expect(service.emitForPlaylist('A')).resolves.toBeUndefined();
  });

  it('terminates on self-referencing playlist', async () => {
    // A → A (self-reference)
    const items: PlaylistItemRow[] = [
      { playlistId: 'A', nestedPlaylistId: 'A' },
    ];
    const prisma = createFakePrismaForEmit(items);
    const service = makeService(prisma);

    await expect(service.emitForPlaylist('A')).resolves.toBeUndefined();
  });

  it('terminates on a three-node cycle', async () => {
    // A → B → C → A
    const items: PlaylistItemRow[] = [
      { playlistId: 'B', nestedPlaylistId: 'A' },
      { playlistId: 'C', nestedPlaylistId: 'B' },
      { playlistId: 'A', nestedPlaylistId: 'C' },
    ];
    const prisma = createFakePrismaForEmit(items);
    const service = makeService(prisma);

    await expect(service.emitForPlaylist('A')).resolves.toBeUndefined();
  });

  it('still visits all parents in a non-circular chain', async () => {
    // C is nested in B, B is nested in A
    // emitForPlaylist('C') should cascade to B then A
    const items: PlaylistItemRow[] = [
      { playlistId: 'B', nestedPlaylistId: 'C' },
      { playlistId: 'A', nestedPlaylistId: 'B' },
    ];
    const prisma = createFakePrismaForEmit(items);
    const service = makeService(prisma);

    await service.emitForPlaylist('C');

    // playlistItem.findMany should have been called for 'C' (initial), 'B' (parent), 'A' (grandparent)
    const findManyCalls = (prisma as unknown as {
      playlistItem: { findMany: jest.Mock };
    }).playlistItem.findMany.mock.calls;
    const queriedNestedIds = findManyCalls.map(
      (c: [{ where: { nestedPlaylistId: string } }]) =>
        c[0].where.nestedPlaylistId,
    );
    expect(queriedNestedIds).toContain('C');
    expect(queriedNestedIds).toContain('B');
    expect(queriedNestedIds).toContain('A');
  });

  it('does not re-visit a playlist already seen via a different path', async () => {
    // Diamond: D nested in B and C; B and C both nested in A
    // emitForPlaylist('D') → B → A, then C → A (already visited)
    const items: PlaylistItemRow[] = [
      { playlistId: 'B', nestedPlaylistId: 'D' },
      { playlistId: 'C', nestedPlaylistId: 'D' },
      { playlistId: 'A', nestedPlaylistId: 'B' },
      { playlistId: 'A', nestedPlaylistId: 'C' },
    ];
    const prisma = createFakePrismaForEmit(items);
    const service = makeService(prisma);

    await service.emitForPlaylist('D');

    const findManyCalls = (prisma as unknown as {
      playlistItem: { findMany: jest.Mock };
    }).playlistItem.findMany.mock.calls;
    const queriedNestedIds = findManyCalls.map(
      (c: [{ where: { nestedPlaylistId: string } }]) =>
        c[0].where.nestedPlaylistId,
    );
    // A should be queried exactly once (via B), not again via C
    const aCount = queriedNestedIds.filter((id: string) => id === 'A').length;
    expect(aCount).toBe(1);
  });
});

describe('emitForPlaylist batched concurrency (F-05)', () => {
  /**
   * Creates a fake prisma where screen.findMany returns screens with
   * activePlaylistId matching the queried playlist, and
   * screenPlaylistAssignment.findMany returns assignments for that playlist.
   * This lets us test the actual screen emission path.
   */
  function createFakePrismaWithScreens(
    screens: { id: string; activePlaylistId: string }[],
    items: PlaylistItemRow[] = [],
  ) {
    const playlistItemFindMany = jest.fn(
      ({ where }: { where: { nestedPlaylistId?: string } }) => {
        const result = items.filter(
          (i) => i.nestedPlaylistId === where.nestedPlaylistId,
        );
        return Promise.resolve(
          result.map((r) => ({ playlistId: r.playlistId })),
        );
      },
    );

    return {
      playlist: {
        create: jest.fn(),
        findFirst: jest.fn(() => Promise.resolve(null)),
        findMany: jest.fn(() => Promise.resolve([])),
        count: jest.fn(() => Promise.resolve(0)),
        update: jest.fn(),
        delete: jest.fn(),
      },
      playlistItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        create: jest.fn(),
        findMany: playlistItemFindMany,
      },
      media: {
        count: jest.fn(() => Promise.resolve(0)),
      },
      canvas: {
        count: jest.fn(() => Promise.resolve(0)),
      },
      screen: {
        count: jest.fn(() => Promise.resolve(0)),
        findMany: jest.fn(
          ({ where }: { where: { OR?: Array<Record<string, string>>; workspaceId?: string } }) => {
            if (where?.OR) {
              // Match by activePlaylistId or overridePlaylistId
              return Promise.resolve(
                screens
                  .filter((s) =>
                    where.OR!.some(
                      (cond) =>
                        cond.activePlaylistId === s.activePlaylistId ||
                        cond.overridePlaylistId === s.activePlaylistId,
                    ),
                  )
                  .map((s) => ({ id: s.id })),
              );
            }
            return Promise.resolve(screens.map((s) => ({ id: s.id })));
          },
        ),
        findUnique: jest.fn(() => Promise.resolve(null)),
      },
      screenPlaylistAssignment: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
      schedule: {
        count: jest.fn(() => Promise.resolve(0)),
        findMany: jest.fn(() => Promise.resolve([])),
      },
      workspaceMember: {
        findUnique: jest.fn(() => Promise.resolve(null)),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({});
      }),
    } as unknown as PrismaService;
  }

  it('processes multiple screens concurrently (not sequentially)', async () => {
    const screens = [
      { id: 'screen-1', activePlaylistId: 'pl-A' },
      { id: 'screen-2', activePlaylistId: 'pl-A' },
      { id: 'screen-3', activePlaylistId: 'pl-A' },
    ];
    const prisma = createFakePrismaWithScreens(screens);
    const service = makeService(prisma);

    // Spy on emitPlaylistForScreen to track concurrency
    const emitSpy = jest.spyOn(service, 'emitPlaylistForScreen');
    // Make each call take a small amount of time
    emitSpy.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const start = Date.now();
    await service.emitForPlaylist('pl-A');
    const elapsed = Date.now() - start;

    // All 3 screens should have been called
    expect(emitSpy).toHaveBeenCalledTimes(3);

    // With batch size 5, all 3 run in one batch → ~10ms total
    // Sequential would be ~30ms. Allow margin for CI jitter.
    expect(elapsed).toBeLessThan(25);

    emitSpy.mockRestore();
  });

  it('failure in one screen does not stop others', async () => {
    const screens = [
      { id: 'screen-1', activePlaylistId: 'pl-A' },
      { id: 'screen-2', activePlaylistId: 'pl-A' },
      { id: 'screen-3', activePlaylistId: 'pl-A' },
    ];
    const prisma = createFakePrismaWithScreens(screens);
    const service = makeService(prisma);

    const emitSpy = jest.spyOn(service, 'emitPlaylistForScreen');
    emitSpy.mockImplementation(async (screenId: string) => {
      if (screenId === 'screen-2') {
        throw new Error('DB connection lost');
      }
    });

    // Should not throw — failures are swallowed by Promise.allSettled
    await expect(service.emitForPlaylist('pl-A')).resolves.toBeUndefined();

    // All 3 screens should have been attempted
    expect(emitSpy).toHaveBeenCalledTimes(3);

    emitSpy.mockRestore();
  });

  it('preserves existing behavior — all screens still receive emissions', async () => {
    const screens = [
      { id: 'screen-1', activePlaylistId: 'pl-A' },
      { id: 'screen-2', activePlaylistId: 'pl-A' },
    ];
    const prisma = createFakePrismaWithScreens(screens);
    const service = makeService(prisma);

    const emitSpy = jest.spyOn(service, 'emitPlaylistForScreen');
    emitSpy.mockResolvedValue(undefined);

    await service.emitForPlaylist('pl-A');

    const calledScreenIds = emitSpy.mock.calls.map((c) => c[0]);
    expect(calledScreenIds).toContain('screen-1');
    expect(calledScreenIds).toContain('screen-2');

    emitSpy.mockRestore();
  });
});
