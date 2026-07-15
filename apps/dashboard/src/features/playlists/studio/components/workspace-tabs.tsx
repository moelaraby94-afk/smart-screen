'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';

type WorkspaceTabsProps = {
  workspaces: WorkspaceSummary[];
  filterWorkspaceId: string;
  setFilterWorkspaceId: (id: string) => void;
};

export function WorkspaceTabs({ workspaces, filterWorkspaceId, setFilterWorkspaceId }: WorkspaceTabsProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => setFilterWorkspaceId('')}
        className={cn(
          'rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all',
          !filterWorkspaceId
            ? 'bg-primary text-white shadow-sm'
            : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
        )}
      >
        {t('allWorkspaces')}
      </button>
      {workspaces.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => setFilterWorkspaceId(w.id)}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all',
            filterWorkspaceId === w.id
              ? 'bg-primary text-white shadow-sm'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
          )}
        >
          {w.name}
        </button>
      ))}
    </div>
  );
}
