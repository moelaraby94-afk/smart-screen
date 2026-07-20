'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutGrid,
  Building2,
  UserCog,
  Layers,
  MonitorSmartphone,
  Monitor,
  Activity,
  ScrollText,
  Flag,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ControlPanelShellProps = {
  children: React.ReactNode;
  locale: string;
};

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

type NavSection = {
  labelKey: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: '',
    items: [
      { href: 'admin', labelKey: 'adminHome', icon: LayoutGrid },
    ],
  },
  {
    labelKey: 'managementSection',
    items: [
      { href: 'admin/customers', labelKey: 'customers', icon: Building2 },
      { href: 'admin/staff', labelKey: 'staff', icon: UserCog },
    ],
  },
  {
    labelKey: 'systemSection',
    items: [
      { href: 'admin/workspaces', labelKey: 'adminWorkspaces', icon: Layers },
      { href: 'admin/fleet', labelKey: 'fleet', icon: MonitorSmartphone },
      { href: 'admin/screens', labelKey: 'adminScreens', icon: Monitor },
      { href: 'admin/stats', labelKey: 'adminHealth', icon: Activity },
      { href: 'admin/logs', labelKey: 'logs', icon: ScrollText },
      { href: 'admin/feature-flags', labelKey: 'adminFeatureFlags', icon: Flag },
      { href: 'admin/settings', labelKey: 'settings', icon: Settings },
    ],
  },
];

const STROKE = 1.75;

function SectionLabel({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="px-3 pt-5 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/40 md:hidden lg:block">
      {children}
    </p>
  );
}

function NavItemLink({
  href,
  label,
  active,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={cn(
        'group relative flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm md:h-9 md:justify-center lg:justify-start',
        'transition-all duration-fast ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
      )}
    >
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
    </a>
  );
}

export function ControlPanelShell({ children, locale }: ControlPanelShellProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const pathSegment = pathname?.split('/').filter(Boolean)[0];
  const navLocale =
    pathSegment === 'ar' || pathSegment === 'en' ? pathSegment : locale;
  const rtl = navLocale === 'ar';

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(min-width: 768px)');
    const syncDesktop = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) setMobileNavOpen(false);
    };
    syncDesktop(query);
    const listener = (event: MediaQueryListEvent) => syncDesktop(event);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  const isActive = (item: NavItem): boolean => {
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const adminIndex = segments.indexOf('admin');
    if (adminIndex === -1) return false;
    const subPath = segments.slice(adminIndex + 1).join('/');
    if (item.href === 'admin') return subPath === '';
    return subPath === item.href.replace('admin/', '') || subPath.startsWith(item.href.replace('admin/', '') + '/');
  };

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-x-hidden overflow-y-hidden bg-background text-foreground dark:bg-transparent">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-tooltip focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        {t('skipToContent')}
      </a>

      {/* Sidebar */}
      <aside
        key={`sidebar-${navLocale}`}
        className={cn(
          'fixed inset-y-0 z-drawer flex w-[280px] flex-col [inset-inline-start:0]',
          'transition-transform duration-normal',
          rtl
            ? mobileNavOpen ? 'max-md:translate-x-0' : 'max-md:translate-x-full'
            : mobileNavOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
          'md:w-[64px] md:translate-x-0 lg:w-[240px]',
        )}
        aria-label={t('mainNavigation')}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col border-e border-border bg-card">
          {/* Logo */}
          <div className="flex shrink-0 items-center px-5 pt-5 pb-3 max-md:block md:hidden lg:block">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutGrid className="h-5 w-5" strokeWidth={STROKE} />
              </div>
              <span className="text-sm font-semibold">{t('headerAdmin')}</span>
            </div>
          </div>

          {/* Nav */}
          <nav
            className="vc-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2 md:px-2 lg:px-3 text-start"
          >
            {NAV_SECTIONS.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                <SectionLabel>{section.labelKey ? t(section.labelKey) : ''}</SectionLabel>
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <NavItemLink
                      key={item.href}
                      href={`/${navLocale}/${item.href}`}
                      label={t(item.labelKey)}
                      active={active}
                      icon={item.icon}
                      onClick={() => setMobileNavOpen(false)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-drawer-backdrop bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label={t('toggleMenu')}
        />
      ) : null}

      {/* Main column */}
      <div className={cn(
        'relative z-content flex min-h-0 flex-1 flex-col overflow-hidden',
        rtl ? 'md:me-[64px] lg:me-[240px]' : 'md:ms-[64px] lg:ms-[240px]',
      )}>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 sm:px-4">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent md:hidden"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={t('toggleMenu')}
            aria-expanded={mobileNavOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold">{t('headerAdmin')}</h1>
        </header>

        {/* Main content */}
        <main
          id="main-content"
          className="vc-scrollbar relative z-content mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
