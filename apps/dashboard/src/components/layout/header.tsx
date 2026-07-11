'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ShellLogo } from '@/components/layout/shell-logo';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { WorkspaceSwitcher } from '@/features/workspace/workspace-switcher';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

type ShellHeaderProps = {
  navLocale: 'ar' | 'en';
  rtl: boolean;
  sovereign: boolean;
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
  sovereign,
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
        rtl ? 'items-end text-right' : 'items-start text-left',
      )}
    >
      {kicker ? (
        <p
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.16em]',
            'text-muted-foreground',
          )}
        >
          {kicker}
        </p>
      ) : null}
      <p
        className={cn(
          'shell-header-title w-full truncate text-[15px] font-bold leading-tight tracking-tight sm:text-[17px]',
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
      className="z-[80] h-8 w-8 shrink-0 rounded-lg border-border bg-card text-foreground hover:bg-muted sm:h-9 sm:w-9 lg:hidden"
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

  const mobileLogo = (
    <div className="flex h-9 items-center rounded-lg border border-border bg-card px-3 lg:hidden">
      <ShellLogo locale={navLocale} className="max-h-[28px] max-w-[120px]" />
    </div>
  );

  const desktopActions = (
    <div className="hidden shrink-0 flex-nowrap items-center justify-end gap-2.5 lg:flex">
      {showWorkspaceSwitcher ? <WorkspaceSwitcher /> : null}
      <UserMenu rtl={rtl} variant={sovereign ? 'sovereign' : 'workspace'} />
    </div>
  );

  return (
    <header
      className={cn(
        'relative sticky top-0 z-[55] flex min-h-[52px] shrink-0 flex-col',
        'border-b border-border bg-background/80 backdrop-blur-md',
      )}
    >
      <div className="relative z-[3] mx-auto flex min-h-[52px] w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10">
        <div className="flex shrink-0 items-center lg:hidden">
          {menuBtn}
        </div>

        {/* Mobile/tablet: show page title between menu and actions */}
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className={cn(
            'flex min-w-0 flex-1 flex-row items-center gap-2 lg:hidden',
          )}
        >
          {backBtn}
          {titleBlock}
        </div>

        {/* Desktop: full title row with inset */}
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className={cn(
            'hidden min-w-0 flex-1 flex-row items-center gap-2 sm:gap-3 lg:flex',
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

        {/* Mobile logo — hidden on desktop, hidden when nav is open on mobile */}
        <div className={cn('hidden', 'lg:hidden')}>
          {mobileLogo}
        </div>

        {desktopActions}
      </div>
      {headerInset ? (
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className="border-b border-border bg-muted/30 px-3 py-2 lg:hidden"
        >
          <div className="mx-auto flex w-full max-w-[1600px] justify-center overflow-x-auto sm:px-3">
            {headerInset}
          </div>
        </div>
      ) : null}
    </header>
  );
}
