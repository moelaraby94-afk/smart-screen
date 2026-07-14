'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';

const TABS = [
  { key: 'profileSettings', segment: 'profile' },
  { key: 'workspaceSettings', segment: 'workspace' },
  { key: 'billing', segment: 'billing' },
] as const;

export function SettingsTabs() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('profileSettings')}
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1"
    >
      {TABS.map((tab) => {
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
