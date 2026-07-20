import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtInfraModule } from '../../common/auth/jwt-infra.module';
import { RedisModule } from '../../common/redis/redis.module';
import { RealtimeGateway } from './realtime.gateway';
import { ScreenHeartbeatService } from './screen-heartbeat.service';
import { OfflineEventQueueService } from './offline-event-queue.service';
import { RealtimeEventBridge } from './realtime-event-bridge';
import { WsThrottlerGuard } from '../../common/throttler/ws-throttler.guard';

@Module({
  imports: [ConfigModule, RedisModule, JwtInfraModule],
  providers: [
    RealtimeGateway,
    ScreenHeartbeatService,
    OfflineEventQueueService,
    RealtimeEventBridge,
    WsThrottlerGuard,
  ],
  exports: [ScreenHeartbeatService, RealtimeGateway, OfflineEventQueueService],
})
export class RealtimeModule {}
