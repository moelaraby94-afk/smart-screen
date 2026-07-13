import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { workspaceId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async create(workspaceId: string, name: string, scopes: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Key name is required');
    }
    const raw = `cs_live_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const keyPrefix = raw.slice(0, 12);

    const created = await this.prisma.apiKey.create({
      data: {
        workspaceId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        scopes: scopes ?? '',
      },
    });

    return {
      id: created.id,
      name: created.name,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      rawKey: raw,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async revoke(workspaceId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, workspaceId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    if (key.revokedAt) {
      throw new BadRequestException('Key is already revoked');
    }
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    return { id: keyId, revoked: true };
  }
}
