import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { JwtUser } from './current-user.decorator';
import { AccountContextHelper } from './account-context.helper';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly accountContext: AccountContextHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      user?: JwtUser;
      query: Record<string, string | undefined>;
      body: Record<string, string | undefined>;
      params: Record<string, string | undefined>;
      headers: Record<string, string | undefined>;
    }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Unauthorized');

    if (user.isSuperAdmin) {
      return true;
    }

    const workspaceId =
      request.params.workspaceId ??
      request.query.workspaceId ??
      request.body.workspaceId ??
      request.headers['x-workspace-id'];

    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId is required for role-protected workspace routes.',
      );
    }

    // Check AccountMember (account-wide or workspace-scoped) first
    const ctx = await this.accountContext.resolveForWorkspace(
      user.sub,
      workspaceId,
    );

    if (ctx) {
      if (!requiredRoles.includes(ctx.role)) {
        throw DomainException.forbidden(
          ErrorCode.INSUFFICIENT_WORKSPACE_ROLE,
          'Insufficient workspace role',
          { requiredRoles, actualRole: ctx.role },
        );
      }
      return true;
    }

    // No access at all
    throw DomainException.forbidden(
      ErrorCode.NO_WORKSPACE_ACCESS,
      'No workspace membership found',
    );
  }
}
