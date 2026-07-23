import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAuthHelper } from '../../common/auth/workspace-auth.helper';
import { SessionRevocationService } from '../../common/auth/session-revocation.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';
import { MAX_PAGE_SIZE } from '../../common/pagination/pagination-query.dto';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAuth: WorkspaceAuthHelper,
    private readonly sessionRevocation: SessionRevocationService,
    private readonly accountContext: AccountContextHelper,
  ) {}

  async listMembers(workspaceId: string) {
    const rows = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      take: MAX_PAGE_SIZE,
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
      },
    });
    return rows.map((r) => ({
      membershipId: r.id,
      role: r.role,
      joinedAt: r.createdAt.toISOString(),
      user: r.user,
    }));
  }

  async updateMemberRole(
    workspaceId: string,
    requesterId: string,
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
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId: requesterId,
      requireAdmin: true,
    });

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { id: membershipId },
      select: { id: true, role: true, workspaceId: true },
    });
    if (!membership || membership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace.');
    }
    if (membership.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot change the role of an owner.');
    }

    const updated = await this.prisma.workspaceMember.update({
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

  async removeMember(
    workspaceId: string,
    requesterId: string,
    membershipId: string,
  ) {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId: requesterId,
      requireAdmin: true,
    });

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { id: membershipId },
      select: { id: true, role: true, workspaceId: true, userId: true },
    });
    if (!membership || membership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace.');
    }
    if (membership.role === UserRole.OWNER) {
      throw new BadRequestException(
        'Cannot remove an owner from the workspace.',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: { id: membershipId },
    });
    await this.sessionRevocation.revokeAllSessions(membership.userId);
    await this.accountContext.invalidateUserContext(membership.userId);
    return { ok: true };
  }
}
