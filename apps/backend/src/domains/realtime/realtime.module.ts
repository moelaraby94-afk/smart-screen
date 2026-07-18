import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../common/redis/redis.module';
import { RealtimeGateway } from './realtime.gateway';
import { ScreenHeartbeatService } from './screen-heartbeat.service';
import { OfflineEventQueueService } from './offline-event-queue.service';
import { WsThrottlerGuard } from '../../common/throttler/ws-throttler.guard';

@Module({
  imports: [ConfigModule, RedisModule, forwardRef(() => AuthModule)],
  providers: [
    RealtimeGateway,
    ScreenHeartbeatService,
    OfflineEventQueueService,
    WsThrottlerGuard,
  ],
  exports: [ScreenHeartbeatService, RealtimeGateway, OfflineEventQueueService],
})
export class RealtimeModule {}
