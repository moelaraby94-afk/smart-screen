import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IslamicController } from './islamic.controller';
import { PrayerTimesService } from './prayer-times.service';
import { RamadanService } from './ramadan.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';

describe('IslamicController', () => {
  let controller: IslamicController;
  let prayerTimes: PrayerTimesService;
  let ramadan: RamadanService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'OWNER' }),
      },
    } as unknown as PrismaService;

    prayerTimes = {
      getPrayerTimes: jest.fn().mockResolvedValue({ configured: true }),
      getConfig: jest.fn().mockResolvedValue({ workspaceId: 'ws1' }),
      updateConfig: jest.fn().mockResolvedValue({}),
      checkPrayerPause: jest.fn().mockResolvedValue({ paused: false }),
      getHijriDate: jest.fn().mockResolvedValue(null),
    } as unknown as PrayerTimesService;

    ramadan = {
      getConfig: jest.fn().mockResolvedValue({}),
      updateConfig: jest.fn().mockResolvedValue({}),
      isRamadanActive: jest.fn().mockResolvedValue(false),
      getRamadanPlaylist: jest.fn().mockResolvedValue({ playlistId: null }),
    } as unknown as RamadanService;

    const moduleRef = await Test.createTestingModule({
      controllers: [IslamicController],
      providers: [
        Reflector,
        AccountContextHelper,
        { provide: PrayerTimesService, useValue: prayerTimes },
        { provide: RamadanService, useValue: ramadan },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    controller = moduleRef.get(IslamicController);
  });

  const user = { sub: 'u1', email: 'test@test.com', role: 'OWNER' } as any;

  it('getPrayerTimes calls service', async () => {
    await controller.getPrayerTimes('ws1', user);
    expect(prayerTimes.getPrayerTimes).toHaveBeenCalledWith('ws1');
  });

  it('getPrayerConfig calls service', async () => {
    await controller.getPrayerConfig('ws1', user);
    expect(prayerTimes.getConfig).toHaveBeenCalledWith('ws1');
  });

  it('updatePrayerConfig calls service with dto', async () => {
    const dto = { method: 3 } as any;
    await controller.updatePrayerConfig('ws1', dto, user);
    expect(prayerTimes.updateConfig).toHaveBeenCalledWith('ws1', dto);
  });

  it('getPrayerPauseStatus calls service', async () => {
    await controller.getPrayerPauseStatus('ws1', user);
    expect(prayerTimes.checkPrayerPause).toHaveBeenCalledWith('ws1');
  });

  it('getHijriDate calls service', async () => {
    await controller.getHijriDate('ws1', user);
    expect(prayerTimes.getHijriDate).toHaveBeenCalledWith('ws1');
  });

  it('getRamadanConfig calls service', async () => {
    await controller.getRamadanConfig('ws1', user);
    expect(ramadan.getConfig).toHaveBeenCalledWith('ws1');
  });

  it('updateRamadanConfig calls service with dto', async () => {
    const dto = { enabled: true } as any;
    await controller.updateRamadanConfig('ws1', dto, user);
    expect(ramadan.updateConfig).toHaveBeenCalledWith('ws1', dto);
  });

  it('getRamadanStatus returns active flag and playlist', async () => {
    const result = await controller.getRamadanStatus('ws1', user);
    expect(result.active).toBe(false);
    expect(result.playlistId).toBeNull();
  });

  it('throws BadRequest when workspaceId is missing', async () => {
    await expect(controller.getPrayerTimes('', user)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws Forbidden when not a member', async () => {
    (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(controller.getPrayerTimes('ws1', user)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
