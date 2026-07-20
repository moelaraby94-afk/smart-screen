import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The audit trail used to be a JSON file appended with read-modify-write and no
 * lock, so two concurrent impersonation events dropped one of them. Backing it
 * with a table makes each append an independent INSERT — these tests pin that
 * contract (one INSERT per event, no read-then-write) rather than re-testing
 * Postgres.
 */
describe('AuditLogService', () => {
  function build() {
    const rows: Array<Record<string, unknown>> = [];
    const create = jest.fn((args: { data: Record<string, unknown> }) => {
      rows.push(args.data);
      return Promise.resolve(args.data);
    });
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'log_2',
        action: 'IMPERSONATION_START',
        adminName: 'Root',
        targetCustomer: 'Acme',
        ipAddress: '203.0.113.9',
        createdAt: new Date('2026-07-09T10:00:00.000Z'),
      },
    ]);

    const prisma = {
      auditLog: { create, findMany },
    } as unknown as PrismaService;

    return { service: new AuditLogService(prisma), rows, create, findMany };
  }

  it('appends an entry as a single insert', async () => {
    const { service, create } = build();

    await service.append({
      action: 'IMPERSONATION_START',
      adminName: 'Root',
      targetCustomer: 'Acme',
      ipAddress: '203.0.113.9',
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        action: 'IMPERSONATION_START',
        adminName: 'Root',
        targetCustomer: 'Acme',
        ipAddress: '203.0.113.9',
      },
    });
  });

  it('keeps every entry when appends run concurrently', async () => {
    const { service, rows } = build();

    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        service.append({
          action: 'IMPERSONATION_START',
          adminName: `admin_${i}`,
          targetCustomer: 'Acme',
          ipAddress: '203.0.113.9',
        }),
      ),
    );

    expect(rows).toHaveLength(25);
    const names = new Set(rows.map((r) => r.adminName));
    expect(names.size).toBe(25);
  });

  it('exposes createdAt as an ISO `timestamp` for the admin UI', async () => {
    const { service, findMany } = build();

    const result = await service.list();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(result.items[0]).toEqual({
      id: 'log_2',
      action: 'IMPERSONATION_START',
      adminName: 'Root',
      targetCustomer: 'Acme',
      ipAddress: '203.0.113.9',
      timestamp: '2026-07-09T10:00:00.000Z',
      createdAt: new Date('2026-07-09T10:00:00.000Z'),
    });
  });
});
