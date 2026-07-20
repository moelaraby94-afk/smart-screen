import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

const ALL_MODULES = [
  'billing',
  'api_keys',
  'webhooks',
  'analytics',
  'campaigns',
  'ai',
  'emergency',
  'proof_of_play',
  'templates',
] as const;

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly CACHE_TTL = 60;
  private readonly CACHE_PREFIX = 'feature-flags';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async listForWorkspace(workspaceId: string) {
    const flags = await this.prisma.featureFlag.findMany({
      where: { workspaceId },
    });

    const map = new Map(flags.map((f) => [f.module, f.enabled]));
    return ALL_MODULES.map((mod) => ({
      module: mod,
      enabled: map.get(mod) ?? true,
    }));
  }

  async listAll() {
    const workspaces = await this.prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        featureFlags: true,
      },
    });

    return workspaces.map((ws) => {
      const map = new Map(ws.featureFlags.map((f) => [f.module, f.enabled]));
      return {
        workspaceId: ws.id,
        workspaceName: ws.name,
        workspaceSlug: ws.slug,
        modules: ALL_MODULES.map((mod) => ({
          module: mod,
          enabled: map.get(mod) ?? true,
        })),
      };
    });
  }

  async setFlag(
    workspaceId: string,
    module: string,
    enabled: boolean,
    setBy: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const flag = await this.prisma.featureFlag.upsert({
      where: {
        workspaceId_module: { workspaceId, module },
      },
      create: { workspaceId, module, enabled, setBy },
      update: { enabled, setBy },
    });

    await this.invalidateFlag(workspaceId, module);

    return { module: flag.module, enabled: flag.enabled };
  }

  async bulkSet(
    workspaceId: string,
    flags: { module: string; enabled: boolean }[],
    setBy: string,
  ) {
    await Promise.all(
      flags.map((f) =>
        this.prisma.featureFlag.upsert({
          where: {
            workspaceId_module: { workspaceId, module: f.module },
          },
          create: { workspaceId, module: f.module, enabled: f.enabled, setBy },
          update: { enabled: f.enabled, setBy },
        }),
      ),
    );
    await this.invalidateWorkspace(workspaceId);
    return this.listForWorkspace(workspaceId);
  }

  async isModuleEnabled(workspaceId: string, module: string): Promise<boolean> {
    const cacheKey = `${this.CACHE_PREFIX}:${workspaceId}:${module}`;
    const client = this.redis.getClient();

    if (client) {
      try {
        const cached = await client.get(cacheKey);
        if (cached !== null) {
          return cached === '1';
        }
      } catch (err) {
        this.logger.warn(
          `Redis GET failed for ${cacheKey}: ${(err as Error).message}`,
        );
      }
    }

    const flag = await this.prisma.featureFlag.findUnique({
      where: {
        workspaceId_module: { workspaceId, module },
      },
    });
    const enabled = flag?.enabled ?? true;

    if (client) {
      try {
        await client.setex(cacheKey, this.CACHE_TTL, enabled ? '1' : '0');
      } catch (err) {
        this.logger.warn(
          `Redis SET failed for ${cacheKey}: ${(err as Error).message}`,
        );
      }
    }

    return enabled;
  }

  async invalidateFlag(workspaceId: string, module: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    try {
      await client.del(`${this.CACHE_PREFIX}:${workspaceId}:${module}`);
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate cache for ${workspaceId}:${module}: ${(err as Error).message}`,
      );
    }
  }

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    try {
      const keys = await client.keys(`${this.CACHE_PREFIX}:${workspaceId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate cache for workspace ${workspaceId}: ${(err as Error).message}`,
      );
    }
  }
}
