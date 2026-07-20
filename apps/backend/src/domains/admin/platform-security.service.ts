import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditLogService } from '../../common/audit/audit-log.service';

@Injectable()
export class PlatformSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async impersonateUser(
    actorId: string,
    targetUserId: string,
    workspaceId?: string,
    ipAddress?: string,
  ) {
    const tokens = await this.auth.issueImpersonation(actorId, targetUserId);
    const me = await this.auth.me(targetUserId);
    if (!me) throw new NotFoundException();

    if (workspaceId) {
      const member = await this.prisma.workspaceMember.findFirst({
        where: { userId: targetUserId, workspaceId },
      });
      if (!member) {
        throw new BadRequestException(
          'User is not a member of this workspace.',
        );
      }
    }

    let workspaces = me.memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));

    if (workspaceId) {
      const pick = workspaces.find((w) => w.id === workspaceId);
      if (!pick) {
        throw new BadRequestException('Workspace not available for this user.');
      }
      workspaces = [pick, ...workspaces.filter((w) => w.id !== workspaceId)];
    }

    const [actor, target] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: actorId },
        select: { fullName: true },
      }),
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { businessName: true, fullName: true },
      }),
    ]);
    await this.auditLog.append({
      action: 'IMPERSONATION_START',
      adminName: actor?.fullName ?? actorId,
      targetCustomer: target?.businessName || target?.fullName || targetUserId,
      ipAddress: ipAddress ?? 'n/a',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: me.id,
        email: me.email,
        fullName: me.fullName,
        locale: me.locale,
        audience: 'customer' as const,
        isSuperAdmin: me.isSuperAdmin,
      },
      workspaces,
    };
  }

  async listLogs(cursor?: string, limit?: number) {
    return this.auditLog.list(cursor, limit);
  }
}
