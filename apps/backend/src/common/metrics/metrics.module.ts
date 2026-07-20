import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsAuthGuard } from './metrics-auth.guard';

@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsAuthGuard],
  exports: [MetricsService],
})
export class MetricsModule {}
