import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

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
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const w = wsMap.get(where.id);
        return Promise.resolve(w ? { id: w.id, name: w.name } : null);
      }),
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
      findFirst: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const m: FakeMembership = {
          id: `m_${memberMap.size + 1}`,
          workspaceId: data.workspaceId as string,
          userId: data.userId as string,
          role: (data.role as string) ?? 'VIEWER',
          createdAt: new Date(),
        };
        memberMap.set(`${m.workspaceId}:${m.userId}`, m);
        return Promise.resolve(m);
      }),
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
      findUnique: jest.fn(({ where }: { where: { id?: string; email?: string } }) => {
        if (where.email) return Promise.resolve(null);
        return Promise.resolve(
          superAdmins.has(where.id!)
            ? { isSuperAdmin: true }
            : { isSuperAdmin: false },
        );
      }),
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
    workspaceInvitation: {
      findFirst: jest.fn(() => Promise.resolve(null)),
      findUnique: jest.fn(() => Promise.resolve(null)),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ id: 'inv-1' })),
      update: jest.fn(() => Promise.resolve({})),
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
        workspaceMember: {
          create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
            const m: FakeMembership = {
              id: `m_${memberMap.size + 1}`,
              workspaceId: data.workspaceId as string,
              userId: data.userId as string,
              role: (data.role as string) ?? 'VIEWER',
              createdAt: new Date(),
            };
            memberMap.set(`${m.workspaceId}:${m.userId}`, m);
            return Promise.resolve(m);
          }),
        },
        workspaceInvitation: {
          update: jest.fn(() => Promise.resolve({})),
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

function createMockEmailService() {
  return {
    isConfigured: jest.fn(() => false),
    sendMail: jest.fn(() => Promise.resolve()),
  } as unknown as EmailService;
}

function createMockConfigService() {
  return {
    get: jest.fn(() => undefined),
  } as unknown as ConfigService;
}

const WS_ID = 'ws-1';
const USER_ID = 'user-1';

describe('WorkspacesService (P1-T6)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new WorkspacesService(
      fake as unknown as PrismaService,
      createMockMediaService(),
      createMockHeartbeat(),
      createMockEmailService(),
      createMockConfigService(),
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

  // ─── Test 10: inviteMember with invalid role → BadRequest ───────────
  it('throws BadRequest when inviteMember has invalid role', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        { id: 'm1', workspaceId: WS_ID, userId: USER_ID, role: 'OWNER', createdAt: new Date() },
      ],
    });
    const service = makeService(fake);

    await expect(
      service.inviteMember(WS_ID, USER_ID, 'new@test.com', 'OWNER'),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 11: inviteMember when already member → BadRequest ─────────
  it('throws BadRequest when email is already a member', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        { id: 'm1', workspaceId: WS_ID, userId: USER_ID, role: 'OWNER', createdAt: new Date() },
      ],
    });
    // Override findFirst to simulate existing member
    (fake.workspaceMember.findFirst as jest.Mock).mockResolvedValue({ id: 'm1' });
    const service = makeService(fake);

    await expect(
      service.inviteMember(WS_ID, USER_ID, 'existing@test.com', 'EDITOR'),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 12: inviteMember when invite already pending → BadRequest ─
  it('throws BadRequest when invitation already pending', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        { id: 'm1', workspaceId: WS_ID, userId: USER_ID, role: 'OWNER', createdAt: new Date() },
      ],
    });
    (fake.workspaceMember.findFirst as jest.Mock).mockResolvedValue(null);
    (fake.workspaceInvitation.findFirst as jest.Mock).mockResolvedValue(
      { id: 'inv-1', status: 'PENDING' },
    );
    const service = makeService(fake);

    await expect(
      service.inviteMember(WS_ID, USER_ID, 'pending@test.com', 'EDITOR'),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 13: inviteMember for new user → creates invitation ────────
  it('creates invitation for new user when email not registered', async () => {
    const fake = createFakePrisma({
      workspaces: [{ id: WS_ID, name: 'Test', slug: 'test', isPaused: false }],
      memberships: [
        { id: 'm1', workspaceId: WS_ID, userId: USER_ID, role: 'OWNER', createdAt: new Date() },
      ],
    });
    (fake.workspaceMember.findFirst as jest.Mock).mockResolvedValue(null);
    (fake.workspaceInvitation.findFirst as jest.Mock).mockResolvedValue(null);
    (fake.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
      if (where.email) return Promise.resolve(null);
      return Promise.resolve({ id: where.id, fullName: 'Inviter' });
    });
    const service = makeService(fake);

    const result = await service.inviteMember(WS_ID, USER_ID, 'newuser@test.com', 'EDITOR');
    expect(result.ok).toBe(true);
    expect(result.addedDirectly).toBe(false);
    expect(fake.workspaceInvitation.create).toHaveBeenCalled();
  });

  // ─── Test 14: acceptInvitation with invalid token → NotFound ────────
  it('throws NotFound when acceptInvitation token not found', async () => {
    const fake = createFakePrisma({});
    (fake.workspaceInvitation.findUnique as jest.Mock).mockResolvedValue(null);
    const service = makeService(fake);

    await expect(
      service.acceptInvitation('invalid-token', USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── Test 15: acceptInvitation already accepted → BadRequest ────────
  it('throws BadRequest when invitation already accepted', async () => {
    const fake = createFakePrisma({});
    (fake.workspaceInvitation.findUnique as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      status: 'ACCEPTED',
      workspaceId: WS_ID,
      email: 'test@test.com',
      role: 'EDITOR',
      expiresAt: new Date(Date.now() + 86400000),
      workspace: { id: WS_ID, name: 'Test' },
    });
    const service = makeService(fake);

    await expect(
      service.acceptInvitation('valid-token', USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 16: acceptInvitation expired → BadRequest ─────────────────
  it('throws BadRequest when invitation has expired', async () => {
    const fake = createFakePrisma({});
    (fake.workspaceInvitation.findUnique as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      status: 'PENDING',
      workspaceId: WS_ID,
      email: 'test@test.com',
      role: 'EDITOR',
      expiresAt: new Date(Date.now() - 86400000),
      workspace: { id: WS_ID, name: 'Test' },
    });
    const service = makeService(fake);

    await expect(
      service.acceptInvitation('valid-token', USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 17: acceptInvitation email mismatch → Forbidden ───────────
  it('throws Forbidden when user email does not match invitation email', async () => {
    const fake = createFakePrisma({});
    (fake.workspaceInvitation.findUnique as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      status: 'PENDING',
      workspaceId: WS_ID,
      email: 'other@test.com',
      role: 'EDITOR',
      expiresAt: new Date(Date.now() + 86400000),
      workspace: { id: WS_ID, name: 'Test' },
    });
    (fake.user.findUnique as jest.Mock).mockResolvedValue(
      { id: USER_ID, email: 'different@test.com' },
    );
    const service = makeService(fake);

    await expect(
      service.acceptInvitation('valid-token', USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── Test 18: listInvitations returns pending invites ───────────────
  it('lists pending invitations for a workspace', async () => {
    const fake = createFakePrisma({});
    const mockInvites = [
      {
        id: 'inv-1',
        email: 'a@test.com',
        role: 'EDITOR',
        status: 'PENDING',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 604800000),
      },
    ];
    (fake.workspaceInvitation.findMany as jest.Mock).mockResolvedValue(mockInvites);
    const service = makeService(fake);

    const result = await service.listInvitations(WS_ID);
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('a@test.com');
  });

  // ─── Test 19: cancelInvitation not found → NotFound ─────────────────
  it('throws NotFound when cancelInvitation invitation not found', async () => {
    const fake = createFakePrisma({});
    (fake.workspaceInvitation.findFirst as jest.Mock).mockResolvedValue(null);
    const service = makeService(fake);

    await expect(
      service.cancelInvitation(WS_ID, 'inv-999'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── Test 20: cancelInvitation already accepted → BadRequest ────────
  it('throws BadRequest when cancelling non-pending invitation', async () => {
    const fake = createFakePrisma({});
    (fake.workspaceInvitation.findFirst as jest.Mock).mockResolvedValue(
      { id: 'inv-1', status: 'ACCEPTED', workspaceId: WS_ID },
    );
    const service = makeService(fake);

    await expect(
      service.cancelInvitation(WS_ID, 'inv-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
