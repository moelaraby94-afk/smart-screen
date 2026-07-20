import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { PlatformAuthController } from './platform-auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthImpersonationService } from './auth-impersonation.service';
import { AuthProfileService } from './auth-profile.service';
import { ExchangeTokenService } from './exchange-token.service';
import { JwtStrategy } from './jwt.strategy';
import { LoginLockoutService } from './login-lockout.service';
import { TwoFactorService } from './two-factor.service';
import { AuditLogModule } from '../../common/audit/audit-log.module';
import { CryptoModule } from '../../common/crypto/crypto.module';
import { JwtInfraModule } from '../../common/auth/jwt-infra.module';

@Module({
  imports: [
    AuditLogModule,
    CryptoModule,
    ConfigModule,
    JwtInfraModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController, PlatformAuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthCredentialsService,
    AuthRegistrationService,
    AuthImpersonationService,
    AuthProfileService,
    ExchangeTokenService,
    JwtStrategy,
    LoginLockoutService,
    TwoFactorService,
  ],
  exports: [
    AuthService,
    AuthTokenService,
    AuthCredentialsService,
    AuthImpersonationService,
    AuthProfileService,
    ExchangeTokenService,
    TwoFactorService,
  ],
})
export class AuthModule {}
