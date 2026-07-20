import { Injectable, Logger } from '@nestjs/common';
import type { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceCrudService } from './workspace-crud.service';
import { WorkspaceBootstrapService } from './workspace-bootstrap.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceInvitesService } from './workspace-invites.service';
import { WorkspaceAccountsService } from './workspace-accounts.service';

@Injectable()
export class WorkspacesService {
  private readonly log = new Logger(WorkspacesService.name);

  constructor(
    private readonly crud: WorkspaceCrudService,
    private readonly bootstrap: WorkspaceBootstrapService,
    private readonly members: WorkspaceMembersService,
    private readonly invites: WorkspaceInvitesService,
    private readonly accounts: WorkspaceAccountsService,
  ) {}

  async ensureAdminControlEntry(userId: string): Promise<void> {
    return this.crud.ensureAdminControlEntry(userId);
  }

  async createForUser(userId: string, name: string) {
    return this.crud.createForUser(userId, name);
  }

  async bootstrapDemo(userId: string) {
    return this.bootstrap.bootstrapDemo(userId);
  }

  async seedDemoContent(workspaceId: string) {
    return this.bootstrap.seedDemoContent(workspaceId);
  }

  async seedDemoForMember(workspaceId: string, userId: string) {
    return this.bootstrap.seedDemoForMember(workspaceId, userId);
  }

  async listMembers(workspaceId: string) {
    return this.members.listMembers(workspaceId);
  }

  async inviteMember(
    workspaceId: string,
    invitedById: string,
    email: string,
    role: string,
  ) {
    return this.invites.inviteMember(workspaceId, invitedById, email, role);
  }

  async acceptInvitation(token: string, userId: string) {
    return this.invites.acceptInvitation(token, userId);
  }

  async listInvitations(workspaceId: string) {
    return this.invites.listInvitations(workspaceId);
  }

  async cancelInvitation(workspaceId: string, invitationId: string) {
    return this.invites.cancelInvitation(workspaceId, invitationId);
  }

  async resendInvitation(workspaceId: string, invitationId: string) {
    return this.invites.resendInvitation(workspaceId, invitationId);
  }

  async getWorkspace(workspaceId: string) {
    return this.crud.getWorkspace(workspaceId);
  }

  async updateWorkspace(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ) {
    return this.crud.updateWorkspace(userId, workspaceId, dto);
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    return this.crud.deleteWorkspace(userId, workspaceId);
  }

  async updateMemberRole(
    workspaceId: string,
    requesterId: string,
    membershipId: string,
    newRole: string,
  ) {
    return this.members.updateMemberRole(
      workspaceId,
      requesterId,
      membershipId,
      newRole,
    );
  }

  async removeMember(
    workspaceId: string,
    requesterId: string,
    membershipId: string,
  ) {
    return this.members.removeMember(workspaceId, requesterId, membershipId);
  }

  async listAccountMembers(ownerId: string) {
    return this.accounts.listAccountMembers(ownerId);
  }

  async createAccountMember(
    ownerId: string,
    dto: {
      email: string;
      fullName: string;
      password: string;
      role: string;
      phone?: string;
      country?: string;
      city?: string;
      workspaceScopes?: Array<{ workspaceId: string; role: string }>;
    },
  ) {
    return this.accounts.createAccountMember(ownerId, dto);
  }

  async addAccountMember(
    ownerId: string,
    userId: string,
    role: string,
    workspaceScopes?: Array<{ workspaceId: string; role: string }>,
  ) {
    return this.accounts.addAccountMember(
      ownerId,
      userId,
      role,
      workspaceScopes,
    );
  }

  async updateAccountMemberRole(
    ownerId: string,
    membershipId: string,
    newRole: string,
  ) {
    return this.accounts.updateAccountMemberRole(
      ownerId,
      membershipId,
      newRole,
    );
  }

  async removeAccountMember(ownerId: string, membershipId: string) {
    return this.accounts.removeAccountMember(ownerId, membershipId);
  }

  async listAccountWorkspaces(ownerId: string) {
    return this.accounts.listAccountWorkspaces(ownerId);
  }

  async notifyPairingStarted(
    userId: string,
    workspaceId: string,
  ): Promise<{ ok: true }> {
    return this.crud.notifyPairingStarted(userId, workspaceId);
  }

  async recentActivity(workspaceId: string, limit = 20) {
    return this.crud.recentActivity(workspaceId, limit);
  }
}
