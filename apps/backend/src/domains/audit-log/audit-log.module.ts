import { Module } from '@nestjs/common';
import { AuditLogModule } from '../../common/audit/audit-log.module';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AuditLogController } from './audit-log.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [AuditLogController],
  providers: [RolesGuard],
})
export class WorkspaceAuditLogModule {}
