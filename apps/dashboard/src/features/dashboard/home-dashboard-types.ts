export type InsightsBranch = {
  workspaceId: string;
  name: string;
  slug: string;
  isPaused?: boolean;
  role: string;
  createdAt: string;
  screens: number;
  playlists: number;
  mediaCount: number;
  storageBytes: number;
  screenStatus: { online: number; offline: number; maintenance: number };
  capabilities: {
    screens: {
      used: number;
      limit: number | null;
      remaining: number | null;
      canCreate: boolean;
    };
    storage: {
      usedBytes: number;
      limitBytes: number | null;
      remainingBytes: number | null;
      usedPct: number | null;
      canUpload: boolean;
    };
  };
  subscription: {
    plan: string;
    status: string;
    seats: number;
    screenLimit: number;
    storageLimitBytes: number | null;
    currentPeriodEnd: string | null;
  } | null;
};

export type InsightsPayload = {
  account: { subscriptionStatus: string; subscriptionEndDate: string | null };
  plan: {
    plan: string;
    status: string;
    seats: number;
    screenLimit: number;
    currentPeriodEnd: string | null;
  } | null;
  totals: {
    branches: number;
    screens: number;
    playlists: number;
    mediaCount: number;
    storageBytes: number;
    screenStatus: { online: number; offline: number; maintenance: number };
  };
  branches: InsightsBranch[];
};

export type HealthKey = 'paused' | 'healthy' | 'mixed' | 'down' | 'empty';

export function branchHealth(row: InsightsBranch): HealthKey {
  if (row.isPaused === true) return 'paused';
  if (row.screens === 0) return 'empty';
  const { online, offline, maintenance } = row.screenStatus;
  if (online === 0) return 'down';
  if (offline > 0 || maintenance > 0) return 'mixed';
  return 'healthy';
}

export function canManageBranch(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canDeleteBranch(role: string, isSuperAdmin: boolean): boolean {
  return canManageBranch(role) || isSuperAdmin;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatBytesLocale(n: number, locale: string): string {
  if (n < 1024) return new Intl.NumberFormat(locale).format(n) + ' B';
  if (n < 1024 * 1024)
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024)
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n / (1024 * 1024))} MB`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n / (1024 * 1024 * 1024))} GB`;
}

export function healthBadgeClass(h: HealthKey): string {
  return h === 'healthy'
    ? 'bg-success/10 text-success'
    : h === 'down'
      ? 'bg-destructive/10 text-destructive'
      : h === 'paused'
        ? 'bg-warning/10 text-warning'
        : h === 'empty'
          ? 'bg-muted text-muted-foreground'
          : 'bg-warning/10 text-warning';
}
