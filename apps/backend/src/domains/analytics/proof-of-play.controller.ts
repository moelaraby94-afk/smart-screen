import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../../common/auth/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ProofOfPlayService, type RecordProofOfPlayInput } from './proof-of-play.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: ['analytics'] })
export class ProofOfPlayController {
  constructor(private readonly popService: ProofOfPlayService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('proof-of-play')
  getReport(
    @Query('workspaceId') workspaceId: string,
    @Query('screenId') screenId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.popService.getReport(workspaceId, {
      screenId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post('proof-of-play')
  record(@Body() body: RecordProofOfPlayInput) {
    return this.popService.record(body);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post('proof-of-play/batch')
  recordBatch(@Body() body: { items: RecordProofOfPlayInput[] }) {
    return this.popService.recordBatch(body.items);
  }
}
