import { Module } from '@nestjs/common';
import { AuditLogModule } from '../../common/audit/audit-log.module';
import { AuditLogController } from './audit-log.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [AuditLogController],
})
export class WorkspaceAuditLogModule {}
