import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceAuthHelper } from './workspace-auth.helper';
import { PrismaService } from '../prisma/prisma.service';

function makePrisma(opts: {
  isSuperAdmin?: boolean;
  membership?: { role: string } | null;
}) {
  const { isSuperAdmin = false, membership = null } = opts;
  return {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve(
          isSuperAdmin ? { isSuperAdmin: true } : { isSuperAdmin: false },
        ),
      ),
    },
    workspaceMember: {
      findUnique: jest.fn(() => Promise.resolve(membership)),
    },
  } as unknown as PrismaService;
}

const WS_ID = 'ws-1';
const USER_ID = 'user-1';

describe('WorkspaceAuthHelper', () => {
  // ─── Normal workspace member ────────────────────────────────────────
  it('passes for a normal workspace member without requireAdmin', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'VIEWER' } }),
    );
    await expect(
      helper.assertAccess({ workspaceId: WS_ID, userId: USER_ID }),
    ).resolves.toBeUndefined();
  });

  // ─── Missing workspace / missing membership ─────────────────────────
  it('throws NotFoundException when membership is not found', async () => {
    const helper = new WorkspaceAuthHelper(makePrisma({ membership: null }));
    await expect(
      helper.assertAccess({ workspaceId: WS_ID, userId: USER_ID }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException with default message for non-member', async () => {
    const helper = new WorkspaceAuthHelper(makePrisma({ membership: null }));
    await expect(
      helper.assertAccess({ workspaceId: WS_ID, userId: USER_ID }),
    ).rejects.toThrow('Workspace not found');
  });

  it('throws NotFoundException with custom message for non-member', async () => {
    const helper = new WorkspaceAuthHelper(makePrisma({ membership: null }));
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        notFoundMessage: 'Branch not found',
      }),
    ).rejects.toThrow('Branch not found');
  });

  // ─── Admin required ─────────────────────────────────────────────────
  it('passes for ADMIN when requireAdmin is true', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'ADMIN' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('passes for OWNER when requireAdmin is true', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'OWNER' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('throws ForbiddenException when requireAdmin is true and role is VIEWER', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'VIEWER' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when requireAdmin is true and role is EDITOR', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'EDITOR' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException with default message for insufficient role', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'VIEWER' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
      }),
    ).rejects.toThrow('Only owners and admins can update this workspace.');
  });

  it('throws ForbiddenException with custom message for insufficient role', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'VIEWER' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
        forbiddenMessage: 'Only owners and admins can seed demo content.',
      }),
    ).rejects.toThrow('Only owners and admins can seed demo content.');
  });

  // ─── Super-admin bypass enabled (default) ───────────────────────────
  it('passes for super-admin without membership when bypass is enabled', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ isSuperAdmin: true, membership: null }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('does not query workspaceMember for super-admin when bypass is enabled', async () => {
    const prisma = makePrisma({ isSuperAdmin: true, membership: null });
    const helper = new WorkspaceAuthHelper(prisma);
    await helper.assertAccess({
      workspaceId: WS_ID,
      userId: USER_ID,
      requireAdmin: true,
    });
    expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
  });

  // ─── Super-admin bypass disabled ────────────────────────────────────
  it('still checks membership for super-admin when bypass is disabled', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ isSuperAdmin: true, membership: null }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
        superAdminBypass: false,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('passes for super-admin with membership when bypass is disabled', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ isSuperAdmin: true, membership: { role: 'VIEWER' } }),
    );
    await expect(
      helper.assertAccess({
        workspaceId: WS_ID,
        userId: USER_ID,
        requireAdmin: true,
        superAdminBypass: false,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not query user.findUnique when bypass is disabled', async () => {
    const prisma = makePrisma({
      isSuperAdmin: true,
      membership: { role: 'OWNER' },
    });
    const helper = new WorkspaceAuthHelper(prisma);
    await helper.assertAccess({
      workspaceId: WS_ID,
      userId: USER_ID,
      superAdminBypass: false,
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  // ─── requireAdmin defaults to false ─────────────────────────────────
  it('passes for VIEWER when requireAdmin is not set (default false)', async () => {
    const helper = new WorkspaceAuthHelper(
      makePrisma({ membership: { role: 'VIEWER' } }),
    );
    await expect(
      helper.assertAccess({ workspaceId: WS_ID, userId: USER_ID }),
    ).resolves.toBeUndefined();
  });
});
