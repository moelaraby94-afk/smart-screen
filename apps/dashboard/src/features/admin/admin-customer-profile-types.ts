export type Lifecycle = 'active' | 'expired' | 'suspended' | 'trial';
export type SubStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED';

export type BranchRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  screenCount: number;
  storageBytes: number;
};

export type ProfilePayload = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  subscriptionStatus: SubStatus;
  subscriptionEndDate: string | null;
  customerLifecycle: Lifecycle;
  branches: BranchRow[];
  usage: { totalScreens: number; totalStorageBytes: number };
  analytics: {
    screensByStatus: Record<string, number>;
    totalPlaylists: number;
    totalMedia: number;
    totalMediaBytes: number;
  };
};

export type ProfileTabId = 'overview' | 'subscription' | 'usage' | 'workspaces';

export const PROFILE_TAB_ORDER: ProfileTabId[] = ['overview', 'subscription', 'usage', 'workspaces'];

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
