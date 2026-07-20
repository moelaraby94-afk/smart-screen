import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { UserThrottlerGuard } from '../../common/throttler/user-throttler.guard';
import { MediaModule } from '../media/media.module';
import { PairingModule } from '../pairing/pairing.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceCrudService } from './workspace-crud.service';
import { WorkspaceBootstrapService } from './workspace-bootstrap.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceInvitesService } from './workspace-invites.service';
import { WorkspaceAccountsService } from './workspace-accounts.service';

@Module({
  imports: [MediaModule, PairingModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceCrudService,
    WorkspaceBootstrapService,
    WorkspaceMembersService,
    WorkspaceInvitesService,
    WorkspaceAccountsService,
    RolesGuard,
    UserThrottlerGuard,
  ],
  exports: [
    WorkspacesService,
    WorkspaceCrudService,
    WorkspaceBootstrapService,
    WorkspaceMembersService,
    WorkspaceInvitesService,
    WorkspaceAccountsService,
  ],
})
export class WorkspacesModule {}
