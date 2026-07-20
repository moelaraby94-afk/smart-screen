import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';

/**
 * Screen-playlist assignment management: list, add, remove, reorder.
 * Extracted from ScreensService to reduce file size and improve cohesion.
 */
@Injectable()
export class ScreenAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  async listAssignments(workspaceId: string, screenId: string) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    return this.prisma.screenPlaylistAssignment.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
      },
    });
  }

  async addAssignment(
    workspaceId: string,
    screenId: string,
    dto: { playlistId: string; orderIndex?: number },
  ) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    const existing = await this.prisma.screenPlaylistAssignment.findUnique({
      where: { screenId_playlistId: { screenId, playlistId: dto.playlistId } },
    });
    if (existing) {
      throw new BadRequestException('Playlist already assigned to this screen');
    }
    const count = await this.prisma.screenPlaylistAssignment.count({
      where: { screenId },
    });
    const created = await this.prisma.screenPlaylistAssignment.create({
      data: {
        screenId,
        playlistId: dto.playlistId,
        orderIndex: dto.orderIndex ?? count,
      },
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
      },
    });

    await this.playlistsService.emitPlaylistForScreen(screenId);
    return created;
  }

  async removeAssignment(
    workspaceId: string,
    screenId: string,
    assignmentId: string,
  ) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    await this.prisma.screenPlaylistAssignment.delete({
      where: { id: assignmentId, screenId },
    });
    await this.playlistsService.emitPlaylistForScreen(screenId);
  }

  async reorderAssignments(
    workspaceId: string,
    screenId: string,
    items: { id: string; orderIndex: number }[],
  ) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.screenPlaylistAssignment.updateMany({
          where: { id: item.id, screenId },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );
    const result = await this.prisma.screenPlaylistAssignment.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
      },
    });

    await this.playlistsService.emitPlaylistForScreen(screenId);
    return result;
  }

  private async assertScreenInWorkspace(
    workspaceId: string,
    screenId: string,
  ): Promise<void> {
    const screen = await this.prisma.screen.findFirst({
      where: { id: screenId, workspaceId },
      select: { id: true },
    });
    if (!screen) {
      throw new NotFoundException('Screen not found in this workspace');
    }
  }
}
