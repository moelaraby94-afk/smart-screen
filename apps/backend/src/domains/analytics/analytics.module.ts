import { Module } from '@nestjs/common';
import { ProofOfPlayController } from './proof-of-play.controller';
import { ProofOfPlayService } from './proof-of-play.service';

@Module({
  controllers: [ProofOfPlayController],
  providers: [ProofOfPlayService],
  exports: [ProofOfPlayService],
})
export class AnalyticsModule {}
