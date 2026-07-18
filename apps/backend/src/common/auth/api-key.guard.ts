import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

export const API_KEY_SCOPES_KEY = 'apiKeyScopes';

export const RequireApiKeyScope = (...scopes: string[]) =>
  SetMetadata(API_KEY_SCOPES_KEY, scopes);

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      apiKey?: { id: string; workspaceId: string; scopes: string[] };
    }>();

    const apiKeyHeader = request.headers['x-api-key'];
    if (!apiKeyHeader) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const keyHash = createHash('sha256').update(apiKeyHeader).digest('hex');

    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyHash, revokedAt: null },
      select: { id: true, workspaceId: true, scopes: true, lastUsedAt: true },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Update lastUsedAt (fire-and-forget)
    this.prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    // Check scopes if decorator is applied
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      API_KEY_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredScopes && requiredScopes.length > 0) {
      const keyScopes = apiKey.scopes
        ? apiKey.scopes.split(' ').filter(Boolean)
        : [];
      // Empty scopes = all scopes (admin key)
      if (keyScopes.length > 0) {
        const hasAllRequired = requiredScopes.every((scope) =>
          keyScopes.includes(scope),
        );
        if (!hasAllRequired) {
          throw new ForbiddenException(
            `API key lacks required scopes: ${requiredScopes.join(', ')}`,
          );
        }
      }
    }

    request.apiKey = {
      id: apiKey.id,
      workspaceId: apiKey.workspaceId,
      scopes: apiKey.scopes ? apiKey.scopes.split(' ').filter(Boolean) : [],
    };

    return true;
  }
}
