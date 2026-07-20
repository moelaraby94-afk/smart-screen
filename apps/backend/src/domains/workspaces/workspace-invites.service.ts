import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InvitationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { EmailService } from '../email/email.service';
import { teamInviteEmail } from '../email/email-templates';

@Injectable()
export class WorkspaceInvitesService {
  private readonly log = new Logger(WorkspaceInvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly configHelper: ConfigHelper,
  ) {}

  async inviteMember(
    workspaceId: string,
    invitedById: string,
    email: string,
    role: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const validRoles: string[] = [
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
    ];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(
        'Invalid role. Must be VIEWER, EDITOR, or ADMIN.',
      );
    }

    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email: normalizedEmail } },
    });
    if (existingMember) {
      throw new BadRequestException(
        'This email is already a member of the workspace.',
      );
    }

    const existingInvite = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });
    if (existingInvite) {
      throw new BadRequestException(
        'An invitation has already been sent to this email.',
      );
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        subscription: { select: { seats: true } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const seatLimit = workspace.subscription?.seats ?? 5;
    const [memberCount, pendingCount] = await Promise.all([
      this.prisma.workspaceMember.count({ where: { workspaceId } }),
      this.prisma.workspaceInvitation.count({
        where: { workspaceId, status: InvitationStatus.PENDING },
      }),
    ]);
    if (memberCount + pendingCount >= seatLimit) {
      throw new BadRequestException(
        `Seat limit reached (${memberCount + pendingCount}/${seatLimit}). Upgrade your plan to invite more members.`,
      );
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
      select: { fullName: true },
    });

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, fullName: true, isActive: true },
    });

    if (existingUser) {
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: existingUser.id,
          role: role as UserRole,
        },
      });

      if (this.email.isConfigured()) {
        const base = this.configHelper.getFrontendBaseUrl();
        try {
          await this.email.enqueue({
            to: normalizedEmail,
            ...teamInviteEmail({
              inviterName: inviter?.fullName ?? 'A team member',
              workspaceName: workspace.name,
              inviteUrl: `${base}/en/team`,
              role,
            }),
          });
        } catch (err) {
          this.log.error(
            `Failed to send invite notification to ${normalizedEmail}: ${err}`,
          );
        }
      }

      return {
        ok: true as const,
        addedDirectly: true as const,
        message: `${normalizedEmail} has been added to the workspace.`,
        workspaceId,
        email: normalizedEmail,
        role,
      };
    }

    const { token, expiresAt } = this.makeInvitationToken();

    await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        role: role as UserRole,
        token,
        status: InvitationStatus.PENDING,
        invitedById,
        expiresAt,
      },
    });

    let emailSent = false;
    if (this.email.isConfigured()) {
      const base = this.configHelper.getFrontendBaseUrl();
      const inviteUrl = `${base}/en/invite?token=${token}`;
      try {
        await this.email.enqueue({
          to: normalizedEmail,
          ...teamInviteEmail({
            inviterName: inviter?.fullName ?? 'A team member',
            workspaceName: workspace.name,
            inviteUrl,
            role,
          }),
        });
        emailSent = true;
      } catch (err) {
        this.log.error(
          `Failed to send invite email to ${normalizedEmail}: ${err}`,
        );
      }
    }

    return {
      ok: true as const,
      addedDirectly: false as const,
      emailSent,
      message: emailSent
        ? `Invitation sent to ${normalizedEmail}.`
        : `Invitation created for ${normalizedEmail}, but email could not be sent. Share the invite link manually.`,
      workspaceId,
      email: normalizedEmail,
      role,
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: { select: { id: true, name: true } } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException(
        'This invitation has already been accepted.',
      );
    }

    if (invitation.status === InvitationStatus.CANCELLED) {
      throw new BadRequestException('This invitation has been cancelled.');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address.',
      );
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
      },
    });
    if (existingMember) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });
      return {
        ok: true as const,
        alreadyMember: true as const,
        workspaceId: invitation.workspaceId,
        workspaceName: invitation.workspace.name,
        message: 'You are already a member of this workspace.',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { workspaceId: invitation.workspaceId },
        select: { seats: true },
      });
      const seatLimit = sub?.seats ?? 5;
      const currentCount = await tx.workspaceMember.count({
        where: { workspaceId: invitation.workspaceId },
      });
      if (currentCount >= seatLimit) {
        throw new BadRequestException(
          `Seat limit reached (${currentCount}/${seatLimit}). Upgrade your plan to add more members.`,
        );
      }
      await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      });
      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });
    });

    return {
      ok: true as const,
      alreadyMember: false as const,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      role: invitation.role,
      message: `You have joined "${invitation.workspace.name}" as ${invitation.role}.`,
    };
  }

  async listInvitations(workspaceId: string) {
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return invitations.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
    }));
  }

  async cancelInvitation(workspaceId: string, invitationId: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending invitations can be cancelled.',
      );
    }
    await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.CANCELLED },
    });
    return { ok: true as const };
  }

  async resendInvitation(workspaceId: string, invitationId: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be resent.');
    }

    const { token, expiresAt } = this.makeInvitationToken();

    await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { token, expiresAt },
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitation.invitedById },
      select: { fullName: true },
    });

    let emailSent = false;
    if (this.email.isConfigured()) {
      const base = this.configHelper.getFrontendBaseUrl();
      const inviteUrl = `${base}/en/invite?token=${token}`;
      try {
        await this.email.enqueue({
          to: invitation.email,
          ...teamInviteEmail({
            inviterName: inviter?.fullName ?? 'A team member',
            workspaceName: workspace?.name ?? 'Workspace',
            inviteUrl,
            role: invitation.role,
          }),
        });
        emailSent = true;
      } catch (err) {
        this.log.error(
          `Failed to resend invite email to ${invitation.email}: ${err}`,
        );
      }
    }

    return { ok: true as const, emailSent };
  }

  private makeInvitationToken(): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, expiresAt };
  }
}
