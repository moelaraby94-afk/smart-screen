import { Global, Module } from '@nestjs/common';
import { WorkspaceAuthHelper } from './workspace-auth.helper';
import { AccountContextHelper } from './account-context.helper';
import { OtpHelper } from './otp.helper';
import { SessionRevocationService } from './session-revocation.service';
import { WorkspaceResolverService } from './workspace-resolver.service';
import { WorkspaceProvisioningService } from './workspace-provisioning.service';

@Global()
@Module({
  providers: [
    WorkspaceAuthHelper,
    AccountContextHelper,
    OtpHelper,
    SessionRevocationService,
    WorkspaceResolverService,
    WorkspaceProvisioningService,
  ],
  exports: [
    WorkspaceAuthHelper,
    AccountContextHelper,
    OtpHelper,
    SessionRevocationService,
    WorkspaceResolverService,
    WorkspaceProvisioningService,
  ],
})
export class WorkspaceAuthModule {}
