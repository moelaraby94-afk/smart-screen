import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PlaylistsModule } from '../playlists/playlists.module';
import { SchedulingModule } from '../schedules/scheduling.module';
import { ScreensController } from './screens.controller';
import { ScreensService } from './screens.service';
import { ScreenAssignmentsService } from './screen-assignments.service';

@Module({
  imports: [PlaylistsModule, SchedulingModule],
  controllers: [ScreensController],
  providers: [ScreensService, ScreenAssignmentsService, RolesGuard],
  exports: [ScreensService, ScreenAssignmentsService],
})
export class ScreensModule {}
