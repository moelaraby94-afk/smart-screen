'use client';

import React, { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { BriefcaseBusiness, Check, ChevronDown, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { appDropdownContentClass, appDropdownTriggerClass } from '@/components/ui/app-dropdown-styles';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/features/workspace/workspace-context';
import type { Route } from 'next';
import { WorkspaceCreateDialog } from '@/features/workspace/workspace-create-dialog';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const rtl = locale === 'ar';
  const tWs = useTranslations('workspaceSwitcher');
  const { workspaceId, workspaces, setWorkspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const showSearch = workspaces.length > 5;

  React.useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, showSearch]);

  const filteredWorkspaces = useMemo(() => {
    if (!showSearch || !debouncedSearch.trim()) return workspaces;
    const q = debouncedSearch.toLowerCase();
    return workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [workspaces, showSearch, debouncedSearch]);

  const pathParts = pathname?.split('/').filter(Boolean) ?? [];
  const isOverviewHome =
    pathParts.length === 1 ||
    (pathParts.length === 2 && pathParts[1] === 'overview');

  const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);
  const currentLabel =
    workspaces.length === 0
      ? tWs('noWorkspacesOption')
      : isOverviewHome
        ? tWs('chooseWorkArea')
        : selectedWorkspace?.name ?? workspaces[0]?.name ?? '';

  return (
    <>
      <div className="flex max-w-[min(100%,min(420px,calc(100vw-8rem)))] items-center gap-1.5">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild disabled={workspaces.length === 0}>
            <button
              type="button"
              className={cn(appDropdownTriggerClass, 'flex-1 justify-between gap-2')}
              aria-label={tWs('activeWorkspaceSr')}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <BriefcaseBusiness className="h-4 w-4 text-white" strokeWidth={ICON_STROKE} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-start leading-snug">
                  <span
                    className={cn(
                      'line-clamp-3 break-words text-[13px] font-semibold sm:text-[14px]',
                      isOverviewHome && workspaces.length > 0
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                    )}
                  >
                    {currentLabel}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  menuOpen && 'rotate-180',
                )}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={rtl ? 'end' : 'start'}
            sideOffset={8}
            className={cn(
              appDropdownContentClass,
              'z-dropdown border-border bg-card',
            )}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {tWs('menuLabel')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            {showSearch && (
              <div className="px-2 pb-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute inset-y-0 my-auto h-3.5 w-3.5 text-muted-foreground" strokeWidth={ICON_STROKE} aria-hidden />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={tWs('searchPlaceholder')}
                    className="w-full rounded-lg border border-border bg-background py-1.5 ps-7 pe-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={tWs('searchPlaceholder')}
                  />
                </div>
              </div>
            )}
            <DropdownMenuGroup>
              {filteredWorkspaces.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">{tWs('searchEmpty')}</p>
              ) : filteredWorkspaces.map((workspace) => {
                const active =
                  !isOverviewHome && workspace.id === workspaceId;
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-[15px]',
                      active && 'bg-primary/10 text-foreground',
                    )}
                    onSelect={(event) => {
                      event.preventDefault();
                      setWorkspaceId(workspace.id);
                      bumpWorkspaceDataEpoch();
                      const onBranchesPage = pathname?.includes(`/${locale}/branches`);
                      if (!onBranchesPage) {
                        router.push(`/${locale}/branches` as Route);
                        router.refresh();
                      }
                      setMenuOpen(false);
                    }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                      <span className="truncate font-semibold">{workspace.name}</span>
                    </span>
                    {active ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} aria-hidden />
                    ) : (
                      <span className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={tWs('newWorkspaceTitle')}
          className="h-9 w-9 shrink-0 rounded-lg border border-border bg-card text-foreground hover:bg-muted"
          onClick={() => setCreateOpen(true)}
          aria-label={tWs('createWorkspaceAria')}
        >
          <Plus className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </Button>
      </div>

      <WorkspaceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
