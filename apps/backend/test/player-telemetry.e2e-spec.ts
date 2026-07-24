import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PlayerTelemetryController } from '../src/domains/player/player-telemetry.controller';
import { PlayerSecretGuard } from '../src/domains/player/player-secret.guard';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('Player Telemetry API (e2e)', () => {
  let app: INestApplication;
  let prisma: Record<string, unknown>;

  beforeAll(async () => {
    prisma = {
      proofOfPlay: { create: jest.fn().mockResolvedValue({ id: 'pop-1' }) },
      commandAck: { create: jest.fn().mockResolvedValue({ id: 'ack-1' }) },
      crashReport: { create: jest.fn().mockResolvedValue({ id: 'crash-1' }) },
      playerOtaUpdate: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      screen: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'screen-1', workspaceId: 'ws-1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'screen-1',
          workspaceId: 'ws-1',
          activePlaylistId: 'pl-1',
        }),
      },
      playlist: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'pl-1', isPublished: true }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      playlistItem: { findMany: jest.fn().mockResolvedValue([]) },
      canvas: { findMany: jest.fn().mockResolvedValue([]) },
      media: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PlayerTelemetryController],
      providers: [Reflector, { provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(PlayerSecretGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
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

  describe('POST /api/v1/player/telemetry/proof-of-play', () => {
    it('records proof-of-play from player', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/player/telemetry/proof-of-play')
        .set('x-player-secret', 'test-secret')
        .send({
          screenId: 'screen-1',
          workspaceId: 'ws-1',
          contentType: 'MEDIA',
          contentId: 'media-1',
          contentName: 'Test',
          durationSec: 10,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/v1/player/telemetry/command-ack', () => {
    it('acknowledges a command', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/player/telemetry/command-ack')
        .set('x-player-secret', 'test-secret')
        .send({
          screenId: 'screen-1',
          workspaceId: 'ws-1',
          commandId: 'cmd-1',
          status: 'SUCCESS',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/v1/player/telemetry/crash-report', () => {
    it('records a crash report', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/player/telemetry/crash-report')
        .set('x-player-secret', 'test-secret')
        .send({
          screenId: 'screen-1',
          workspaceId: 'ws-1',
          playerVersion: '1.0.0',
          platform: 'WEB',
          stackTrace: 'Error: test',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/v1/player/telemetry/ota-update', () => {
    it('checks for OTA updates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/player/telemetry/ota-update?serialNumber=SN-001')
        .set('x-player-secret', 'test-secret');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/player/telemetry/content-manifest', () => {
    it('returns content manifest for a screen', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/player/telemetry/content-manifest?screenId=screen-1')
        .set('x-player-secret', 'test-secret');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('manifest');
      expect(res.body).toHaveProperty('screenId');
      expect(res.body).toHaveProperty('playlistId');
    });
  });
});
