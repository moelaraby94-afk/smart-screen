import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { IslamicController } from './islamic.controller';
import { PrayerTimesService } from './prayer-times.service';
import { RamadanService } from './ramadan.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IslamicController],
  providers: [PrayerTimesService, RamadanService],
  exports: [PrayerTimesService, RamadanService],
})
export class IslamicModule {}
