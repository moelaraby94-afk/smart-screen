'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ShellHeader } from '@/components/layout/header';
import { ShellHeaderInsetSetterContext } from '@/components/layout/shell-header-inset-context';
import { ShellSidebar } from '@/components/layout/shell-sidebar';
import { PageTransition } from '@/components/page-transition';
import { ImpersonationReturnButton } from '@/features/auth/impersonation-return-button';
import { WorkspaceGate } from '@/features/workspace/workspace-gate';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useWorkspaceStats } from '@/features/workspace/use-workspace-stats';
import { useShellHeaderMeta } from '@/lib/shell-header-meta';

type CrystalShellProps = {
  children: React.ReactNode;
  locale: string;
};

export function CrystalShell({ children, locale }: CrystalShellProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const {
    workspaceId,
    workspaces,
    workspaceDataEpoch,
    isLoading,
    isAuthenticated,
  } = useWorkspace();
  const counts = useWorkspaceStats(workspaceId, workspaceDataEpoch);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [headerInset, setHeaderInset] = React.useState<React.ReactNode>(null);
  const setHeaderInsetStable = React.useCallback((node: React.ReactNode | null) => {
    setHeaderInset(node);
  }, []);
  // Close mobile nav after route changes.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    setHeaderInset(null);
  }, [pathname]);

  // Ensure mobile nav cannot stay open on desktop widths.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(min-width: 768px)');
    const syncDesktop = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) {
        setMobileNavOpen(false);
      }
    };
    syncDesktop(query);
    const listener = (event: MediaQueryListEvent) => syncDesktop(event);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  // Close mobile drawer on Escape key.
  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  const pathSegment = pathname?.split('/').filter(Boolean)[0];
  const pathLocale =
    pathSegment === 'ar' || pathSegment === 'en' ? pathSegment : locale;
  const navLocale = pathLocale as 'ar' | 'en';
  const headerMeta = useShellHeaderMeta(pathname);

  const pageTitle = React.useMemo(() => {
    const parts = pathname?.split('/').filter(Boolean) ?? [];
    if (parts[0] !== navLocale) return headerMeta.pageTitle;
    if (parts[1] === 'branches' && parts[2] && !parts[3]) {
      const ws = workspaces.find((w) => w.id === parts[2]);
      if (ws?.name) return ws.name;
    }
    return headerMeta.pageTitle;
  }, [pathname, navLocale, workspaces, headerMeta.pageTitle]);

  const shellNavLoading = isLoading;

  const rtl = navLocale === 'ar';

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-x-hidden overflow-y-hidden bg-background text-foreground dark:bg-transparent">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-tooltip focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        {t('skipToContent')}
      </a>
      <ShellSidebar
        navLocale={navLocale}
        rtl={rtl}
        pathname={pathname}
        shellNavLoading={shellNavLoading}
        workspaceId={workspaceId}
        counts={counts}
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
        mobileNavOpen={mobileNavOpen}
        showWorkspaceSwitcher={true}
      />

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-drawer-backdrop bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label={t('toggleMenu')}
        />
      ) : null}

      {/* Main column: fixed viewport height; only <main> scrolls — sidebar stays fixed, no document scroll */}
      <div className="relative z-content flex min-h-0 flex-1 flex-col overflow-hidden md:ms-[64px] lg:ms-[240px]">
        <ShellHeader
          navLocale={navLocale}
          rtl={rtl}
          pageTitle={pageTitle}
          kicker={headerMeta.kicker}
          showBack={headerMeta.showBack}
          backHref={headerMeta.backHref}
          backLabel={headerMeta.backLabel}
          mobileNavOpen={mobileNavOpen}
          onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
          showWorkspaceSwitcher={true}
          headerInset={headerInset}
        />
        <Breadcrumbs pathname={pathname} locale={navLocale} rtl={rtl} />
        <ShellHeaderInsetSetterContext.Provider value={setHeaderInsetStable}>
          <main id="main-content" className="vc-scrollbar relative z-content mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
            <ImpersonationReturnButton />
            <PageTransition>
              <WorkspaceGate>{children}</WorkspaceGate>
            </PageTransition>
          </main>
        </ShellHeaderInsetSetterContext.Provider>
      </div>
    </div>
  );
}
