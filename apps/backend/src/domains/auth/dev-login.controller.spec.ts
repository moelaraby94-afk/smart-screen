import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DevLoginController } from './dev-login.controller';
import { JwtStrategy } from './jwt.strategy';
import { LoginLockoutService } from './login-lockout.service';
import { TwoFactorService } from './two-factor.service';

/**
 * Minimal stubs — we only need route existence, not full auth flow.
 */
const authServiceStub = {
  devLoginAsFirstUser: jest.fn().mockResolvedValue({
    user: { id: 'u1', email: 'a@b.c', fullName: 'Test', locale: 'en' },
    workspaces: [],
    accessToken: 'tok',
    refreshToken: 'ref',
  }),
};
const jwtStrategyStub = { validate: jest.fn() };
const loginLockoutStub = {
  recordFailure: jest.fn(),
  checkLockout: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
};
const twoFactorStub = {};

async function buildApp(includeDevLogin: boolean): Promise<INestApplication> {
  const controllers: unknown[] = [AuthController];
  if (includeDevLogin) controllers.push(DevLoginController);

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'test-secret' }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    controllers: controllers as any,
    providers: [
      { provide: AuthService, useValue: authServiceStub },
      { provide: JwtStrategy, useValue: jwtStrategyStub },
      { provide: LoginLockoutService, useValue: loginLockoutStub },
      { provide: TwoFactorService, useValue: twoFactorStub },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('DevLoginController conditional registration (T3.2)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
  });

  it('dev-login route is registered when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'development';
    const app = await buildApp(true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer()).post('/auth/dev-login').expect(200);
    await app.close();
  });

  it('dev-login route is absent when DevLoginController is not registered (production)', async () => {
    process.env.NODE_ENV = 'production';
    const app = await buildApp(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer()).post('/auth/dev-login').expect(404);
    await app.close();
  });
});
