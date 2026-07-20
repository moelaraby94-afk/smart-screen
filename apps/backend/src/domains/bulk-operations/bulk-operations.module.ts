import { Module } from '@nestjs/common';
import { BulkOperationsController } from './bulk-operations.controller';

@Module({
  controllers: [BulkOperationsController],
})
export class BulkOperationsModule {}
