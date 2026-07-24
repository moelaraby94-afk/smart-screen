'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { appDropdownContentClass, appDropdownTriggerClass } from '@/components/ui/app-dropdown-styles';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { useWorkspace, type WorkspaceSummary } from '@/features/workspace/workspace-context';

type Props = {
  /** Currently selected workspaceId, or null for account-level (all branches). */
  value: string | null;
  /** Called when the user selects a branch or "all branches". */
  onChange: (workspaceId: string | null) => void;
  /** Optional label override for the "all branches" option. */
  allLabel?: string;
  /** Whether to show the compact variant. */
  compact?: boolean;
};

export function BranchFilterDropdown({ value, onChange, allLabel, compact = false }: Props) {
  const t = useTranslations('common');
  const { workspaces } = useWorkspace();

  const sortedWorkspaces = useMemo(
    () => [...workspaces].sort((a, b) => a.name.localeCompare(b.name)),
    [workspaces],
  );

  const selectedWorkspace = workspaces.find((w) => w.id === value);
  const currentLabel = value === null
    ? (allLabel ?? t('allBranches'))
    : (selectedWorkspace?.name ?? t('allBranches'));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(appDropdownTriggerClass, compact ? 'h-9 w-9 justify-center !px-0' : 'h-9 justify-between gap-2 min-w-[160px]')}
          aria-label={t('filterByBranch')}
          aria-expanded="false"
          aria-haspopup="menu"
        >
          <span className={cn('flex min-w-0 flex-1 items-center gap-2', compact && 'flex-none')}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} aria-hidden />
            </span>
            {!compact && (
              <span className="min-w-0 flex-1 truncate text-start text-sm font-medium text-foreground">
                {currentLabel}
              </span>
            )}
          </span>
          {!compact && (
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className={cn(appDropdownContentClass, 'z-dropdown border-border bg-card')}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('filterByBranch')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
            value === null && 'bg-primary/10 text-foreground',
          )}
          onSelect={(event) => {
            event.preventDefault();
            onChange(null);
          }}
        >
          <span className="min-w-0 flex-1 truncate text-start font-medium">{allLabel ?? t('allBranches')}</span>
          {value === null && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} aria-hidden />}
        </DropdownMenuItem>
        {sortedWorkspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
              value === workspace.id && 'bg-primary/10 text-foreground',
            )}
            onSelect={(event) => {
              event.preventDefault();
              onChange(workspace.id);
            }}
          >
            <span className="min-w-0 flex-1 truncate text-start font-medium">{workspace.name}</span>
            {value === workspace.id && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { WorkspaceSummary };
