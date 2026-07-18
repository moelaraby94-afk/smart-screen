import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { StorageModule } from '../../common/storage/storage.module';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
