'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type Crumb = {
  label: string;
  href: string | null;
};

function buildCrumbs(
  pathname: string | null,
  locale: string,
  t: (key: string) => string,
): Crumb[] {
  if (!pathname) return [];
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== locale) return [];
  const rest = parts.slice(1);
  if (rest.length === 0) return [{ label: t('overview'), href: null }];

  const base = `/${locale}`;
  const crumbs: Crumb[] = [{ label: t('overview'), href: `${base}/overview` }];

  const sectionLabels: Record<string, string> = {
    overview: t('overview'),
    content: t('content'),
    media: t('media'),
    studio: t('studio'),
    playlists: t('playlists'),
    screens: t('screens'),
    schedules: t('schedules'),
    scheduling: t('scheduling'),
    team: t('team'),
    billing: t('billing'),
    settings: t('settings'),
    admin: t('adminHome'),
    branches: t('branches'),
    templates: t('templates'),
    ai: t('ai'),
    emergency: t('emergency'),
    analytics: t('analytics'),
    'audit-log': t('auditLog'),
    notifications: t('notifications'),
    'api-docs': t('apiDocs'),
    help: t('help'),
  };

  const subLabels: Record<string, string> = {
    profile: t('profileSettings'),
    workspace: t('workspaceSettings'),
    billing: t('billingAndPayments'),
    customers: t('adminCustomers'),
    staff: t('adminStaff'),
    stats: t('adminStats'),
    logs: t('adminLogs'),
    fleet: t('adminFleet'),
    screens: t('adminScreens'),
    playlists: t('playlists'),
    groups: t('displayGroups'),
    workspaces: t('adminWorkspaces'),
    users: t('adminCustomers'),
  };

  if (rest[0] === 'admin') {
    crumbs[0] = { label: t('adminHome'), href: `${base}/admin` };
    if (rest[1]) {
      const label = sectionLabels[rest[1]] ?? subLabels[rest[1]] ?? rest[1];
      crumbs.push({ label, href: rest.length > 2 ? `${base}/admin/${rest[1]}` : null });
    }
    if (rest[2]) {
      crumbs.push({ label: rest[2], href: rest.length > 3 ? `${base}/admin/${rest[1]}/${rest[2]}` : null });
    }
    if (rest[3]) {
      const label = subLabels[rest[3]] ?? rest[3];
      crumbs.push({ label, href: rest.length > 4 ? `${base}/admin/${rest[1]}/${rest[2]}/${rest[3]}` : null });
    }
    if (rest[4]) {
      crumbs.push({ label: rest[4], href: null });
    }
    return crumbs;
  }

  if (rest[0] === 'branches') {
    if (rest[1]) {
      crumbs.push({ label: t('branches'), href: `${base}/overview` });
      if (rest[2]) {
        const label = subLabels[rest[2]] ?? rest[2];
        crumbs.push({ label, href: rest.length > 3 ? `${base}/branches/${rest[1]}/${rest[2]}` : null });
      }
      if (rest[3]) {
        crumbs.push({ label: rest[3], href: null });
      }
    }
    return crumbs;
  }

  if (rest[0] === 'settings') {
    if (rest[1]) {
      const label = subLabels[rest[1]] ?? rest[1];
      crumbs.push({ label, href: null });
    }
    return crumbs;
  }

  const sectionLabel = sectionLabels[rest[0]] ?? rest[0];
  crumbs.push({ label: sectionLabel, href: rest.length > 1 ? `${base}/${rest[0]}` : null });
  if (rest[1]) {
    crumbs.push({ label: rest[1], href: null });
  }

  return crumbs;
}

export function Breadcrumbs({
  pathname,
  locale,
  rtl,
}: {
  pathname: string | null;
  locale: string;
  rtl: boolean;
}) {
  const t = useTranslations('nav');
  const crumbs = buildCrumbs(pathname, locale, t);

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      dir={rtl ? 'rtl' : 'ltr'}
      className={cn(
        'flex items-center gap-1 px-4 py-1.5 text-xs text-muted-foreground sm:px-6 lg:px-10',
        'border-b border-border bg-muted/20',
      )}
    >
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            {idx === 0 && (
              <Home className="h-3 w-3 text-muted-foreground/60" strokeWidth={1.5} />
            )}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href as Route}
                className="truncate font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate',
                  isLast ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                )}
              >
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className={cn('h-3 w-3 shrink-0 text-muted-foreground/40', rtl && 'rotate-180')}
                strokeWidth={1.5}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
