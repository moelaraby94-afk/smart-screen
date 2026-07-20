import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { buildPage } from '../../common/pagination/page';
import {
  PaginationQueryDto,
  skipFor,
} from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';

import { MediaService } from '../media/media.service';

import { CanvasesService } from '../canvases/canvases.service';

import { SchedulingService } from '../schedules/scheduling.service';

import type { Playlist, PlaylistItem, Media, Canvas } from '@prisma/client';

import type { ReplacePlaylistItemsDto } from './dto/replace-playlist-items.dto';
import type { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistGroupsService } from './playlist-groups.service';
import { PlaylistResolutionService } from './playlist-resolution.service';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly eventEmitter: EventEmitter2,

    private readonly mediaService: MediaService,

    private readonly canvasesService: CanvasesService,

    private readonly scheduling: SchedulingService,

    private readonly accountContext: AccountContextHelper,

    private readonly groupsService: PlaylistGroupsService,

    private readonly resolutionService: PlaylistResolutionService,
  ) {}

  async create(
    ownerId: string,
    workspaceId: string | null,
    name: string,
    groupId?: string | null,
  ) {
    return this.prisma.playlist.create({
      data: {
        ownerId,
        workspaceId: workspaceId ?? undefined,
        name,
        groupId: groupId ?? undefined,
      },
    });
  }

  async list(
    ownerId: string,
    workspaceId: string | undefined,
    query: PaginationQueryDto & { groupId?: string },
  ) {
    const where: { ownerId: string; workspaceId?: string; groupId?: string } = {
      ownerId,
    };
    if (workspaceId) where.workspaceId = workspaceId;
    if (query.groupId) where.groupId = query.groupId;
    const [items, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: skipFor(query),
        take: query.limit,
        include: {
          _count: { select: { items: true, screensInGroup: true } },
          items: {
            orderBy: { orderIndex: 'asc' },
            take: 1,
            include: {
              media: true,
              canvas: {
                select: { id: true, name: true, width: true, height: true },
              },
              nestedPlaylist: {
                select: { id: true, name: true, isPublished: true },
              },
            },
          },
        },
      }),
      this.prisma.playlist.count({ where }),
    ]);
    const serialized = items.map((p) => ({
      ...p,
      items: p.items.map((item) => ({
        ...item,
        media: item.media ? this.mediaService.toResponse(item.media) : null,
      })),
    }));
    return buildPage(serialized as unknown[], total, query);
  }

  async getOne(workspaceId: string, id: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id, workspaceId },

      include: {
        items: {
          orderBy: { orderIndex: 'asc' },

          include: {
            media: true,
            canvas: true,
            nestedPlaylist: {
              select: { id: true, name: true, isPublished: true },
            },
          },
        },
      },
    });

    if (!playlist) throw new NotFoundException('Playlist not found');

    return this.resolutionService.serializePlaylist(playlist);
  }

  async update(workspaceId: string, id: string, dto: UpdatePlaylistDto) {
    await this.ensurePlaylist(workspaceId, id);
    if (dto.name === undefined && dto.isPublished === undefined) {
      throw new BadRequestException('No fields to update.');
    }
    const data: { name?: string; isPublished?: boolean } = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    const updated = await this.prisma.playlist.update({
      where: { id },
      data,
    });

    if (dto.isPublished !== undefined) {
      await this.emitForPlaylist(id);
    }

    return updated;
  }

  async replaceItems(
    workspaceId: string,

    playlistId: string,

    dto: ReplacePlaylistItemsDto,
  ) {
    await this.ensurePlaylist(workspaceId, playlistId);

    for (const item of dto.items) {
      const hasMedia = !!item.mediaId?.trim();

      const hasCanvas = !!item.canvasId?.trim();

      const hasPlaylist = !!item.playlistId?.trim();

      const filledCount = [hasMedia, hasCanvas, hasPlaylist].filter(
        Boolean,
      ).length;

      if (filledCount !== 1) {
        throw new BadRequestException(
          'Each playlist item must have exactly one of mediaId, canvasId, or playlistId.',
        );
      }

      if (hasPlaylist && item.playlistId!.trim() === playlistId) {
        throw new BadRequestException(
          'A playlist cannot contain itself as a nested item.',
        );
      }
    }

    const mediaIds = [
      ...new Set(
        dto.items.map((i) => i.mediaId).filter((x): x is string => !!x?.trim()),
      ),
    ];

    const canvasIds = [
      ...new Set(
        dto.items
          .map((i) => i.canvasId)
          .filter((x): x is string => !!x?.trim()),
      ),
    ];

    const nestedPlaylistIds = [
      ...new Set(
        dto.items
          .map((i) => i.playlistId)
          .filter((x): x is string => !!x?.trim()),
      ),
    ];

    if (mediaIds.length > 0) {
      const count = await this.prisma.media.count({
        where: { workspaceId, id: { in: mediaIds } },
      });

      if (count !== mediaIds.length) {
        throw new BadRequestException(
          'One or more media items are missing or not in this workspace.',
        );
      }
    }

    if (canvasIds.length > 0) {
      const count = await this.prisma.canvas.count({
        where: { workspaceId, id: { in: canvasIds } },
      });

      if (count !== canvasIds.length) {
        throw new BadRequestException(
          'One or more canvas designs are missing or not in this workspace.',
        );
      }
    }

    if (nestedPlaylistIds.length > 0) {
      const count = await this.prisma.playlist.count({
        where: { id: { in: nestedPlaylistIds }, workspaceId },
      });

      if (count !== nestedPlaylistIds.length) {
        throw new BadRequestException(
          'One or more nested playlists are missing or not in this workspace.',
        );
      }

      // Circular reference detection: check that none of the nested playlists
      // contain this playlist at any depth.
      for (const nestedId of nestedPlaylistIds) {
        await this.resolutionService.assertNoCircularReference(
          nestedId,
          playlistId,
          new Set(),
        );
      }
    }

    const orderIndices = dto.items.map((i) => i.orderIndex);
    if (new Set(orderIndices).size !== orderIndices.length) {
      throw new BadRequestException(
        'Playlist item orderIndex values must be unique.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.playlistItem.deleteMany({ where: { playlistId } });

      if (dto.items.length > 0) {
        await tx.playlistItem.createMany({
          data: dto.items.map((item, index) => ({
            playlistId,

            mediaId: item.mediaId?.trim() || null,

            canvasId: item.canvasId?.trim() || null,

            nestedPlaylistId: item.playlistId?.trim() || null,

            orderIndex: index,

            durationSec: item.durationSec,

            zoneName: item.zoneName ?? null,
          })),
        });
      }
    });

    await this.emitForPlaylist(playlistId);

    return this.getOne(workspaceId, playlistId);
  }

  // ─── Delegated to PlaylistResolutionService ────────────────────

  private async buildRotationPayload(
    screen: { workspaceId: string; id: string },
    screenId: string,
  ) {
    return this.resolutionService.buildRotationPayload(screen, screenId);
  }

  private async buildPayload(
    workspaceId: string,
    screenId: string | null,
    playlist: Playlist & {
      items: (PlaylistItem & {
        media: Media | null;
        canvas: Canvas | null;
        nestedPlaylist: {
          id: string;
          name: string;
          isPublished: boolean;
        } | null;
      })[];
    },
    activeSource: 'override' | 'schedule' | 'rotation' | 'default' = 'default',
  ) {
    return this.resolutionService.buildPayload(
      workspaceId,
      screenId,
      playlist,
      activeSource,
    );
  }

  async remove(
    workspaceId: string,
    id: string,
    options?: { force?: boolean },
  ): Promise<void> {
    await this.ensurePlaylist(workspaceId, id);

    if (!options?.force) {
      const used = await this.prisma.screen.count({
        where: { activePlaylistId: id },
      });

      if (used > 0) {
        throw new BadRequestException(
          'Playlist is assigned to one or more screens. Unassign it first, or delete with force=true (owner/admin only).',
        );
      }

      const inSchedules = await this.prisma.schedule.count({
        where: { playlistId: id },
      });

      if (inSchedules > 0) {
        throw new BadRequestException(
          'Playlist is referenced by schedules. Remove those schedules first, or delete with force=true (owner/admin only).',
        );
      }

      await this.prisma.playlist.delete({ where: { id } });
      return;
    }

    const directScreens = await this.prisma.screen.findMany({
      where: {
        workspaceId,
        OR: [
          { activePlaylistId: id },
          { overridePlaylistId: id },
          { playlistGroupId: id },
        ],
      },
      select: { id: true },
    });
    const screenIdSet = new Set(directScreens.map((s) => s.id));

    const workspaceWideSchedules = await this.prisma.schedule.count({
      where: { playlistId: id, screenId: null, enabled: true },
    });
    if (workspaceWideSchedules > 0) {
      const allInWs = await this.prisma.screen.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      for (const s of allInWs) screenIdSet.add(s.id);
    }

    await this.prisma.playlist.delete({ where: { id } });

    for (const screenId of screenIdSet) {
      await this.emitPlaylistForScreen(screenId);
    }
  }

  /** Same-workspace copy: reuses media/canvas IDs. */
  async duplicateInWorkspace(workspaceId: string, playlistId: string) {
    await this.ensurePlaylist(workspaceId, playlistId);
    const pl = await this.prisma.playlist.findFirst({
      where: { id: playlistId, workspaceId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!pl) throw new NotFoundException('Playlist not found');

    const created = await this.prisma.$transaction(async (tx) => {
      const nu = await tx.playlist.create({
        data: {
          ownerId: pl.ownerId,
          workspaceId,
          name: this.makeDuplicatePlaylistName(pl.name),
          isPublished: false,
        },
      });
      if (pl.items.length > 0) {
        await tx.playlistItem.createMany({
          data: pl.items.map((item) => ({
            playlistId: nu.id,
            mediaId: item.mediaId,
            canvasId: item.canvasId,
            nestedPlaylistId: item.nestedPlaylistId,
            orderIndex: item.orderIndex,
            durationSec: item.durationSec,
            zoneName: item.zoneName,
          })),
        });
      }
      return nu;
    });

    const row = await this.prisma.playlist.findFirst({
      where: { id: created.id },
      include: {
        _count: { select: { items: true, screensInGroup: true } },
        items: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
          include: {
            media: true,
            canvas: {
              select: { id: true, name: true, width: true, height: true },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Playlist not found');
    return {
      ...row,
      items: row.items.map((item) => ({
        ...item,
        media: item.media ? this.mediaService.toResponse(item.media) : null,
      })),
    };
  }

  /**
   * Copy playlist timeline into another workspace (duplicates media files and canvases).
   * Does not remove the source playlist.
   */
  async cloneToWorkspace(
    userId: string,
    sourceWorkspaceId: string,
    playlistId: string,
    targetWorkspaceId: string,
  ) {
    if (sourceWorkspaceId === targetWorkspaceId) {
      throw new BadRequestException(
        'Source and target workspace must be different.',
      );
    }
    await this.assertUserWorkspaceMember(userId, sourceWorkspaceId);
    await this.assertUserWorkspaceMember(userId, targetWorkspaceId);

    await this.ensurePlaylist(sourceWorkspaceId, playlistId);
    const pl = await this.prisma.playlist.findFirst({
      where: { id: playlistId, workspaceId: sourceWorkspaceId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!pl) throw new NotFoundException('Playlist not found');

    const mediaIdMap = new Map<string, string>();
    const canvasIdMap = new Map<string, string>();

    for (const item of pl.items) {
      if (item.mediaId && !mediaIdMap.has(item.mediaId)) {
        const { id } = await this.mediaService.duplicateMediaToWorkspace({
          sourceWorkspaceId,
          mediaId: item.mediaId,
          targetWorkspaceId,
        });
        mediaIdMap.set(item.mediaId, id);
      }
      if (item.canvasId && !canvasIdMap.has(item.canvasId)) {
        const { id } = await this.canvasesService.duplicateCanvasToWorkspace({
          sourceWorkspaceId,
          canvasId: item.canvasId,
          targetWorkspaceId,
          createdById: userId,
        });
        canvasIdMap.set(item.canvasId, id);
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const nu = await tx.playlist.create({
        data: {
          ownerId: pl.ownerId,
          workspaceId: targetWorkspaceId,
          name: this.makeClonedPlaylistName(pl.name),
          isPublished: false,
        },
      });
      for (const item of pl.items) {
        const mediaId = item.mediaId ? mediaIdMap.get(item.mediaId) : null;
        const canvasId = item.canvasId ? canvasIdMap.get(item.canvasId) : null;
        // Nested playlist references point to playlists in the source workspace.
        // They cannot be reused in the target workspace (workspace isolation).
        // Cloning entire nested playlist trees is out of scope, so we skip these items.
        const nestedPlaylistId = null;
        if (item.mediaId && !mediaId) {
          throw new BadRequestException('Failed to map media item for clone.');
        }
        if (item.canvasId && !canvasId) {
          throw new BadRequestException('Failed to map canvas item for clone.');
        }
        if (!item.mediaId && !item.canvasId && item.nestedPlaylistId) {
          continue;
        }
        if (!item.mediaId && !item.canvasId && !item.nestedPlaylistId) {
          continue;
        }
        await tx.playlistItem.create({
          data: {
            playlistId: nu.id,
            mediaId: mediaId ?? null,
            canvasId: canvasId ?? null,
            nestedPlaylistId,
            orderIndex: item.orderIndex,
            durationSec: item.durationSec,
            zoneName: item.zoneName,
          },
        });
      }
      return nu;
    });

    const row = await this.prisma.playlist.findFirst({
      where: { id: created.id },
      include: {
        _count: { select: { items: true, screensInGroup: true } },
        items: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
          include: {
            media: true,
            canvas: {
              select: { id: true, name: true, width: true, height: true },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Playlist not found');
    return {
      ...row,
      items: row.items.map((item) => ({
        ...item,
        media: item.media ? this.mediaService.toResponse(item.media) : null,
      })),
    };
  }

  private makeDuplicatePlaylistName(name: string): string {
    const base = name.trim();
    if (base.toLowerCase().endsWith(' (copy)')) {
      return `${base} · ${Date.now().toString(36)}`;
    }
    return `${base} (copy)`;
  }

  private makeClonedPlaylistName(name: string): string {
    return `${name.trim()} (imported)`;
  }

  private async assertUserWorkspaceMember(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) {
      throw new ForbiddenException('No access to this workspace.');
    }
  }

  /**

   * Public playlist payload for player bootstrap and socket pushes.

   */

  async getPlaylistPayloadForScreen(
    screenId: string,
  ): Promise<Record<string, unknown> | null> {
    const screen = await this.prisma.screen.findUnique({
      where: { id: screenId },
    });

    if (!screen) return null;

    const resolved = await this.scheduling.resolveEffectivePlaylistId(
      screenId,

      new Date(),
    );

    if (resolved.source === 'rotation') {
      return this.buildRotationPayload(screen, screenId);
    }

    if (!resolved.playlistId) {
      return {
        workspaceId: screen.workspaceId,

        screenId,

        playlistId: null,

        name: null,

        items: [],

        activeSource: resolved.source,
      };
    }

    const playlist = await this.prisma.playlist.findFirst({
      where: { id: resolved.playlistId, workspaceId: screen.workspaceId },

      include: {
        items: {
          orderBy: { orderIndex: 'asc' },

          include: {
            media: true,
            canvas: true,
            nestedPlaylist: {
              select: { id: true, name: true, isPublished: true },
            },
          },
        },
      },
    });

    if (!playlist) {
      return {
        workspaceId: screen.workspaceId,

        screenId,

        playlistId: null,

        name: null,

        items: [],

        activeSource: 'default',
      };
    }

    return this.buildPayload(
      screen.workspaceId,

      screen.id,

      playlist,

      resolved.source,
    );
  }

  /**
   * Pushes the resolved playlist to the player via Socket.IO.
   * When `alsoEmitScheduleSignal` is true (schedule CRUD), also emits `schedule:changed`
   * so clients listening on that channel stay in sync.
   */
  async emitPlaylistForScreen(
    screenId: string,
    options?: { alsoEmitScheduleSignal?: boolean },
  ): Promise<void> {
    const payload = await this.getPlaylistPayloadForScreen(screenId);

    if (payload) {
      this.eventEmitter.emit(PlatformEvents.CONTENT_SYNC, {
        screenId,
        payload,
      });
      if (options?.alsoEmitScheduleSignal) {
        this.eventEmitter.emit(PlatformEvents.SCHEDULE_CHANGED, {
          screenId,
          payload,
        });
      }
    }
  }

  async emitForPlaylist(playlistId: string): Promise<void> {
    const direct = await this.prisma.screen.findMany({
      where: {
        OR: [
          { activePlaylistId: playlistId },
          { overridePlaylistId: playlistId },
        ],
      },
      select: { id: true },
    });

    const assigned = await this.prisma.screenPlaylistAssignment.findMany({
      where: { playlistId },
      select: { screenId: true },
    });

    const scheduled = await this.prisma.schedule.findMany({
      where: { playlistId, enabled: true },
      select: { workspaceId: true, screenId: true },
    });

    const ids = new Set<string>(direct.map((d) => d.id));
    for (const a of assigned) ids.add(a.screenId);

    const workspaceWide = new Set<string>();

    for (const row of scheduled) {
      if (row.screenId) ids.add(row.screenId);
      else workspaceWide.add(row.workspaceId);
    }

    if (workspaceWide.size > 0) {
      const inWs = await this.prisma.screen.findMany({
        where: { workspaceId: { in: [...workspaceWide] } },
        select: { id: true },
      });

      for (const s of inWs) ids.add(s.id);
    }

    // Cascade: find parent playlists that contain this playlist as a nested item
    // and emit for their affected screens too.
    const parentItems = await this.prisma.playlistItem.findMany({
      where: { nestedPlaylistId: playlistId },
      select: { playlistId: true },
    });
    const parentIds = [...new Set(parentItems.map((p) => p.playlistId))];
    for (const parentId of parentIds) {
      await this.emitForPlaylist(parentId);
    }

    for (const id of ids) {
      await this.emitPlaylistForScreen(id);
    }
  }

  private async ensurePlaylist(
    workspaceId: string,

    id: string,
  ): Promise<Playlist> {
    const p = await this.prisma.playlist.findFirst({
      where: { id, workspaceId },
    });

    if (!p) throw new NotFoundException('Playlist not found');

    return p;
  }

  // ─── Playlist Groups — delegated to PlaylistGroupsService ──────

  async listGroups(ownerId: string) {
    return this.groupsService.listGroups(ownerId);
  }

  async createGroup(
    ownerId: string,
    name: string,
    parentGroupId?: string | null,
  ) {
    return this.groupsService.createGroup(ownerId, name, parentGroupId);
  }

  async renameGroup(ownerId: string, groupId: string, name: string) {
    return this.groupsService.renameGroup(ownerId, groupId, name);
  }

  async deleteGroup(ownerId: string, groupId: string) {
    return this.groupsService.deleteGroup(ownerId, groupId);
  }

  async moveGroup(
    ownerId: string,
    groupId: string,
    newParentId: string | null,
  ) {
    return this.groupsService.moveGroup(ownerId, groupId, newParentId);
  }
}
