import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

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
  private readonly log = new Logger(AccountContextHelper.name);
  private readonly CACHE_TTL = 60; // seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Resolve the effective ownerId for a user.
   * Returns the user's own id if they are the account owner or a standalone user.
   */
  async resolveOwnerId(userId: string): Promise<string> {
    const cacheKey = `account-context:${userId}:owner`;
    const cached = await this.redisGet(cacheKey);
    if (cached !== null) return cached;

    // Fast path: is this user an account owner?
    const asOwner = await this.prisma.accountMember.findFirst({
      where: { ownerId: userId },
      select: { ownerId: true },
    });
    if (asOwner) {
      await this.redisSet(cacheKey, userId);
      return userId;
    }

    // Is this user an account member of someone else?
    const asMember = await this.prisma.accountMember.findFirst({
      where: { userId },
      select: { ownerId: true },
    });
    if (asMember) {
      await this.redisSet(cacheKey, asMember.ownerId);
      return asMember.ownerId;
    }

    // Standalone user (no account members yet)
    await this.redisSet(cacheKey, userId);
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
    const cacheKey = `account-context:${userId}:${workspaceId}`;
    const cached = await this.redisGet(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached) as ResolvedAccountContext;
    }

    const result = await this.resolveForWorkspaceFromDB(userId, workspaceId);
    if (result) {
      await this.redisSet(cacheKey, JSON.stringify(result));
    }
    return result;
  }

  private async resolveForWorkspaceFromDB(
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
   * Invalidate all cached account context for a user.
   * Call when the user's role, membership, or account changes.
   */
  async invalidateUserContext(userId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;

    try {
      const keys = await client.keys(`account-context:${userId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
        this.log.debug(
          `Invalidated ${keys.length} cache keys for user ${userId}`,
        );
      }
    } catch (err) {
      this.log.warn(
        `Failed to invalidate cache for user ${userId}: ${(err as Error).message}`,
      );
    }
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

  private async redisGet(key: string): Promise<string | null> {
    const client = this.redis.getClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch (err) {
      this.log.warn(`Redis GET failed for ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  private async redisSet(key: string, value: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    try {
      await client.setex(key, this.CACHE_TTL, value);
    } catch (err) {
      this.log.warn(`Redis SET failed for ${key}: ${(err as Error).message}`);
    }
  }
}
