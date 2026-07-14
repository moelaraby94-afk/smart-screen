import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import {
  InvitationStatus,
  ScreenStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAuthHelper } from '../../common/auth/workspace-auth.helper';
import { ConfigHelper } from '../../common/config/config.helper';
import { MediaService } from '../media/media.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { EmailService } from '../email/email.service';
import { teamInviteEmail } from '../email/email-templates';

/** Minimal valid 1×1 PNG (transparent). */
const DEMO_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
);

@Injectable()
export class WorkspacesService {
  private readonly log = new Logger(WorkspacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAuth: WorkspaceAuthHelper,
    private readonly media: MediaService,
    private readonly heartbeat: ScreenHeartbeatService,
    private readonly email: EmailService,
    private readonly configHelper: ConfigHelper,
  ) {}

  /**
   * When the database has zero workspaces, create an empty Admin Control workspace (super-admin).
   * No sample playlists, screens, or media — tenants add content manually.
   */
  async ensureAdminControlEntry(userId: string): Promise<void> {
    const total = await this.prisma.workspace.count();
    if (total > 0) return;
    await this.createForUser(userId, 'Admin Control');
  }

  async createForUser(userId: string, name: string) {
    const slug = this.makeSlug(name);
    const workspace = await this.prisma.$transaction(async (tx) => {
      const w = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug,
          defaultLocale: 'en',
          members: {
            create: { userId, role: 'OWNER' },
          },
          subscription: {
            create: {
              plan: SubscriptionPlan.FREE,
              status: SubscriptionStatus.TRIALING,
              seats: 5,
              screenLimit: 25,
              storageLimitBytes: BigInt(5 * 1024 * 1024 * 1024),
            },
          },
        },
        select: { id: true, name: true, slug: true },
      });
      return w;
    });
    return workspace;
  }

  /**
   * One-shot demo: only when the user has zero workspace memberships.
   * Creates workspace + 2 screens + 3 sample images.
   */
  async bootstrapDemo(userId: string) {
    const membershipCount = await this.prisma.workspaceMember.count({
      where: { userId },
    });
    if (membershipCount > 0) {
      throw new BadRequestException(
        'You already belong to a workspace. Use “Seed demo content” on an existing workspace instead.',
      );
    }

    const ws = await this.createForUser(userId, 'Demo Workspace');
    await this.seedDemoContent(ws.id);
    return {
      workspace: ws,
      message: 'Demo workspace created with sample screens and media.',
    };
  }

  async seedDemoContent(workspaceId: string) {
    const screenCount = await this.prisma.screen.count({
      where: { workspaceId },
    });
    if (screenCount < 2) {
      const base = Date.now();
      const templates = [
        {
          name: 'Lobby Display',
          serialNumber: `CS-DEMO-${base}-A`,
          location: 'Main lobby',
        },
        {
          name: 'Conference Room',
          serialNumber: `CS-DEMO-${base}-B`,
          location: 'Floor 2',
        },
      ];
      for (let i = screenCount; i < 2; i++) {
        const t = templates[i];
        await this.prisma.screen.create({
          data: {
            workspaceId,
            name: t.name,
            serialNumber: t.serialNumber,
            status: ScreenStatus.ONLINE,
            location: t.location,
          },
        });
      }
    }

    const mediaCount = await this.prisma.media.count({
      where: { workspaceId },
    });
    const samples = [
      { originalName: 'sample-hero.png', mimeType: 'image/png' },
      { originalName: 'sample-promo.png', mimeType: 'image/png' },
      { originalName: 'sample-brand.png', mimeType: 'image/png' },
      { originalName: 'sample-banner.png', mimeType: 'image/png' },
      { originalName: 'sample-thumb.png', mimeType: 'image/png' },
    ];
    const targetMedia = 5;
    let mediaAdded = 0;
    for (let i = mediaCount; i < targetMedia; i++) {
      const meta = samples[i % samples.length];
      await this.media.saveUploadedFile({
        workspaceId,
        buffer: DEMO_PNG,
        originalName: meta.originalName,
        mimeType: meta.mimeType,
        size: DEMO_PNG.length,
      });
      mediaAdded += 1;
    }

    const demoPlaylist = await this.prisma.playlist.findFirst({
      where: { workspaceId, name: 'Demo Loop' },
    });
    if (!demoPlaylist) {
      const mediaRows = await this.prisma.media.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'asc' },
        take: 5,
      });
      if (mediaRows.length > 0) {
        const playlist = await this.prisma.playlist.create({
          data: {
            workspaceId,
            name: 'Demo Loop',
            isPublished: true,
          },
        });
        await this.prisma.$transaction(async (tx) => {
          for (let i = 0; i < mediaRows.length; i++) {
            await tx.playlistItem.create({
              data: {
                playlistId: playlist.id,
                mediaId: mediaRows[i].id,
                orderIndex: i,
                durationSec: 10,
              },
            });
          }
        });
        const screens = await this.prisma.screen.findMany({
          where: { workspaceId },
          take: 2,
        });
        for (const s of screens) {
          await this.prisma.screen.update({
            where: { id: s.id },
            data: { activePlaylistId: playlist.id },
          });
        }
      }
    }

    return {
      ok: true,
      screensAdded: Math.max(0, 2 - screenCount),
      mediaAdded,
    };
  }

  async seedDemoForMember(workspaceId: string, userId: string) {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage: 'Only owners and admins can seed demo content.',
    });
    return this.seedDemoContent(workspaceId);
  }

  async listMembers(workspaceId: string) {
    const rows = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            locale: true,
            isActive: true,
          },
        },
      },
    });
    return rows.map((r) => ({
      membershipId: r.id,
      role: r.role,
      joinedAt: r.createdAt.toISOString(),
      user: r.user,
    }));
  }

  /**
   * Invite a user to a workspace.
   * - If the user already has an account, they are added as a member immediately.
   * - If not, a WorkspaceInvitation record is created and an email is sent (when email is configured).
   */
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
      select: { id: true, name: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

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
          await this.email.sendMail({
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
        await this.email.sendMail({
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

  /** Accept a pending invitation by token. */
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

  /** List pending invitations for a workspace. */
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

  /** Cancel a pending invitation. */
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

  /** Resend a pending invitation email with a fresh token. */
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
        await this.email.sendMail({
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

  async getWorkspace(workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        defaultLocale: true,
        timezone: true,
        isPaused: true,
        createdAt: true,
      },
    });
  }

  async updateWorkspace(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ) {
    await this.assertWorkspaceAccess(workspaceId, userId, true);
    if (
      dto.name === undefined &&
      dto.isPaused === undefined &&
      dto.timezone === undefined &&
      dto.defaultLocale === undefined
    ) {
      throw new BadRequestException('No fields to update.');
    }
    const data: {
      name?: string;
      slug?: string;
      isPaused?: boolean;
      timezone?: string;
      defaultLocale?: string;
    } = {};
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length < 2) {
        throw new BadRequestException('Workspace name is too short.');
      }
      data.name = trimmed;
      data.slug = this.makeSlug(trimmed);
    }
    if (dto.isPaused !== undefined) {
      data.isPaused = dto.isPaused;
    }
    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone;
    }
    if (dto.defaultLocale !== undefined) {
      data.defaultLocale = dto.defaultLocale;
    }
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        isPaused: true,
        timezone: true,
        defaultLocale: true,
      },
    });
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage:
        'Only workspace owners and admins can delete this branch.',
    });
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async updateMemberRole(
    workspaceId: string,
    requesterId: string,
    membershipId: string,
    newRole: string,
  ) {
    const validRoles: string[] = [
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
    ];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(
        'Invalid role. Must be VIEWER, EDITOR, or ADMIN.',
      );
    }
    await this.assertWorkspaceAccess(workspaceId, requesterId, true);

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { id: membershipId },
      select: { id: true, role: true, workspaceId: true },
    });
    if (!membership || membership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace.');
    }
    if (membership.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot change the role of an owner.');
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: membershipId },
      data: { role: newRole as UserRole },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
    return updated;
  }

  async removeMember(
    workspaceId: string,
    requesterId: string,
    membershipId: string,
  ) {
    await this.assertWorkspaceAccess(workspaceId, requesterId, true);

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { id: membershipId },
      select: { id: true, role: true, workspaceId: true },
    });
    if (!membership || membership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace.');
    }
    if (membership.role === UserRole.OWNER) {
      throw new BadRequestException(
        'Cannot remove an owner from the workspace.',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: { id: membershipId },
    });
    return { ok: true };
  }

  private async assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requireAdmin: boolean,
  ) {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin,
    });
  }

  private makeSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `${base || 'workspace'}-${suffix}`;
  }

  private makeInvitationToken(): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, expiresAt };
  }

  /**
   * Emits `pairing:started` on `workspace:{id}` so dashboards in the Add Screen flow
   * can show live feedback (also call when the pairing modal opens).
   */
  async notifyPairingStarted(
    userId: string,
    workspaceId: string,
  ): Promise<{ ok: true }> {
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage: 'Only owners and admins can signal pairing activity.',
    });
    this.heartbeat.emitPairingStarted(workspaceId, {
      source: 'dashboard',
      at: new Date().toISOString(),
    });
    return { ok: true as const };
  }

  /** Get recent activity for a workspace (screens, media, playlists, schedules, invites). */
  async recentActivity(workspaceId: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);

    const [screens, mediaItems, playlists, schedules, invites] =
      await Promise.all([
        this.prisma.screen.findMany({
          where: { workspaceId },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.media.findMany({
          where: { workspaceId },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.playlist.findMany({
          where: { workspaceId },
          select: {
            id: true,
            name: true,
            isPublished: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take,
        }),
        this.prisma.schedule.findMany({
          where: { workspaceId },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.workspaceInvitation.findMany({
          where: { workspaceId, status: InvitationStatus.PENDING },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
      ]);

    type ActivityItem = {
      type: string;
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
    };

    const items: ActivityItem[] = [];

    for (const s of screens) {
      items.push({
        type: 'screen',
        id: s.id,
        title: s.name,
        subtitle: s.status,
        timestamp: s.createdAt.toISOString(),
      });
    }
    for (const m of mediaItems) {
      items.push({
        type: 'media',
        id: m.id,
        title: m.originalName,
        subtitle: m.mimeType,
        timestamp: m.createdAt.toISOString(),
      });
    }
    for (const p of playlists) {
      items.push({
        type: 'playlist',
        id: p.id,
        title: p.name,
        subtitle: p.isPublished ? 'published' : 'draft',
        timestamp: p.updatedAt.toISOString(),
      });
    }
    for (const s of schedules) {
      items.push({
        type: 'schedule',
        id: s.id,
        title: `${s.startTime} - ${s.endTime}`,
        subtitle: 'schedule',
        timestamp: s.createdAt.toISOString(),
      });
    }
    for (const inv of invites) {
      items.push({
        type: 'invite',
        id: inv.id,
        title: inv.email,
        subtitle: inv.role,
        timestamp: inv.createdAt.toISOString(),
      });
    }

    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return items.slice(0, take);
  }
}
