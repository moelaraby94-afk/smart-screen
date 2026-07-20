import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { HolidayService } from './holiday.service';

@Module({
  providers: [SchedulingService, HolidayService],
  exports: [SchedulingService, HolidayService],
})
export class SchedulingModule {}
