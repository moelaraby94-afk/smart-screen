import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type WorkspaceListItem = {
  id: string;
  name: string;
  slug: string;
  isPaused: boolean;
  role: string;
};

/**
 * Shared, read-only workspace list builder.
 * Extracted from AuthService to break the Auth ↔ Workspaces circular dependency.
 *
 * Both AuthService and any other module that needs a user's workspace list
 * can inject this service without importing WorkspacesModule.
 */
@Injectable()
export class WorkspaceResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build the list of workspaces for a user.
   * Super admins see all workspaces (with role 'OWNER').
   * Other users see only their memberships.
   */
  async buildWorkspaceListForUser(
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<WorkspaceListItem[]> {
    if (isSuperAdmin) {
      const all = await this.prisma.workspace.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, slug: true, isPaused: true },
      });
      return all.map((w) => ({ ...w, role: 'OWNER' }));
    }
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        role: true,
        workspace: {
          select: { id: true, name: true, slug: true, isPaused: true },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }
}
