import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ScreenStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAuthHelper } from '../../common/auth/workspace-auth.helper';
import { MediaService } from '../media/media.service';
import { WorkspaceCrudService } from './workspace-crud.service';

const DEMO_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
);

@Injectable()
export class WorkspaceBootstrapService {
  private readonly log = new Logger(WorkspaceBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAuth: WorkspaceAuthHelper,
    private readonly media: MediaService,
    private readonly crud: WorkspaceCrudService,
  ) {}

  async bootstrapDemo(userId: string) {
    const membershipCount = await this.prisma.workspaceMember.count({
      where: { userId },
    });
    if (membershipCount > 0) {
      throw new BadRequestException(
        'You already belong to a workspace. Use "Seed demo content" on an existing workspace instead.',
      );
    }

    const ws = await this.crud.createForUser(userId, 'Demo Workspace');
    await this.seedDemoContent(ws.id);
    return {
      workspace: ws,
      message: 'Demo workspace created with sample screens and media.',
    };
  }

  async seedDemoContent(workspaceId: string) {
    const screenCount = await this.prisma.screen.count({
      where: { workspaceId },
    });
    if (screenCount < 2) {
      const base = Date.now();
      const templates = [
        {
          name: 'Lobby Display',
          serialNumber: `CS-DEMO-${base}-A`,
          location: 'Main lobby',
        },
        {
          name: 'Conference Room',
          serialNumber: `CS-DEMO-${base}-B`,
          location: 'Floor 2',
        },
      ];
      for (let i = screenCount; i < 2; i++) {
        const t = templates[i];
        await this.prisma.screen.create({
          data: {
            workspaceId,
            name: t.name,
            serialNumber: t.serialNumber,
            status: ScreenStatus.ONLINE,
            location: t.location,
          },
        });
      }
    }

    const mediaCount = await this.prisma.media.count({
      where: { workspaceId },
    });
    const wsOwner = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, role: 'OWNER' },
      select: { userId: true },
    });
    const samples = [
      { originalName: 'sample-hero.png', mimeType: 'image/png' },
      { originalName: 'sample-promo.png', mimeType: 'image/png' },
      { originalName: 'sample-brand.png', mimeType: 'image/png' },
      { originalName: 'sample-banner.png', mimeType: 'image/png' },
      { originalName: 'sample-thumb.png', mimeType: 'image/png' },
    ];
    const targetMedia = 5;
    let mediaAdded = 0;
    for (let i = mediaCount; i < targetMedia; i++) {
      const meta = samples[i % samples.length];
      await this.media.saveUploadedFile({
        ownerId: wsOwner?.userId ?? '',
        workspaceId,
        buffer: DEMO_PNG,
        originalName: meta.originalName,
        mimeType: meta.mimeType,
        size: DEMO_PNG.length,
      });
      mediaAdded += 1;
    }

    const demoPlaylist = await this.prisma.playlist.findFirst({
      where: { workspaceId, name: 'Demo Loop' },
    });
    if (!demoPlaylist) {
      const mediaRows = await this.prisma.media.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'asc' },
        take: 5,
      });
      if (mediaRows.length > 0) {
        const playlist = await this.prisma.playlist.create({
          data: {
            ownerId: wsOwner?.userId ?? mediaRows[0].ownerId,
            workspaceId,
            name: 'Demo Loop',
            isPublished: true,
          },
        });
        await this.prisma.$transaction(async (tx) => {
          for (let i = 0; i < mediaRows.length; i++) {
            await tx.playlistItem.create({
              data: {
                playlistId: playlist.id,
                mediaId: mediaRows[i].id,
                orderIndex: i,
                durationSec: 10,
              },
            });
          }
        });
        const screens = await this.prisma.screen.findMany({
          where: { workspaceId },
          take: 2,
        });
        for (const s of screens) {
          await this.prisma.screen.update({
            where: { id: s.id },
            data: { activePlaylistId: playlist.id },
          });
        }
      }
    }

    return {
      ok: true,
      screensAdded: Math.max(0, 2 - screenCount),
      mediaAdded,
    };
  }

  async seedDemoForMember(workspaceId: string, userId: string) {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage: 'Only owners and admins can seed demo content.',
    });
    return this.seedDemoContent(workspaceId);
  }
}
