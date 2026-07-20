import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { resolveAudience } from './auth.types';

@Injectable()
export class AuthProfileService {
  private readonly logger = new Logger(AuthProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async me(userId: string, impersonatedBy?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
        businessName: true,
        phone: true,
        country: true,
        city: true,
        emailVerified: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: { id: true, name: true, slug: true, isPaused: true },
            },
          },
        },
      },
    });
    if (!user) return null;
    const isSuperAdmin = user.isSuperAdmin === true;
    const profile = {
      businessName: user.businessName ?? null,
      phone: user.phone ?? null,
      country: user.country ?? null,
      city: user.city ?? null,
      emailVerified: user.emailVerified,
    };
    const audience = resolveAudience({
      isSuperAdmin,
      platformStaffRole: user.platformStaffRole,
    });
    if (isSuperAdmin) {
      const all = await this.prisma.workspace.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, slug: true, isPaused: true },
      });
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isActive: user.isActive,
        audience,
        isSuperAdmin: true,
        platformStaffRole: user.platformStaffRole ?? null,
        impersonatedBy: impersonatedBy ?? null,
        ...profile,
        memberships: all.map((w) => ({
          role: 'OWNER',
          workspace: w,
        })),
      };
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      locale: user.locale,
      isActive: user.isActive,
      audience,
      isSuperAdmin: false,
      platformStaffRole: user.platformStaffRole ?? null,
      impersonatedBy: impersonatedBy ?? null,
      ...profile,
      memberships: user.memberships,
    };
  }

  async logTwoFactorAction(userId: string, action: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      });
      if (user) {
        await this.auditLog.append({
          action,
          adminName: user.fullName,
          targetCustomer: user.email,
          ipAddress: 'n/a',
        });
      }
    } catch (err) {
      this.logger.error(
        '[auth] 2FA audit log failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
