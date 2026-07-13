import { Global, Module } from '@nestjs/common';
import { WorkspaceAuthHelper } from './workspace-auth.helper';
import { OtpHelper } from './otp.helper';

@Global()
@Module({
  providers: [WorkspaceAuthHelper, OtpHelper],
  exports: [WorkspaceAuthHelper, OtpHelper],
})
export class WorkspaceAuthModule {}
