'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  BarChart3,
  Building2,
  CalendarClock,
  Clapperboard,
  LayoutDashboard,
  Megaphone,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  Users,
  ImageIcon,
  LifeBuoy,
  ScrollText,
} from 'lucide-react';
import { ShellLogo } from '@/components/layout/shell-logo';
import { pathWithLocale } from '@/components/language-switcher';
import { setStoredAccessToken } from '@/features/auth/session';
import { logout as apiLogout } from '@/features/auth/auth-api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceSwitcher } from '@/features/workspace/workspace-switcher';
import { useReducedMotion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   Nimbus Rail v2 — Professional SaaS sidebar
   • 240px wide, solid surface, no clutter
   • Active: violet tinted bg + 3px rounded indicator bar
   • 44px touch targets, 200ms transitions, cursor-pointer
   • Navigation only — no workspace, no account section
   ═══════════════════════════════════════════════════════════════ */

const STROKE = 1.5;

const CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE = new Set<
  string
>(['overview', 'screens', 'media', 'templates', 'team', 'playlists', 'schedules', 'campaigns', 'ai', 'analytics', 'emergency', 'help', 'api-docs', 'notifications', 'audit-log', 'studio']);

function hrefFor(
  locale: string,
  hrefKey:
    | 'overview'
    | 'help'
    | 'apiDocs'
    | 'notifications'
    | 'analytics'
    | 'auditLog'
    | 'media'
    | 'team'
    | 'screens'
    | 'templates'
    | 'ai'
    | 'emergency'
    | 'campaigns'
    | 'studio',
): string {
  if (hrefKey === 'overview') return `/${locale}/overview`;
  if (hrefKey === 'help') return `/${locale}/help`;
  if (hrefKey === 'apiDocs') return `/${locale}/api-docs`;
  if (hrefKey === 'notifications') return `/${locale}/notifications`;
  if (hrefKey === 'analytics') return `/${locale}/analytics`;
  if (hrefKey === 'auditLog') return `/${locale}/audit-log`;
  if (hrefKey === 'media') return `/${locale}/media`;
  if (hrefKey === 'team') return `/${locale}/team`;
  if (hrefKey === 'screens') return `/${locale}/screens`;
  if (hrefKey === 'templates') return `/${locale}/templates`;
  if (hrefKey === 'ai') return `/${locale}/ai`;
  if (hrefKey === 'emergency') return `/${locale}/emergency`;
  if (hrefKey === 'campaigns') return `/${locale}/campaigns`;
  if (hrefKey === 'studio') return `/${locale}/studio`;
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
      title={label}
      className={cn(
        'group relative flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm md:h-9 md:justify-center lg:justify-start',
        'transition-all duration-fast ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
      )}
>
      {/* Active indicator — 2px left border per DS V2 (desktop), bg-primary on icon (collapsed) */}
      {active ? (
        <span className="absolute inset-inline-start-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-fast md:hidden lg:block" />
      ) : null}

      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors duration-fast',
          active ? 'text-primary md:bg-primary/10 md:rounded-lg md:p-0.5 md:-m-0.5' : 'text-muted-foreground/70 group-hover:text-foreground',
        )}
        strokeWidth={STROKE}
      />
      <span className={cn('min-w-0 flex-1 truncate transition-colors duration-fast md:hidden lg:block', active ? 'font-medium' : 'font-normal')}>
        {label}
      </span>
      {count !== null && count !== undefined && count > 0 ? (
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums transition-colors duration-fast md:hidden lg:inline-flex',
            active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
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
    'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
    danger
      ? 'text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive'
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
  shellNavLoading,
  workspaceId,
  counts,
  isLoading,
  isAuthenticated,
  mobileNavOpen,
  showWorkspaceSwitcher,
}: ShellSidebarProps) {
  const t = useTranslations('nav');
  const tUser = useTranslations('userMenu');
  const router = useRouter();
  const pathnameActive = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <aside
      key={`sidebar-${navLocale}`}
      className={cn(
        'fixed inset-y-0 z-drawer flex w-[280px] flex-col [inset-inline-start:0] max-md:shadow-2xl',
        prefersReducedMotion ? 'transition-[translate,transform] duration-0' : 'transition-[translate,transform] duration-normal',
        rtl
          ? mobileNavOpen ? 'max-md:translate-x-0' : 'max-md:translate-x-full'
          : mobileNavOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        'md:w-[64px] md:translate-x-0 lg:w-[240px]',
      )}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col border-e border-border bg-card">
        {/* ── Logo ── */}
        <div className="flex shrink-0 items-center px-5 pt-5 pb-3 max-md:block md:hidden lg:block">
          <ShellLogo locale={navLocale} />
        </div>

        {/* ── Workspace switcher (mobile drawer only) ── */}
        {showWorkspaceSwitcher ? (
          <div className="shrink-0 px-3 pb-2 max-md:block md:hidden lg:block">
            <WorkspaceSwitcher />
          </div>
        ) : null}

        {/* ── Nav ── */}
        <nav
          key={navLocale}
          aria-label={t('mainNavigation')}
          className={cn(
            'vc-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2 md:px-2 lg:px-3 text-start',
          )}
        >
          {shellNavLoading ? (
            <div className="flex flex-col gap-1 px-3 pt-4" aria-hidden aria-busy="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : (
            <>
              {/* ── 7-item sidebar per IA sitemap ── */}
              <NavItem
                href={hrefFor(navLocale, 'overview') as Route}
                label={t('overview')}
                active={isOverviewPath(pathname, navLocale)}
                icon={LayoutDashboard}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                }}
              />

              <NavItem
                href={`/${navLocale}/branches` as Route}
                label={t('branches')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/branches`))}
                icon={Building2}
              />

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

              {/* Content — links to /content/playlists (canonical default tab) */}
              <NavItem
                href={`/${navLocale}/content/playlists` as Route}
                label={t('content')}
                active={
                  Boolean(pathname?.startsWith(`/${navLocale}/content`)) ||
                  Boolean(pathname?.startsWith(`/${navLocale}/playlists`)) ||
                  Boolean(pathname?.startsWith(`/${navLocale}/templates`))
                }
                icon={Clapperboard}
                count={counts.playlists}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('playlists')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              {/* Media — standalone page */}
              <NavItem
                href={hrefFor(navLocale, 'media') as Route}
                label={t('media')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/media`))}
                icon={ImageIcon}
                count={counts.media}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('media')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              {/* Studio — Canvas Editor */}
              <NavItem
                href={hrefFor(navLocale, 'studio') as Route}
                label={t('studio')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/studio`))}
                icon={Palette}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('studio')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              {/* Scheduling — links to /scheduling route */}
              <NavItem
                href={`/${navLocale}/scheduling` as Route}
                label={t('scheduling')}
                active={
                  Boolean(pathname?.startsWith(`/${navLocale}/scheduling`)) ||
                  Boolean(pathname?.startsWith(`/${navLocale}/schedules`))
                }
                icon={CalendarClock}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('schedules')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              {/* Campaigns — approval workflow */}
              <NavItem
                href={`/${navLocale}/campaigns` as Route}
                label={t('campaigns')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/campaigns`))}
                icon={Megaphone}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('campaigns')) {
                    e.preventDefault(); toast.error(t('selectWorkspaceToast'));
                  }
                }}
              />

              <NavItem
                href={hrefFor(navLocale, 'analytics') as Route}
                label={t('analytics')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/analytics`))}
                icon={BarChart3}
                onClick={(e) => {
                  if (isLoading) { e.preventDefault(); return; }
                  if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has('analytics')) {
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
                href={`/${navLocale}/settings` as Route}
                label={t('settings')}
                active={Boolean(pathname?.startsWith(`/${navLocale}/settings`))}
                icon={Settings}
              />

              {/* ── Secondary nav: Help + Audit Log ── */}
              <div className="pt-2 mt-2 border-t border-border/60">
                <NavItem
                  href={hrefFor(navLocale, 'help') as Route}
                  label={t('help')}
                  active={Boolean(pathname?.startsWith(`/${navLocale}/help`))}
                  icon={LifeBuoy}
                />
                <NavItem
                  href={hrefFor(navLocale, 'auditLog') as Route}
                  label={t('auditLog')}
                  active={Boolean(pathname?.startsWith(`/${navLocale}/audit-log`))}
                  icon={ScrollText}
                />
              </div>
            </>
          )}
        </nav>

        {/* ── Bottom bar: theme + lang + logout ── */}
        <div className="flex shrink-0 items-center gap-1.5 border-t border-border px-4 py-3 md:justify-center lg:justify-start [padding-bottom:env(safe-area-inset-bottom)]">
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
              'flex h-9 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-bold uppercase transition-colors duration-fast',
              'text-muted-foreground/60 hover:bg-muted hover:text-foreground',
              'md:hidden lg:flex',
            )}
            aria-label={tUser('language')}
            title={tUser('language')}
          >
            {navLocale === 'ar' ? 'EN' : 'AR'}
          </button>

          <div className="flex-1 md:hidden lg:block" />

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
