import { Global, Module } from '@nestjs/common';
import { SecurityEventService } from './security-event.service';
import { VirusScanService } from './virus-scan.service';

@Global()
@Module({
  providers: [SecurityEventService, VirusScanService],
  exports: [SecurityEventService, VirusScanService],
})
export class SecurityEventModule {}
