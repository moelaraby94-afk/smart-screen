import { Global, Module } from '@nestjs/common';
import { ConfigHelper } from './config.helper';

@Global()
@Module({
  providers: [ConfigHelper],
  exports: [ConfigHelper],
})
export class ConfigHelperModule {}
