import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailQueueProcessor } from './email-queue.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
  ],
  providers: [EmailQueueProcessor],
  exports: [BullModule],
})
export class EmailQueueModule {}
