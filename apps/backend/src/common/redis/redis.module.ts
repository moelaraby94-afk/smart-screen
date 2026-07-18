import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Global Redis module — provides RedisService to all modules.
 *
 * Registered as @Global so any module can inject RedisService
 * without importing RedisModule explicitly.
 *
 * Official source: NestJS — https://docs.nestjs.com/fundamentals/modules
 * "Global modules reduce the need to import the same module everywhere."
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
