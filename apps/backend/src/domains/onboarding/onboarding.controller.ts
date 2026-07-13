import {
  Body,
  Controller,
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
import { UserRole } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import { CompleteStepDto } from './dto/complete-step.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  getProgress(@Query('workspaceId') workspaceId: string) {
    return this.onboarding.getProgress(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('complete-step')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  completeStep(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CompleteStepDto,
  ) {
    return this.onboarding.completeStep(workspaceId, dto.step);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch('dismiss')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  dismiss(@Query('workspaceId') workspaceId: string) {
    return this.onboarding.dismiss(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('reset')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reset(@Query('workspaceId') workspaceId: string) {
    return this.onboarding.reset(workspaceId);
  }
}
