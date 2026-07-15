'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Check,
  ChevronDown,
  FolderTree,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { WorkspaceCreateDialog } from '@/features/workspace/workspace-create-dialog';
import { BranchDetailClient } from '@/features/branches/branch-detail-client';

type Props = {
  locale: string;
};

export function BranchesPageClient({ locale }: Props) {
  const t = useTranslations('branchesPage');
  const tWs = useTranslations('workspaceSettings');
  const { workspaces, workspaceId, setWorkspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveId = workspaceId ?? workspaces[0]?.id ?? null;
  const selectedBranch = useMemo(
    () => workspaces.find((w) => w.id === effectiveId) ?? null,
    [workspaces, effectiveId],
  );

  useEffect(() => {
    if (effectiveId && effectiveId !== workspaceId) {
      setWorkspaceId(effectiveId);
      bumpWorkspaceDataEpoch();
    }
  }, [effectiveId, workspaceId, setWorkspaceId, bumpWorkspaceDataEpoch]);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase();
    return workspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [workspaces, searchQuery]);

  return (
    <main className="space-y-6 pb-12">
      {/* ── Page header with workspace selector ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Building2 className="h-6 w-6 text-primary" strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              {t('title')}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace selector dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[200px] justify-between rounded-xl gap-2"
              >
                <span className="flex items-center gap-2 truncate">
                  <FolderTree className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
                  <span className="truncate">
                    {selectedBranch ? selectedBranch.name : t('selectPlaceholder')}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={ICON_STROKE} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[280px] p-2">
              {/* Search inside dropdown */}
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={ICON_STROKE} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="h-9 rounded-lg ps-8 text-sm"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredWorkspaces.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    {t('noResults')}
                  </p>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <DropdownMenuItem
                      key={ws.id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm',
                        ws.id === effectiveId
                          ? 'bg-primary/10 font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                      onSelect={(e) => {
                        e.preventDefault();
                        setWorkspaceId(ws.id);
                        bumpWorkspaceDataEpoch();
                      }}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
                        <span className="truncate">{ws.name}</span>
                        {ws.isPaused && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        )}
                      </span>
                      {ws.id === effectiveId && (
                        <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary"
                onSelect={(e) => {
                  e.preventDefault();
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" strokeWidth={ICON_STROKE} />
                {t('createNew')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="cta"
            className="rounded-xl gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={ICON_STROKE} />
            {t('createNew')}
          </Button>
        </div>
      </div>

      {/* ── Workspace cards strip (quick switch) ── */}
      {workspaces.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                setWorkspaceId(ws.id);
                bumpWorkspaceDataEpoch();
              }}
              className={cn(
                'group flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all duration-200',
                ws.id === effectiveId
                  ? 'border-primary/40 bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/20 hover:shadow-sm',
              )}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                ws.id === effectiveId
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground',
              )}>
                <Building2 className="h-5 w-5" strokeWidth={ICON_STROKE} />
              </div>
              <div className="text-start">
                <p className={cn(
                  'max-w-[140px] truncate text-sm',
                  ws.id === effectiveId ? 'font-bold text-foreground' : 'font-medium text-foreground',
                )}>
                  {ws.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    ws.isPaused ? 'bg-amber-500' : 'bg-emerald-500',
                  )} />
                  <span className="text-[10px] text-muted-foreground">
                    {ws.isPaused ? tWs('statusPaused') : tWs('statusActive')}
                  </span>
                  {ws.role && (
                    <span className="text-[10px] text-muted-foreground/70">· {ws.role}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {workspaces.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('emptyTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyHint')}</p>
          </div>
          <Button variant="cta" className="rounded-xl gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={ICON_STROKE} />
            {t('createNew')}
          </Button>
        </div>
      )}

      {/* ── Detail content for selected workspace ── */}
      <AnimatePresence mode="wait">
        {effectiveId && (
          <motion.div
            key={effectiveId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <BranchDetailClient locale={locale} workspaceIdOverride={effectiveId} />
          </motion.div>
        )}
      </AnimatePresence>

      <WorkspaceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          if (workspaces.length > 0) {
            const latest = workspaces[workspaces.length - 1];
            setWorkspaceId(latest.id);
            bumpWorkspaceDataEpoch();
          }
        }}
      />
    </main>
  );
}
