import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type RecordProofOfPlayInput = {
  workspaceId: string;
  screenId: string;
  contentType: 'MEDIA' | 'CANVAS' | 'PLAYLIST';
  contentId?: string;
  contentName?: string;
  playlistId?: string;
  durationSec?: number;
  playedAt?: Date;
};

@Injectable()
export class ProofOfPlayService {
  private readonly logger = new Logger(ProofOfPlayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordProofOfPlayInput): Promise<void> {
    await this.prisma.proofOfPlay.create({
      data: {
        workspaceId: input.workspaceId,
        screenId: input.screenId,
        contentType: input.contentType,
        contentId: input.contentId,
        contentName: input.contentName,
        playlistId: input.playlistId,
        durationSec: input.durationSec ?? 0,
        playedAt: input.playedAt ?? new Date(),
      },
    });
  }

  async recordBatch(inputs: RecordProofOfPlayInput[]): Promise<void> {
    if (inputs.length === 0) return;
    await this.prisma.proofOfPlay.createMany({
      data: inputs.map((i) => ({
        workspaceId: i.workspaceId,
        screenId: i.screenId,
        contentType: i.contentType,
        contentId: i.contentId,
        contentName: i.contentName,
        playlistId: i.playlistId,
        durationSec: i.durationSec ?? 0,
        playedAt: i.playedAt ?? new Date(),
      })),
    });
  }

  async getReport(workspaceId: string, opts?: {
    screenId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: Record<string, unknown> = { workspaceId };
    if (opts?.screenId) where.screenId = opts.screenId;
    if (opts?.startDate || opts?.endDate) {
      where.playedAt = {};
      if (opts?.startDate) (where.playedAt as Record<string, unknown>).gte = opts.startDate;
      if (opts?.endDate) (where.playedAt as Record<string, unknown>).lte = opts.endDate;
    }

    const limit = Math.min(opts?.limit ?? 100, 500);

    const [items, total] = await Promise.all([
      this.prisma.proofOfPlay.findMany({
        where,
        orderBy: { playedAt: 'desc' },
        take: limit,
      }),
      this.prisma.proofOfPlay.count({ where }),
    ]);

    const byContent = await this.prisma.proofOfPlay.groupBy({
      by: ['contentId', 'contentName', 'contentType'],
      where,
      _count: { id: true },
      _sum: { durationSec: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return {
      items,
      total,
      summary: {
        totalPlays: total,
        uniqueContent: byContent.length,
        topContent: byContent.map((c) => ({
          contentId: c.contentId,
          contentName: c.contentName,
          contentType: c.contentType,
          playCount: c._count.id,
          totalDurationSec: c._sum.durationSec ?? 0,
        })),
      },
    };
  }
}
