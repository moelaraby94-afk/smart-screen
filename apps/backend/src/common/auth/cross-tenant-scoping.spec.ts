import { NotFoundException } from '@nestjs/common';
import { CanvasesService } from '../../domains/canvases/canvases.service';
import { MediaService } from '../../domains/media/media.service';
import { SchedulesService } from '../../domains/schedules/schedules.service';
import { ScreensService } from '../../domains/screens/screens.service';
import { ScreenHeartbeatService } from '../../domains/realtime/screen-heartbeat.service';
import { PrismaService } from '../prisma/prisma.service';

const mockHeartbeat = {} as unknown as ScreenHeartbeatService;

/**
 * The second tenant boundary. RolesGuard proves the caller belongs to the
 * workspace they name (roles.guard.spec.ts); this proves that even a legitimate
 * member of workspace B cannot read workspace A's row by guessing its id,
 * because every scoped getter filters on `{ id, workspaceId }`.
 *
 * The fake Prisma below filters `findFirst`/`findUnique` honestly against *every*
 * key in the `where` clause. So if a service is ever changed to look up by `id`
 * alone, the foreign-workspace lookup starts succeeding and these tests fail —
 * which is exactly the IDOR regression they exist to catch.
 */
const OWNER_WS = 'ws_owner';
const OTHER_WS = 'ws_other';
const ROW_ID = 'row_1';

type Row = Record<string, unknown> & { id: string; workspaceId: string };

function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    // Only scalar equality is needed for these getters.
    if (value === null || typeof value !== 'object') {
      return row[key] === value;
    }
    return true;
  });
}

function makeDelegate(rows: Row[]) {
  const findFirst = jest.fn(({ where }: { where: Record<string, unknown> }) =>
    Promise.resolve(rows.find((r) => matches(r, where)) ?? null),
  );
  const findUnique = jest.fn(({ where }: { where: Record<string, unknown> }) =>
    Promise.resolve(rows.find((r) => matches(r, where)) ?? null),
  );
  return { findFirst, findUnique };
}

/** A PrismaService whose canvas/schedule/screen/media delegates all hold one row owned by OWNER_WS. */
function makeFakePrisma() {
  const row: Row = {
    id: ROW_ID,
    workspaceId: OWNER_WS,
    name: 'Owned by A',
    // fields MediaService.toResponse reads on the positive-control path:
    fileName: 'file.png',
    originalName: 'file.png',
    mimeType: 'image/png',
    relativePath: `${OWNER_WS}/file.png`,
    sizeBytes: 10,
    folderId: null,
    folder: null,
    createdAt: new Date('2026-07-10T00:00:00.000Z'),
    updatedAt: new Date('2026-07-10T00:00:00.000Z'),
  };
  return {
    canvas: makeDelegate([row]),
    schedule: makeDelegate([row]),
    screen: makeDelegate([row]),
    media: makeDelegate([row]),
  } as unknown as PrismaService;
}

const stub = () => ({}) as never;

describe('cross-tenant scoping of by-id getters', () => {
  const cases: Array<{
    name: string;
    build: (prisma: PrismaService) => {
      get: (ws: string, id: string) => Promise<unknown>;
    };
  }> = [
    {
      name: 'CanvasesService.getById',
      build: (prisma) => {
        const svc = new CanvasesService(prisma, stub());
        return { get: (ws, id) => svc.getById(ws, id) };
      },
    },
    {
      name: 'SchedulesService.getOne',
      build: (prisma) => {
        const svc = new SchedulesService(prisma, stub(), stub(), stub());
        return { get: (ws, id) => svc.getOne(ws, id) };
      },
    },
    {
      name: 'ScreensService.getById',
      build: (prisma) => {
        const svc = new ScreensService(prisma, stub(), stub(), stub());
        return { get: (ws, id) => svc.getById(ws, id) };
      },
    },
    {
      name: 'MediaService.getById',
      build: (prisma) => {
        const svc = new MediaService(
          prisma,
          {
            get: (_k: string, d?: unknown) => d,
          } as never,
          mockHeartbeat,
        );
        return { get: (ws, id) => svc.getById(ws, id) };
      },
    },
  ];

  it.each(cases)(
    '$name returns the row to its owning workspace',
    async ({ build }) => {
      const { get } = build(makeFakePrisma());

      await expect(get(OWNER_WS, ROW_ID)).resolves.toBeDefined();
    },
  );

  it.each(cases)(
    "$name rejects another workspace's id even for a valid member",
    async ({ build }) => {
      const { get } = build(makeFakePrisma());

      await expect(get(OTHER_WS, ROW_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    },
  );

  it.each(cases)('$name rejects an unknown id', async ({ build }) => {
    const { get } = build(makeFakePrisma());

    await expect(get(OWNER_WS, 'does_not_exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
