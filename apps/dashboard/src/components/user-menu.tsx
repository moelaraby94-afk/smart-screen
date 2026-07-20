'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChevronDown,
  LogOut,
  Moon,
  SlidersHorizontal,
  Sun,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { pathWithLocale } from '@/components/language-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setStoredAccessToken } from '@/features/auth/session';
import { logout as apiLogout } from '@/features/auth/auth-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

type Props = {
  rtl: boolean;
};

export function UserMenu({ rtl }: Props) {
  const t = useTranslations('userMenu');
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { userEmail, userFullName, isAuthenticated } = useWorkspace();

  if (!isAuthenticated) return null;

  const isDark = resolvedTheme !== 'light';
  const hrefAr = pathWithLocale(pathname, 'ar') as Route;
  const hrefEn = pathWithLocale(pathname, 'en') as Route;

  const switchLocale = (href: Route) => {
    router.replace(href);
    router.refresh();
  };

  const accentIcon = 'text-primary';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 items-center gap-1 rounded-lg border px-1.5 py-1 transition-all',
            rtl && 'flex-row-reverse',
            'border-border bg-card hover:bg-muted',
          )}
          aria-label={t('accountMenu')}
        >
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white',
              'bg-primary',
            )}
          >
            <UserRound className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-80" strokeWidth={ICON_STROKE} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={rtl ? 'start' : 'end'}
        sideOffset={8}
        className={cn(
          'z-dropdown min-w-[14rem] rounded-xl border border-border bg-card p-2',
          rtl && 'rtl',
        )}
      >
        <DropdownMenuLabel className="px-2 py-1.5 font-normal normal-case">
          <span className="block truncate text-xs text-muted-foreground">
            {userFullName || userEmail}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('language')}
          </span>
          <div
            className="inline-flex rounded-full border border-primary/20 bg-muted/40 p-0.5"
            role="group"
            aria-label={t('language')}
          >
            <button
              type="button"
              onClick={() => switchLocale(hrefAr)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                activeLocale === 'ar'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('langArabic')}
            </button>
            <button
              type="button"
              onClick={() => switchLocale(hrefEn)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                activeLocale === 'en'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('langEnglish')}
            </button>
          </div>
        </div>

        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-xl"
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? 'light' : 'dark');
          }}
        >
          <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10', accentIcon)}>
            {isDark ? <Moon className="h-4 w-4" strokeWidth={ICON_STROKE} /> : <Sun className="h-4 w-4" strokeWidth={ICON_STROKE} />}
          </span>
          <span className="flex-1">{isDark ? t('switchToLight') : t('switchToDark')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('sectionAccount')}
        </p>
        <DropdownMenuItem asChild className="cursor-pointer gap-2 rounded-lg">
          <Link href={`/${activeLocale}/settings/profile` as Route} className="flex items-center gap-2">
            <UserRound className={cn('h-4 w-4', accentIcon)} strokeWidth={ICON_STROKE} />
            {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-2 rounded-lg">
          <Link href={`/${activeLocale}/settings/billing` as Route} className="flex items-center gap-2">
            <SlidersHorizontal className={cn('h-4 w-4', accentIcon)} strokeWidth={ICON_STROKE} />
            {t('settingsBilling')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg text-destructive focus:text-destructive"
          onSelect={async (e) => {
            e.preventDefault();
            const res = await apiLogout();
            if (!res.ok) {
              toast.error(t('signOutFailed'));
              return;
            }
            setStoredAccessToken(null);
            router.push(`/${activeLocale}/login`);
            router.refresh();
          }}
        >
          <LogOut className="h-4 w-4" strokeWidth={ICON_STROKE} />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
