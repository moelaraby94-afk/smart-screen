import { PlaylistsService } from './playlists.service';
import { PlaylistResolutionService } from './playlist-resolution.service';
import { PlaylistGroupsService } from './playlist-groups.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MediaService } from '../media/media.service';
import { CanvasesService } from '../canvases/canvases.service';
import { SchedulingService } from '../schedules/scheduling.service';
import { toMediaResponse } from '../media/media.mapper';
import type { IStorageService } from '../../common/storage/storage.interface';

// ─── Types ───────────────────────────────────────────────────────────

type FakePlaylist = {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  isPublished: boolean;
  orientation: string;
  renderMode: string;
  targetWidth: number | null;
  targetHeight: number | null;
  createdAt: Date;
  updatedAt: Date;
  items: unknown[];
};

type FakeScreen = {
  id: string;
  workspaceId: string;
  orientation: string;
};

type FakeAssignment = {
  screenId: string;
  orderIndex: number;
  playlist: FakePlaylist;
};

// ─── Helpers ─────────────────────────────────────────────────────────

const RENDER_FIELDS = ['renderMode', 'orientation', 'targetWidth', 'targetHeight'] as const;

function makeFakeStorage(): IStorageService {
  return {
    getPublicUrl: jest.fn((key: string) => `https://cdn.test/${key}`),
    upload: jest.fn(),
    delete: jest.fn(),
    copy: jest.fn(),
    exists: jest.fn(),
    move: jest.fn(),
    ensureDir: jest.fn(),
    getSignedUrl: jest.fn(() => Promise.resolve('')),
    providerName: 'test',
  } as unknown as IStorageService;
}

function makePlaylist(overrides: Partial<FakePlaylist> = {}): FakePlaylist {
  return {
    id: 'pl-1',
    workspaceId: 'ws-1',
    ownerId: 'owner-1',
    name: 'Test Playlist',
    isPublished: true,
    orientation: 'LANDSCAPE',
    renderMode: 'CONTAIN',
    targetWidth: 1920,
    targetHeight: 1080,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
}

function makeScreen(overrides: Partial<FakeScreen> = {}): FakeScreen {
  return {
    id: 'screen-1',
    workspaceId: 'ws-1',
    orientation: 'AUTO',
    ...overrides,
  };
}

function createFakePrisma(opts: {
  playlists?: FakePlaylist[];
  screens?: FakeScreen[];
  assignments?: FakeAssignment[];
}) {
  const {
    playlists = [],
    screens = [],
    assignments = [],
  } = opts;

  const playlistMap = new Map<string, FakePlaylist>(
    playlists.map((p) => [p.id, p]),
  );

  return {
    playlist: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const p: FakePlaylist = {
          id: `pl_${playlistMap.size + 1}`,
          workspaceId: data.workspaceId as string,
          ownerId: data.ownerId as string,
          name: data.name as string,
          isPublished: (data.isPublished as boolean) ?? false,
          orientation: (data.orientation as string) ?? 'AUTO',
          renderMode: (data.renderMode as string) ?? 'CONTAIN',
          targetWidth: (data.targetWidth as number | null) ?? null,
          targetHeight: (data.targetHeight as number | null) ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        };
        playlistMap.set(p.id, p);
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
              items: [],
              _count: { items: 0, screensInGroup: 0 },
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
    },
    screen: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const s = screens.find((s) => s.id === where.id);
        return Promise.resolve(s ?? null);
      }),
      count: jest.fn(() => Promise.resolve(0)),
      findMany: jest.fn(() => Promise.resolve(screens)),
    },
    screenPlaylistAssignment: {
      findMany: jest.fn(({ where }: { where: { screenId: string } }) => {
        const filtered = assignments.filter((a) => a.screenId === where.screenId);
        return Promise.resolve(
          filtered.map((a) => ({
            ...a,
            playlist: {
              ...a.playlist,
              items: a.playlist.items.map((item, idx) => ({
                id: `item_${idx}`,
                playlistId: a.playlist.id,
                mediaId: (item as Record<string, unknown>).mediaId ?? null,
                canvasId: (item as Record<string, unknown>).canvasId ?? null,
                orderIndex: (item as Record<string, unknown>).orderIndex ?? idx,
                durationSec: (item as Record<string, unknown>).durationSec ?? 5,
                zoneName: null,
                media: null,
                canvas: null,
                nestedPlaylist: null,
              })),
            },
          })),
        );
      }),
    },
    schedule: {
      count: jest.fn(() => Promise.resolve(0)),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    workspaceMember: {
      findUnique: jest.fn(() => Promise.resolve({})),
    },
    media: { count: jest.fn(() => Promise.resolve(0)) },
    canvas: { count: jest.fn(() => Promise.resolve(0)) },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        playlist: {
          create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
            const p: FakePlaylist = {
              id: `pl_${playlistMap.size + 1}`,
              workspaceId: data.workspaceId as string,
              ownerId: data.ownerId as string,
              name: data.name as string,
              isPublished: false,
              orientation: 'AUTO',
              renderMode: 'CONTAIN',
              targetWidth: null,
              targetHeight: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              items: [],
            };
            playlistMap.set(p.id, p);
            return Promise.resolve(p);
          }),
        },
        playlistItem: {
          deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
          createMany: jest.fn(() => Promise.resolve({ count: 0 })),
          create: jest.fn(() => Promise.resolve({})),
        },
      });
    }),
  };
}

function createMockHeartbeat() {
  return { emit: jest.fn() } as unknown as EventEmitter2;
}

function createMockMediaService() {
  return {
    toResponse: jest.fn((m: unknown) => m),
    duplicateMediaToWorkspace: jest.fn(() => Promise.resolve({ id: 'media-dup' })),
  } as unknown as MediaService;
}

function createMockCanvasesService() {
  return {
    toCompiledPayload: jest.fn((c: unknown) => c),
    duplicateCanvasToWorkspace: jest.fn(() => Promise.resolve({ id: 'canvas-dup' })),
  } as unknown as CanvasesService;
}

function createMockScheduling(source: string = 'default', playlistId: string | null = null) {
  return {
    resolveEffectivePlaylistId: jest.fn(() =>
      Promise.resolve({ playlistId, source }),
    ),
  } as unknown as SchedulingService;
}

const WS_ID = 'ws-1';
const SCREEN_ID = 'screen-1';
const PL_ID = 'pl-1';

// ─── Tests ───────────────────────────────────────────────────────────

describe('Display Config Regression (Phase 1.5)', () => {
  function makeService(
    fake: ReturnType<typeof createFakePrisma>,
    schedulingSource: string = 'default',
    schedulingPlaylistId: string | null = null,
  ) {
    const media = createMockMediaService();
    const canvases = createMockCanvasesService();
    const prisma = fake as unknown as PrismaService;
    const accountContext = {
      resolveOwnerId: jest.fn().mockResolvedValue('owner-1'),
    } as unknown as AccountContextHelper;
    const groupsService = new PlaylistGroupsService(prisma, accountContext);
    const resolutionService = new PlaylistResolutionService(prisma, media, canvases);
    return new PlaylistsService(
      prisma,
      createMockHeartbeat(),
      media,
      canvases,
      createMockScheduling(schedulingSource, schedulingPlaylistId),
      accountContext,
      groupsService,
      resolutionService,
    );
  }

  // ─── C1: Rotation payload includes display configuration ───────────

  describe('C1: Rotation payload', () => {
    it('includes renderMode, orientation, targetWidth, targetHeight from first playlist', async () => {
      const pl1 = makePlaylist({
        id: 'pl-rot-1',
        name: 'Rotation A',
        renderMode: 'COVER',
        orientation: 'PORTRAIT',
        targetWidth: 1080,
        targetHeight: 1920,
        isPublished: true,
        items: [{ id: 'i1', mediaId: 'm1', canvasId: null, orderIndex: 0, durationSec: 5 }] as never,
      });
      const pl2 = makePlaylist({
        id: 'pl-rot-2',
        name: 'Rotation B',
        renderMode: 'CENTER',
        orientation: 'SQUARE',
        targetWidth: 1080,
        targetHeight: 1080,
        isPublished: true,
        items: [{ id: 'i2', mediaId: 'm2', canvasId: null, orderIndex: 0, durationSec: 5 }] as never,
      });
      const screen = makeScreen({ id: SCREEN_ID });
      const fake = createFakePrisma({
        playlists: [pl1, pl2],
        screens: [screen],
        assignments: [
          { screenId: SCREEN_ID, orderIndex: 0, playlist: pl1 },
          { screenId: SCREEN_ID, orderIndex: 1, playlist: pl2 },
        ],
      });
      const service = makeService(fake, 'rotation');

      const payload = await service.getPlaylistPayloadForScreen(SCREEN_ID);

      expect(payload).not.toBeNull();
      // Rotation takes config from first published playlist
      expect(payload!.renderMode).toBe('COVER');
      expect(payload!.orientation).toBe('PORTRAIT');
      expect(payload!.targetWidth).toBe(1080);
      expect(payload!.targetHeight).toBe(1920);
    });

    it('empty rotation fallback includes all render fields with defaults', async () => {
      const screen = makeScreen({ id: SCREEN_ID });
      const fake = createFakePrisma({
        screens: [screen],
        assignments: [], // no assignments → empty rotation
      });
      const service = makeService(fake, 'rotation');

      const payload = await service.getPlaylistPayloadForScreen(SCREEN_ID);

      expect(payload).not.toBeNull();
      for (const field of RENDER_FIELDS) {
        expect(payload).toHaveProperty(field);
      }
      expect(payload!.renderMode).toBe('CONTAIN');
      expect(payload!.orientation).toBe('AUTO');
      expect(payload!.targetWidth).toBeNull();
      expect(payload!.targetHeight).toBeNull();
    });
  });

  // ─── C2: Fallback responses include render fields ──────────────────

  describe('C2: Fallback responses', () => {
    it('no-playlist fallback (resolved.playlistId is null) includes render fields', async () => {
      const screen = makeScreen({ id: SCREEN_ID });
      const fake = createFakePrisma({
        screens: [screen],
        playlists: [],
      });
      const service = makeService(fake, 'default', null);

      const payload = await service.getPlaylistPayloadForScreen(SCREEN_ID);

      expect(payload).not.toBeNull();
      expect(payload!.playlistId).toBeNull();
      for (const field of RENDER_FIELDS) {
        expect(payload).toHaveProperty(field);
      }
      expect(payload!.renderMode).toBe('CONTAIN');
      expect(payload!.orientation).toBe('AUTO');
      expect(payload!.targetWidth).toBeNull();
      expect(payload!.targetHeight).toBeNull();
    });

    it('playlist-not-found fallback includes render fields', async () => {
      const screen = makeScreen({ id: SCREEN_ID });
      const fake = createFakePrisma({
        screens: [screen],
        playlists: [], // playlist exists in schedule but not in DB
      });
      const service = makeService(fake, 'default', 'nonexistent-pl');

      const payload = await service.getPlaylistPayloadForScreen(SCREEN_ID);

      expect(payload).not.toBeNull();
      expect(payload!.playlistId).toBeNull();
      for (const field of RENDER_FIELDS) {
        expect(payload).toHaveProperty(field);
      }
    });
  });

  // ─── C4: Shared media mapper preserves width and height ────────────

  describe('C4: Shared media mapper', () => {
    const storage = makeFakeStorage();

    it('preserves width and height when present', () => {
      const result = toMediaResponse(
        {
          id: 'm1',
          workspaceId: 'ws-1',
          fileName: 'test.jpg',
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          width: 1920,
          height: 1080,
          relativePath: 'ws-1/test.jpg',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('returns null for width and height when absent', () => {
      const result = toMediaResponse(
        {
          id: 'm2',
          workspaceId: 'ws-1',
          fileName: 'test.mp4',
          originalName: 'test.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 50000,
          relativePath: 'ws-1/test.mp4',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );
      expect(result.width).toBeNull();
      expect(result.height).toBeNull();
    });

    it('includes folder name when folder is present', () => {
      const result = toMediaResponse(
        {
          id: 'm3',
          workspaceId: 'ws-1',
          fileName: 'test.png',
          originalName: 'test.png',
          mimeType: 'image/png',
          sizeBytes: 2048,
          width: 800,
          height: 600,
          relativePath: 'ws-1/test.png',
          folderId: 'folder-1',
          folder: { id: 'folder-1', name: 'Campaigns' },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );
      expect(result.folderName).toBe('Campaigns');
      expect(result.folderId).toBe('folder-1');
    });

    it('builds publicUrl via storage service', () => {
      const result = toMediaResponse(
        {
          id: 'm4',
          workspaceId: 'ws-1',
          fileName: 'test.gif',
          originalName: 'test.gif',
          mimeType: 'image/gif',
          sizeBytes: 512,
          width: 400,
          height: 400,
          relativePath: 'ws-1/sub/test.gif',
          folderId: null,
          folder: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        storage,
      );
      expect(result.publicUrl).toBe('https://cdn.test/ws-1/sub/test.gif');
    });
  });

  // ─── C5: SQUARE orientation accepted through backend contract ──────

  describe('C5: SQUARE orientation', () => {
    it('create accepts SQUARE orientation', async () => {
      const fake = createFakePrisma({});
      const service = makeService(fake);

      const result = await service.create(
        'owner-1',
        WS_ID,
        'Square Playlist',
        null,
        'SQUARE',
      );
      expect(result.orientation).toBe('SQUARE');
    });

    it('update accepts SQUARE orientation', async () => {
      const pl = makePlaylist({ id: PL_ID, orientation: 'AUTO' });
      const fake = createFakePrisma({ playlists: [pl] });
      const service = makeService(fake);

      const result = await service.update(WS_ID, PL_ID, {
        orientation: 'SQUARE',
      } as never);
      expect(result.orientation).toBe('SQUARE');
    });

    it('create accepts SQUARE with renderMode COVER', async () => {
      const fake = createFakePrisma({});
      const service = makeService(fake);

      const result = await service.create(
        'owner-1',
        WS_ID,
        'Square Cover Playlist',
        null,
        'SQUARE',
        'COVER',
      );
      expect(result.orientation).toBe('SQUARE');
      expect(result.renderMode).toBe('COVER');
    });
  });

  // ─── C3: No `as any` — enum types enforced ─────────────────────────

  describe('C3: Enum type safety', () => {
    it('create passes orientation and renderMode to prisma without casts', async () => {
      const fake = createFakePrisma({});
      const service = makeService(fake);

      await service.create(
        'owner-1',
        WS_ID,
        'Typed Playlist',
        null,
        'PORTRAIT',
        'FIT_WIDTH',
        1080,
        1920,
      );

      expect(fake.playlist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orientation: 'PORTRAIT',
            renderMode: 'FIT_WIDTH',
            targetWidth: 1080,
            targetHeight: 1920,
          }),
        }),
      );
    });

    it('update passes orientation and renderMode to prisma without casts', async () => {
      const pl = makePlaylist({ id: PL_ID });
      const fake = createFakePrisma({ playlists: [pl] });
      const service = makeService(fake);

      await service.update(WS_ID, PL_ID, {
        orientation: 'LANDSCAPE',
        renderMode: 'CENTER',
        targetWidth: 1920,
        targetHeight: 1080,
      } as never);

      expect(fake.playlist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orientation: 'LANDSCAPE',
            renderMode: 'CENTER',
            targetWidth: 1920,
            targetHeight: 1080,
          }),
        }),
      );
    });

    it('create without orientation/renderMode uses DB defaults', async () => {
      const fake = createFakePrisma({});
      const service = makeService(fake);

      const result = await service.create('owner-1', WS_ID, 'Default Playlist');
      // Fake prisma returns defaults
      expect(result.orientation).toBe('AUTO');
      expect(result.renderMode).toBe('CONTAIN');
    });
  });

  // ─── Serialize playlist includes render fields ─────────────────────

  describe('serializePlaylist (buildPayload)', () => {
    it('includes renderMode, orientation, targetWidth, targetHeight', async () => {
      const pl = makePlaylist({
        id: PL_ID,
        renderMode: 'COVER',
        orientation: 'PORTRAIT',
        targetWidth: 1080,
        targetHeight: 1920,
        items: [],
      });
      const screen = makeScreen({ id: SCREEN_ID });
      const fake = createFakePrisma({ playlists: [pl], screens: [screen] });
      const service = makeService(fake, 'default', PL_ID);

      const payload = await service.getPlaylistPayloadForScreen(SCREEN_ID);

      expect(payload).not.toBeNull();
      expect(payload!.playlistId).toBe(PL_ID);
      expect(payload!.renderMode).toBe('COVER');
      expect(payload!.orientation).toBe('PORTRAIT');
      expect(payload!.targetWidth).toBe(1080);
      expect(payload!.targetHeight).toBe(1920);
    });
  });
});
