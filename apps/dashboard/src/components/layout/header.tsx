'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, LogOut, Menu, Moon, MoreVertical, Search, Settings, SlidersHorizontal, Sun, UserRound, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { pathWithLocale } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenu } from '@/components/user-menu';
import { WorkspaceSwitcher } from '@/features/workspace/workspace-switcher';
import { NotificationBell } from '@/features/notifications/notification-provider';
import { GlobalSearch } from '@/features/search/global-search';
import { DensityToggle } from '@/components/density-toggle';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { setStoredAccessToken } from '@/features/auth/session';
import { logout as apiLogout } from '@/features/auth/auth-api';
import { toast } from 'sonner';

type ShellHeaderProps = {
  navLocale: 'ar' | 'en';
  rtl: boolean;
  pageTitle: string;
  kicker: string;
  showBack: boolean;
  backHref: string | null;
  backLabel: string;
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  showWorkspaceSwitcher: boolean;
  /** Branch tools etc.: beside page title on desktop; extra row on small screens. */
  headerInset?: ReactNode;
};

export function ShellHeader({
  navLocale,
  rtl,
  pageTitle,
  kicker,
  showBack,
  backHref,
  backLabel,
  mobileNavOpen,
  onToggleMobileNav,
  showWorkspaceSwitcher,
  headerInset,
}: ShellHeaderProps) {
  const t = useTranslations('nav');

  const backBtn = showBack && backHref && (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        'h-8 w-8 shrink-0 rounded-lg border-border bg-card transition-all',
        'text-foreground hover:bg-muted',
        rtl && 'rotate-180',
      )}
      asChild
    >
      <Link href={backHref as Route} aria-label={backLabel}>
        <ArrowLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
      </Link>
    </Button>
  );

  const titleBlock = (
    <div
      className={cn(
        'min-w-0 flex flex-col justify-center',
        headerInset ? 'shrink-0' : 'flex-1',
        rtl ? 'items-end text-end' : 'items-start text-start',
      )}
    >
      {kicker ? (
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            'text-muted-foreground',
          )}
        >
          {kicker}
        </p>
      ) : null}
      <p
        className={cn(
          'shell-header-title w-full truncate text-sm font-bold leading-tight tracking-tight sm:text-base',
          headerInset && 'max-w-[10rem] sm:max-w-[14rem] lg:max-w-[18rem]',
          'text-foreground',
        )}
      >
        {pageTitle}
      </p>
    </div>
  );

  const menuBtn = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="z-header h-8 w-8 shrink-0 rounded-lg border-border bg-card text-foreground hover:bg-muted sm:h-9 sm:w-9 md:hidden"
      onClick={onToggleMobileNav}
      aria-label={t('toggleMenu')}
    >
      {mobileNavOpen ? (
        <X className="h-4 w-4 text-foreground" strokeWidth={ICON_STROKE} />
      ) : (
        <Menu className="h-4 w-4 text-foreground" strokeWidth={ICON_STROKE} />
      )}
    </Button>
  );

  const desktopActions = (
    <div className="hidden shrink-0 flex-nowrap items-center justify-end gap-3 lg:flex">
      <DensityToggle />
      <GlobalSearch />
      {showWorkspaceSwitcher ? (
        <div className="flex items-center gap-1.5">
          <OfflineIndicator />
          <WorkspaceSwitcher />
        </div>
      ) : null}
      <NotificationBell />
      <UserMenu rtl={rtl} />
    </div>
  );

  const mobileActions = (
    <div className="flex shrink-0 items-center gap-1 lg:hidden">
      {showWorkspaceSwitcher ? <WorkspaceSwitcher compact /> : null}
      <NotificationBell />
      <MobileMoreMenu navLocale={navLocale} rtl={rtl} />
    </div>
  );

  return (
    <header
      className={cn(
        'relative sticky top-0 z-sticky flex min-h-[56px] shrink-0 flex-col',
        'border-b border-border bg-card',
        '[padding-top:env(safe-area-inset-top)]',
      )}
    >
      <div className="relative z-content mx-auto flex min-h-[56px] w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-2">
        <div className="flex shrink-0 items-center md:hidden">
          {menuBtn}
        </div>

        {/* Mobile/tablet: show page title between menu and actions */}
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className={cn(
            'flex min-w-0 flex-1 flex-row items-center gap-2 md:hidden',
          )}
        >
          {backBtn}
          {titleBlock}
        </div>

        {/* Desktop: full title row with inset */}
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className={cn(
            'hidden min-w-0 flex-1 flex-row items-center gap-2 sm:gap-3 md:flex',
            headerInset ? 'min-w-0 justify-start' : rtl ? 'justify-start' : 'justify-end',
          )}
        >
          {backBtn}
          {titleBlock}
          {headerInset ? (
            <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1">
              {headerInset}
            </div>
          ) : null}
        </div>

        {/* Mobile actions: notification bell + more menu */}
        {mobileActions}

        {desktopActions}
      </div>
      {headerInset ? (
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className="border-b border-border bg-muted/30 px-3 py-2 md:hidden"
        >
          <div className="mx-auto flex w-full max-w-[1400px] justify-center overflow-x-auto sm:px-3">
            {headerInset}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MobileMoreMenu({ navLocale, rtl }: { navLocale: 'ar' | 'en'; rtl: boolean }) {
  const t = useTranslations('nav');
  const tUser = useTranslations('userMenu');
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const activeLocale = useLocale();
  const isDark = resolvedTheme !== 'light';

  const switchLocale = (locale: 'ar' | 'en') => {
    router.replace(pathWithLocale(pathname, locale) as Route);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted"
          aria-label={t('moreMenu')}
          aria-haspopup="menu"
        >
          <MoreVertical className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={rtl ? 'start' : 'end'} className="w-56">
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
          onSelect={(e) => {
            e.preventDefault();
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            window.dispatchEvent(event);
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
          {t('search')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tUser('language')}
          </span>
          <div
            className="inline-flex rounded-full border border-primary/20 bg-muted/40 p-0.5"
            role="group"
            aria-label={tUser('language')}
          >
            <button
              type="button"
              onClick={() => switchLocale('ar')}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                activeLocale === 'ar'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tUser('langArabic')}
            </button>
            <button
              type="button"
              onClick={() => switchLocale('en')}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                activeLocale === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tUser('langEnglish')}
            </button>
          </div>
        </div>

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? 'light' : 'dark');
          }}
        >
          {isDark ? <Moon className="h-4 w-4 text-muted-foreground" strokeWidth={ICON_STROKE} /> : <Sun className="h-4 w-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
          {isDark ? tUser('switchToLight') : tUser('switchToDark')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <Link href={`/${navLocale}/settings/profile` as Route} className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            {tUser('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <Link href={`/${navLocale}/settings/billing` as Route} className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            {tUser('settingsBilling')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
          onSelect={(e) => {
            e.preventDefault();
            router.push(`/${navLocale}/settings` as Route);
          }}
        >
          <Settings className="h-4 w-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
          {t('settings')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive"
          onSelect={async (e) => {
            e.preventDefault();
            const res = await apiLogout();
            if (!res.ok) {
              toast.error(tUser('signOutFailed'));
              return;
            }
            setStoredAccessToken(null);
            router.push(`/${navLocale}/login`);
            router.refresh();
          }}
        >
          <LogOut className="h-4 w-4 text-destructive" strokeWidth={ICON_STROKE} />
          {tUser('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OfflineIndicator() {
  const t = useTranslations('nav');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full bg-warning"
      title={t('offline')}
      aria-label={t('offline')}
      role="status"
    />
  );
}
