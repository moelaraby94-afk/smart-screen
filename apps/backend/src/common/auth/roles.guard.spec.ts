import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from './roles.guard';
import { AccountContextHelper } from './account-context.helper';

type Membership = { role: UserRole } | null;

function buildContext(opts: {
  user?: { sub: string; isSuperAdmin?: boolean };
  workspaceId?: string;
  source?: 'params' | 'query' | 'body' | 'header';
  requiredRoles?: UserRole[];
}): { context: ExecutionContext; reflector: Reflector } {
  const source = opts.source ?? 'query';
  const request = {
    user: opts.user,
    params: {} as Record<string, string | undefined>,
    query: {} as Record<string, string | undefined>,
    body: {} as Record<string, string | undefined>,
    headers: {} as Record<string, string | undefined>,
  };
  if (opts.workspaceId !== undefined) {
    if (source === 'header')
      request.headers['x-workspace-id'] = opts.workspaceId;
    else request[source].workspaceId = opts.workspaceId;
  }

  const context = {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(opts.requiredRoles),
  } as unknown as Reflector;

  return { context, reflector };
}

function buildAccountContext(membership: Membership) {
  const resolveForWorkspace = jest
    .fn()
    .mockResolvedValue(
      membership
        ? { role: membership.role, ownerId: 'owner1', isOwner: false }
        : null,
    );
  const resolveOwnerId = jest.fn().mockResolvedValue('u1');
  const accountContext = {
    resolveForWorkspace,
    resolveOwnerId,
  } as unknown as AccountContextHelper;
  return { accountContext, resolveForWorkspace, resolveOwnerId };
}

function buildPrisma(): PrismaService {
  return {
    accountMember: { findUnique: jest.fn().mockResolvedValue(null) },
  } as unknown as PrismaService;
}

const OWNER_ONLY = [UserRole.OWNER];
const ANY_MEMBER = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.EDITOR,
  UserRole.VIEWER,
];

describe('RolesGuard', () => {
  it('allows a member whose role is permitted', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'u1' },
      workspaceId: 'ws_a',
      requiredRoles: ANY_MEMBER,
    });
    const { accountContext } = buildAccountContext({ role: UserRole.EDITOR });

    await expect(
      new RolesGuard(reflector, buildPrisma(), accountContext).canActivate(
        context,
      ),
    ).resolves.toBe(true);
  });

  /**
   * The IDOR case: the caller is authenticated and passes a workspace id, but is
   * not a member of that workspace. `findUnique` returns null → forbidden.
   */
  it('rejects a caller who is not a member of the requested workspace', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'attacker' },
      workspaceId: 'ws_victim',
      requiredRoles: ANY_MEMBER,
    });
    const { accountContext, resolveForWorkspace } = buildAccountContext(null);

    const guard = new RolesGuard(reflector, buildPrisma(), accountContext);
    const error = await guard.canActivate(context).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DomainException);
    expect((error as DomainException).code).toBe(ErrorCode.NO_WORKSPACE_ACCESS);
    expect(resolveForWorkspace).toHaveBeenCalledWith('attacker', 'ws_victim');
  });

  it('rejects a member whose role is too low for the route', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'u1' },
      workspaceId: 'ws_a',
      requiredRoles: OWNER_ONLY,
    });
    const { accountContext } = buildAccountContext({ role: UserRole.VIEWER });

    const error = await new RolesGuard(reflector, buildPrisma(), accountContext)
      .canActivate(context)
      .catch((e: unknown) => e);

    expect((error as DomainException).code).toBe(
      ErrorCode.INSUFFICIENT_WORKSPACE_ROLE,
    );
  });

  it('requires a workspaceId on a role-protected route', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'u1' },
      requiredRoles: ANY_MEMBER,
    });
    const { accountContext, resolveForWorkspace, resolveOwnerId } =
      buildAccountContext(null);
    resolveOwnerId.mockResolvedValue('other-owner');
    const prisma = {
      accountMember: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    await expect(
      new RolesGuard(reflector, prisma, accountContext).canActivate(context),
    ).rejects.toBeDefined();
    expect(resolveForWorkspace).not.toHaveBeenCalled();
  });

  it('lets a super admin through without a membership check', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'root', isSuperAdmin: true },
      workspaceId: 'ws_anything',
      requiredRoles: OWNER_ONLY,
    });
    const { accountContext, resolveForWorkspace } = buildAccountContext(null);

    await expect(
      new RolesGuard(reflector, buildPrisma(), accountContext).canActivate(
        context,
      ),
    ).resolves.toBe(true);
    expect(resolveForWorkspace).not.toHaveBeenCalled();
  });

  it('skips the check entirely for a route with no @Roles', async () => {
    const { context, reflector } = buildContext({ requiredRoles: undefined });
    const { accountContext, resolveForWorkspace } = buildAccountContext(null);

    await expect(
      new RolesGuard(reflector, buildPrisma(), accountContext).canActivate(
        context,
      ),
    ).resolves.toBe(true);
    expect(resolveForWorkspace).not.toHaveBeenCalled();
  });

  it.each(['params', 'query', 'body', 'header'] as const)(
    'resolves workspaceId from %s',
    async (source) => {
      const { context, reflector } = buildContext({
        user: { sub: 'u1' },
        workspaceId: 'ws_a',
        source,
        requiredRoles: ANY_MEMBER,
      });
      const { accountContext, resolveForWorkspace } = buildAccountContext({
        role: UserRole.ADMIN,
      });

      await new RolesGuard(
        reflector,
        buildPrisma(),
        accountContext,
      ).canActivate(context);
      expect(resolveForWorkspace).toHaveBeenCalledWith('u1', 'ws_a');
    },
  );
});
