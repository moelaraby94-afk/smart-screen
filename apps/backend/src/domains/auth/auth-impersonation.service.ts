import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { WorkspaceResolverService } from '../../common/auth/workspace-resolver.service';
import { AuthTokenService } from './auth-token.service';
import type { JwtAudience } from '../../common/auth/current-user.decorator';
import { PlatformStaffRole } from '@prisma/client';

@Injectable()
export class AuthImpersonationService {
  private readonly logger = new Logger(AuthImpersonationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly workspaceResolver: WorkspaceResolverService,
    private readonly tokenService: AuthTokenService,
  ) {}

  async issueImpersonation(actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new BadRequestException('Cannot impersonate yourself');
    }
    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { isSuperAdmin: true },
    });
    if (!actor?.isSuperAdmin) throw new ForbiddenException();

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
      },
    });
    if (!target) throw new NotFoundException('User not found');
    if (!target.isActive) throw new BadRequestException('User is suspended');

    const tokens = await this.tokenService.issueTokenPair(
      {
        sub: target.id,
        email: target.email,
        aud: 'customer',
      },
      { impersonatedBy: actorUserId },
    );
    await this.tokenService.setRefreshTokenSession(
      target.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    return {
      user: {
        id: target.id,
        email: target.email,
        fullName: target.fullName,
        locale: target.locale,
        isSuperAdmin: target.isSuperAdmin,
      },
      ...tokens,
    };
  }

  async exitImpersonation(
    jwtUser: { sub: string; impersonatedBy?: string },
    ipAddress?: string,
  ) {
    const superAdminId = jwtUser.impersonatedBy;
    if (!superAdminId) throw new ForbiddenException('Not impersonating');

    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });
    if (!superAdmin?.isSuperAdmin || !superAdmin.isActive) {
      throw new ForbiddenException();
    }

    const tokens = await this.tokenService.issueTokenPair({
      sub: superAdmin.id,
      email: superAdmin.email,
      aud: 'platform',
      platformStaffRole: PlatformStaffRole.SUPER_ADMIN,
    });
    await this.tokenService.setRefreshTokenSession(
      superAdmin.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    const workspaceList =
      await this.workspaceResolver.buildWorkspaceListForUser(
        superAdmin.id,
        true,
      );

    await this.auditLog.append({
      action: 'IMPERSONATION_END',
      adminName: superAdmin.fullName,
      targetCustomer: jwtUser.sub,
      ipAddress: ipAddress ?? 'n/a',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
        locale: superAdmin.locale,
        audience: 'platform' as JwtAudience,
        isSuperAdmin: true,
      },
      workspaces: workspaceList,
    };
  }
}
