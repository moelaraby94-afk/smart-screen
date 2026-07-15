import { Global, Module } from '@nestjs/common';
import { WorkspaceAuthHelper } from './workspace-auth.helper';
import { AccountContextHelper } from './account-context.helper';
import { OtpHelper } from './otp.helper';

@Global()
@Module({
  providers: [WorkspaceAuthHelper, AccountContextHelper, OtpHelper],
  exports: [WorkspaceAuthHelper, AccountContextHelper, OtpHelper],
})
export class WorkspaceAuthModule {}
