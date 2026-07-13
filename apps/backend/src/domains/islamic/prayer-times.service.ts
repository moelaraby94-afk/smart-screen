import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const ALADHAN_BASE = 'https://api.aladhan.com/v1/timings';

type AladhanTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

type AladhanResponse = {
  data: {
    timings: AladhanTimings;
    date: {
      readable: string;
      hijri: {
        date: string;
        day: string;
        month: { en: string; ar: string };
        year: string;
      };
    };
  };
};

@Injectable()
export class PrayerTimesService {
  private readonly logger = new Logger(PrayerTimesService.name);
  private cache = new Map<
    string,
    { date: string; data: AladhanResponse['data'] }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async getPrayerTimes(workspaceId: string, dateOverride?: Date) {
    const config = await this.getOrCreateConfig(workspaceId);
    if (!config.latitude || !config.longitude) {
      return {
        configured: false,
        message: 'Location not set. Configure latitude and longitude in settings.',
        times: null,
        hijriDate: null,
      };
    }

    const at = dateOverride ?? new Date();
    const dateStr = `${at.getDate().toString().padStart(2, '0')}-${(
      at.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${at.getFullYear()}`;

    const cacheKey = `${workspaceId}:${dateStr}:${config.method}:${config.asrJuristic}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return this.formatResponse(cached.data, config, at);
    }

    try {
      const url = `${ALADHAN_BASE}/${dateStr}?latitude=${config.latitude}&longitude=${config.longitude}&method=${config.method}&school=${config.asrJuristic}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Aladhan API returned ${res.status}`);
      }
      const json = (await res.json()) as AladhanResponse;
      this.cache.set(cacheKey, { date: dateStr, data: json.data });
      return this.formatResponse(json.data, config, at);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch prayer times: ${(err as Error).message}`,
      );
      return {
        configured: true,
        error: 'Failed to fetch prayer times from provider',
        times: null,
        hijriDate: null,
      };
    }
  }

  async getConfig(workspaceId: string) {
    return this.getOrCreateConfig(workspaceId);
  }

  async updateConfig(
    workspaceId: string,
    updates: {
      method?: number;
      asrJuristic?: number;
      latitude?: number;
      longitude?: number;
      city?: string;
      bufferBefore?: number;
      bufferAfter?: number;
      enabledPrayers?: string[];
      autoPauseEnabled?: boolean;
    },
  ) {
    const config = await this.getOrCreateConfig(workspaceId);
    const enabledPrayers = updates.enabledPrayers
      ? JSON.stringify(updates.enabledPrayers)
      : undefined;

    return this.prisma.prayerConfig.update({
      where: { workspaceId },
      data: {
        ...(updates.method !== undefined ? { method: updates.method } : {}),
        ...(updates.asrJuristic !== undefined
          ? { asrJuristic: updates.asrJuristic }
          : {}),
        ...(updates.latitude !== undefined
          ? { latitude: updates.latitude }
          : {}),
        ...(updates.longitude !== undefined
          ? { longitude: updates.longitude }
          : {}),
        ...(updates.city !== undefined ? { city: updates.city } : {}),
        ...(updates.bufferBefore !== undefined
          ? { bufferBefore: updates.bufferBefore }
          : {}),
        ...(updates.bufferAfter !== undefined
          ? { bufferAfter: updates.bufferAfter }
          : {}),
        ...(enabledPrayers !== undefined ? { enabledPrayers } : {}),
        ...(updates.autoPauseEnabled !== undefined
          ? { autoPauseEnabled: updates.autoPauseEnabled }
          : {}),
      },
    });
  }

  /**
   * Check if content should be paused right now due to prayer time.
   * Returns the prayer name and remaining minutes if paused, null otherwise.
   */
  async checkPrayerPause(workspaceId: string, at: Date = new Date()) {
    const config = await this.getOrCreateConfig(workspaceId);
    if (!config.autoPauseEnabled || !config.latitude || !config.longitude) {
      return { paused: false, prayer: null, remainingMinutes: 0 };
    }

    const result = await this.getPrayerTimes(workspaceId, at);
    if (!result.times) return { paused: false, prayer: null, remainingMinutes: 0 };

    const enabledPrayers: string[] = JSON.parse(config.enabledPrayers);
    const nowMinutes = at.getHours() * 60 + at.getMinutes();

    for (const prayerName of enabledPrayers) {
      const timeStr = (result.times as Record<string, string>)[prayerName];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
      const prayerMinutes = h * 60 + m;
      const pauseStart = prayerMinutes - config.bufferBefore;
      const pauseEnd = prayerMinutes + config.bufferAfter;

      if (nowMinutes >= pauseStart && nowMinutes <= pauseEnd) {
        const remaining = pauseEnd - nowMinutes;
        return {
          paused: true,
          prayer: prayerName,
          remainingMinutes: remaining,
        };
      }
    }

    return { paused: false, prayer: null, remainingMinutes: 0 };
  }

  async getHijriDate(workspaceId: string, at: Date = new Date()) {
    const result = await this.getPrayerTimes(workspaceId, at);
    if (!result.hijriDate) return null;
    return result.hijriDate;
  }

  private async getOrCreateConfig(workspaceId: string) {
    let config = await this.prisma.prayerConfig.findUnique({
      where: { workspaceId },
    });
    if (!config) {
      config = await this.prisma.prayerConfig.create({
        data: { workspaceId },
      });
    }
    return config;
  }

  private formatResponse(
    data: AladhanResponse['data'],
    config: Awaited<ReturnType<PrayerTimesService['getOrCreateConfig']>>,
    at: Date,
  ) {
    const times: Record<string, string> = {};
    for (const name of PRAYER_NAMES) {
      times[name] = data.timings[name];
    }

    const enabledPrayers: string[] = JSON.parse(config.enabledPrayers);
    const nowMinutes = at.getHours() * 60 + at.getMinutes();

    let nextPrayer: string | null = null;
    let nextPrayerTime: string | null = null;
    let minutesUntil = 0;

    for (const prayerName of enabledPrayers) {
      const timeStr = times[prayerName];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
      const prayerMin = h * 60 + m;
      if (prayerMin > nowMinutes) {
        nextPrayer = prayerName;
        nextPrayerTime = timeStr;
        minutesUntil = prayerMin - nowMinutes;
        break;
      }
    }

    if (!nextPrayer && enabledPrayers.length > 0) {
      nextPrayer = enabledPrayers[0];
      nextPrayerTime = times[enabledPrayers[0]] ?? null;
      if (nextPrayerTime) {
        const [h, m] = nextPrayerTime.split(':').map((x) => parseInt(x, 10));
        minutesUntil = 24 * 60 - nowMinutes + h * 60 + m;
      }
    }

    return {
      configured: true,
      times,
      hijriDate: {
        date: data.date.hijri.date,
        day: data.date.hijri.day,
        monthEn: data.date.hijri.month.en,
        monthAr: data.date.hijri.month.ar,
        year: data.date.hijri.year,
      },
      city: config.city,
      nextPrayer,
      nextPrayerTime,
      minutesUntilNext: minutesUntil,
    };
  }
}
