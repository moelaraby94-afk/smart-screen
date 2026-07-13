import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsService } from './metrics.service';

describe('MetricsMiddleware', () => {
  let middleware: MetricsMiddleware;
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsMiddleware, MetricsService],
    }).compile();

    middleware = module.get<MetricsMiddleware>(MetricsMiddleware);
    service = module.get<MetricsService>(MetricsService);
  });

  it('should call next and record metrics on response finish', (done) => {
    const observeSpy = jest.spyOn(service, 'observeHttpRequest');

    const req = {
      method: 'GET',
      baseUrl: '',
      path: '/api/v1/screens',
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          cb();
        }
        return res as unknown as Response;
      }),
    } as unknown as Response;

    middleware.use(req, res, () => {
      expect(observeSpy).toHaveBeenCalledWith(
        'GET',
        '/api/v1/screens',
        200,
        expect.any(Number),
      );
      done();
    });
  });

  it('should normalize UUID path segments to :id', (done) => {
    const observeSpy = jest.spyOn(service, 'observeHttpRequest');

    const req = {
      method: 'GET',
      baseUrl: '',
      path: '/api/v1/screens/550e8400-e29b-41d4-a716-446655440000',
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          cb();
        }
        return res as unknown as Response;
      }),
    } as unknown as Response;

    middleware.use(req, res, () => {
      expect(observeSpy).toHaveBeenCalledWith(
        'GET',
        '/api/v1/screens/:id',
        200,
        expect.any(Number),
      );
      done();
    });
  });

  it('should normalize numeric path segments to :id', (done) => {
    const observeSpy = jest.spyOn(service, 'observeHttpRequest');

    const req = {
      method: 'GET',
      baseUrl: '',
      path: '/api/v1/screens/12345',
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          cb();
        }
        return res as unknown as Response;
      }),
    } as unknown as Response;

    middleware.use(req, res, () => {
      expect(observeSpy).toHaveBeenCalledWith(
        'GET',
        '/api/v1/screens/:id',
        200,
        expect.any(Number),
      );
      done();
    });
  });
});
