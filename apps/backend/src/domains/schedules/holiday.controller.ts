import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { HolidayService } from './holiday.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: ['holidays'] })
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    return this.holidayService.list(workspaceId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  create(
    @Query('workspaceId') workspaceId: string,
    @Body() body: { name: string; date: string; endDate?: string; isRecurring?: boolean },
  ) {
    return this.holidayService.create(workspaceId, {
      name: body.name,
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      isRecurring: body.isRecurring,
    });
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  remove(@Query('workspaceId') workspaceId: string, @Query('id') id: string) {
    return this.holidayService.remove(workspaceId, id);
  }
}
