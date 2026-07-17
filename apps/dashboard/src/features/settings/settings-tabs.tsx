'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';
import { useWorkspace } from '@/features/workspace/workspace-context';

type TabDef = {
  key: string;
  segment: string;
  ownerOnly?: boolean;
};

const ALL_TABS: TabDef[] = [
  { key: 'profileSettings', segment: 'profile' },
  { key: 'workspaceSettings', segment: 'workspace', ownerOnly: true },
  { key: 'billing', segment: 'billing', ownerOnly: true },
  { key: 'notificationsSettings', segment: 'notifications' },
  { key: 'securitySettings', segment: 'security' },
  { key: 'apiSettings', segment: 'api', ownerOnly: true },
];

export function SettingsTabs() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { workspaces, workspaceId } = useWorkspace();

  const userRole = workspaces.find((w) => w.id === workspaceId)?.role ?? 'VIEWER';
  const isOwner = userRole === 'OWNER';

  const visibleTabs = ALL_TABS.filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <nav
      aria-label={t('profileSettings')}
      className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/30 p-1"
    >
      {visibleTabs.map((tab) => {
        const href = `/${locale}/settings/${tab.segment}`;
        const active = pathname?.startsWith(href) ?? false;
        return (
          <Link
            key={tab.segment}
            href={href as Route}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-semibold tracking-tight transition-all',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
