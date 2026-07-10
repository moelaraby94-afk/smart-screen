import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from './roles.guard';

/**
 * RolesGuard is the primary tenant boundary: it proves the caller is a member
 * of the `workspaceId` they name before any handler runs. It had no test at all,
 * yet it is what stops user A from operating on workspace B by passing B's id.
 *
 * The service layer is the second boundary (`findFirst({ where: {id, workspaceId} })`);
 * cross-tenant-scoping.spec.ts covers that. Between them, a request needs both a
 * membership *and* a matching workspace id on the row.
 */
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

function buildPrisma(membership: Membership): {
  prisma: PrismaService;
  findUnique: jest.Mock;
} {
  const findUnique = jest.fn().mockResolvedValue(membership);
  const prisma = {
    workspaceMember: { findUnique },
  } as unknown as PrismaService;
  return { prisma, findUnique };
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
    const { prisma } = buildPrisma({ role: UserRole.EDITOR });

    await expect(
      new RolesGuard(reflector, prisma).canActivate(context),
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
    const { prisma, findUnique } = buildPrisma(null);

    const guard = new RolesGuard(reflector, prisma);
    const error = await guard.canActivate(context).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DomainException);
    expect((error as DomainException).code).toBe(ErrorCode.NO_WORKSPACE_ACCESS);
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_userId: { workspaceId: 'ws_victim', userId: 'attacker' },
      },
      select: { role: true },
    });
  });

  it('rejects a member whose role is too low for the route', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'u1' },
      workspaceId: 'ws_a',
      requiredRoles: OWNER_ONLY,
    });
    const { prisma } = buildPrisma({ role: UserRole.VIEWER });

    const error = await new RolesGuard(reflector, prisma)
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
    const { prisma, findUnique } = buildPrisma(null);

    await expect(
      new RolesGuard(reflector, prisma).canActivate(context),
    ).rejects.toBeDefined();
    // Never even looked up a membership — failed before the DB.
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('lets a super admin through without a membership check', async () => {
    const { context, reflector } = buildContext({
      user: { sub: 'root', isSuperAdmin: true },
      workspaceId: 'ws_anything',
      requiredRoles: OWNER_ONLY,
    });
    const { prisma, findUnique } = buildPrisma(null);

    await expect(
      new RolesGuard(reflector, prisma).canActivate(context),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('skips the check entirely for a route with no @Roles', async () => {
    const { context, reflector } = buildContext({ requiredRoles: undefined });
    const { prisma, findUnique } = buildPrisma(null);

    await expect(
      new RolesGuard(reflector, prisma).canActivate(context),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
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
      const { prisma, findUnique } = buildPrisma({ role: UserRole.ADMIN });

      await new RolesGuard(reflector, prisma).canActivate(context);
      expect(findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId_userId: { workspaceId: 'ws_a', userId: 'u1' },
          },
        }),
      );
    },
  );
});
