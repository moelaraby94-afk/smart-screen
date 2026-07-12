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
import { WorkspacesService } from './workspaces.service';
import type { Request } from 'express';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly pairing: PairingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.createForUser(user.sub, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bootstrap-demo')
  bootstrapDemo(@CurrentUser() user: JwtUser) {
    return this.workspaces.bootstrapDemo(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':workspaceId/seed-demo')
  seedDemo(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.workspaces.seedDemoForMember(workspaceId, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId')
  getWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.workspaces.getWorkspace(workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId/members')
  members(@Param('workspaceId') workspaceId: string) {
    return this.workspaces.listMembers(workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':workspaceId')
  updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaces.updateWorkspace(user.sub, workspaceId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':workspaceId')
  deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.workspaces.deleteWorkspace(user.sub, workspaceId);
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
    return this.workspaces.updateMemberRole(workspaceId, user.sub, membershipId, dto.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':workspaceId/members/:membershipId')
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.workspaces.removeMember(workspaceId, user.sub, membershipId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':workspaceId/invites')
  invite(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspaces.inviteMember(workspaceId, user.sub, dto.email, dto.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get(':workspaceId/invites')
  listInvites(@Param('workspaceId') workspaceId: string) {
    return this.workspaces.listInvitations(workspaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':workspaceId/invites/:inviteId')
  cancelInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.workspaces.cancelInvitation(workspaceId, inviteId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':workspaceId/invites/:inviteId/resend')
  resendInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.workspaces.resendInvitation(workspaceId, inviteId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invites/accept')
  acceptInvite(
    @CurrentUser() user: JwtUser,
    @Body() body: { token: string },
  ) {
    return this.workspaces.acceptInvitation(body.token, user.sub);
  }

  @UseGuards(JwtAuthGuard, UserThrottlerGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
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
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(204)
  @Post(':workspaceId/pairing-started')
  async notifyPairingStarted(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    await this.workspaces.notifyPairingStarted(user.sub, workspaceId);
  }
}
