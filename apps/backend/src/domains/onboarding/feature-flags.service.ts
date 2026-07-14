import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
    return this.listForWorkspace(workspaceId);
  }

  async isModuleEnabled(workspaceId: string, module: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: {
        workspaceId_module: { workspaceId, module },
      },
    });
    return flag?.enabled ?? true;
  }
}
