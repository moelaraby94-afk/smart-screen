import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';

/**
 * In-memory stand-in for PrismaService covering workspace, workspaceMember,
 * user, screen, media, and playlist delegates.
 */

type FakeWorkspace = {
  id: string;
  name: string;
  slug: string;
  isPaused: boolean;
};

type FakeMembership = {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: Date;
};

function createFakePrisma(opts: {
  workspaces?: FakeWorkspace[];
  memberships?: FakeMembership[];
  superAdmins?: Set<string>;
  screenCount?: number;
  mediaCount?: number;
}) {
  const {
    workspaces = [],
    memberships = [],
    superAdmins = new Set<string>(),
    screenCount = 0,
    mediaCount = 0,
  } = opts;

  const wsMap = new Map<string, FakeWorkspace>(
    workspaces.map((w) => [w.id, w]),
  );
  const memberMap = new Map<string, FakeMembership>(
    memberships.map((m) => [`${m.workspaceId}:${m.userId}`, m]),
  );

  return {
    workspace: {
      count: jest.fn(() => Promise.resolve(wsMap.size)),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const w: FakeWorkspace = {
          id: `ws_${wsMap.size + 1}`,
          name: data.name as string,
          slug: data.slug as string,
          isPaused: false,
        };
        wsMap.set(w.id, w);
        return Promise.resolve(w);
      }),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const w = wsMap.get(where.id);
          if (!w) throw new Error('Workspace not found');
          Object.assign(w, data);
          return Promise.resolve({
            id: w.id,
            name: w.name,
            slug: w.slug,
            isPaused: w.isPaused,
          });
        },
      ),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const w = wsMap.get(where.id);
        if (!w) throw new Error('Workspace not found');
        wsMap.delete(where.id);
        return Promise.resolve(w);
      }),
    },
    workspaceMember: {
      count: jest.fn(({ where }: { where: { userId?: string } }) =>
        Promise.resolve(
          memberships.filter((m) => m.userId === where?.userId).length,
        ),
      ),
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: {
            workspaceId_userId: { workspaceId: string; userId: string };
          };
        }) => {
          const key = `${where.workspaceId_userId.workspaceId}:${where.workspaceId_userId.userId}`;
          return Promise.resolve(memberMap.get(key) ?? null);
        },
      ),
      findMany: jest.fn(({ where }: { where: { workspaceId?: string } }) =>
        Promise.resolve(
          memberships
            .filter((m) => m.workspaceId === where?.workspaceId)
            .map((m) => ({
              id: m.id,
              role: m.role,
              createdAt: m.createdAt,
              user: {
                id: m.userId,
                email: 'test@test.com',
                fullName: 'Test',
                locale: 'en',
                isActive: true,
              },
            })),
        ),
      ),
    },
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(
          superAdmins.has(where.id)
            ? { isSuperAdmin: true }
            : { isSuperAdmin: false },
        ),
      ),
    },
    screen: {
      count: jest.fn(() => Promise.resolve(screenCount)),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ id: 'screen-new' })),
      update: jest.fn(() => Promise.resolve({})),
    },
    media: {
      count: jest.fn(() => Promise.resolve(mediaCount)),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    playlist: {
      findFirst: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(() => Promise.resolve({ id: 'pl-new' })),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        workspace: {
          create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
            const w: FakeWorkspace = {
              id: `ws_${wsMap.size + 1}`,
              name: data.name as string,
              slug: data.slug as string,
              isPaused: false,
            };
            wsMap.set(w.id, w);
            return Promise.resolve({ id: w.id, name: w.name, slug: w.slug });
          }),
        },
        playlistItem: {
          create: jest.fn(() => Promise.resolve({})),
        },
      };
      return fn(tx);
    }),
  };
}

function createMockMediaService() {
  return {
    saveUploadedFile: jest.fn(() => Promise.resolve({ id: 'media-new' })),
  } as unknown as MediaService;
}

function createMockHeartbeat() {
  return {
    emitPairingStarted: jest.fn(),
    emitContentSync: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

const WS_ID = 'ws-1';
const USER_ID = 'user-1';

describe('WorkspacesService (P1-T6)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new WorkspacesService(
      fake as unknown as PrismaService,
      createMockMediaService(),
      createMockHeartbeat(),
    );
  }

  // ─── Test 1: updateWorkspace with no fields → BadRequest ────────────
  it('throws BadRequest when updateWorkspace has no fields', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: USER_ID,
          role: 'OWNER',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    await expect(
      service.updateWorkspace(USER_ID, WS_ID, {} as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 2: updateWorkspace with short name → BadRequest ───────────
  it('throws BadRequest when workspace name is too short', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: USER_ID,
          role: 'OWNER',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    await expect(
      service.updateWorkspace(USER_ID, WS_ID, { name: 'A' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 3: updateWorkspace as non-admin → Forbidden ───────────────
  it('throws Forbidden when non-admin tries to update workspace', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: USER_ID,
          role: 'MEMBER',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    await expect(
      service.updateWorkspace(USER_ID, WS_ID, { name: 'New Name' } as never),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── Test 4: updateWorkspace as non-member → NotFound ───────────────
  it('throws NotFound when non-member tries to update workspace', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [],
    });
    const service = makeService(fake);

    await expect(
      service.updateWorkspace(USER_ID, WS_ID, { name: 'New Name' } as never),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── Test 5: updateWorkspace as admin → success ─────────────────────
  it('updates workspace name as admin', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: USER_ID,
          role: 'ADMIN',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    const result = await service.updateWorkspace(USER_ID, WS_ID, {
      name: 'Updated Name',
    } as never);
    expect(result.name).toBe('Updated Name');
  });

  // ─── Test 6: deleteWorkspace as non-member → NotFound ───────────────
  it('throws NotFound when non-member tries to delete workspace', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [],
    });
    const service = makeService(fake);

    await expect(service.deleteWorkspace(USER_ID, WS_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ─── Test 7: deleteWorkspace as member but not admin → Forbidden ────
  it('throws Forbidden when non-admin member tries to delete', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: USER_ID,
          role: 'MEMBER',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    await expect(service.deleteWorkspace(USER_ID, WS_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ─── Test 8: seedDemoForMember as non-admin → Forbidden ─────────────
  it('throws Forbidden when non-admin tries to seed demo content', async () => {
    const fake = createFakePrisma({
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: USER_ID,
          role: 'MEMBER',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    await expect(service.seedDemoForMember(WS_ID, USER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ─── Test 9: listMembers ────────────────────────────────────────────
  it('lists workspace members', async () => {
    const fake = createFakePrisma({
      memberships: [
        {
          id: 'm1',
          workspaceId: WS_ID,
          userId: 'u1',
          role: 'OWNER',
          createdAt: new Date(),
        },
        {
          id: 'm2',
          workspaceId: WS_ID,
          userId: 'u2',
          role: 'MEMBER',
          createdAt: new Date(),
        },
      ],
    });
    const service = makeService(fake);

    const result = await service.listMembers(WS_ID);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('OWNER');
    expect(result[1].role).toBe('MEMBER');
  });
});
