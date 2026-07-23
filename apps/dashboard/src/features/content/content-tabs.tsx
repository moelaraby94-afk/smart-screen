'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';

type TabDef = {
  key: string;
  segment: string;
  href: string;
};

const ALL_TABS: TabDef[] = [
  { key: 'tabPlaylists', segment: 'playlists', href: 'playlists' },
  { key: 'tabTemplates', segment: 'templates', href: 'templates' },
];

export function ContentTabs() {
  const t = useTranslations('contentPage');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('title')}
      className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/30 p-1"
    >
      {ALL_TABS.map((tab) => {
        const href = `/${locale}/${tab.href}`;
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
