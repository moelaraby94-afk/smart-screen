import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, Prisma } from '@prisma/client';
import { buildPage } from '../../common/pagination/page';
import {
  PaginationQueryDto,
  skipFor,
} from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['PUBLISHED', 'DRAFT'],
  REJECTED: ['DRAFT'],
  PUBLISHED: ['PAUSED', 'ENDED'],
  PAUSED: ['PUBLISHED', 'ENDED'],
  ENDED: [],
};

function assertTransition(from: CampaignStatus, to: CampaignStatus): void {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition campaign from ${from} to ${to}`,
    );
  }
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list(workspaceId: string, query: PaginationQueryDto) {
    const where: Prisma.CampaignWhereInput = { workspaceId };
    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: skipFor(query),
        take: query.limit,
        include: {
          createdBy: { select: { id: true, fullName: true } },
          approvedBy: { select: { id: true, fullName: true } },
          playlist: { select: { id: true, name: true } },
          screen: { select: { id: true, name: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return buildPage(items, total, query);
  }

  async getOne(workspaceId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, workspaceId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(dto: CreateCampaignDto, userId: string) {
    await this.ensureRefs(
      dto.workspaceId,
      dto.playlistId ?? null,
      dto.screenId ?? null,
    );

    const campaign = await this.prisma.campaign.create({
      data: {
        workspaceId: dto.workspaceId,
        createdById: userId,
        name: dto.name,
        description: dto.description ?? null,
        playlistId: dto.playlistId?.trim() || null,
        screenId: dto.screenId?.trim() || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'DRAFT',
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true } },
      },
    });

    await this.recordHistory(
      campaign.id,
      userId,
      'CREATE',
      'DRAFT',
      'DRAFT',
      undefined,
    );

    return campaign;
  }

  async update(workspaceId: string, id: string, dto: UpdateCampaignDto) {
    const existing = await this.getOne(workspaceId, id);

    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      throw new BadRequestException(
        'Campaign can only be edited in DRAFT or REJECTED status',
      );
    }

    const nextPlaylistId =
      dto.playlistId === undefined
        ? existing.playlistId
        : dto.playlistId?.trim() || null;
    const nextScreenId =
      dto.screenId === undefined
        ? existing.screenId
        : dto.screenId?.trim() || null;

    await this.ensureRefs(workspaceId, nextPlaylistId, nextScreenId);

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.playlistId !== undefined
          ? { playlistId: dto.playlistId?.trim() || null }
          : {}),
        ...(dto.screenId !== undefined
          ? { screenId: dto.screenId?.trim() || null }
          : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    const existing = await this.getOne(workspaceId, id);
    if (existing.status === 'PUBLISHED' || existing.status === 'PAUSED') {
      throw new BadRequestException(
        'Cannot delete a published or paused campaign. End it first.',
      );
    }
    await this.prisma.campaign.delete({ where: { id } });
  }

  async submit(workspaceId: string, id: string, userId: string) {
    return this.transition(
      workspaceId,
      id,
      userId,
      'PENDING_APPROVAL',
      'SUBMIT',
    );
  }

  async approve(
    workspaceId: string,
    id: string,
    userId: string,
    comment?: string,
  ) {
    await this.transition(
      workspaceId,
      id,
      userId,
      'APPROVED',
      'APPROVE',
      comment,
    );

    await this.prisma.campaign.update({
      where: { id },
      data: { approvedById: userId, reviewComment: comment ?? null },
    });

    return this.getOne(workspaceId, id);
  }

  async reject(
    workspaceId: string,
    id: string,
    userId: string,
    comment?: string,
  ) {
    await this.transition(
      workspaceId,
      id,
      userId,
      'REJECTED',
      'REJECT',
      comment,
    );

    await this.prisma.campaign.update({
      where: { id },
      data: { reviewComment: comment ?? null },
    });

    return this.getOne(workspaceId, id);
  }

  async publish(workspaceId: string, id: string, userId: string) {
    return this.transition(workspaceId, id, userId, 'PUBLISHED', 'PUBLISH');
  }

  async pause(workspaceId: string, id: string, userId: string) {
    return this.transition(workspaceId, id, userId, 'PAUSED', 'PAUSE');
  }

  async resume(workspaceId: string, id: string, userId: string) {
    return this.transition(workspaceId, id, userId, 'PUBLISHED', 'RESUME');
  }

  async end(workspaceId: string, id: string, userId: string) {
    return this.transition(workspaceId, id, userId, 'ENDED', 'END');
  }

  private async transition(
    workspaceId: string,
    id: string,
    userId: string,
    toStatus: CampaignStatus,
    action: string,
    comment?: string,
  ) {
    const campaign = await this.getOne(workspaceId, id);
    const fromStatus = campaign.status;

    assertTransition(fromStatus, toStatus);

    const updated = await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: { id },
        data: { status: toStatus },
      }),
      this.prisma.campaignHistory.create({
        data: {
          campaignId: id,
          actorId: userId,
          action,
          fromStatus,
          toStatus,
          comment: comment ?? null,
        },
      }),
    ]);

    // Push campaign update to all screens in workspace when published
    if (toStatus === 'PUBLISHED') {
      this.eventEmitter.emit(PlatformEvents.CAMPAIGN_PUBLISHED, {
        workspaceId,
        campaignId: id,
      });
    }

    return updated[0];
  }

  private async recordHistory(
    campaignId: string,
    actorId: string,
    action: string,
    fromStatus: CampaignStatus,
    toStatus: CampaignStatus,
    comment?: string,
  ): Promise<void> {
    await this.prisma.campaignHistory.create({
      data: {
        campaignId,
        actorId,
        action,
        fromStatus,
        toStatus,
        comment: comment ?? null,
      },
    });
  }

  private async ensureRefs(
    workspaceId: string,
    playlistId: string | null,
    screenId: string | null,
  ): Promise<void> {
    if (playlistId) {
      const pl = await this.prisma.playlist.findFirst({
        where: { id: playlistId, workspaceId },
      });
      if (!pl) throw new BadRequestException('Playlist not found in workspace');
    }

    if (screenId) {
      const sc = await this.prisma.screen.findFirst({
        where: { id: screenId, workspaceId },
      });
      if (!sc) throw new BadRequestException('Screen not found in workspace');
    }
  }
}
