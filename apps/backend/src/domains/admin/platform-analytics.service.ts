import { Injectable } from '@nestjs/common';
import * as os from 'os';
import { ScreenPairingSessionStatus, ScreenStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { fromStorageLimitBytes } from '../../common/product/storage-limit';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';

@Injectable()
export class PlatformAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly heartbeat: ScreenHeartbeatService,
  ) {}

  async getGlobalStats() {
    const now = new Date();
    const [
      onlineScreens,
      totalScreens,
      totalActiveUsers,
      totalWorkspaces,
      totalActiveCustomers,
      paymentAgg,
      mediaSizeAgg,
      storageQuotaAgg,
      pairingPending,
      screenStatusGroups,
      cacheModeScreens,
    ] = await Promise.all([
      this.prisma.screen.count({ where: { status: ScreenStatus.ONLINE } }),
      this.prisma.screen.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.workspace.count(),
      this.prisma.user.count({
        where: {
          isActive: true,
          isSuperAdmin: false,
          platformStaffRole: null,
        },
      }),
      this.prisma.paymentRecord.aggregate({
        where: {
          OR: [
            { paidAt: { not: null } },
            { status: { in: ['PAID', 'SUCCEEDED', 'SUCCESS'] } },
          ],
        },
        _sum: { amountCents: true },
      }),
      this.prisma.media.aggregate({ _sum: { sizeBytes: true } }),
      this.prisma.subscription.aggregate({
        where: { storageLimitBytes: { not: null } },
        _sum: { storageLimitBytes: true },
      }),
      this.prisma.screenPairingSession.count({
        where: {
          status: ScreenPairingSessionStatus.PENDING,
          expiresAt: { gte: now },
        },
      }),
      this.prisma.screen.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.screen.count({ where: { isOfflineCacheMode: true } }),
    ]);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const load = os.loadavg();
    const healthOnline =
      screenStatusGroups.find((g) => g.status === ScreenStatus.ONLINE)?._count
        ._all ?? 0;
    const healthOffline =
      screenStatusGroups.find((g) => g.status === ScreenStatus.OFFLINE)?._count
        ._all ?? 0;
    const healthMaintenance =
      screenStatusGroups.find((g) => g.status === ScreenStatus.MAINTENANCE)
        ?._count._all ?? 0;
    const storageUsedBytes = mediaSizeAgg._sum.sizeBytes ?? 0;
    const quotaSum = fromStorageLimitBytes(
      storageQuotaAgg._sum.storageLimitBytes,
    );
    const storageQuotaBytes =
      quotaSum != null && quotaSum > 0 ? quotaSum : null;
    return {
      revenueUsdPlaceholder: Math.round(
        (paymentAgg._sum.amountCents ?? 0) / 100,
      ),
      totalConnectedScreens: onlineScreens,
      totalActiveUsers,
      totalActiveCustomers,
      totalWorkspaces,
      realtimeSocketConnections: this.heartbeat.getConnectedSocketCount(),
      adminOverview: {
        screensOnline: onlineScreens,
        screensTotal: totalScreens,
        storageUsedBytes,
        storageQuotaBytes,
        pairingPendingActive: pairingPending,
        healthOnline,
        healthOffline,
        healthMaintenance,
        healthCacheMode: cacheModeScreens,
      },
      server: {
        loadAvg1m: load[0] ?? 0,
        memoryUsedBytes: totalMem - freeMem,
        memoryTotalBytes: totalMem,
        hostname: os.hostname(),
        platform: os.platform(),
      },
    };
  }
}
