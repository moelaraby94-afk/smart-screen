import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { TransitionCampaignDto } from './dto/transition-campaign.dto';
import { CampaignsService } from './campaigns.service';
import { CUSTOMER_ROUTES } from '../../common/constants/route-prefixes';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: [...CUSTOMER_ROUTES.CAMPAIGNS] })
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  list(@Query() query: ListCampaignsDto) {
    return this.campaignsService.list(query.workspaceId, query);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':id')
  getOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.campaignsService.getOne(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: JwtUser) {
    return this.campaignsService.create(dto, user.sub);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(workspaceId, id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ): Promise<void> {
    await this.campaignsService.remove(workspaceId, id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.campaignsService.submit(workspaceId, id, user.sub);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: TransitionCampaignDto,
  ) {
    return this.campaignsService.approve(
      workspaceId,
      id,
      user.sub,
      dto.comment,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: TransitionCampaignDto,
  ) {
    return this.campaignsService.reject(workspaceId, id, user.sub, dto.comment);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.campaignsService.publish(workspaceId, id, user.sub);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/pause')
  pause(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.campaignsService.pause(workspaceId, id, user.sub);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/resume')
  resume(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.campaignsService.resume(workspaceId, id, user.sub);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/end')
  end(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.campaignsService.end(workspaceId, id, user.sub);
  }
}
