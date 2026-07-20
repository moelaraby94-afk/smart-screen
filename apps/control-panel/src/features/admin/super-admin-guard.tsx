'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Lock, Home } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations('superAdminGuard');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isSuperAdmin, isLoading, isAuthenticated } = useWorkspace();
  const deniedToast = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(pathname || `/${locale}/overview`);
      router.replace(`/${locale}/login?returnTo=${returnTo}`);
      return;
    }
    if (!isSuperAdmin) {
      if (!deniedToast.current) {
        deniedToast.current = true;
        toast.error(t('accessDenied'));
      }
      router.replace(`/${locale}/overview`);
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, locale, pathname, router, t]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">{t('verifying')}</p>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted/50">
          <Lock className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">{t('accessDenied')}</p>
          <p className="max-w-md text-sm text-muted-foreground">{t('accessDeniedDesc')}</p>
        </div>
        <Link
          href={`/${locale}/overview` as Route}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" strokeWidth={1.8} />
          {t('backToOverview')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
