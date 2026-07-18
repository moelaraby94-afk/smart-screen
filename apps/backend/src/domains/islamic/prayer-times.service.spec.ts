import { Test } from '@nestjs/testing';
import { PrayerTimesService } from './prayer-times.service';
import { PrismaService } from '../../common/prisma/prisma.service';

function makePrisma() {
  return {
    prayerConfig: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'pc1',
        workspaceId: 'ws1',
        method: 4,
        asrJuristic: 0,
        latitude: null,
        longitude: null,
        city: null,
        bufferBefore: 5,
        bufferAfter: 15,
        enabledPrayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
        autoPauseEnabled: false,
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    workspace: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
    },
  } as unknown as PrismaService;
}

describe('PrayerTimesService', () => {
  let service: PrayerTimesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = makePrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrayerTimesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(PrayerTimesService);
  });

  it('getPrayerTimes returns not-configured when no lat/long', async () => {
    const result = await service.getPrayerTimes('ws1');
    expect(result.configured).toBe(false);
    expect(result.times).toBeNull();
  });

  it('getConfig returns config (creating if missing)', async () => {
    const config = await service.getConfig('ws1');
    expect(config.workspaceId).toBe('ws1');
    expect(prisma.prayerConfig.create).toHaveBeenCalled();
  });

  it('getConfig returns existing config without creating', async () => {
    const existing = {
      id: 'pc1',
      workspaceId: 'ws1',
      method: 2,
      latitude: 21.4,
      longitude: 39.8,
    };
    (prisma.prayerConfig.findUnique as jest.Mock).mockResolvedValue(existing);
    const config = await service.getConfig('ws1');
    expect(config).toBe(existing);
    expect(prisma.prayerConfig.create).not.toHaveBeenCalled();
  });

  it('updateConfig calls prisma update with provided fields', async () => {
    await service.updateConfig('ws1', { method: 3, latitude: 40.0 });
    expect(prisma.prayerConfig.update).toHaveBeenCalledWith({
      where: { workspaceId: 'ws1' },
      data: { method: 3, latitude: 40.0 },
    });
  });

  it('updateConfig only includes provided fields', async () => {
    await service.updateConfig('ws1', { autoPauseEnabled: true });
    const callArgs = (prisma.prayerConfig.update as jest.Mock).mock.calls[0][0];
    expect(callArgs.data).toEqual({ autoPauseEnabled: true });
    expect(callArgs.data.method).toBeUndefined();
  });

  it('checkPrayerPause returns not paused when autoPause disabled', async () => {
    const result = await service.checkPrayerPause('ws1');
    expect(result.paused).toBe(false);
    expect(result.prayer).toBeNull();
  });

  it('getHijriDate returns null when not configured', async () => {
    const result = await service.getHijriDate('ws1');
    expect(result).toBeNull();
  });
});
