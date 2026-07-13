import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OnboardingService } from './onboarding.service';
import { CompleteStepDto } from './dto/complete-step.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  constructor(
    private readonly onboarding: OnboardingService,
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

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  async getProgress(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.onboarding.getProgress(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('complete-step')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async completeStep(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CompleteStepDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.onboarding.completeStep(workspaceId, dto.step);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch('dismiss')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async dismiss(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.onboarding.dismiss(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('reset')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async reset(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertMembership(workspaceId, user.sub);
    return this.onboarding.reset(workspaceId);
  }
}
