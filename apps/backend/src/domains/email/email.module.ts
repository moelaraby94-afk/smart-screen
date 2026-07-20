import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SubscriptionEmailService } from './subscription-email.service';
import { OnboardingEmailService } from './onboarding-email.service';
import { ConfigHelperModule } from '../../common/config/config-helper.module';

@Global()
@Module({
  imports: [ConfigHelperModule],
  providers: [EmailService, SubscriptionEmailService, OnboardingEmailService],
  exports: [EmailService, SubscriptionEmailService, OnboardingEmailService],
})
export class EmailModule {}
