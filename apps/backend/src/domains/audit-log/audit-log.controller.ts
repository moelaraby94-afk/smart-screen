import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import {
  CurrentUser,
  type JwtUser,
} from '../../common/auth/current-user.decorator';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { CUSTOMER_ROUTES } from '../../common/constants/route-prefixes';
import {
  toPaginatedResponseDto,
  WorkspaceAuditLogItemDto,
} from '../../common/dto/response-dtos';

@Controller({ path: [...CUSTOMER_ROUTES.AUDIT_LOG] })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.auditLogService.listForWorkspace(
      workspaceId,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
    return toPaginatedResponseDto(WorkspaceAuditLogItemDto, result as never);
  }
}
