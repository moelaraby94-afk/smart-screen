import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AssertAccessOptions = {
  workspaceId: string;
  userId: string;
  requireAdmin?: boolean;
  superAdminBypass?: boolean;
  forbiddenMessage?: string;
  notFoundMessage?: string;
};

/**
 * Single source of truth for workspace authorization checks that follow the
 * "super-admin bypass → membership lookup → NotFoundException for non-member →
 * ForbiddenException for insufficient role" pattern.
 *
 * Callers that need different behaviour (no super-admin bypass, WebSocket
 * error events, DomainException with error codes, membership-only checks
 * without role requirements, etc.) should keep their own logic — this helper
 * is only for the common admin-check pattern.
 */
@Injectable()
export class WorkspaceAuthHelper {
  constructor(private readonly prisma: PrismaService) {}

  async assertAccess(options: AssertAccessOptions): Promise<void> {
    const {
      workspaceId,
      userId,
      requireAdmin = false,
      superAdminBypass = true,
      forbiddenMessage = 'Only owners and admins can update this workspace.',
      notFoundMessage = 'Workspace not found',
    } = options;

    if (superAdminBypass) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true },
      });
      if (user?.isSuperAdmin) return;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException(notFoundMessage);
    if (
      requireAdmin &&
      membership.role !== 'OWNER' &&
      membership.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(forbiddenMessage);
    }
  }
}
