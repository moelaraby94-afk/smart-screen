import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAuthHelper } from '../../common/auth/workspace-auth.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';
import { InvitationStatus } from '@prisma/client';
import type { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceCrudService {
  private readonly log = new Logger(WorkspaceCrudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAuth: WorkspaceAuthHelper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async ensureAdminControlEntry(userId: string): Promise<void> {
    const total = await this.prisma.workspace.count();
    if (total > 0) return;
    await this.createForUser(userId, 'Admin Control');
  }

  async createForUser(userId: string, name: string) {
    const slug = this.makeSlug(name);
    const workspace = await this.prisma.$transaction(async (tx) => {
      const w = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug,
          defaultLocale: 'en',
          members: {
            create: { userId, role: 'OWNER' },
          },
          subscription: {
            create: {
              plan: SubscriptionPlan.FREE,
              status: SubscriptionStatus.TRIALING,
              seats: 5,
              screenLimit: 25,
              storageLimitBytes: BigInt(5 * 1024 * 1024 * 1024),
            },
          },
        },
        select: { id: true, name: true, slug: true },
      });

      await tx.mediaFolder.create({
        data: {
          ownerId: userId,
          workspaceId: w.id,
          name: name.trim(),
          isDefault: true,
        },
      });

      return w;
    });
    return workspace;
  }

  async getWorkspace(workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        defaultLocale: true,
        timezone: true,
        isPaused: true,
        createdAt: true,
      },
    });
  }

  async updateWorkspace(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ) {
    await this.assertWorkspaceAccess(workspaceId, userId, true);
    if (
      dto.name === undefined &&
      dto.isPaused === undefined &&
      dto.timezone === undefined &&
      dto.defaultLocale === undefined
    ) {
      throw new BadRequestException('No fields to update.');
    }
    const data: {
      name?: string;
      slug?: string;
      isPaused?: boolean;
      timezone?: string;
      defaultLocale?: string;
    } = {};
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length < 2) {
        throw new BadRequestException('Workspace name is too short.');
      }
      data.name = trimmed;
      data.slug = this.makeSlug(trimmed);
    }
    if (dto.isPaused !== undefined) {
      data.isPaused = dto.isPaused;
    }
    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone;
    }
    if (dto.defaultLocale !== undefined) {
      data.defaultLocale = dto.defaultLocale;
    }
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        isPaused: true,
        timezone: true,
        defaultLocale: true,
      },
    });
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage:
        'Only workspace owners and admins can delete this branch.',
    });
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async notifyPairingStarted(
    userId: string,
    workspaceId: string,
  ): Promise<{ ok: true }> {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage: 'Only owners and admins can signal pairing activity.',
    });
    this.eventEmitter.emit(PlatformEvents.PAIRING_STARTED, {
      workspaceId,
      payload: { source: 'dashboard', at: new Date().toISOString() },
    });
    return { ok: true as const };
  }

  async recentActivity(workspaceId: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);

    const [screens, mediaItems, playlists, schedules, invites] =
      await Promise.all([
        this.prisma.screen.findMany({
          where: { workspaceId },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.media.findMany({
          where: { workspaceId },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.playlist.findMany({
          where: { workspaceId },
          select: {
            id: true,
            name: true,
            isPublished: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take,
        }),
        this.prisma.schedule.findMany({
          where: { workspaceId },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.workspaceInvitation.findMany({
          where: { workspaceId, status: InvitationStatus.PENDING },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
      ]);

    type ActivityItem = {
      type: string;
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
    };

    const items: ActivityItem[] = [];

    for (const s of screens) {
      items.push({
        type: 'screen',
        id: s.id,
        title: s.name,
        subtitle: s.status,
        timestamp: s.createdAt.toISOString(),
      });
    }
    for (const m of mediaItems) {
      items.push({
        type: 'media',
        id: m.id,
        title: m.originalName,
        subtitle: m.mimeType,
        timestamp: m.createdAt.toISOString(),
      });
    }
    for (const p of playlists) {
      items.push({
        type: 'playlist',
        id: p.id,
        title: p.name,
        subtitle: p.isPublished ? 'published' : 'draft',
        timestamp: p.updatedAt.toISOString(),
      });
    }
    for (const s of schedules) {
      items.push({
        type: 'schedule',
        id: s.id,
        title: `${s.startTime} - ${s.endTime}`,
        subtitle: 'schedule',
        timestamp: s.createdAt.toISOString(),
      });
    }
    for (const inv of invites) {
      items.push({
        type: 'invite',
        id: inv.id,
        title: inv.email,
        subtitle: inv.role,
        timestamp: inv.createdAt.toISOString(),
      });
    }

    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return items.slice(0, take);
  }

  async assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requireAdmin: boolean,
  ) {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin,
    });
  }

  makeSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `${base || 'workspace'}-${suffix}`;
  }
}
