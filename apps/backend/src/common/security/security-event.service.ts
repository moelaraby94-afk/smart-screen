import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SecurityEventType =
  | 'FAILED_LOGIN'
  | 'BRUTE_FORCE_LOCKOUT'
  | 'PRIVILEGE_ESCALATION'
  | 'SUSPICIOUS_ACTIVITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_FAILURE'
  | 'JWT_INVALID'
  | 'IMPERSONATION_START'
  | 'IMPERSONATION_EXIT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'TWO_FACTOR_DISABLED'
  | 'ACCOUNT_LOCKED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type LogSecurityEventInput = {
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  userId?: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class SecurityEventService {
  private readonly logger = new Logger(SecurityEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogSecurityEventInput): Promise<void> {
    const severity = input.severity ?? this.defaultSeverity(input.eventType);
    try {
      await this.prisma.securityEventLog.create({
        data: {
          eventType: input.eventType,
          severity,
          userId: input.userId,
          workspaceId: input.workspaceId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: (input.metadata ?? undefined) as any,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to persist security event ${input.eventType}: ${err}`,
      );
    }

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      this.logger.warn(
        `Security event [${severity}] ${input.eventType} user=${input.userId ?? 'anon'} ip=${input.ipAddress ?? 'n/a'}`,
      );
    }
  }

  async list(opts?: {
    cursor?: string;
    limit?: number;
    severity?: SecuritySeverity;
    eventType?: SecurityEventType;
  }) {
    const limit = Math.min(opts?.limit ?? 50, 200);
    const where: Record<string, unknown> = {};
    if (opts?.severity) where.severity = opts.severity;
    if (opts?.eventType) where.eventType = opts.eventType;

    const rows = await this.prisma.securityEventLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return { items, nextCursor, hasMore };
  }

  private defaultSeverity(eventType: SecurityEventType): SecuritySeverity {
    switch (eventType) {
      case 'BRUTE_FORCE_LOCKOUT':
      case 'PRIVILEGE_ESCALATION':
      case 'IMPERSONATION_START':
        return 'HIGH';
      case 'FAILED_LOGIN':
      case 'RATE_LIMIT_EXCEEDED':
      case 'CSRF_FAILURE':
      case 'JWT_INVALID':
        return 'MEDIUM';
      case 'SUSPICIOUS_ACTIVITY':
        return 'HIGH';
      case 'PASSWORD_RESET_REQUESTED':
      case 'TWO_FACTOR_DISABLED':
      case 'ACCOUNT_LOCKED':
        return 'MEDIUM';
      case 'IMPERSONATION_EXIT':
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }
}
