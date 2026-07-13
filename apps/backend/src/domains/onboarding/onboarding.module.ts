import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OnboardingController, FeatureFlagsController],
  providers: [OnboardingService, FeatureFlagsService],
  exports: [OnboardingService, FeatureFlagsService],
})
export class OnboardingModule {}
