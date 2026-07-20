import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionRevocationService } from '../../common/auth/session-revocation.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';

@Injectable()
export class WorkspaceAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionRevocation: SessionRevocationService,
    private readonly accountContext: AccountContextHelper,
  ) {}

  async listAccountMembers(ownerId: string) {
    const members = await this.prisma.accountMember.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            locale: true,
            isActive: true,
          },
        },
        workspaceScopes: {
          select: {
            id: true,
            workspaceId: true,
            role: true,
            workspace: { select: { id: true, name: true } },
          },
        },
      },
    });
    return members.map((m) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
      user: m.user,
      workspaceScopes: m.workspaceScopes.map((s) => ({
        id: s.id,
        workspaceId: s.workspaceId,
        workspaceName: s.workspace.name,
        role: s.role,
      })),
    }));
  }

  async createAccountMember(
    ownerId: string,
    dto: {
      email: string;
      fullName: string;
      password: string;
      role: string;
      phone?: string;
      country?: string;
      city?: string;
      workspaceScopes?: Array<{ workspaceId: string; role: string }>;
    },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const validRoles: string[] = [
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
    ];
    if (!validRoles.includes(dto.role)) {
      throw new BadRequestException(
        'Invalid role. Must be VIEWER, EDITOR, or ADMIN.',
      );
    }

    if (dto.workspaceScopes && dto.workspaceScopes.length > 0) {
      for (const scope of dto.workspaceScopes) {
        if (!validRoles.includes(scope.role)) {
          throw new BadRequestException(
            `Invalid role for workspace scope: ${scope.role}`,
          );
        }
        const ws = await this.prisma.workspace.findFirst({
          where: {
            id: scope.workspaceId,
            members: { some: { userId: ownerId, role: UserRole.OWNER } },
          },
          select: { id: true },
        });
        if (!ws) {
          throw new BadRequestException(
            `Workspace ${scope.workspaceId} not found or not owned by you.`,
          );
        }
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: dto.fullName.trim(),
          phone: dto.phone?.trim() || null,
          country: dto.country?.trim().toUpperCase().slice(0, 2) || null,
          city: dto.city?.trim() || null,
          passwordHash,
          emailVerified: true,
          locale: 'en',
        },
      });

      const member = await tx.accountMember.create({
        data: {
          ownerId,
          userId: user.id,
          role: dto.role as UserRole,
        },
      });

      if (dto.workspaceScopes && dto.workspaceScopes.length > 0) {
        await tx.accountMemberWorkspaceScope.createMany({
          data: dto.workspaceScopes.map((scope) => ({
            accountMemberId: member.id,
            workspaceId: scope.workspaceId,
            role: scope.role as UserRole,
          })),
        });
      }

      return { user, member };
    });

    return {
      ok: true,
      membershipId: result.member.id,
      userId: result.user.id,
      email: normalizedEmail,
      fullName: result.user.fullName,
      role: dto.role,
    };
  }

  async addAccountMember(
    ownerId: string,
    userId: string,
    role: string,
    workspaceScopes?: Array<{ workspaceId: string; role: string }>,
  ) {
    const validRoles: string[] = [
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
    ];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(
        'Invalid role. Must be VIEWER, EDITOR, or ADMIN.',
      );
    }

    if (workspaceScopes && workspaceScopes.length > 0) {
      for (const scope of workspaceScopes) {
        if (!validRoles.includes(scope.role)) {
          throw new BadRequestException(
            `Invalid role for workspace scope: ${scope.role}`,
          );
        }
        const ws = await this.prisma.workspace.findFirst({
          where: {
            id: scope.workspaceId,
            members: { some: { userId: ownerId, role: UserRole.OWNER } },
          },
          select: { id: true },
        });
        if (!ws) {
          throw new BadRequestException(
            `Workspace ${scope.workspaceId} not found or not owned by you.`,
          );
        }
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const existing = await this.prisma.accountMember.findUnique({
      where: { ownerId_userId: { ownerId, userId } },
    });
    if (existing) {
      throw new BadRequestException('This user is already an account member.');
    }

    const member = await this.prisma.accountMember.create({
      data: { ownerId, userId, role: role as UserRole },
    });

    if (workspaceScopes && workspaceScopes.length > 0) {
      await this.prisma.accountMemberWorkspaceScope.createMany({
        data: workspaceScopes.map((scope) => ({
          accountMemberId: member.id,
          workspaceId: scope.workspaceId,
          role: scope.role as UserRole,
        })),
      });
    }

    return {
      ok: true,
      membershipId: member.id,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role,
    };
  }

  async updateAccountMemberRole(
    ownerId: string,
    membershipId: string,
    newRole: string,
  ) {
    const validRoles: string[] = [
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
    ];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(
        'Invalid role. Must be VIEWER, EDITOR, or ADMIN.',
      );
    }

    const membership = await this.prisma.accountMember.findUnique({
      where: { id: membershipId },
      select: { id: true, ownerId: true, role: true },
    });
    if (!membership || membership.ownerId !== ownerId) {
      throw new NotFoundException('Account member not found.');
    }

    const updated = await this.prisma.accountMember.update({
      where: { id: membershipId },
      data: { role: newRole as UserRole },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
    await this.sessionRevocation.revokeAllSessions(updated.user.id);
    await this.accountContext.invalidateUserContext(updated.user.id);
    return updated;
  }

  async removeAccountMember(ownerId: string, membershipId: string) {
    const membership = await this.prisma.accountMember.findUnique({
      where: { id: membershipId },
      select: { id: true, ownerId: true, userId: true },
    });
    if (!membership || membership.ownerId !== ownerId) {
      throw new NotFoundException('Account member not found.');
    }

    await this.prisma.accountMember.delete({ where: { id: membershipId } });
    await this.sessionRevocation.revokeAllSessions(membership.userId);
    await this.accountContext.invalidateUserContext(membership.userId);
    return { ok: true };
  }

  async listAccountWorkspaces(ownerId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { members: { some: { userId: ownerId } } },
      select: {
        id: true,
        name: true,
        slug: true,
        isPaused: true,
        _count: {
          select: { screens: true, members: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return workspaces;
  }
}
