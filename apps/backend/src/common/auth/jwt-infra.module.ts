import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Shared JWT infrastructure module.
 * Extracted from AuthModule to break the Auth ↔ Realtime circular dependency.
 *
 * Both AuthModule and RealtimeModule import this module independently
 * instead of RealtimeModule importing AuthModule via forwardRef.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_ACCESS_SECRET',
          'dev-access-secret',
        ),
      }),
    }),
  ],
  exports: [JwtModule],
})
export class JwtInfraModule {}
