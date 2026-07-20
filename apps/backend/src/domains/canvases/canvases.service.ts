import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPage } from '../../common/pagination/page';
import {
  PaginationQueryDto,
  skipFor,
} from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { UpdateCanvasDto } from './dto/update-canvas.dto';

@Injectable()
export class CanvasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateCanvasDto) {
    return this.prisma.canvas.create({
      data: {
        workspaceId,
        createdById: userId,
        name: dto.name.trim(),
        width: dto.width ?? 1920,
        height: dto.height ?? 1080,
        layoutData: (dto.layoutData ?? {}) as object,
        durationSec: dto.durationSec ?? 15,
      },
      select: this.canvasSelect,
    });
  }

  async list(workspaceId: string, query: PaginationQueryDto) {
    const where = { workspaceId };
    const [items, total] = await Promise.all([
      this.prisma.canvas.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: skipFor(query),
        take: query.limit,
        select: this.canvasSelect,
      }),
      this.prisma.canvas.count({ where }),
    ]);
    return buildPage(items, total, query);
  }

  async getById(workspaceId: string, id: string) {
    const canvas = await this.prisma.canvas.findFirst({
      where: { id, workspaceId },
      select: this.canvasSelect,
    });
    if (!canvas) throw new NotFoundException('Canvas not found');
    return canvas;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateCanvasDto,
    userId?: string,
  ) {
    const existing = await this.getById(workspaceId, id);

    // Create a version snapshot before updating
    if (userId) {
      await this.prisma.canvasVersion.create({
        data: {
          canvasId: id,
          layoutData: existing.layoutData as object,
          name: existing.name,
          width: existing.width,
          height: existing.height,
          savedById: userId,
        },
      });
    }

    const updated = await this.prisma.canvas.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.width !== undefined ? { width: dto.width } : {}),
        ...(dto.height !== undefined ? { height: dto.height } : {}),
        ...(dto.durationSec !== undefined
          ? { durationSec: dto.durationSec }
          : {}),
        ...(dto.layoutData !== undefined
          ? { layoutData: dto.layoutData as object }
          : {}),
      },
      select: this.canvasSelect,
    });
    await this.broadcastCanvasLive(id);
    return updated;
  }

  async listVersions(workspaceId: string, canvasId: string) {
    await this.getById(workspaceId, canvasId);
    return this.prisma.canvasVersion.findMany({
      where: { canvasId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        createdAt: true,
        savedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async restoreVersion(
    workspaceId: string,
    canvasId: string,
    versionId: string,
    userId: string,
  ) {
    const canvas = await this.getById(workspaceId, canvasId);
    const version = await this.prisma.canvasVersion.findFirst({
      where: { id: versionId, canvasId },
    });
    if (!version) throw new NotFoundException('Version not found');

    // Snapshot current state before restoring
    await this.prisma.canvasVersion.create({
      data: {
        canvasId,
        layoutData: canvas.layoutData as object,
        name: canvas.name,
        width: canvas.width,
        height: canvas.height,
        savedById: userId,
      },
    });

    const restored = await this.prisma.canvas.update({
      where: { id: canvasId },
      data: {
        name: version.name,
        width: version.width,
        height: version.height,
        layoutData: version.layoutData as object,
      },
      select: this.canvasSelect,
    });
    await this.broadcastCanvasLive(canvasId);
    return restored;
  }

  /** Deep-copy a canvas into another workspace (e.g. playlist clone across branches). */
  async duplicateCanvasToWorkspace(params: {
    sourceWorkspaceId: string;
    canvasId: string;
    targetWorkspaceId: string;
    createdById: string;
  }): Promise<{ id: string }> {
    const c = await this.prisma.canvas.findFirst({
      where: {
        id: params.canvasId,
        workspaceId: params.sourceWorkspaceId,
      },
    });
    if (!c) throw new NotFoundException('Canvas not found');

    const copy = await this.prisma.canvas.create({
      data: {
        workspaceId: params.targetWorkspaceId,
        createdById: params.createdById,
        name: `${c.name} (copy)`,
        type: c.type,
        durationSec: c.durationSec,
        contentUrl: c.contentUrl,
        layoutData: (c.layoutData ?? {}) as object,
        width: c.width,
        height: c.height,
        metadata: c.metadata === null ? undefined : (c.metadata as object),
      },
      select: { id: true },
    });
    return copy;
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.getById(workspaceId, id);
    const used = await this.prisma.playlistItem.count({
      where: { canvasId: id },
    });
    if (used > 0) {
      throw new BadRequestException(
        'Canvas is used in one or more playlists. Remove it from playlists first.',
      );
    }
    await this.prisma.canvas.delete({ where: { id } });
  }

  /**
   * Public compiled shape for the player / playlist payloads.
   */
  toCompiledPayload(canvas: {
    id: string;
    name: string;
    width: number;
    height: number;
    layoutData: unknown;
    durationSec: number;
  }) {
    return {
      id: canvas.id,
      name: canvas.name,
      width: canvas.width,
      height: canvas.height,
      durationSec: canvas.durationSec,
      layoutData: canvas.layoutData ?? {},
    };
  }

  async getCompiledForPlayer(workspaceId: string, canvasId: string) {
    const canvas = await this.prisma.canvas.findFirst({
      where: { id: canvasId, workspaceId },
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        layoutData: true,
        durationSec: true,
      },
    });
    if (!canvas) throw new NotFoundException('Canvas not found');
    return this.toCompiledPayload(canvas);
  }

  private async broadcastCanvasLive(canvasId: string): Promise<void> {
    const canvas = await this.prisma.canvas.findUnique({
      where: { id: canvasId },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        width: true,
        height: true,
        layoutData: true,
        durationSec: true,
      },
    });
    if (!canvas) return;
    const screenIds = await this.findScreenIdsForCanvas(canvasId);
    const payload = {
      canvasId: canvas.id,
      workspaceId: canvas.workspaceId,
      name: canvas.name,
      width: canvas.width,
      height: canvas.height,
      durationSec: canvas.durationSec,
      layoutData: canvas.layoutData ?? {},
      at: new Date().toISOString(),
    };
    for (const screenId of screenIds) {
      this.eventEmitter.emit(PlatformEvents.CANVAS_LIVE, { screenId, payload });
    }
  }

  private async findScreenIdsForCanvas(canvasId: string): Promise<string[]> {
    const items = await this.prisma.playlistItem.findMany({
      where: { canvasId },
      select: { playlistId: true },
    });
    const playlistIds = [...new Set(items.map((i) => i.playlistId))];
    if (playlistIds.length === 0) return [];
    const screens = await this.prisma.screen.findMany({
      where: { activePlaylistId: { in: playlistIds } },
      select: { id: true },
    });
    return screens.map((s) => s.id);
  }

  private readonly canvasSelect = {
    id: true,
    workspaceId: true,
    name: true,
    width: true,
    height: true,
    durationSec: true,
    layoutData: true,
    type: true,
    contentUrl: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}
