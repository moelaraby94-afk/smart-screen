'use client';

import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { WorkspaceWelcome } from '@/features/workspace/workspace-welcome';

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations('workspaceGate');
  const pathname = usePathname();
  const { isLoading, workspaces, isAuthenticated } = useWorkspace();

  const isAuthPage =
    pathname?.includes('/login') || pathname?.includes('/register');

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (isAuthenticated && workspaces.length === 0) {
    return <WorkspaceWelcome />;
  }

  return <>{children}</>;
}
