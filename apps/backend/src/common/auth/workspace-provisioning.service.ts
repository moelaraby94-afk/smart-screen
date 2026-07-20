import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceProvisioningService {
  private readonly log = new Logger(WorkspaceProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      return w;
    });
    return workspace;
  }

  private makeSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `${base || 'workspace'}-${suffix}`;
  }
}
