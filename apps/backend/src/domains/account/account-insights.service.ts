import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { fromStorageLimitBytes } from '../../common/product/storage-limit';
import { computeWorkspaceCapabilities } from '../../common/product/workspace-capabilities';
import Stripe from 'stripe';

/**
 * Account insights and billing queries: workspace analytics, invoice PDF access.
 * Extracted from AccountService to reduce file size and improve cohesion.
 */
@Injectable()
export class AccountInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configHelper: ConfigHelper,
  ) {}

  async getInsights(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                isPaused: true,
                createdAt: true,
                subscription: {
                  select: {
                    plan: true,
                    status: true,
                    seats: true,
                    screenLimit: true,
                    storageLimitBytes: true,
                    currentPeriodEnd: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new ForbiddenException();

    const branches = await Promise.all(
      user.memberships.map(async (m) => {
        const workspaceId = m.workspace.id;
        const [screens, playlists, mediaCount, mediaAgg] = await Promise.all([
          this.prisma.screen.findMany({
            where: { workspaceId },
            select: { id: true, status: true },
          }),
          this.prisma.playlist.count({ where: { workspaceId } }),
          this.prisma.media.count({ where: { workspaceId } }),
          this.prisma.media.aggregate({
            where: { workspaceId },
            _sum: { sizeBytes: true },
          }),
        ]);

        const screenStatus = screens.reduce(
          (acc, s) => {
            if (s.status === 'ONLINE') acc.online += 1;
            else if (s.status === 'MAINTENANCE') acc.maintenance += 1;
            else acc.offline += 1;
            return acc;
          },
          { online: 0, offline: 0, maintenance: 0 },
        );

        const storageBytes = mediaAgg._sum.sizeBytes ?? 0;
        const sub = m.workspace.subscription;
        const storageLimitBytes = sub
          ? fromStorageLimitBytes(sub.storageLimitBytes)
          : null;
        const capabilities = computeWorkspaceCapabilities(
          { screenCount: screens.length, storageUsedBytes: storageBytes },
          {
            screenLimit: sub?.screenLimit ?? null,
            storageLimitBytes,
          },
        );
        return {
          workspaceId,
          name: m.workspace.name,
          slug: m.workspace.slug,
          isPaused: m.workspace.isPaused,
          role: m.role,
          createdAt: m.workspace.createdAt.toISOString(),
          screens: screens.length,
          playlists,
          mediaCount,
          storageBytes,
          screenStatus,
          capabilities,
          subscription: sub
            ? {
                plan: sub.plan,
                status: sub.status,
                seats: sub.seats,
                screenLimit: sub.screenLimit,
                storageLimitBytes,
                currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
              }
            : null,
        };
      }),
    );

    const totals = branches.reduce(
      (acc, b) => {
        acc.branches += 1;
        acc.screens += b.screens;
        acc.playlists += b.playlists;
        acc.mediaCount += b.mediaCount;
        acc.storageBytes += b.storageBytes;
        acc.screenStatus.online += b.screenStatus.online;
        acc.screenStatus.offline += b.screenStatus.offline;
        acc.screenStatus.maintenance += b.screenStatus.maintenance;
        if (b.subscription) {
          acc.screenLimit += b.subscription.screenLimit;
          if (b.subscription.storageLimitBytes != null && acc.storageLimitBytes != null) {
            acc.storageLimitBytes += b.subscription.storageLimitBytes;
          }
        }
        return acc;
      },
      {
        branches: 0,
        screens: 0,
        playlists: 0,
        mediaCount: 0,
        storageBytes: 0,
        screenLimit: 0,
        storageLimitBytes: 0 as number | null,
        screenStatus: { online: 0, offline: 0, maintenance: 0 },
      },
    );

    const firstSub = branches.find((b) => b.subscription)?.subscription ?? null;
    return {
      account: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate?.toISOString() ?? null,
      },
      plan: firstSub,
      totals,
      branches,
    };
  }

  async getInvoicePdfUrl(userId: string, invoiceRef: string) {
    const payment = await this.prisma.paymentRecord.findFirst({
      where: { userId, invoiceRef },
    });
    if (!payment) {
      throw new ForbiddenException('Invoice not found');
    }

    const secret = this.configHelper.requireStripeSecretKey();

    const stripe = new Stripe(secret);
    const invoice = await stripe.invoices.retrieve(invoiceRef);
    const pdfUrl = invoice.invoice_pdf;
    if (!pdfUrl) {
      throw new BadRequestException('Invoice PDF is not available yet');
    }
    return { url: pdfUrl };
  }

  async getAccountActivity(userId: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);

    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    const workspaceIds = memberships.map((m) => m.workspace.id);
    if (workspaceIds.length === 0) return [];

    const workspaceNameMap = new Map(
      memberships.map((m) => [m.workspace.id, m.workspace.name]),
    );

    const [screens, mediaItems, playlists, schedules, invites] =
      await Promise.all([
        this.prisma.screen.findMany({
          where: { workspaceId: { in: workspaceIds } },
          select: { id: true, name: true, status: true, createdAt: true, workspaceId: true },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.media.findMany({
          where: { workspaceId: { in: workspaceIds } },
          select: { id: true, originalName: true, mimeType: true, createdAt: true, workspaceId: true },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.playlist.findMany({
          where: { workspaceId: { in: workspaceIds } },
          select: { id: true, name: true, isPublished: true, updatedAt: true, workspaceId: true },
          orderBy: { updatedAt: 'desc' },
          take,
        }),
        this.prisma.schedule.findMany({
          where: { workspaceId: { in: workspaceIds } },
          select: { id: true, startTime: true, endTime: true, createdAt: true, workspaceId: true },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.workspaceInvitation.findMany({
          where: { workspaceId: { in: workspaceIds }, status: InvitationStatus.PENDING },
          select: { id: true, email: true, role: true, createdAt: true, workspaceId: true },
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
      workspaceName: string;
    };

    const items: ActivityItem[] = [];

    for (const s of screens) {
      items.push({
        type: 'screen',
        id: s.id,
        title: s.name,
        subtitle: s.status,
        timestamp: s.createdAt.toISOString(),
        workspaceName: workspaceNameMap.get(s.workspaceId) ?? '',
      });
    }
    for (const m of mediaItems) {
      items.push({
        type: 'media',
        id: m.id,
        title: m.originalName,
        subtitle: m.mimeType,
        timestamp: m.createdAt.toISOString(),
        workspaceName: workspaceNameMap.get(m.workspaceId ?? '') ?? '',
      });
    }
    for (const p of playlists) {
      items.push({
        type: 'playlist',
        id: p.id,
        title: p.name,
        subtitle: p.isPublished ? 'published' : 'draft',
        timestamp: p.updatedAt.toISOString(),
        workspaceName: workspaceNameMap.get(p.workspaceId ?? '') ?? '',
      });
    }
    for (const s of schedules) {
      items.push({
        type: 'schedule',
        id: s.id,
        title: `${s.startTime} - ${s.endTime}`,
        subtitle: 'schedule',
        timestamp: s.createdAt.toISOString(),
        workspaceName: workspaceNameMap.get(s.workspaceId) ?? '',
      });
    }
    for (const inv of invites) {
      items.push({
        type: 'invite',
        id: inv.id,
        title: inv.email,
        subtitle: inv.role,
        timestamp: inv.createdAt.toISOString(),
        workspaceName: workspaceNameMap.get(inv.workspaceId) ?? '',
      });
    }

    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return items.slice(0, take);
  }
}
