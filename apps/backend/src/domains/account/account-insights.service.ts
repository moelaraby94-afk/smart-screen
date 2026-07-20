import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
        return acc;
      },
      {
        branches: 0,
        screens: 0,
        playlists: 0,
        mediaCount: 0,
        storageBytes: 0,
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
}
