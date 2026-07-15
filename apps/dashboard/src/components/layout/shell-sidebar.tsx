'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  CircleHelp,
  Clapperboard,
  CreditCard,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Monitor,
  Moon,
  ScrollText,
  Server,
  Settings,
  Sparkles,
  Sun,
  Terminal,
  ToggleRight,
  UserCog,
  Users,
} from 'lucide-react';
import { ShellLogo } from '@/components/layout/shell-logo';
import { pathWithLocale } from '@/components/language-switcher';
import { setStoredAccessToken } from '@/features/auth/session';
import { logout as apiLogout } from '@/features/auth/auth-api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/features/workspace/workspace-context';

/* ═══════════════════════════════════════════════════════════════
   Nimbus Rail v2 — Professional SaaS sidebar
   • 240px wide, solid surface, no clutter
   • Active: violet tinted bg + 3px rounded indicator bar
   • 44px touch targets, 200ms transitions, cursor-pointer
   • Navigation only — no workspace, no account section
   ═══════════════════════════════════════════════════════════════ */

const STROKE = 1.6;

const OVERVIEW_NAV = [
  { key: 'overview', hrefKey: 'overview' as const, icon: LayoutDashboard },
] as const;

const FLEET_NAV = [
  { key: 'screens', hrefKey: 'screens' as const, icon: Monitor },
  { key: 'emergency', hrefKey: 'emergency' as const, icon: AlertTriangle },
] as const;

const CONTENT_NAV = [
  { key: 'media', hrefKey: 'media' as const, icon: FolderOpen },
  { key: 'studio', hrefKey: 'studio' as const, icon: Clapperboard },
  { key: 'templates', hrefKey: 'templates' as const, icon: LayoutTemplate },
] as const;

const PLAYBACK_NAV = [
  { key: 'playlists', hrefKey: 'playlists' as const, icon: Clapperboard },
  { key: 'schedules', hrefKey: 'schedules' as const, icon: CalendarClock },
] as const;

const INSIGHTS_NAV = [
  { key: 'analytics', hrefKey: 'analytics' as const, icon: Activity },
  { key: 'ai', hrefKey: 'ai' as const, icon: Sparkles },
] as const;

const MANAGEMENT_NAV = [
  { key: 'team', hrefKey: 'team' as const, icon: Users },
] as const;

const CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE = new Set<
  string
>(['overview', 'screens', 'media', 'studio', 'templates', 'team', 'playlists', 'schedules', 'ai', 'analytics', 'emergency', 'help', 'apiDocs', 'notifications', 'auditLog']);

function hrefFor(
  locale: string,
  hrefKey:
    | (typeof OVERVIEW_NAV)[number]['hrefKey']
    | (typeof FLEET_NAV)[number]['hrefKey']
    | (typeof CONTENT_NAV)[number]['hrefKey']
    | (typeof PLAYBACK_NAV)[number]['hrefKey']
    | (typeof INSIGHTS_NAV)[number]['hrefKey']
    | (typeof MANAGEMENT_NAV)[number]['hrefKey']
    | 'overview'
    | 'adminHome'
    | 'adminCustomers'
    | 'adminStaff'
    | 'adminStats'
    | 'adminLogs'
    | 'adminSettings'
    | 'adminFeatureFlags'
    | 'adminWorkspaces'
    | 'adminFleet'
    | 'adminScreens'
    | 'help'
    | 'apiDocs'
    | 'notifications'
    | 'analytics'
    | 'auditLog'
    | 'media'
    | 'team'
    | 'screens'
    | 'studio'
    | 'templates'
    | 'ai'
    | 'emergency',
): string {
  if (hrefKey === 'overview') return `/${locale}/overview`;
  if (hrefKey === 'adminHome') return `/${locale}/admin`;
  if (hrefKey === 'adminCustomers') return `/${locale}/admin/customers`;
  if (hrefKey === 'adminWorkspaces') return `/${locale}/admin/workspaces`;
  if (hrefKey === 'adminFleet') return `/${locale}/admin/fleet`;
  if (hrefKey === 'adminScreens') return `/${locale}/admin/screens`;
  if (hrefKey === 'adminStaff') return `/${locale}/admin/staff`;
  if (hrefKey === 'adminStats') return `/${locale}/admin/stats`;
  if (hrefKey === 'adminLogs') return `/${locale}/admin/logs`;
  if (hrefKey === 'adminSettings') return `/${locale}/admin/settings`;
  if (hrefKey === 'adminFeatureFlags') return `/${locale}/admin/feature-flags`;
  if (hrefKey === 'help') return `/${locale}/help`;
  if (hrefKey === 'apiDocs') return `/${locale}/api-docs`;
  if (hrefKey === 'notifications') return `/${locale}/notifications`;
  if (hrefKey === 'analytics') return `/${locale}/analytics`;
  if (hrefKey === 'auditLog') return `/${locale}/audit-log`;
  if (hrefKey === 'media') return `/${locale}/media`;
  if (hrefKey === 'team') return `/${locale}/team`;
  if (hrefKey === 'screens') return `/${locale}/screens`;
  if (hrefKey === 'studio') return `/${locale}/studio`;
  if (hrefKey === 'templates') return `/${locale}/templates`;
  if (hrefKey === 'ai') return `/${locale}/ai`;
  if (hrefKey === 'emergency') return `/${locale}/emergency`;
  return `/${locale}/${hrefKey}`;
}

function isOverviewPath(pathname: string | null, locale: string): boolean {
  if (!pathname) return false;
  return (
    pathname === `/${locale}/overview` ||
    pathname === `/${locale}` ||
    pathname === `/${locale}/`
  );
}

function sovereignLinkActive(
  pathname: string | null,
  locale: string,
  hrefKey:
    | 'overview'
    | 'adminHome'
    | 'adminCustomers'
    | 'adminStaff'
    | 'adminStats'
    | 'adminLogs'
    | 'adminSettings'
    | 'adminFeatureFlags'
    | 'adminFleet'
    | 'adminScreens'
    | 'help'
    | 'apiDocs'
    | 'notifications'
    | 'analytics'
    | 'auditLog',
): boolean {
  if (!pathname) return false;
  if (hrefKey === 'overview') return isOverviewPath(pathname, locale);
  if (hrefKey === 'adminHome') return pathname === `/${locale}/admin` || pathname === `/${locale}/admin/`;
  if (hrefKey === 'adminCustomers') return pathname.startsWith(`/${locale}/admin/customers`) || pathname.startsWith(`/${locale}/admin/users`);
  if (hrefKey === 'adminFleet') return pathname.startsWith(`/${locale}/admin/fleet`);
  if (hrefKey === 'adminScreens') return pathname.startsWith(`/${locale}/admin/screens`);
  if (hrefKey === 'adminStaff') return pathname.startsWith(`/${locale}/admin/staff`);
  if (hrefKey === 'adminStats') return pathname.startsWith(`/${locale}/admin/stats`);
  if (hrefKey === 'adminLogs') return pathname.startsWith(`/${locale}/admin/logs`);
  if (hrefKey === 'adminSettings') return pathname.startsWith(`/${locale}/admin/settings`);
  if (hrefKey === 'adminFeatureFlags') return pathname.startsWith(`/${locale}/admin/feature-flags`);
  if (hrefKey === 'help') return pathname.startsWith(`/${locale}/help`);
  if (hrefKey === 'apiDocs') return pathname.startsWith(`/${locale}/api-docs`);
  if (hrefKey === 'notifications') return pathname.startsWith(`/${locale}/notifications`);
  if (hrefKey === 'analytics') return pathname.startsWith(`/${locale}/analytics`);
  if (hrefKey === 'auditLog') return pathname.startsWith(`/${locale}/audit-log`);
  return false;
}

/* ── Nav Item ── */
function NavItem({
  href,
  label,
  active,
  icon: Icon,
  count,
  onClick,
}: {
  href: Route;
  label: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  count?: number | null;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-[13px]',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        active
          ? 'bg-primary/8 text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
>
      {/* Active indicator bar */}
      {active ? (
        <span className="absolute inset-inline-start-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-all duration-200" />
      ) : null}

      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-all duration-200',
          active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground group-hover:scale-105',
        )}
        strokeWidth={STROKE}
      />
      <span className={cn('min-w-0 flex-1 truncate transition-all duration-200', active ? 'font-semibold' : 'font-medium')}>
        {label}
      </span>
      {count !== null && count !== undefined && count > 0 ? (
        <span
          className={cn(
            'text-[10px] font-bold tabular-nums transition-colors duration-200',
            active ? 'text-primary' : 'text-muted-foreground/50',
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

/* ── Section Label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40">
      {children}
    </p>
  );
}

/* ── Bottom Icon Button ── */
function IconButton({
  label,
  onClick,
  href,
  icon: Icon,
  danger,
}: {
  label: string;
  onClick?: () => void;
  href?: Route;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  danger?: boolean;
}) {
  const cls = cn(
    'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
    danger
      ? 'text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500'
      : 'text-muted-foreground/60 hover:bg-muted hover:text-foreground',
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label} title={label}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={STROKE} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={STROKE} />
    </button>
  );
}

export type ShellSidebarProps = {
  navLocale: 'ar' | 'en';
  rtl: boolean;
  pathname: string | null;
  sovereign: boolean;
  shellNavLoading: boolean;
  workspaceId: string | null;
  counts: { media: number; screens: number; playlists: number };
  isLoading: boolean;
  isAuthenticated: boolean;
  mobileNavOpen: boolean;
  showWorkspaceSwitcher: boolean;
};

export function ShellSidebar({
  navLocale,
  rtl,
  pathname,
  sovereign,
  shellNavLoading,
  workspaceId,
  counts,
  isLoading,
  isAuthenticated,
  mobileNavOpen,
}: ShellSidebarProps) {
  const t = useTranslations('nav');
  const tUser = useTranslations('userMenu');
  const router = useRouter();
  const pathnameActive = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const { workspaces } = useWorkspace();

  return (
    <aside
      key={`sidebar-${navLocale}-${sovereign ? 'admin' : 'workspace'}`}
      className={cn(
        'fixed inset-y-0 z-[82] flex w-[240px] flex-col [inset-inline-start:0]',
        'transition-transform duration-300',
        rtl
          ? mobileNavOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full'
          : mobileNavOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col border-e border-border bg-card">
        {/* ── Logo ── */}
        <div className="flex shrink-0 items-center px-5 pt-5 pb-3">
          <ShellLogo locale={navLocale} />
        </div>

        {/* ── Nav ── */}
        <nav
          key={navLocale}
          className={cn(
            'vc-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2',
            rtl ? 'text-right' : 'text-left',
          )}
        >
          {shellNavLoading ? (
            <div className="flex flex-col gap-1 px-3 pt-4" aria-hidden aria-busy="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : sovereign ? (
            <>
              <NavItem
                href={hrefFor(navLocale, 'overview') as Route}
                label={t('overview')}
                active={sovereignLinkActive(pathname, navLocale, 'overview')}
                icon={LayoutDashboard}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminHome') as Route}
                label={t('adminHome')}
                active={sovereignLinkActive(pathname, navLocale, 'adminHome')}
                icon={LayoutGrid}
              />

              <SectionLabel>{t('customersSection')}</SectionLabel>
              <NavItem
                href={hrefFor(navLocale, 'adminCustomers') as Route}
                label={t('adminCustomers')}
                active={sovereignLinkActive(pathname, navLocale, 'adminCustomers')}
                icon={Users}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminWorkspaces') as Route}
                label={t('adminWorkspaces')}
                active={pathname?.startsWith(`/${navLocale}/admin/workspaces`) ?? false}
                icon={Building2}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminFleet') as Route}
                label={t('adminFleet')}
                active={sovereignLinkActive(pathname, navLocale, 'adminFleet')}
                icon={Globe2}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminScreens') as Route}
                label={t('adminScreens')}
                active={sovereignLinkActive(pathname, navLocale, 'adminScreens')}
                icon={Server}
              />

              <SectionLabel>{t('staffSection')}</SectionLabel>
              <NavItem
                href={hrefFor(navLocale, 'adminStaff') as Route}
                label={t('adminStaff')}
                active={sovereignLinkActive(pathname, navLocale, 'adminStaff')}
                icon={UserCog}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminStats') as Route}
                label={t('adminStats')}
                active={sovereignLinkActive(pathname, navLocale, 'adminStats')}
                icon={Activity}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminLogs') as Route}
                label={t('adminLogs')}
                active={sovereignLinkActive(pathname, navLocale, 'adminLogs')}
                icon={ScrollText}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminSettings') as Route}
                label={t('adminSettings')}
                active={sovereignLinkActive(pathname, navLocale, 'adminSettings')}
                icon={Settings}
              />
              <NavItem
                href={hrefFor(navLocale, 'adminFeatureFlags') as Route}
                label={t('adminFeatureFlags')}
                active={sovereignLinkActive(pathname, navLocale, 'adminFeatureFlags')}
                icon={ToggleRight}
              />

              <SectionLabel>{t('resourcesSection')}</SectionLabel>
              <NavItem
                href={hrefFor(navLocale, 'notifications') as Route}
                label={t('notifications')}
                active={sovereignLinkActive(pathname, navLocale, 'notifications')}
                icon={Bell}
              />
              <NavItem
                href={hrefFor(navLocale, 'auditLog') as Route}
                label={t('auditLog')}
                active={sovereignLinkActive(pathname, navLocale, 'auditLog')}
                icon={ScrollText}
              />
              <NavItem
                href={hrefFor(navLocale, 'apiDocs') as Route}
                label={t('apiDocs')}
                active={sovereignLinkActive(pathname, navLocale, 'apiDocs')}
                icon={Terminal}
              />
              <NavItem
                href={hrefFor(navLocale, 'help') as Route}
                label={t('help')}
                active={sovereignLinkActive(pathname, navLocale, 'help')}
                icon={CircleHelp}
              />
            </>
          ) : (
            <>
              {/* ── Flat nav: overview → workspaces → screens → playlists → media → rest ── */}
              <NavItem
                href={hrefFor(navLocale, 'overview') as Route}
                label={t('overview')}
                active={isOverviewPath(pathname, navLocale)}
                icon={LayoutDashboard}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                }}
              />

              {/* Workspaces with count badge */}
              <Link
                href={`/${navLocale}/branches` as Route}
                aria-current={pathname?.startsWith(`/${navLocale}/branches`) ? 'page' : undefined}
                className={cn(
                  'group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-[13px]',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  pathname?.startsWith(`/${navLocale}/branches`)
                    ? 'bg-primary/8 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {pathname?.startsWith(`/${navLocale}/branches`) ? (
                  <span className="absolute inset-inline-start-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-all duration-200" />
                ) : null}
                <Building2
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-200',
                    pathname?.startsWith(`/${navLocale}/branches`) ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground group-hover:scale-105',
                  )}
                  strokeWidth={STROKE}
                />
                <span className={cn(
                  'min-w-0 flex-1 truncate transition-all duration-200',
                  pathname?.startsWith(`/${navLocale}/branches`) ? 'font-semibold' : 'font-medium',
                )}>
                  {t('branches')}
                </span>
                {workspaces.length > 0 && (
                  <span className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors duration-200',
                    pathname?.startsWith(`/${navLocale}/branches`)
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground/50',
                  )}>
                    {workspaces.length}
                  </span>
                )}
              </Link>

              <NavItem
                href={hrefFor(navLocale, 'screens') as Route}
                label={t('screens')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/screens`))}
                icon={Monitor}
                count={counts.screens}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('screens')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'playlists') as Route}
                label={t('playlists')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/playlists`))}
                icon={Clapperboard}
                count={counts.playlists}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('playlists')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'media') as Route}
                label={t('media')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/media`))}
                icon={FolderOpen}
                count={counts.media}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('media')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'studio') as Route}
                label={t('studio')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/studio`))}
                icon={Clapperboard}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('studio')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'templates') as Route}
                label={t('templates')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/templates`))}
                icon={LayoutTemplate}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('templates')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'schedules') as Route}
                label={t('schedules')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/schedules`))}
                icon={CalendarClock}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('schedules')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'emergency') as Route}
                label={t('emergency')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/emergency`))}
                icon={AlertTriangle}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('emergency')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'analytics') as Route}
                label={t('analytics')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/analytics`))}
                icon={Activity}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('analytics')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'ai') as Route}
                label={t('ai')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/ai`))}
                icon={Sparkles}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('ai')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'team') as Route}
                label={t('team')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/team`))}
                icon={Users}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('team')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={`/${navLocale}/settings/billing` as Route}
                label={t('billing')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/settings/billing`))}
                icon={CreditCard}
              />
              <NavItem
                href={`/${navLocale}/settings/profile` as Route}
                label={t('settings')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/settings/profile`)) || Boolean(pathname?.startsWith(`/${navLocale}/settings/workspace`))}
                icon={Settings}
              />

              <NavItem
                href={hrefFor(navLocale, 'notifications') as Route}
                label={t('notifications')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/notifications`))}
                icon={Bell}
              />
              <NavItem
                href={hrefFor(navLocale, 'auditLog') as Route}
                label={t('auditLog')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/audit-log`))}
                icon={ScrollText}
              />
              <NavItem
                href={hrefFor(navLocale, 'apiDocs') as Route}
                label={t('apiDocs')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/api-docs`))}
                icon={Terminal}
              />
              <NavItem
                href={hrefFor(navLocale, 'help') as Route}
                label={t('help')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/help`))}
                icon={CircleHelp}
              />
            </>
          )}
        </nav>

        {/* ── Bottom bar: theme + lang + logout ── */}
        <div className="flex shrink-0 items-center gap-1.5 border-t border-border px-4 py-3">
          <IconButton
            label={isDark ? tUser('switchToLight') : tUser('switchToDark')}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            icon={isDark ? Sun : Moon}
          />
          <button
            type="button"
            onClick={() => {
              router.replace(pathWithLocale(pathnameActive, navLocale === 'ar' ? 'en' : 'ar') as Route);
              router.refresh();
            }}
            className={cn(
              'flex h-9 cursor-pointer items-center justify-center rounded-lg px-2 text-[10px] font-bold uppercase transition-colors duration-200',
              'text-muted-foreground/60 hover:bg-muted hover:text-foreground',
            )}
            aria-label={tUser('language')}
            title={tUser('language')}
          >
            {navLocale === 'ar' ? 'EN' : 'AR'}
          </button>

          <div className="flex-1" />

          <IconButton
            label={tUser('signOut')}
            icon={LogOut}
            danger
            onClick={async () => {
              const res = await apiLogout();
              if (!res.ok) {
                toast.error(tUser('signOutFailed'));
                return;
              }
              setStoredAccessToken(null);
              router.push(`/${navLocale}/login`);
              router.refresh();
            }}
          />
        </div>
      </div>
    </aside>
  );
}
