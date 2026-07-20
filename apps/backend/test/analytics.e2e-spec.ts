import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ProofOfPlayController } from '../src/domains/analytics/proof-of-play.controller';
import { ProofOfPlayService } from '../src/domains/analytics/proof-of-play.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/auth/jwt-auth.guard';
import { RolesGuard } from '../src/common/auth/roles.guard';

describe('Analytics API (e2e)', () => {
  let app: INestApplication;
  let proofOfPlayService: {
    record: jest.Mock;
    recordBatch: jest.Mock;
    getReport: jest.Mock;
  };

  beforeAll(async () => {
    proofOfPlayService = {
      record: jest.fn().mockResolvedValue(undefined),
      recordBatch: jest.fn().mockResolvedValue(undefined),
      getReport: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        summary: {
          totalPlays: 0,
          uniqueContent: 0,
          topContent: [],
        },
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ProofOfPlayController],
      providers: [
        { provide: ProofOfPlayService, useValue: proofOfPlayService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
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

  describe('POST /api/v1/analytics/proof-of-play', () => {
    it('records a proof-of-play entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/analytics/proof-of-play')
        .send({
          workspaceId: 'ws-1',
          screenId: 'screen-1',
          contentType: 'MEDIA',
          contentId: 'media-1',
          contentName: 'Test Media',
          durationSec: 15,
        });

      expect(res.status).toBe(201);
      expect(proofOfPlayService.record).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/analytics/proof-of-play/batch', () => {
    it('records a batch of proof-of-play entries', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/analytics/proof-of-play/batch')
        .send({
          items: [
            {
              workspaceId: 'ws-1',
              screenId: 'screen-1',
              contentType: 'MEDIA',
              contentId: 'media-1',
              contentName: 'Test Media',
              durationSec: 15,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(proofOfPlayService.recordBatch).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/analytics/proof-of-play', () => {
    it('returns a proof-of-play report', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/proof-of-play?workspaceId=ws-1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('summary');
    });
  });
});
