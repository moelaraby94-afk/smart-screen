import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PlayerService } from './player.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { CanvasesService } from '../canvases/canvases.service';
import { PrayerTimesService } from '../islamic/prayer-times.service';

type FakeScreen = {
  id: string;
  serialNumber: string;
  workspaceId: string;
  pairingSecretHash: string | null;
};

function createFakePrisma(opts: {
  screens?: FakeScreen[];
  users?: Map<string, { isSuperAdmin: boolean }>;
  memberships?: Set<string>;
}) {
  const {
    screens = [],
    users = new Map<string, { isSuperAdmin: boolean }>(),
    memberships = new Set<string>(),
  } = opts;

  return {
    screen: {
      findFirst: jest.fn(
        ({
          where,
          select,
        }: {
          where: { serialNumber?: string };
          select?: Record<string, boolean>;
        }) => {
          const found = screens.find(
            (s) => s.serialNumber === where.serialNumber,
          );
          if (!found) return Promise.resolve(null);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                filtered[key] = (found as Record<string, unknown>)[key];
              }
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(found);
        },
      ),
    },
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const u = users.get(where.id);
        return Promise.resolve(
          u ? { id: where.id, isSuperAdmin: u.isSuperAdmin } : null,
        );
      }),
    },
    workspaceMember: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: {
            workspaceId_userId: { workspaceId: string; userId: string };
          };
        }) => {
          const key = `${where.workspaceId_userId.workspaceId}:${where.workspaceId_userId.userId}`;
          return Promise.resolve(memberships.has(key) ? {} : null);
        },
      ),
    },
  };
}

function createMockConfigService(
  sharedSecret: string = 'dev-player-heartbeat-secret',
) {
  return {
    get: jest.fn((key: string, fallback?: string) =>
      key === 'PLAYER_HEARTBEAT_SECRET' ? sharedSecret : fallback,
    ),
  } as unknown as ConfigService;
}

function createMockPlaylistsService() {
  return {} as unknown as PlaylistsService;
}

function createMockCanvasesService() {
  return {} as unknown as CanvasesService;
}

function createMockPrayerTimesService(pauseResult: {
  paused: boolean;
  prayer: string | null;
  remainingMinutes: number;
}) {
  return {
    checkPrayerPause: jest.fn().mockResolvedValue(pauseResult),
  } as unknown as PrayerTimesService;
}

const SERIAL = 'CS-PRAYER-001';
const WS_ID = 'ws-prayer';
const SCREEN_ID = 'screen-prayer';

function makeScreen(overrides: Partial<FakeScreen> = {}): FakeScreen {
  return {
    id: SCREEN_ID,
    serialNumber: SERIAL,
    workspaceId: WS_ID,
    pairingSecretHash: null,
    ...overrides,
  };
}

describe('PlayerService — prayer pause (T4.1)', () => {
  function makeService(
    fake: ReturnType<typeof createFakePrisma>,
    prayerTimes: ReturnType<typeof createMockPrayerTimesService>,
  ) {
    return new PlayerService(
      fake as unknown as PrismaService,
      createMockConfigService(),
      createMockPlaylistsService(),
      createMockCanvasesService(),
      prayerTimes,
    );
  }

  it('getPrayerPauseStatusForKiosk returns pause status with valid serial + secret', async () => {
    const secretHash = await bcrypt.hash('test-secret', 10);
    const fake = createFakePrisma({
      screens: [makeScreen({ pairingSecretHash: secretHash })],
    });
    const prayerTimes = createMockPrayerTimesService({
      paused: true,
      prayer: 'Dhuhr',
      remainingMinutes: 5,
    });
    const service = makeService(fake, prayerTimes);

    const result = await service.getPrayerPauseStatusForKiosk(
      SERIAL,
      'test-secret',
    );
    expect(result).toEqual({
      paused: true,
      prayer: 'Dhuhr',
      remainingMinutes: 5,
    });
    expect(prayerTimes.checkPrayerPause).toHaveBeenCalledWith(WS_ID);
  });

  it('getPrayerPauseStatusForKiosk throws NotFound when serial is missing', async () => {
    const fake = createFakePrisma({});
    const prayerTimes = createMockPrayerTimesService({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
    const service = makeService(fake, prayerTimes);

    await expect(
      service.getPrayerPauseStatusForKiosk(undefined, 'secret'),
    ).rejects.toThrow(NotFoundException);
  });

  it('getPrayerPauseStatusForKiosk throws NotFound when screen not found', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const prayerTimes = createMockPrayerTimesService({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
    const service = makeService(fake, prayerTimes);

    await expect(
      service.getPrayerPauseStatusForKiosk('CS-UNKNOWN', 'secret'),
    ).rejects.toThrow(NotFoundException);
  });

  it('getPrayerPauseStatusForKiosk throws Unauthorized when secret is wrong', async () => {
    const fake = createFakePrisma({ screens: [makeScreen()] });
    const prayerTimes = createMockPrayerTimesService({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
    const service = makeService(fake, prayerTimes);

    await expect(
      service.getPrayerPauseStatusForKiosk(SERIAL, 'wrong-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('getPrayerPauseStatusForJwtUser returns pause status for valid member', async () => {
    const users = new Map<string, { isSuperAdmin: boolean }>();
    users.set('user-1', { isSuperAdmin: false });
    const memberships = new Set<string>();
    memberships.add(`${WS_ID}:user-1`);
    const fake = createFakePrisma({ users, memberships });
    const prayerTimes = createMockPrayerTimesService({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
    const service = makeService(fake, prayerTimes);

    const result = await service.getPrayerPauseStatusForJwtUser(
      { sub: 'user-1' } as never,
      WS_ID,
    );
    expect(result).toEqual({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
  });

  it('getPrayerPauseStatusForJwtUser throws Forbidden when not a member', async () => {
    const users = new Map<string, { isSuperAdmin: boolean }>();
    users.set('user-2', { isSuperAdmin: false });
    const fake = createFakePrisma({ users });
    const prayerTimes = createMockPrayerTimesService({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
    const service = makeService(fake, prayerTimes);

    await expect(
      service.getPrayerPauseStatusForJwtUser({ sub: 'user-2' } as never, WS_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  it('getPrayerPauseStatusForJwtUser throws NotFound when workspaceId is missing', async () => {
    const fake = createFakePrisma({});
    const prayerTimes = createMockPrayerTimesService({
      paused: false,
      prayer: null,
      remainingMinutes: 0,
    });
    const service = makeService(fake, prayerTimes);

    await expect(
      service.getPrayerPauseStatusForJwtUser(
        { sub: 'user-1' } as never,
        undefined,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('getPrayerPauseStatusForJwtUser allows super admin without membership', async () => {
    const users = new Map<string, { isSuperAdmin: boolean }>();
    users.set('admin-1', { isSuperAdmin: true });
    const fake = createFakePrisma({ users });
    const prayerTimes = createMockPrayerTimesService({
      paused: true,
      prayer: 'Asr',
      remainingMinutes: 10,
    });
    const service = makeService(fake, prayerTimes);

    const result = await service.getPrayerPauseStatusForJwtUser(
      { sub: 'admin-1' } as never,
      WS_ID,
    );
    expect(result).toEqual({
      paused: true,
      prayer: 'Asr',
      remainingMinutes: 10,
    });
  });
});
