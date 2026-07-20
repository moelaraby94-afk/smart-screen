import { randomBytes } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionRevocationService } from '../../common/auth/session-revocation.service';
import type { JwtAudience } from '../../common/auth/current-user.decorator';
import type { TokenPayload, TokenPair } from './auth.types';
import { resolveAudience } from './auth.types';

@Injectable()
export class AuthTokenService {
  private readonly logger = new Logger(AuthTokenService.name);
  private readonly accessExpiresIn: number;
  private readonly adminAccessExpiresIn: number;
  private readonly refreshExpiresIn: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionRevocation: SessionRevocationService,
  ) {
    this.accessExpiresIn = this.parseDurationToSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    );
    this.adminAccessExpiresIn = this.parseDurationToSeconds(
      this.configService.get<string>('ADMIN_JWT_EXPIRES_IN', '8h'),
    );
    this.refreshExpiresIn = this.parseDurationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
  }

  async issueTokenPair(
    payload: TokenPayload,
    options?: { impersonatedBy?: string },
  ): Promise<TokenPair & { sessionId: string }> {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev-access-secret',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret',
    );

    const sessionId = randomBytes(16).toString('hex');

    const tokenPayload = {
      ...payload,
      ...(options?.impersonatedBy
        ? { impersonatedBy: options.impersonatedBy }
        : {}),
    };

    const isAdmin = payload.aud === 'platform';
    const accessExpiry = isAdmin
      ? this.adminAccessExpiresIn
      : this.accessExpiresIn;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...tokenPayload, typ: 'access' },
        {
          secret: accessSecret,
          expiresIn: accessExpiry,
        },
      ),
      this.jwtService.signAsync(
        { ...tokenPayload, typ: 'refresh', sid: sessionId },
        {
          secret: refreshSecret,
          expiresIn: this.refreshExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken, sessionId };
  }

  async setRefreshTokenSession(
    userId: string,
    refreshToken: string,
    sessionId: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 12);
    const now = new Date();
    const refreshSeconds = this.refreshExpiresIn;
    const expiresAt = new Date(now.getTime() + refreshSeconds * 1000);

    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: { userId, sessionId, tokenHash: hash, expiresAt },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId, expiresAt: { lt: now } },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }),
    ]);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret',
    );
    let userId: string;
    let sessionId: string | undefined;
    let impersonatedByFromRefresh: string | undefined;
    let decodedAudience: JwtAudience | undefined;
    try {
      const decoded = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: refreshSecret,
        },
      );
      if (decoded.typ === 'access') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      userId = decoded.sub;
      sessionId = decoded.sid;
      impersonatedByFromRefresh = decoded.impersonatedBy;
      decodedAudience = decoded.aud;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (sessionId) {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { userId_sessionId: { userId, sessionId } },
      });
      if (!stored) {
        this.logger.warn(
          `Refresh token reuse detected for userId=${userId} sessionId=${sessionId} — revoking all sessions`,
        );
        await this.sessionRevocation.revokeAllSessions(userId);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
      if (!isValid) {
        this.logger.warn(
          `Refresh token hash mismatch for userId=${userId} sessionId=${sessionId} — revoking all sessions`,
        );
        await this.sessionRevocation.revokeAllSessions(userId);
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    } else {
      const legacyUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { refreshTokenHash: true },
      });
      if (!legacyUser?.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const isValid = await bcrypt.compare(
        refreshToken,
        legacyUser.refreshTokenHash,
      );
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');
    }

    const audience: JwtAudience = decodedAudience ?? 'customer';

    const tokens = await this.issueTokenPair(
      {
        sub: user.id,
        email: user.email,
        aud: audience,
        platformStaffRole: user.platformStaffRole ?? undefined,
      },
      impersonatedByFromRefresh
        ? { impersonatedBy: impersonatedByFromRefresh }
        : undefined,
    );
    await this.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );
    return { ...tokens, audience };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async issueTokensForUser(
    targetUserId: string,
    workspaceId?: string,
    actorUserId?: string,
  ): Promise<TokenPair & { sessionId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const audience = resolveAudience({
      isSuperAdmin: user.isSuperAdmin,
      platformStaffRole: user.platformStaffRole,
    });

    const tokens = await this.issueTokenPair(
      {
        sub: user.id,
        email: user.email,
        aud: audience,
        platformStaffRole: user.platformStaffRole ?? undefined,
      },
      actorUserId ? { impersonatedBy: actorUserId } : undefined,
    );
    await this.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    if (workspaceId) {
      void workspaceId;
    }

    return { ...tokens, audience };
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessionRevocation.revokeAllSessions(userId);
  }

  private parseDurationToSeconds(value: string): number {
    const trimmed = value.trim().toLowerCase();
    const match = /^(\d+)([smhd])$/.exec(trimmed);
    if (!match) return Number(trimmed) || 900;

    const amount = Number(match[1]);
    const unit = match[2];
    if (unit === 's') return amount;
    if (unit === 'm') return amount * 60;
    if (unit === 'h') return amount * 3600;
    return amount * 86400;
  }
}
