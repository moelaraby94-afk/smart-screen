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

export type WorkspaceAuditLogItem = {
  id: string;
  action: string;
  actorName: string;
  ipAddress: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AppendWorkspaceAuditInput = {
  workspaceId: string;
  userId: string;
  action: string;
  actorName: string;
  ipAddress: string;
  metadata?: Record<string, unknown> | null;
};

/** Matches the previous file-backed store's cap, so the admin UI is unchanged. */
const AUDIT_LOG_PAGE_SIZE = 1000;
const WORKSPACE_AUDIT_PAGE_SIZE = 200;

/**
 * The audit trail records impersonation and other privileged actions across
 * every tenant. It previously lived in `.data/admin-runtime.json` and was
 * appended with a read-modify-write of the whole file under no lock, so two
 * concurrent events silently dropped one of them — and the file sat outside
 * every database backup. It is now an ordinary Postgres table: appends are
 * atomic, and it is captured by `pg_dump` like everything else.
 *
 * Source of truth: The Postgres `AuditLog` table is the sole authoritative
 * store. The `.data/admin-runtime.json` file no longer contains audit logs;
 * any stale `logs` key from pre-migration files is ignored on read and dropped
 * on the next write. Retention is enforced by `MaintenanceService.purgeOldAuditLogs`,
 * which deletes entries older than `AUDIT_LOG_RETENTION_DAYS` (default: 90 days).
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

  async appendWorkspace(input: AppendWorkspaceAuditInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        adminName: input.actorName,
        targetCustomer: 'n/a',
        ipAddress: input.ipAddress,
        workspaceId: input.workspaceId,
        userId: input.userId,
        ...(input.metadata ? { metadata: input.metadata as never } : {}),
      },
    });
  }

  async listForWorkspace(
    workspaceId: string,
  ): Promise<WorkspaceAuditLogItem[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: WORKSPACE_AUDIT_PAGE_SIZE,
    });

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorName: row.adminName,
      ipAddress: row.ipAddress,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
