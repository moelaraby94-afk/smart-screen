import { Module, forwardRef } from '@nestjs/common';
import { PlaylistsModule } from '../playlists/playlists.module';
import { SchedulingModule } from './scheduling.module';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';

@Module({
  imports: [SchedulingModule, forwardRef(() => PlaylistsModule)],
  controllers: [SchedulesController, HolidayController],
  providers: [SchedulesService, HolidayService],
  exports: [SchedulesService, SchedulingModule, HolidayService],
})
export class SchedulesModule {}
