import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AdminAuditLogItem = {
  id: string;
  action: string;
  adminName: string;
  targetCustomer: string;
  ipAddress: string;
  timestamp: string;
};

export type AppendAuditLogInput = Omit<AdminAuditLogItem, 'id' | 'timestamp'>;

/** Matches the previous file-backed store's cap, so the admin UI is unchanged. */
const AUDIT_LOG_PAGE_SIZE = 1000;

/**
 * The audit trail records impersonation and other privileged actions across
 * every tenant. It previously lived in `.data/admin-runtime.json` and was
 * appended with a read-modify-write of the whole file under no lock, so two
 * concurrent events silently dropped one of them — and the file sat outside
 * every database backup. It is now an ordinary Postgres table: appends are
 * atomic, and it is captured by `pg_dump` like everything else.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: AppendAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({ data: input });
  }

  async list(): Promise<AdminAuditLogItem[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: AUDIT_LOG_PAGE_SIZE,
    });

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      adminName: row.adminName,
      targetCustomer: row.targetCustomer,
      ipAddress: row.ipAddress,
      timestamp: row.createdAt.toISOString(),
    }));
  }
}
