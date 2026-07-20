import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { UserThrottlerGuard } from '../../common/throttler/user-throttler.guard';
import { ClaimPairingSessionDto } from '../pairing/dto/claim-pairing-session.dto';
import { PairingService } from '../pairing/pairing.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateAccountMemberDto } from './dto/create-account-member.dto';
import { AddAccountMemberDto } from './dto/add-account-member.dto';
import { UpdateAccountMemberRoleDto } from './dto/update-account-member-role.dto';
import { WorkspaceCrudService } from './workspace-crud.service';
import { WorkspaceBootstrapService } from './workspace-bootstrap.service';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceInvitesService } from './workspace-invites.service';
import { WorkspaceAccountsService } from './workspace-accounts.service';
import type { Request } from 'express';
import { CUSTOMER_ROUTES } from '../../common/constants/route-prefixes';

@Controller({ path: [...CUSTOMER_ROUTES.WORKSPACES] })
export class WorkspacesController {
  constructor(
    private readonly crud: WorkspaceCrudService,
    private readonly bootstrap: WorkspaceBootstrapService,
    private readonly members: WorkspaceMembersService,
    private readonly invites: WorkspaceInvitesService,
    private readonly accounts: WorkspaceAccountsService,
    private readonly pairing: PairingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateWorkspaceDto) {
    return this.crud.createForUser(user.sub, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bootstrap-demo')
  bootstrapDemo(@CurrentUser() user: JwtUser) {
    return this.bootstrap.bootstrapDemo(user.sub);
  }

  // ─── Account-level member endpoints (must be before :workspaceId routes) ───

  @UseGuards(JwtAuthGuard)
  @Get('account/members')
  listAccountMembers(@CurrentUser() user: JwtUser) {
    return this.accounts.listAccountMembers(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('account/workspaces')
  listAccountWorkspaces(@CurrentUser() user: JwtUser) {
    return this.accounts.listAccountWorkspaces(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('account/members')
  createAccountMember(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateAccountMemberDto,
  ) {
    return this.accounts.createAccountMember(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('account/members/add')
  addAccountMember(
    @CurrentUser() user: JwtUser,
    @Body() dto: AddAccountMemberDto,
  ) {
    return this.accounts.addAccountMember(
      user.sub,
      dto.userId,
      dto.role,
      dto.workspaceScopes,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('account/members/:membershipId/role')
  updateAccountMemberRole(
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAccountMemberRoleDto,
  ) {
    return this.accounts.updateAccountMemberRole(
      user.sub,
      membershipId,
      dto.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account/members/:membershipId')
  removeAccountMember(
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.accounts.removeAccountMember(user.sub, membershipId);
  }

  // ─── Workspace-level routes ──────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':workspaceId/seed-demo')
  seedDemo(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.bootstrap.seedDemoForMember(workspaceId, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId')
  getWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.crud.getWorkspace(workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId/members')
  listMembers(@Param('workspaceId') workspaceId: string) {
    return this.members.listMembers(workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':workspaceId')
  updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.crud.updateWorkspace(user.sub, workspaceId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':workspaceId')
  deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.crud.deleteWorkspace(user.sub, workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':workspaceId/members/:membershipId/role')
  updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.members.updateMemberRole(
      workspaceId,
      user.sub,
      membershipId,
      dto.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':workspaceId/members/:membershipId')
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.members.removeMember(workspaceId, user.sub, membershipId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':workspaceId/invites')
  invite(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.invites.inviteMember(
      workspaceId,
      user.sub,
      dto.email,
      dto.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId/invites')
  listInvites(@Param('workspaceId') workspaceId: string) {
    return this.invites.listInvitations(workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':workspaceId/invites/:inviteId')
  cancelInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invites.cancelInvitation(workspaceId, inviteId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':workspaceId/invites/:inviteId/resend')
  resendInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invites.resendInvitation(workspaceId, inviteId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invites/accept')
  acceptInvite(@CurrentUser() user: JwtUser, @Body() body: { token: string }) {
    return this.invites.acceptInvitation(body.token, user.sub);
  }

  @UseGuards(JwtAuthGuard, UserThrottlerGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.EDITOR)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':workspaceId/pairing-sessions/claim')
  claimPairingSession(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: ClaimPairingSessionDto,
    @Req() req: Request,
  ) {
    return this.pairing.claimSession(workspaceId, user.sub, dto, req.ip);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.EDITOR)
  @HttpCode(204)
  @Post(':workspaceId/pairing-started')
  async notifyPairingStarted(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    await this.crud.notifyPairingStarted(user.sub, workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId/activity')
  recentActivity(@Param('workspaceId') workspaceId: string) {
    return this.crud.recentActivity(workspaceId);
  }
}
