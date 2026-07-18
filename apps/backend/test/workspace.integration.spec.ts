import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { WorkspacesController } from '../src/domains/workspaces/workspaces.controller';
import { WorkspacesService } from '../src/domains/workspaces/workspaces.service';
import { PairingService } from '../src/domains/pairing/pairing.service';
import { WorkspaceAuthHelper } from '../src/common/auth/workspace-auth.helper';
import { RolesGuard } from '../src/common/auth/roles.guard';
import { AccountContextHelper } from '../src/common/auth/account-context.helper';
import { JwtStrategy } from '../src/domains/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/common/auth/jwt-auth.guard';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ScreenHeartbeatService } from '../src/domains/realtime/screen-heartbeat.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from '../src/common/throttler/user-throttler.guard';
import { UserRole } from '@prisma/client';

const JWT_SECRET = 'test-secret';
const WS_ID = 'ws_1';
const USER_ID = 'user_1';

describe('Workspace flow (integration)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: JWT_SECRET }),
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] }),
      ],
      controllers: [WorkspacesController],
      providers: [
        JwtStrategy,
        RolesGuard,
        AccountContextHelper,
        UserThrottlerGuard,
        PairingService,
        WorkspaceAuthHelper,
        {
          provide: WorkspacesService,
          useValue: {
            listAccountWorkspaces: jest.fn().mockResolvedValue([]),
            createForUser: jest
              .fn()
              .mockResolvedValue({ id: WS_ID, name: 'Test WS' }),
            getWorkspace: jest
              .fn()
              .mockResolvedValue({ id: WS_ID, name: 'Test WS' }),
            update: jest.fn().mockResolvedValue({ id: WS_ID, name: 'Updated' }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: USER_ID,
                isSuperAdmin: false,
                isActive: true,
              }),
            },
            workspace: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
            workspaceMember: {
              findUnique: jest.fn(),
              findFirst: jest
                .fn()
                .mockResolvedValue({ userId: USER_ID, role: UserRole.OWNER }),
            },
            accountMember: {
              findFirst: jest.fn().mockResolvedValue(null),
              findUnique: jest.fn().mockResolvedValue(null),
            },
            screenPairingSession: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ScreenHeartbeatService,
          useValue: {
            emitPairingSessionComplete: jest.fn(),
            emitPairingStarted: jest.fn(),
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
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { sub: USER_ID, email: 'test@test.com', role: 'OWNER' };
          return true;
        },
      })
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

    token = new JwtService({ secret: JWT_SECRET }).sign({
      sub: USER_ID,
      email: 'test@test.com',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/workspaces/account/workspaces', () => {
    it('returns workspace list for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/workspaces/account/workspaces')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/workspaces', () => {
    it('creates a workspace with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Workspace' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(WS_ID);
    });

    it('rejects missing name with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
