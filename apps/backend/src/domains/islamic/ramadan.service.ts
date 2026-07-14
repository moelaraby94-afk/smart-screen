import { Injectable, Logger } from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrayerTimesService } from './prayer-times.service';

@Injectable()
export class RamadanService {
  private readonly logger = new Logger(RamadanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly prayerTimes: PrayerTimesService,
  ) {}

  async getConfig(workspaceId: string) {
    let config = await this.prisma.ramadanConfig.findUnique({
      where: { workspaceId },
    });
    if (!config) {
      config = await this.prisma.ramadanConfig.create({
        data: { workspaceId },
      });
    }
    return config;
  }

  async updateConfig(
    workspaceId: string,
    updates: {
      enabled?: boolean;
      iftarPlaylistId?: string | null;
      suhoorPlaylistId?: string | null;
      iftarBuffer?: number;
      suhoorBuffer?: number;
      showHijriDate?: boolean;
      showPrayerTimes?: boolean;
      startDate?: string | null;
      endDate?: string | null;
    },
  ) {
    await this.getConfig(workspaceId);

    return this.prisma.ramadanConfig.update({
      where: { workspaceId },
      data: {
        ...(updates.enabled !== undefined ? { enabled: updates.enabled } : {}),
        ...(updates.iftarPlaylistId !== undefined
          ? { iftarPlaylistId: updates.iftarPlaylistId }
          : {}),
        ...(updates.suhoorPlaylistId !== undefined
          ? { suhoorPlaylistId: updates.suhoorPlaylistId }
          : {}),
        ...(updates.iftarBuffer !== undefined
          ? { iftarBuffer: updates.iftarBuffer }
          : {}),
        ...(updates.suhoorBuffer !== undefined
          ? { suhoorBuffer: updates.suhoorBuffer }
          : {}),
        ...(updates.showHijriDate !== undefined
          ? { showHijriDate: updates.showHijriDate }
          : {}),
        ...(updates.showPrayerTimes !== undefined
          ? { showPrayerTimes: updates.showPrayerTimes }
          : {}),
        ...(updates.startDate !== undefined
          ? {
              startDate: updates.startDate ? new Date(updates.startDate) : null,
            }
          : {}),
        ...(updates.endDate !== undefined
          ? { endDate: updates.endDate ? new Date(updates.endDate) : null }
          : {}),
      },
    });
  }

  /**
   * Check if Ramadan mode is currently active (manually or by date range).
   */
  async isRamadanActive(
    workspaceId: string,
    at: Date = new Date(),
  ): Promise<boolean> {
    const config = await this.getConfig(workspaceId);
    if (!config.enabled) return false;

    if (config.startDate && config.endDate) {
      return at >= config.startDate && at <= config.endDate;
    }

    return true;
  }

  /**
   * Determine if we should show Iftar or Suhoor content right now.
   * Returns the playlist ID to show, or null if no special content.
   */
  async getRamadanPlaylist(
    workspaceId: string,
    at: Date = new Date(),
  ): Promise<{
    playlistId: string | null;
    mode: 'iftar' | 'suhoor' | 'normal';
  }> {
    const isActive = await this.isRamadanActive(workspaceId, at);
    if (!isActive) return { playlistId: null, mode: 'normal' };

    const config = await this.getConfig(workspaceId);
    const prayerResult = await this.prayerTimes.getPrayerTimes(workspaceId, at);
    if (!prayerResult.times) return { playlistId: null, mode: 'normal' };

    const maghribTime = prayerResult.times['Maghrib'];
    const fajrTime = prayerResult.times['Fajr'];
    if (!maghribTime || !fajrTime) return { playlistId: null, mode: 'normal' };

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { timezone: true },
    });
    const tz = workspace?.timezone ?? 'UTC';
    const timeStr = formatInTimeZone(at, tz, 'HH:mm');
    const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
    const nowMinutes = hh * 60 + mm;
    const [magh, magm] = maghribTime.split(':').map((x) => parseInt(x, 10));
    const [fajh, fajm] = fajrTime.split(':').map((x) => parseInt(x, 10));
    const maghribMin = magh * 60 + magm;
    const fajrMin = fajh * 60 + fajm;

    const iftarStart = maghribMin - config.iftarBuffer;
    const suhoorStart = fajrMin - config.suhoorBuffer;
    const suhoorEnd = fajrMin + 30;

    if (nowMinutes >= iftarStart && nowMinutes < maghribMin + 60) {
      return { playlistId: config.iftarPlaylistId, mode: 'iftar' };
    }

    if (nowMinutes >= suhoorStart && nowMinutes <= suhoorEnd) {
      return { playlistId: config.suhoorPlaylistId, mode: 'suhoor' };
    }

    return { playlistId: null, mode: 'normal' };
  }

  /**
   * Auto-deactivate Ramadan mode if end date has passed.
   */
  async autoDeactivate(workspaceId: string): Promise<void> {
    const config = await this.getConfig(workspaceId);
    if (!config.enabled || !config.endDate) return;

    if (new Date() > config.endDate) {
      await this.prisma.ramadanConfig.update({
        where: { workspaceId },
        data: { enabled: false },
      });
      this.logger.log(
        `Auto-deactivated Ramadan mode for workspace ${workspaceId}`,
      );
    }
  }
}
