import type { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { MediaController } from '../../domains/media/media.controller';
import { MediaService } from '../../domains/media/media.service';
import { SubscriptionsController } from '../../domains/subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../../domains/subscriptions/subscriptions.service';

/**
 * `ValidationPipe({ whitelist, forbidNonWhitelisted })` only inspects *class*
 * DTOs. Several routes declared their body as an inline type
 * (`@Body() body: { name?: string }`), which the pipe skips entirely, so:
 *
 *   - unknown properties were silently accepted (no `forbidNonWhitelisted`), and
 *   - `{"name": 12345}` reached `name.trim()` in the service and returned a 500.
 *
 * Both were reproduced against a running server before this suite existed. The
 * pipe below mirrors `main.ts` exactly, so these tests fail if either the DTO or
 * the pipe configuration regresses.
 */
const WORKSPACE = 'ws_1';
const allowAll = { canActivate: () => true };

describe('request body validation', () => {
  let app: INestApplication;
  let media: { createFolder: jest.Mock; moveMediaToFolder: jest.Mock };
  let subscriptions: { setMockPlan: jest.Mock; getCurrent: jest.Mock };

  beforeAll(async () => {
    media = {
      createFolder: jest.fn((_ws: string, name: string) => ({
        id: 'f1',
        name,
      })),
      moveMediaToFolder: jest.fn(() => ({ id: 'm1' })),
    };
    subscriptions = {
      setMockPlan: jest.fn((_ws: string, plan: string) => ({ plan })),
      getCurrent: jest.fn(() => ({})),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [MediaController, SubscriptionsController],
      providers: [
        { provide: MediaService, useValue: media },
        { provide: SubscriptionsService, useValue: subscriptions },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAll)
      .overrideGuard(RolesGuard)
      .useValue(allowAll)
      .overrideGuard(ThrottlerGuard)
      .useValue(allowAll)
      .compile();

    app = moduleRef.createNestApplication();
    // Identical to main.ts.
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

  const server = () => app.getHttpServer() as Server;
  const postFolder = (body: unknown) =>
    request(server())
      .post(`/media/folders?workspaceId=${WORKSPACE}`)
      .send(body as object);

  describe('POST /media/folders', () => {
    it('accepts a valid name and passes it through trimmed', async () => {
      const res = await postFolder({ name: '  Campaigns  ' });

      expect(res.status).toBe(201);
      expect(media.createFolder).toHaveBeenCalledWith(WORKSPACE, 'Campaigns');
    });

    /** Regression: this used to return 500 from `name.trim()`. */
    it('rejects a non-string name with 400 instead of crashing', async () => {
      const res = await postFolder({ name: 12345 });

      expect(res.status).toBe(400);
      expect(media.createFolder).not.toHaveBeenCalled();
    });

    /** Regression: unknown properties were silently accepted. */
    it('rejects an unknown property', async () => {
      const res = await postFolder({ name: 'Valid', evilField: 'injected' });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('evilField');
      expect(media.createFolder).not.toHaveBeenCalled();
    });

    it('enforces the length bounds', async () => {
      await expect(
        postFolder({ name: 'a' }).then((r) => r.status),
      ).resolves.toBe(400);
      await expect(
        postFolder({ name: 'x'.repeat(65) }).then((r) => r.status),
      ).resolves.toBe(400);
    });

    it('rejects a missing name', async () => {
      const res = await postFolder({});
      expect(res.status).toBe(400);
    });

    afterEach(() => {
      media.createFolder.mockClear();
    });
  });

  describe('PATCH /media/:id/folder', () => {
    const move = (body: unknown) =>
      request(server())
        .patch(`/media/m1/folder?workspaceId=${WORKSPACE}`)
        .send(body as object);

    it('accepts an explicit null to clear the folder', async () => {
      const res = await move({ folderId: null });

      expect(res.status).toBe(200);
      expect(media.moveMediaToFolder).toHaveBeenCalledWith(
        WORKSPACE,
        'm1',
        null,
      );
    });

    it('accepts a folder id', async () => {
      const res = await move({ folderId: 'f1' });

      expect(res.status).toBe(200);
      expect(media.moveMediaToFolder).toHaveBeenCalledWith(
        WORKSPACE,
        'm1',
        'f1',
      );
    });

    it('rejects a non-string folderId', async () => {
      const res = await move({ folderId: 123 });
      expect(res.status).toBe(400);
    });

    afterEach(() => {
      media.moveMediaToFolder.mockClear();
    });
  });

  describe('PATCH /subscriptions/mock-plan', () => {
    const setPlan = (body: unknown) =>
      request(server())
        .patch(`/subscriptions/mock-plan?workspaceId=${WORKSPACE}`)
        .send(body as object);

    it('accepts a supported plan', async () => {
      const res = await setPlan({ plan: 'PRO' });

      expect(res.status).toBe(200);
      expect(subscriptions.setMockPlan).toHaveBeenCalledWith(WORKSPACE, 'PRO');
    });

    it('rejects an unsupported plan', async () => {
      const res = await setPlan({ plan: 'ENTERPRISE' });

      expect(res.status).toBe(400);
      expect(subscriptions.setMockPlan).not.toHaveBeenCalled();
    });

    /**
     * Regression: `plan` used to default to 'FREE' when absent, so a misspelled
     * property silently downgraded the workspace rather than failing.
     */
    it('rejects a missing plan instead of silently downgrading to FREE', async () => {
      const res = await setPlan({});

      expect(res.status).toBe(400);
      expect(subscriptions.setMockPlan).not.toHaveBeenCalled();
    });

    it('rejects a misspelled property rather than treating it as absent', async () => {
      const res = await setPlan({ pln: 'PRO' });

      expect(res.status).toBe(400);
      expect(subscriptions.setMockPlan).not.toHaveBeenCalled();
    });

    afterEach(() => {
      subscriptions.setMockPlan.mockClear();
    });
  });
});
