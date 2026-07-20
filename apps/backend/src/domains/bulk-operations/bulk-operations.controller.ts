import {
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: ['bulk'] })
export class BulkOperationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('schedules/delete')
  async bulkDeleteSchedules(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { ids: string[] },
  ) {
    const result = await this.prisma.schedule.deleteMany({
      where: { id: { in: body.ids }, workspaceId },
    });
    return { deleted: result.count };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('schedules/toggle')
  async bulkToggleSchedules(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { ids: string[]; enabled: boolean },
  ) {
    const result = await this.prisma.schedule.updateMany({
      where: { id: { in: body.ids }, workspaceId },
      data: { enabled: body.enabled },
    });
    return { updated: result.count };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('media/delete')
  async bulkDeleteMedia(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { ids: string[] },
  ) {
    const result = await this.prisma.media.deleteMany({
      where: { id: { in: body.ids }, workspaceId },
    });
    return { deleted: result.count };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete('screens')
  async bulkDeleteScreens(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { ids: string[] },
  ) {
    const result = await this.prisma.screen.deleteMany({
      where: { id: { in: body.ids }, workspaceId },
    });
    return { deleted: result.count };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('playlists/delete')
  async bulkDeletePlaylists(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { ids: string[] },
  ) {
    const result = await this.prisma.playlist.deleteMany({
      where: { id: { in: body.ids }, workspaceId },
    });
    return { deleted: result.count };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('canvases/delete')
  async bulkDeleteCanvases(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { ids: string[] },
  ) {
    const result = await this.prisma.canvas.deleteMany({
      where: { id: { in: body.ids }, workspaceId },
    });
    return { deleted: result.count };
  }
}
