import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

type DeleteManyArgs = {
  where: { createdAt: { lt: Date } };
};

/**
 * Tests for the AuditLog retention purge job. Verifies that:
 * - Entries older than the retention window are deleted.
 * - The retention window is configurable via AUDIT_LOG_RETENTION_DAYS.
 * - The default of 90 days is used when the env var is absent/invalid.
 */
describe('MaintenanceService — AuditLog retention', () => {
  function build(envValue?: string) {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const prisma = {
      auditLog: { deleteMany },
      screenPairingSession: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaService;

    const config = {
      get: jest.fn((key: string) =>
        key === 'AUDIT_LOG_RETENTION_DAYS' ? envValue : undefined,
      ),
    } as unknown as ConfigService;

    return {
      service: new MaintenanceService(prisma, config, {} as never),
      deleteMany: deleteMany as jest.MockedFunction<
        (args: DeleteManyArgs) => Promise<{ count: number }>
      >,
    };
  }

  it('deletes AuditLog rows older than the retention window', async () => {
    const { service, deleteMany } = build('30');

    await service.purgeOldAuditLogs();

    expect(deleteMany).toHaveBeenCalledTimes(1);
    const arg = deleteMany.mock.calls[0][0];
    expect(arg.where.createdAt.lt).toBeInstanceOf(Date);

    // Cutoff should be ~30 days ago
    const cutoff = arg.where.createdAt.lt;
    const expectedMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - expectedMs)).toBeLessThan(5000);
  });

  it('defaults to 90 days when AUDIT_LOG_RETENTION_DAYS is absent', async () => {
    const { service, deleteMany } = build(undefined);

    await service.purgeOldAuditLogs();

    const arg = deleteMany.mock.calls[0][0];
    const cutoff = arg.where.createdAt.lt;
    const expectedMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - expectedMs)).toBeLessThan(5000);
  });

  it('defaults to 90 days when AUDIT_LOG_RETENTION_DAYS is invalid', async () => {
    const { service, deleteMany } = build('not-a-number');

    await service.purgeOldAuditLogs();

    const arg = deleteMany.mock.calls[0][0];
    const cutoff = arg.where.createdAt.lt;
    const expectedMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - expectedMs)).toBeLessThan(5000);
  });

  it('defaults to 90 days when AUDIT_LOG_RETENTION_DAYS is zero or negative', async () => {
    const { service, deleteMany } = build('0');

    await service.purgeOldAuditLogs();

    const arg = deleteMany.mock.calls[0][0];
    const cutoff = arg.where.createdAt.lt;
    const expectedMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - expectedMs)).toBeLessThan(5000);
  });

  it('logs when rows are deleted', async () => {
    const { service, deleteMany } = build('30');
    deleteMany.mockResolvedValue({ count: 5 });

    const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

    await service.purgeOldAuditLogs();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Deleted 5 AuditLog row(s)'),
    );
    logSpy.mockRestore();
  });

  it('does not log when zero rows are deleted', async () => {
    const { service, deleteMany } = build('30');
    deleteMany.mockResolvedValue({ count: 0 });

    const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

    await service.purgeOldAuditLogs();

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
