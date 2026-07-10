/**
 * Derives what a workspace is *allowed to do* from its usage and plan limits.
 *
 * This is the one place the plan rules live. They used to be split between the
 * backend (screens.service throws SCREEN_LIMIT_REACHED, media.service throws
 * STORAGE_LIMIT_REACHED) and the browser (client-home-dashboard computed
 * `storagePct` from raw limit + usage, and other screens gated on plan). A
 * client should render what it is told — `canCreateScreen`, `storageUsedPct` —
 * never recompute a threshold.
 *
 * `null` limits mean "unlimited": FREE workspaces can have a null
 * storageLimitBytes, and the resulting capability is always "allowed".
 */
export type WorkspaceUsage = {
  screenCount: number;
  storageUsedBytes: number;
};

export type WorkspaceLimits = {
  screenLimit: number | null;
  storageLimitBytes: number | null;
};

export type WorkspaceCapabilities = {
  screens: {
    used: number;
    limit: number | null;
    /** null when the limit is null (unlimited). */
    remaining: number | null;
    canCreate: boolean;
  };
  storage: {
    usedBytes: number;
    limitBytes: number | null;
    remainingBytes: number | null;
    /** 0..100, or null when unlimited. */
    usedPct: number | null;
    canUpload: boolean;
  };
};

function clampPct(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((100 * used) / limit)));
}

export function computeWorkspaceCapabilities(
  usage: WorkspaceUsage,
  limits: WorkspaceLimits,
): WorkspaceCapabilities {
  const screenLimit = limits.screenLimit;
  const screensUnlimited = screenLimit === null;
  const screenRemaining = screensUnlimited
    ? null
    : Math.max(0, screenLimit - usage.screenCount);

  const storageLimit = limits.storageLimitBytes;
  const storageUnlimited = storageLimit === null;
  const storageRemaining = storageUnlimited
    ? null
    : Math.max(0, storageLimit - usage.storageUsedBytes);

  return {
    screens: {
      used: usage.screenCount,
      limit: screenLimit,
      remaining: screenRemaining,
      canCreate: screensUnlimited || usage.screenCount < screenLimit,
    },
    storage: {
      usedBytes: usage.storageUsedBytes,
      limitBytes: storageLimit,
      remainingBytes: storageRemaining,
      usedPct: storageUnlimited
        ? null
        : clampPct(usage.storageUsedBytes, storageLimit),
      canUpload: storageUnlimited || usage.storageUsedBytes < storageLimit,
    },
  };
}
