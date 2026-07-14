import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Platform settings only. The audit log used to live here too, appended with a
 * read-modify-write of this whole file under no lock — concurrent events
 * dropped each other. It now lives in Postgres; see
 * `common/audit/audit-log.service.ts`.
 */
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

type AdminRuntimeData = {
  settings: AdminGlobalSettings;
};

const DATA_DIR = join(process.cwd(), '.data');
const DATA_FILE = join(DATA_DIR, 'admin-runtime.json');

const DEFAULT_DATA: AdminRuntimeData = {
  settings: {
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
  },
};

async function ensureDataFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, 'utf-8');
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  }
}

function normalizeSettings(raw: unknown): AdminGlobalSettings {
  const base = DEFAULT_DATA.settings;
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

async function readData(): Promise<AdminRuntimeData> {
  await ensureDataFile();
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AdminRuntimeData>;
    // A `logs` key may still be present in files written before the audit log
    // moved to Postgres. It is ignored, and dropped on the next write.
    return { settings: normalizeSettings(parsed.settings) };
  } catch {
    return DEFAULT_DATA;
  }
}

async function writeData(data: AdminRuntimeData): Promise<void> {
  await ensureDataFile();
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAdminSettings(): Promise<AdminGlobalSettings> {
  const data = await readData();
  return data.settings;
}

export async function updateAdminSettings(
  partial: Partial<AdminGlobalSettings>,
): Promise<AdminGlobalSettings> {
  const data = await readData();
  data.settings = { ...data.settings, ...partial };
  await writeData(data);
  return data.settings;
}
