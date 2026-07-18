import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Blocks mutation endpoints when the workspace is paused.
 * Read operations are allowed (guard should only be applied to mutation routes).
 */
@Injectable()
export class WorkspacePauseGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      params: { workspaceId?: string; id?: string };
      body?: { workspaceId?: string };
    }>();

    const workspaceId =
      request.params?.workspaceId ??
      request.body?.workspaceId ??
      request.params?.id;

    if (!workspaceId) return true;

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { isPaused: true },
    });

    if (workspace?.isPaused) {
      throw new ForbiddenException(
        'Workspace is paused. Mutations are not allowed. Contact your workspace owner.',
      );
    }

    return true;
  }
}
