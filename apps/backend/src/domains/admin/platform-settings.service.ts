import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type AdminGlobalSettings = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  defaultLanguage: string;
  /** Legacy: external URL fallback (English) */
  logoUrlEn: string;
  /** Legacy: external URL fallback (Arabic) */
  logoUrlAr: string;
  /** Stored filename under .data/branding/ */
  logoAssetEnLight: string;
  logoAssetEnDark: string;
  logoAssetArLight: string;
  logoAssetArDark: string;
  /** Bumps on upload for cache-busting */
  brandingEpoch: number;
};

const SETTINGS_KEY = 'admin.globalSettings';
const SETTINGS_CATEGORY = 'admin';

const DEFAULT_SETTINGS: AdminGlobalSettings = {
  platformName: 'Cloud Signage',
  supportEmail: 'support@cloudsignage.local',
  maintenanceMode: false,
  defaultLanguage: 'ar',
  logoUrlEn: '',
  logoUrlAr: '',
  logoAssetEnLight: '',
  logoAssetEnDark: '',
  logoAssetArLight: '',
  logoAssetArDark: '',
  brandingEpoch: 0,
};

function normalizeSettings(raw: unknown): AdminGlobalSettings {
  const base = DEFAULT_SETTINGS;
  if (!raw || typeof raw !== 'object') {
    return { ...base };
  }
  const r = raw as Record<string, unknown>;
  return {
    platformName:
      typeof r.platformName === 'string' ? r.platformName : base.platformName,
    supportEmail:
      typeof r.supportEmail === 'string' ? r.supportEmail : base.supportEmail,
    maintenanceMode:
      typeof r.maintenanceMode === 'boolean'
        ? r.maintenanceMode
        : base.maintenanceMode,
    defaultLanguage:
      typeof r.defaultLanguage === 'string'
        ? r.defaultLanguage
        : base.defaultLanguage,
    logoUrlEn: typeof r.logoUrlEn === 'string' ? r.logoUrlEn : '',
    logoUrlAr: typeof r.logoUrlAr === 'string' ? r.logoUrlAr : '',
    logoAssetEnLight:
      typeof r.logoAssetEnLight === 'string' ? r.logoAssetEnLight : '',
    logoAssetEnDark:
      typeof r.logoAssetEnDark === 'string' ? r.logoAssetEnDark : '',
    logoAssetArLight:
      typeof r.logoAssetArLight === 'string' ? r.logoAssetArLight : '',
    logoAssetArDark:
      typeof r.logoAssetArDark === 'string' ? r.logoAssetArDark : '',
    brandingEpoch:
      typeof r.brandingEpoch === 'number' && Number.isFinite(r.brandingEpoch)
        ? r.brandingEpoch
        : 0,
  };
}

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<AdminGlobalSettings> {
    const row = await this.prisma.platformSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });
    if (!row) {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      const parsed = JSON.parse(row.value) as unknown;
      return normalizeSettings(parsed);
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async patchSettings(
    partial: Partial<AdminGlobalSettings>,
  ): Promise<AdminGlobalSettings> {
    const current = await this.getSettings();
    const merged = { ...current, ...partial };
    await this.prisma.platformSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: JSON.stringify(merged),
        category: SETTINGS_CATEGORY,
      },
      update: {
        value: JSON.stringify(merged),
      },
    });
    return merged;
  }
}
