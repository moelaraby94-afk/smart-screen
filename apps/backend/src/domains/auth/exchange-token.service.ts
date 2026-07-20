import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ExchangeTokenResult = {
  exchangeToken: string;
  targetApp: 'customer';
  redirectUrl: string;
};

export type RedeemedToken = {
  actorUserId: string;
  targetUserId: string;
  workspaceId: string | null;
};

@Injectable()
export class ExchangeTokenService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = parseInt(
      this.configService.get<string>('EXCHANGE_TOKEN_TTL', '60'),
      10,
    );
  }

  async generate(
    actorUserId: string,
    targetUserId: string,
    workspaceId?: string,
  ): Promise<ExchangeTokenResult> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);

    await this.prisma.exchangeToken.create({
      data: {
        token,
        tokenHash,
        actorUserId,
        targetUserId,
        workspaceId: workspaceId ?? null,
        expiresAt,
      },
    });

    const customerAppUrl = this.configService.get<string>(
      'CUSTOMER_APP_URL',
      'http://localhost:3000',
    );

    return {
      exchangeToken: token,
      targetApp: 'customer',
      redirectUrl: `${customerAppUrl}/auth/exchange?token=${token}`,
    };
  }

  async redeem(token: string): Promise<RedeemedToken> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const record = await this.prisma.exchangeToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid exchange token');
    }

    if (record.usedAt) {
      throw new UnauthorizedException('Exchange token already used');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Exchange token expired');
    }

    // Atomic update: only succeed if usedAt is still null (prevents race)
    const updated = await this.prisma.exchangeToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    if (updated.count === 0) {
      throw new UnauthorizedException('Exchange token already used');
    }

    return {
      actorUserId: record.actorUserId,
      targetUserId: record.targetUserId,
      workspaceId: record.workspaceId,
    };
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.exchangeToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
