import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { CsrfController } from '../src/common/csrf/csrf.controller';

describe('CSRF endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CsrfController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'ready', 'metrics'],
    });
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/csrf returns 200 with token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/csrf');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('csrfToken');
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken).toHaveLength(64);
  });
});
