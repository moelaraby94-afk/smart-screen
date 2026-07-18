import {
  Injectable,
  NotFoundException,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { skipFor } from '../../common/pagination/pagination-query.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtime?: RealtimeGateway,
  ) {}

  async listForUser(
    userId: string,
    query: { page: number; limit: number },
  ): Promise<NotificationRow[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: skipFor(query),
      take: query.limit,
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      read: r.read,
      link: r.link,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId } });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!row) throw new NotFoundException('Notification not found');
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async createForUser(
    userId: string,
    data: {
      type: string;
      title: string;
      message: string;
      link?: string | null;
    },
  ): Promise<NotificationRow> {
    const row = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link ?? null,
      },
    });
    const result: NotificationRow = {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      link: row.link,
      createdAt: row.createdAt.toISOString(),
    };
    this.realtime?.emitNotificationToUser(userId, result);
    return result;
  }

  async createForWorkspaceMembers(
    workspaceId: string,
    data: {
      type: string;
      title: string;
      message: string;
      link?: string | null;
    },
  ): Promise<void> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { userId: true },
    });
    if (members.length === 0) return;
    await this.prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link ?? null,
      })),
    });
  }

  async getPreferences(userId: string): Promise<Record<string, boolean>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    if (!user) return {};
    const prefs = user.notificationPreferences as Record<
      string,
      boolean
    > | null;
    return prefs ?? {};
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences },
    });
  }
}
