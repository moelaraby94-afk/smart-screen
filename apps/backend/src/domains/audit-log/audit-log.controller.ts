import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/auth/current-user.decorator';
import {
  AuditLogService,
  type WorkspaceAuditLogItem,
} from '../../common/audit/audit-log.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId: string,
  ): Promise<{ items: WorkspaceAuditLogItem[] }> {
    const items = await this.auditLogService.listForWorkspace(workspaceId);
    return { items };
  }
}
