import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CanvasesService } from './canvases.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';

type FakeCanvas = {
  id: string;
  workspaceId: string;
  createdById: string;
  name: string;
  width: number;
  height: number;
  layoutData: unknown;
  durationSec: number;
  type: string;
  contentUrl: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function createFakePrisma(opts: {
  canvases?: FakeCanvas[];
  playlistItemCanvasCount?: number;
}) {
  const { canvases = [], playlistItemCanvasCount = 0 } = opts;

  const canvasMap = new Map<string, FakeCanvas>(canvases.map((c) => [c.id, c]));

  return {
    canvas: {
      create: jest.fn(
        ({
          data,
          select,
        }: {
          data: Record<string, unknown>;
          select?: Record<string, boolean>;
        }) => {
          const c: FakeCanvas = {
            id: `canvas_${canvasMap.size + 1}`,
            workspaceId: data.workspaceId as string,
            createdById: data.createdById as string,
            name: data.name as string,
            width: (data.width as number) ?? 1920,
            height: (data.height as number) ?? 1080,
            layoutData: data.layoutData ?? {},
            durationSec: (data.durationSec as number) ?? 15,
            type: (data.type as string) ?? 'custom',
            contentUrl: (data.contentUrl as string | null) ?? null,
            metadata: data.metadata ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          canvasMap.set(c.id, c);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key])
                filtered[key] = (c as Record<string, unknown>)[key];
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(c);
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id?: string; workspaceId?: string };
          select?: Record<string, boolean>;
        }) => {
          const result = [...canvasMap.values()].find(
            (c) =>
              (!where.id || c.id === where.id) &&
              (!where.workspaceId || c.workspaceId === where.workspaceId),
          );
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
      findUnique: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id: string };
          select?: Record<string, boolean>;
        }) => {
          const result = canvasMap.get(where.id);
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
      findMany: jest.fn(() => Promise.resolve([...canvasMap.values()])),
      count: jest.fn(({ where }: { where: { workspaceId?: string } }) =>
        Promise.resolve(
          [...canvasMap.values()].filter(
            (c) => !where?.workspaceId || c.workspaceId === where.workspaceId,
          ).length,
        ),
      ),
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
          const c = canvasMap.get(where.id);
          if (!c) throw new Error('Canvas not found');
          Object.assign(c, data);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key])
                filtered[key] = (c as Record<string, unknown>)[key];
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(c);
        },
      ),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const c = canvasMap.get(where.id);
        if (!c) throw new Error('Canvas not found');
        canvasMap.delete(where.id);
        return Promise.resolve(c);
      }),
    },
    playlistItem: {
      count: jest.fn(({ where }: { where: { canvasId?: string } }) =>
        Promise.resolve(where?.canvasId ? playlistItemCanvasCount : 0),
      ),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    screen: {
      findMany: jest.fn(() => Promise.resolve([])),
    },
  };
}

function createMockHeartbeat() {
  return {
    emitCanvasLive: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

const WS_ID = 'ws-1';
const USER_ID = 'user-1';
const CANVAS_ID = 'canvas-1';

function makeCanvas(overrides: Partial<FakeCanvas> = {}): FakeCanvas {
  return {
    id: CANVAS_ID,
    workspaceId: WS_ID,
    createdById: USER_ID,
    name: 'Test Canvas',
    width: 1920,
    height: 1080,
    layoutData: {},
    durationSec: 15,
    type: 'custom',
    contentUrl: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CanvasesService (P1-T6)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new CanvasesService(
      fake as unknown as PrismaService,
      createMockHeartbeat(),
    );
  }

  // ─── Test 1: create ─────────────────────────────────────────────────
  it('creates a canvas with defaults', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    const result = await service.create(WS_ID, USER_ID, {
      name: 'My Canvas',
    } as never);
    expect(result.name).toBe('My Canvas');
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  // ─── Test 2: getById on non-existent → NotFound ─────────────────────
  it('throws NotFound when getting a non-existent canvas', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(service.getById(WS_ID, 'nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 3: getById on canvas from different workspace → NotFound ──
  it('throws NotFound when canvas is from a different workspace', async () => {
    const fake = createFakePrisma({
      canvases: [makeCanvas({ workspaceId: 'other-ws' })],
    });
    const service = makeService(fake);

    await expect(service.getById(WS_ID, CANVAS_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 4: update ─────────────────────────────────────────────────
  it('updates canvas name and broadcasts', async () => {
    const fake = createFakePrisma({
      canvases: [makeCanvas()],
    });
    const service = makeService(fake);

    const result = await service.update(WS_ID, CANVAS_ID, {
      name: 'Updated Canvas',
    } as never);
    expect(result.name).toBe('Updated Canvas');
  });

  // ─── Test 5: remove canvas in use → BadRequest ──────────────────────
  it('throws BadRequest when removing a canvas used in playlists', async () => {
    const fake = createFakePrisma({
      canvases: [makeCanvas()],
      playlistItemCanvasCount: 2,
    });
    const service = makeService(fake);

    await expect(service.remove(WS_ID, CANVAS_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Test 6: remove unused canvas → success ────────────────────────
  it('removes an unused canvas successfully', async () => {
    const fake = createFakePrisma({
      canvases: [makeCanvas()],
      playlistItemCanvasCount: 0,
    });
    const service = makeService(fake);

    await expect(service.remove(WS_ID, CANVAS_ID)).resolves.toBeUndefined();
  });

  // ─── Test 7: duplicateCanvasToWorkspace ─────────────────────────────
  it('duplicates a canvas to another workspace', async () => {
    const fake = createFakePrisma({
      canvases: [makeCanvas()],
    });
    const service = makeService(fake);

    const result = await service.duplicateCanvasToWorkspace({
      sourceWorkspaceId: WS_ID,
      canvasId: CANVAS_ID,
      targetWorkspaceId: 'ws-2',
      createdById: USER_ID,
    });
    expect(result.id).toBeDefined();
  });

  // ─── Test 8: duplicateCanvasToWorkspace with non-existent source → NotFound
  it('throws NotFound when duplicating a non-existent canvas', async () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    await expect(
      service.duplicateCanvasToWorkspace({
        sourceWorkspaceId: WS_ID,
        canvasId: 'nonexistent',
        targetWorkspaceId: 'ws-2',
        createdById: USER_ID,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── Test 9: toCompiledPayload ──────────────────────────────────────
  it('serializes canvas to compiled payload', () => {
    const fake = createFakePrisma({});
    const service = makeService(fake);

    const payload = service.toCompiledPayload({
      id: 'c1',
      name: 'Test',
      width: 1920,
      height: 1080,
      layoutData: { elements: [] },
      durationSec: 30,
    });
    expect(payload.id).toBe('c1');
    expect(payload.width).toBe(1920);
    expect(payload.durationSec).toBe(30);
    expect(payload.layoutData).toEqual({ elements: [] });
  });

  // ─── Test 10: getCompiledForPlayer ──────────────────────────────────
  it('returns compiled payload for player', async () => {
    const fake = createFakePrisma({
      canvases: [makeCanvas({ layoutData: { foo: 'bar' } })],
    });
    const service = makeService(fake);

    const result = await service.getCompiledForPlayer(WS_ID, CANVAS_ID);
    expect(result.id).toBe(CANVAS_ID);
    expect(result.layoutData).toEqual({ foo: 'bar' });
  });
});
