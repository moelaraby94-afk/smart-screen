import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { SuperAdminDbGuard } from '../../common/auth/super-admin-db.guard';
import { FeatureFlagsService } from './feature-flags.service';
import { SetFeatureFlagDto } from './dto/set-feature-flag.dto';

@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, SuperAdminDbGuard)
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  listAll() {
    return this.flags.listAll();
  }

  @Get(':workspaceId')
  listForWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.flags.listForWorkspace(workspaceId);
  }

  @Patch(':workspaceId')
  setFlag(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SetFeatureFlagDto,
  ) {
    return this.flags.setFlag(workspaceId, dto.module, dto.enabled, 'super_admin');
  }
}
