import type { Server } from 'node:http';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  SkipThrottle,
  Throttle,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import request from 'supertest';

/**
 * `ThrottlerModule.forRoot()` only *configures* a limit. Until ThrottlerGuard is
 * registered as an APP_GUARD nothing enforces it, which is how eleven of the
 * sixteen controllers ended up with no rate limiting at all while the module
 * config advertised 120/min.
 *
 * These tests pin the three behaviours the API depends on:
 *   1. the baseline applies to a controller that asks for nothing,
 *   2. `@SkipThrottle()` exempts a controller (Stripe webhooks, player kiosk),
 *   3. a method on a skipped controller can opt back in (pairing session create).
 */
const LIMIT = 3;

@Controller('plain')
class PlainController {
  @Get()
  get() {
    return { ok: true };
  }
}

@SkipThrottle()
@Controller('exempt')
class ExemptController {
  @Get()
  get() {
    return { ok: true };
  }

  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: LIMIT, ttl: 60_000 } })
  @Get('metered')
  metered() {
    return { ok: true };
  }
}

async function statusesFor(app: INestApplication, path: string, times: number) {
  const statuses: number[] = [];
  for (let i = 0; i < times; i += 1) {
    const res = await request(app.getHttpServer() as Server).get(path);
    statuses.push(res.status);
  }
  return statuses;
}

describe('global rate limiting', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: LIMIT }],
        }),
      ],
      controllers: [PlainController, ExemptController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('applies the baseline to a controller that declares nothing', async () => {
    const statuses = await statusesFor(app, '/plain', LIMIT + 1);

    expect(statuses.slice(0, LIMIT)).toEqual(Array(LIMIT).fill(200));
    expect(statuses[LIMIT]).toBe(429);
  });

  it('exempts a @SkipThrottle() controller entirely', async () => {
    const statuses = await statusesFor(app, '/exempt', LIMIT * 3);

    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  it('lets a method opt back in on a skipped controller', async () => {
    const statuses = await statusesFor(app, '/exempt/metered', LIMIT + 1);

    expect(statuses.slice(0, LIMIT)).toEqual(Array(LIMIT).fill(200));
    expect(statuses[LIMIT]).toBe(429);
  });

  it('counts the metered route separately from its exempt siblings', async () => {
    // Exhaust the metered budget...
    await statusesFor(app, '/exempt/metered', LIMIT + 1);

    // ...the exempt sibling is unaffected.
    const statuses = await statusesFor(app, '/exempt', 2);
    expect(statuses).toEqual([200, 200]);
  });
});
