import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';

/**
 * Account-level playlist group management: list, create, rename, delete, move.
 * Extracted from PlaylistsService to reduce file size and improve cohesion.
 */
@Injectable()
export class PlaylistGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountContext: AccountContextHelper,
  ) {}

  async listGroups(ownerId: string) {
    const effectiveOwnerId = await this.accountContext.resolveOwnerId(ownerId);
    return this.prisma.playlistGroup.findMany({
      where: { ownerId: effectiveOwnerId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        parentGroupId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { playlists: true, children: true } },
      },
    });
  }

  async createGroup(
    ownerId: string,
    name: string,
    parentGroupId?: string | null,
  ) {
    const effectiveOwnerId = await this.accountContext.resolveOwnerId(ownerId);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Group name is too short');
    }
    if (parentGroupId) {
      const parent = await this.prisma.playlistGroup.findFirst({
        where: { id: parentGroupId, ownerId: effectiveOwnerId },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('Parent group not found');
    }
    return this.prisma.playlistGroup.create({
      data: {
        ownerId: effectiveOwnerId,
        name: trimmed,
        parentGroupId: parentGroupId ?? null,
      },
      select: {
        id: true,
        name: true,
        parentGroupId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { playlists: true, children: true } },
      },
    });
  }

  async renameGroup(ownerId: string, groupId: string, name: string) {
    const effectiveOwnerId = await this.accountContext.resolveOwnerId(ownerId);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Group name is too short');
    }
    const group = await this.prisma.playlistGroup.findFirst({
      where: { id: groupId, ownerId: effectiveOwnerId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Playlist group not found');
    return this.prisma.playlistGroup.update({
      where: { id: groupId },
      data: { name: trimmed },
      select: {
        id: true,
        name: true,
        parentGroupId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { playlists: true, children: true } },
      },
    });
  }

  async deleteGroup(ownerId: string, groupId: string) {
    const effectiveOwnerId = await this.accountContext.resolveOwnerId(ownerId);
    const group = await this.prisma.playlistGroup.findFirst({
      where: { id: groupId, ownerId: effectiveOwnerId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Playlist group not found');
    // Playlists in this group get groupId = null (SetNull in schema).
    // Child groups are cascade-deleted via the parentGroupId self-relation (onDelete: Cascade).
    await this.prisma.playlistGroup.delete({ where: { id: groupId } });
  }

  async moveGroup(
    ownerId: string,
    groupId: string,
    newParentId: string | null,
  ) {
    const effectiveOwnerId = await this.accountContext.resolveOwnerId(ownerId);
    const group = await this.prisma.playlistGroup.findFirst({
      where: { id: groupId, ownerId: effectiveOwnerId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Playlist group not found');
    if (newParentId === groupId) {
      throw new BadRequestException('A group cannot be its own parent');
    }
    if (newParentId) {
      const parent = await this.prisma.playlistGroup.findFirst({
        where: { id: newParentId, ownerId: effectiveOwnerId },
        select: { id: true, parentGroupId: true },
      });
      if (!parent) throw new NotFoundException('Parent group not found');
      // Prevent circular references: check that groupId is not an ancestor of newParentId
      let current: { id: string; parentGroupId: string | null } | null = parent;
      const visited = new Set<string>([groupId]);
      while (current && current.parentGroupId) {
        if (visited.has(current.parentGroupId)) {
          throw new BadRequestException('Circular reference detected');
        }
        visited.add(current.parentGroupId);
        if (current.parentGroupId === groupId) {
          throw new BadRequestException(
            'Cannot move a group into one of its own descendants',
          );
        }
        current = await this.prisma.playlistGroup.findFirst({
          where: { id: current.parentGroupId, ownerId: effectiveOwnerId },
          select: { id: true, parentGroupId: true },
        });
      }
    }
    return this.prisma.playlistGroup.update({
      where: { id: groupId },
      data: { parentGroupId: newParentId },
      select: {
        id: true,
        name: true,
        parentGroupId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { playlists: true, children: true } },
      },
    });
  }
}
