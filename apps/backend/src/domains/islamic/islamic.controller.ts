import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrayerTimesService } from './prayer-times.service';
import { RamadanService } from './ramadan.service';
import { UpdatePrayerConfigDto } from './dto/update-prayer-config.dto';
import { UpdateRamadanConfigDto } from './dto/update-ramadan-config.dto';

@Controller('islamic')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IslamicController {
  constructor(
    private readonly prayerTimes: PrayerTimesService,
    private readonly ramadan: RamadanService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertMembership(workspaceId: string, userId: string) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (!membership) throw new ForbiddenException('Not a member of this workspace');
    return membership;
  }

  // ─── Prayer Times ─────────────────────────────────────────────────

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('prayer-times')
  async getPrayerTimes(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.prayerTimes.getPrayerTimes(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('prayer-config')
  async getPrayerConfig(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.prayerTimes.getConfig(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch('prayer-config')
  async updatePrayerConfig(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdatePrayerConfigDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.prayerTimes.updateConfig(workspaceId, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('prayer-pause-status')
  async getPrayerPauseStatus(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.prayerTimes.checkPrayerPause(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('hijri-date')
  async getHijriDate(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.prayerTimes.getHijriDate(workspaceId);
  }

  // ─── Ramadan Mode ─────────────────────────────────────────────────

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('ramadan-config')
  async getRamadanConfig(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.ramadan.getConfig(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch('ramadan-config')
  async updateRamadanConfig(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateRamadanConfigDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.ramadan.updateConfig(workspaceId, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get('ramadan-status')
  async getRamadanStatus(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    const active = await this.ramadan.isRamadanActive(workspaceId);
    const playlist = await this.ramadan.getRamadanPlaylist(workspaceId);
    return { active, ...playlist };
  }
}
