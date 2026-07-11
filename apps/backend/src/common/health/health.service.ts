import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Readiness probe: verifies the database connection is alive.
   * Returns `{ status: 'ready' }` on success, throws on failure.
   * The caller (health.controller) catches the error and returns 503.
   */
  async checkReadiness(): Promise<{ status: 'ready' }> {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { status: 'ready' };
  }
}
