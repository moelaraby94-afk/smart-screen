import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountInsightsService } from './account-insights.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountController],
  providers: [AccountService, AccountInsightsService],
  exports: [AccountService, AccountInsightsService],
})
export class AccountModule {}
