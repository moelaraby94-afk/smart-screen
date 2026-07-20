import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformStaffRole, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceProvisioningService } from '../../common/auth/workspace-provisioning.service';
import { AuthService } from '../auth/auth.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class PlatformStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly workspaceProvisioning: WorkspaceProvisioningService,
    private readonly accountContext: AccountContextHelper,
  ) {}

  async listStaff() {
    const adminControl = await this.prisma.workspace.findFirst({
      where: { name: 'Admin Control' },
      select: { id: true },
    });
    if (!adminControl) return [];
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId: adminControl.id },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            isSuperAdmin: true,
            lastLoginAt: true,
          },
        },
      },
    });
    return members.map((m) => ({
      ...m.user,
      adminRole: m.user.isSuperAdmin ? 'SUPER_ADMIN' : m.role,
    }));
  }

  async createStaff(input: {
    fullName: string;
    email: string;
    password: string;
    adminRole: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'SUPER_ADMIN';
  }) {
    const email = input.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email already registered');
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash,
        emailVerified: true,
        isSuperAdmin: input.adminRole === 'SUPER_ADMIN',
        platformStaffRole:
          input.adminRole === 'SUPER_ADMIN'
            ? PlatformStaffRole.SUPER_ADMIN
            : PlatformStaffRole.SUPPORT_SPECIALIST,
      },
      select: { id: true, email: true, fullName: true },
    });
    let adminControl = await this.prisma.workspace.findFirst({
      where: { name: 'Admin Control' },
      select: { id: true },
    });
    if (!adminControl) {
      const ws = await this.workspaceProvisioning.createForUser(
        user.id,
        'Admin Control',
      );
      adminControl = { id: ws.id };
    }
    await this.prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: adminControl.id, userId: user.id },
      },
      create: {
        workspaceId: adminControl.id,
        userId: user.id,
        role:
          input.adminRole === 'SUPER_ADMIN'
            ? UserRole.OWNER
            : (input.adminRole as UserRole),
      },
      update: {
        role:
          input.adminRole === 'SUPER_ADMIN'
            ? UserRole.OWNER
            : (input.adminRole as UserRole),
      },
    });
    return user;
  }

  async updateStaffRole(
    userId: string,
    role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER',
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Staff user not found');
    let adminControl = await this.prisma.workspace.findFirst({
      where: { name: 'Admin Control' },
      select: { id: true },
    });
    if (!adminControl) {
      const ws = await this.workspaceProvisioning.createForUser(
        userId,
        'Admin Control',
      );
      adminControl = { id: ws.id };
    }
    await this.prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: adminControl.id, userId } },
      create: {
        workspaceId: adminControl.id,
        userId,
        role: role === 'SUPER_ADMIN' ? UserRole.OWNER : (role as UserRole),
      },
      update: {
        role: role === 'SUPER_ADMIN' ? UserRole.OWNER : (role as UserRole),
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuperAdmin: role === 'SUPER_ADMIN',
        platformStaffRole:
          role === 'SUPER_ADMIN'
            ? PlatformStaffRole.SUPER_ADMIN
            : PlatformStaffRole.SUPPORT_SPECIALIST,
      },
    });
    return { ok: true };
  }

  async updateUser(actorId: string, userId: string, dto: UpdateAdminUserDto) {
    if (userId === actorId && dto.isActive === false) {
      throw new BadRequestException('You cannot suspend your own account.');
    }
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) throw new NotFoundException('User not found');

    const data: {
      fullName?: string;
      isActive?: boolean;
      isSuperAdmin?: boolean;
      platformStaffRole?: PlatformStaffRole | null;
      subscriptionStatus?: import('@prisma/client').UserSubscriptionStatus;
      subscriptionEndDate?: Date | null;
    } = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isSuperAdmin !== undefined) {
      if (userId === actorId && dto.isSuperAdmin === false) {
        throw new ForbiddenException(
          'You cannot remove your own super admin flag.',
        );
      }
      data.isSuperAdmin = dto.isSuperAdmin;
    }
    if (dto.platformStaffRole !== undefined) {
      if (dto.platformStaffRole === PlatformStaffRole.SUPER_ADMIN) {
        data.isSuperAdmin = true;
        data.platformStaffRole = PlatformStaffRole.SUPER_ADMIN;
      } else if (dto.platformStaffRole === null) {
        data.platformStaffRole = null;
      } else {
        data.platformStaffRole = dto.platformStaffRole;
        data.isSuperAdmin = false;
      }
    }
    if (dto.subscriptionStatus !== undefined) {
      data.subscriptionStatus = dto.subscriptionStatus;
    }
    if (dto.subscriptionEndDate !== undefined) {
      data.subscriptionEndDate =
        dto.subscriptionEndDate === null
          ? null
          : new Date(dto.subscriptionEndDate);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    const roleChanged =
      dto.isSuperAdmin !== undefined ||
      dto.platformStaffRole !== undefined ||
      dto.isActive !== undefined;
    if (roleChanged) {
      await this.auth.revokeAllSessions(userId);
      await this.accountContext.invalidateUserContext(userId);
    }

    return updated;
  }
}
