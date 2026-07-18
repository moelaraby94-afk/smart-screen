import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import { AuthController } from '../src/domains/auth/auth.controller';
import { AuthService } from '../src/domains/auth/auth.service';
import { TwoFactorService } from '../src/domains/auth/two-factor.service';
import { JwtStrategy } from '../src/domains/auth/jwt.strategy';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LoginLockoutService } from '../src/domains/auth/login-lockout.service';
import { EmailService } from '../src/domains/email/email.service';
import { OtpHelper } from '../src/common/auth/otp.helper';
import { AccountContextHelper } from '../src/common/auth/account-context.helper';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const JWT_SECRET = 'test-secret';

describe('Auth flow (integration)', () => {
  let app: INestApplication;
  let authService: {
    login: jest.Mock;
    registerStart: jest.Mock;
    me: jest.Mock;
  };

  beforeAll(async () => {
    authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: { id: 'user_1', email: 'test@test.com', fullName: 'Test' },
        workspaces: [],
      }),
      registerStart: jest.fn().mockResolvedValue({ verificationSent: true }),
      me: jest.fn().mockResolvedValue({ id: 'user_1', email: 'test@test.com' }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: JWT_SECRET }),
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] }),
      ],
      controllers: [AuthController],
      providers: [
        JwtStrategy,
        AccountContextHelper,
        OtpHelper,
        LoginLockoutService,
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: TwoFactorService,
          useValue: {
            isTwoFactorEnabled: jest.fn().mockResolvedValue(false),
            generateSecret: jest
              .fn()
              .mockReturnValue({ otpauthUrl: '', base32: '' }),
            verifyToken: jest.fn().mockReturnValue(true),
            enableTwoFactor: jest.fn().mockResolvedValue(undefined),
            disableTwoFactor: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmailService,
          useValue: { sendOtp: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn(), update: jest.fn() },
            accountMember: {
              findFirst: jest.fn().mockResolvedValue(null),
              findUnique: jest.fn().mockResolvedValue(null),
            },
            workspaceMember: {
              findFirst: jest.fn().mockResolvedValue(null),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: unknown) =>
              key === 'JWT_ACCESS_SECRET' ? JWT_SECRET : def,
            ),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns tokens on valid login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe('access-token-123');
      expect(res.body.user.email).toBe('test@test.com');
      expect(authService.login).toHaveBeenCalledWith(
        { email: 'test@test.com', password: 'Password123!' },
        expect.any(String),
      );
    });

    it('rejects missing email with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'Password123!' });

      expect(res.status).toBe(400);
    });

    it('rejects missing password with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/register/start', () => {
    it('accepts valid registration start', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/start')
        .send({
          email: 'new@test.com',
          password: 'Password123!',
          fullName: 'New User',
          businessName: 'New Business',
          phone: '+1234567890',
          country: 'US',
        });

      expect(res.status).toBe(200);
      expect(res.body.verificationSent).toBe(true);
    });

    it('rejects invalid email with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/start')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          fullName: 'New User',
          businessName: 'New Business',
          phone: '+1234567890',
          country: 'US',
        });

      expect(res.status).toBe(400);
    });

    it('rejects short password with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/start')
        .send({
          email: 'new@test.com',
          password: 'short',
          fullName: 'New User',
          businessName: 'New Business',
          phone: '+1234567890',
          country: 'US',
        });

      expect(res.status).toBe(400);
    });
  });
});
