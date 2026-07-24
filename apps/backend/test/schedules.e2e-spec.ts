import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { SchedulesController } from '../src/domains/schedules/schedules.controller';
import { SchedulesService } from '../src/domains/schedules/schedules.service';
import { HolidayController } from '../src/domains/schedules/holiday.controller';
import { HolidayService } from '../src/domains/schedules/holiday.service';
import { SchedulingService } from '../src/domains/schedules/scheduling.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PlaylistsService } from '../src/domains/playlists/playlists.service';
import { JwtAuthGuard } from '../src/common/auth/jwt-auth.guard';
import { RolesGuard } from '../src/common/auth/roles.guard';

describe('Schedules API (e2e)', () => {
  let app: INestApplication;
  let schedulesService: {
    list: jest.Mock;
    preview: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    getOne: jest.Mock;
    listOverlaps: jest.Mock;
  };
  let holidayService: {
    list: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
    isHoliday: jest.Mock;
  };

  beforeAll(async () => {
    schedulesService = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      preview: jest.fn().mockResolvedValue({
        date: '2026-07-13T12:00:00.000Z',
        timezone: 'UTC',
        screenId: null,
        activeSchedules: [],
        allSchedules: [],
      }),
      create: jest.fn().mockResolvedValue({ id: 'sched-1' }),
      update: jest.fn().mockResolvedValue({ id: 'sched-1' }),
      remove: jest.fn().mockResolvedValue(undefined),
      getOne: jest.fn().mockResolvedValue({ id: 'sched-1' }),
      listOverlaps: jest.fn().mockResolvedValue({ pairs: [] }),
    };

    holidayService = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'holiday-1' }),
      remove: jest.fn().mockResolvedValue(undefined),
      isHoliday: jest.fn().mockResolvedValue(false),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SchedulesController, HolidayController],
      providers: [
        { provide: SchedulesService, useValue: schedulesService },
        { provide: HolidayService, useValue: holidayService },
        {
          provide: SchedulingService,
          useValue: { resolveEffectivePlaylistId: jest.fn() },
        },
        { provide: PrismaService, useValue: {} },
        {
          provide: PlaylistsService,
          useValue: { emitPlaylistForScreen: jest.fn() },
        },
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

  describe('GET /api/v1/customer/schedules/preview', () => {
    it('returns schedule preview for a workspace', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/customer/schedules/preview?workspaceId=ws-1',
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('date');
      expect(res.body).toHaveProperty('timezone');
      expect(res.body).toHaveProperty('activeSchedules');
      expect(res.body).toHaveProperty('allSchedules');
      expect(schedulesService.preview).toHaveBeenCalledWith(
        'ws-1',
        undefined,
        undefined,
      );
    });

    it('accepts optional screenId and date params', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/customer/schedules/preview?workspaceId=ws-1&screenId=screen-1&date=2026-07-13',
      );

      expect(res.status).toBe(200);
      expect(schedulesService.preview).toHaveBeenCalledWith(
        'ws-1',
        'screen-1',
        '2026-07-13',
      );
    });
  });

  describe('GET /api/v1/customer/schedules/overlaps', () => {
    it('returns schedule overlaps', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/customer/schedules/overlaps?workspaceId=ws-1',
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pairs');
    });
  });

  describe('Holiday endpoints', () => {
    it('GET /api/v1/holidays returns list', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/holidays?workspaceId=ws-1',
      );

      expect(res.status).toBe(200);
      expect(holidayService.list).toHaveBeenCalledWith('ws-1');
    });

    it('POST /api/v1/holidays creates a holiday', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/holidays?workspaceId=ws-1')
        .send({
          name: 'National Day',
          date: '2026-12-02',
          isRecurring: true,
        });

      expect(res.status).toBe(201);
      expect(holidayService.create).toHaveBeenCalled();
    });
  });
});
