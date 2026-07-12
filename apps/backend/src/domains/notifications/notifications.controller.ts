import { Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../../common/auth/current-user.decorator';
import { NotificationsService, type NotificationRow } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: JwtUser): Promise<{ items: NotificationRow[]; unreadCount: number }> {
    const [items, unreadCount] = await Promise.all([
      this.service.listForUser(user.sub),
      this.service.unreadCount(user.sub),
    ]);
    return { items, unreadCount };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: JwtUser, @Param('id') id: string): Promise<{ ok: true }> {
    await this.service.markRead(user.sub, id);
    return { ok: true as const };
  }

  @Post('mark-all-read')
  async markAllRead(@CurrentUser() user: JwtUser): Promise<{ ok: true }> {
    await this.service.markAllRead(user.sub);
    return { ok: true as const };
  }
}
