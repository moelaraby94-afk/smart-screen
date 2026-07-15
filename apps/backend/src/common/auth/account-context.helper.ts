import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ResolvedAccountContext = {
  /** The user who owns the account (the OWNER of the workspace(s)). */
  ownerId: string;
  /** The role the current user has in this context. */
  role: UserRole;
  /** True when the user IS the account owner. */
  isOwner: boolean;
};

/**
 * Resolves the "effective owner" for a given user.
 *
 * The account owner is the user who created the workspace(s). When an
 * AccountMember logs in, their userId differs from the ownerId on
 * Playlist/Media/MediaFolder rows. This helper bridges that gap so
 * services can filter by a single `ownerId` regardless of who is
 * authenticated.
 *
 * Resolution order:
 *  1. If the user is an account owner (has AccountMember rows where
 *     ownerId = their own userId) → they ARE the owner.
 *  2. Otherwise, find the AccountMember row where userId = their id →
 *     the ownerId on that row is the effective owner.
 *  3. Fallback: the user is their own owner (standalone workspace owner
 *     with no AccountMember records yet).
 */
@Injectable()
export class AccountContextHelper {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the effective ownerId for a user.
   * Returns the user's own id if they are the account owner or a standalone user.
   */
  async resolveOwnerId(userId: string): Promise<string> {
    // Fast path: is this user an account owner?
    const asOwner = await this.prisma.accountMember.findFirst({
      where: { ownerId: userId },
      select: { ownerId: true },
    });
    if (asOwner) return userId;

    // Is this user an account member of someone else?
    const asMember = await this.prisma.accountMember.findFirst({
      where: { userId },
      select: { ownerId: true },
    });
    if (asMember) return asMember.ownerId;

    // Standalone user (no account members yet)
    return userId;
  }

  /**
   * Resolve the full account context for a user within a specific workspace.
   * Checks AccountMember (account-wide or workspace-scoped) and falls back
   * to WorkspaceMember.
   *
   * Returns null when the user has no access to the workspace.
   */
  async resolveForWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<ResolvedAccountContext | null> {
    // Super-admin bypass
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });
    if (user?.isSuperAdmin) {
      // Find the workspace owner to get the ownerId
      const owner = await this.prisma.workspaceMember.findFirst({
        where: { workspaceId, role: UserRole.OWNER },
        select: { userId: true },
      });
      return {
        ownerId: owner?.userId ?? userId,
        role: UserRole.OWNER,
        isOwner: false,
      };
    }

    // Find the workspace's OWNER to determine the account owner
    const workspaceOwner = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, role: UserRole.OWNER },
      select: { userId: true },
    });

    if (workspaceOwner) {
      // Check if the current user is an AccountMember of this owner
      const accountMember = await this.prisma.accountMember.findUnique({
        where: {
          ownerId_userId: { ownerId: workspaceOwner.userId, userId },
        },
        include: {
          workspaceScopes: {
            where: { workspaceId },
            select: { role: true },
          },
        },
      });

      if (accountMember) {
        // If there are workspace scopes, the user only has access to scoped workspaces
        if (accountMember.workspaceScopes.length > 0) {
          const scope = accountMember.workspaceScopes[0];
          return {
            ownerId: workspaceOwner.userId,
            role: scope.role,
            isOwner: false,
          };
        }
        // No scopes → account-wide access with the account-level role
        return {
          ownerId: workspaceOwner.userId,
          role: accountMember.role,
          isOwner: false,
        };
      }

      // Is the current user the workspace owner themselves?
      if (workspaceOwner.userId === userId) {
        return {
          ownerId: userId,
          role: UserRole.OWNER,
          isOwner: true,
        };
      }
    }

    // Fall back to direct WorkspaceMember
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (membership) {
      return {
        ownerId: workspaceOwner?.userId ?? userId,
        role: membership.role,
        isOwner: membership.role === UserRole.OWNER,
      };
    }

    return null;
  }

  /**
   * Check if a user has access to a workspace and return their role.
   * Throws ForbiddenException if no access.
   */
  async getRoleForWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<UserRole | null> {
    const ctx = await this.resolveForWorkspace(userId, workspaceId);
    return ctx?.role ?? null;
  }
}
