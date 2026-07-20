import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BulkOperationsController } from '../src/domains/bulk-operations/bulk-operations.controller';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/auth/jwt-auth.guard';
import { RolesGuard } from '../src/common/auth/roles.guard';

describe('Bulk Operations API (e2e)', () => {
  let app: INestApplication;
  let prisma: Record<string, unknown>;

  beforeAll(async () => {
    prisma = {
      schedule: {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      media: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
      screen: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      playlist: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      canvas: { deleteMany: jest.fn().mockResolvedValue({ count: 4 }) },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [BulkOperationsController],
      providers: [
        { provide: PrismaService, useValue: prisma },
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

  describe('POST /api/v1/bulk/schedules/delete', () => {
    it('bulk deletes schedules', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bulk/schedules/delete?workspaceId=ws-1')
        .send({ ids: ['s1', 's2', 's3'] });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('deleted');
      expect(res.body.deleted).toBe(3);
    });
  });

  describe('POST /api/v1/bulk/media/delete', () => {
    it('bulk deletes media', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bulk/media/delete?workspaceId=ws-1')
        .send({ ids: ['m1', 'm2', 'm3', 'm4', 'm5'] });

      expect(res.status).toBe(201);
      expect(res.body.deleted).toBe(5);
    });
  });

  describe('POST /api/v1/bulk/schedules/toggle', () => {
    it('bulk toggles schedules', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bulk/schedules/toggle?workspaceId=ws-1')
        .send({ ids: ['s1', 's2'], enabled: true });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('updated');
      expect(res.body.updated).toBe(2);
    });
  });

  describe('DELETE /api/v1/bulk/screens', () => {
    it('bulk deletes screens', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/bulk/screens?workspaceId=ws-1')
        .send({ ids: ['sc1', 'sc2'] });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(2);
    });
  });
});
