import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { AccountService } from './account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Patch('profile')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.account.updateProfile(user.sub, dto);
  }

  @Post('email/request')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestEmailChange(
    @CurrentUser() user: JwtUser,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.account.requestEmailChange(user.sub, dto.newEmail);
  }

  @Post('email/verify')
  verifyEmailChange(
    @CurrentUser() user: JwtUser,
    @Body() dto: VerifyEmailChangeDto,
  ) {
    return this.account.verifyEmailChange(user.sub, dto.newEmail, dto.code);
  }

  @Get('billing')
  billing(@CurrentUser() user: JwtUser) {
    return this.account.getBilling(user.sub);
  }

  @Get('billing/invoice/:invoiceRef/pdf')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  invoicePdf(
    @CurrentUser() user: JwtUser,
    @Param('invoiceRef') invoiceRef: string,
  ) {
    return this.account.getInvoicePdfUrl(user.sub, invoiceRef);
  }

  @Get('insights')
  insights(@CurrentUser() user: JwtUser) {
    return this.account.getInsights(user.sub);
  }

  @Get('export')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  exportData(@CurrentUser() user: JwtUser) {
    return this.account.exportUserData(user.sub);
  }

  @Delete()
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  anonymizeAccount(@CurrentUser() user: JwtUser) {
    return this.account.anonymizeAccount(user.sub);
  }
}
