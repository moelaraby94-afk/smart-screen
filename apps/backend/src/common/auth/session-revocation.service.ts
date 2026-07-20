import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shared service for revoking all refresh token sessions for a user.
 * Extracted from AuthService to break the Auth ↔ Workspaces circular dependency.
 *
 * Used when a user's role or permissions change to prevent
 * stale JWT-based privilege escalation.
 *
 * Official source: OWASP A07:2021 — "When a user's role or permissions
 * change, invalidate existing sessions."
 */
@Injectable()
export class SessionRevocationService {
  private readonly logger = new Logger(SessionRevocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }),
    ]);
    this.logger.debug(`Revoked all sessions for user ${userId}`);
  }
}
