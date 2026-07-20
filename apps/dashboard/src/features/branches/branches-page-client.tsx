'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Check,
  ChevronDown,
  FolderTree,
  Monitor,
  Clapperboard,
  Image as ImageIcon,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { WorkspaceCreateDialog } from '@/features/workspace/workspace-create-dialog';
import { BranchDetailClient } from '@/features/branches/branch-detail-client';
import { deleteWorkspace } from '@/features/dashboard/dashboard-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { updateWorkspace } from '@/features/workspace/workspace-api';
import { useWorkspaceStats } from '@/features/workspace/use-workspace-stats';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Props = {
  locale: string;
};

function BranchCard({
  ws,
  isActive,
  t,
  tWs,
  onClick,
}: {
  ws: { id: string; name: string; isPaused?: boolean; role?: string };
  isActive: boolean;
  t: ReturnType<typeof useTranslations<'branchesPage'>>;
  tWs: ReturnType<typeof useTranslations<'workspaceSettings'>>;
  onClick: () => void;
}) {
  const stats = useWorkspaceStats(ws.id, 0);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-3 rounded-lg border p-4 text-start transition-all duration-200',
        isActive
          ? 'border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/20 hover:shadow-md',
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground group-hover:text-foreground',
        )}>
          <Building2 className="h-5 w-5" strokeWidth={ICON_STROKE} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'truncate text-sm',
            isActive ? 'font-bold text-foreground' : 'font-medium text-foreground',
          )}>
            {ws.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn(
              'h-1.5 w-1.5 rounded-full',
              ws.isPaused ? 'bg-warning' : 'bg-success',
            )} />
            <span className="text-[10px] text-muted-foreground">
              {ws.isPaused ? tWs('statusPaused') : tWs('statusActive')}
            </span>
            {ws.role && (
              <span className="text-[10px] text-muted-foreground/70">· {ws.role}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{stats.screens}</span>
          {t('statScreens')}
        </span>
        <span className="flex items-center gap-1.5">
          <Clapperboard className="h-3.5 w-3.5 text-success" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{stats.playlists}</span>
          {t('statPlaylists')}
        </span>
        <span className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-warning" strokeWidth={ICON_STROKE} />
          <span className="font-mono font-bold text-foreground">{stats.media}</span>
          {t('statMedia')}
        </span>
      </div>
    </button>
  );
}

export function BranchesPageClient({ locale }: Props) {
  const t = useTranslations('branchesPage');
  const tWs = useTranslations('workspaceSettings');
  const { workspaces, workspaceId, setWorkspaceId, bumpWorkspaceDataEpoch, refreshWorkspaces } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [togglingPause, setTogglingPause] = useState(false);

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

  const canDeleteBranch = workspaces.length > 1;
  const canRenameBranch = Boolean(selectedBranch && (selectedBranch.role === 'OWNER' || selectedBranch.role === 'ADMIN'));
  const canTogglePause = canRenameBranch;

  const handleDeleteBranch = useCallback(async () => {
    if (!selectedBranch || deleting) return;
    if (!canDeleteBranch) {
      toast.error(t('deleteLastBranch'));
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteWorkspace(selectedBranch.id);
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('deleteSuccess'));
      setDeleteOpen(false);
      const remaining = workspaces.filter((w) => w.id !== selectedBranch.id);
      const nextId = remaining[0]?.id ?? null;
      if (nextId) {
        setWorkspaceId(nextId);
      }
      await refreshWorkspaces(nextId);
      bumpWorkspaceDataEpoch();
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }, [selectedBranch, deleting, canDeleteBranch, workspaces, setWorkspaceId, refreshWorkspaces, bumpWorkspaceDataEpoch, t, toastResponseError]);

  const handleTogglePause = useCallback(async () => {
    if (!selectedBranch || togglingPause) return;
    setTogglingPause(true);
    try {
      const res = await updateWorkspace(selectedBranch.id, { isPaused: !selectedBranch.isPaused });
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(selectedBranch.isPaused ? t('resumeSuccess') : t('pauseSuccess'));
      await refreshWorkspaces(selectedBranch.id);
      bumpWorkspaceDataEpoch();
    } catch {
      toast.error(t('togglePauseFailed'));
    } finally {
      setTogglingPause(false);
    }
  }, [selectedBranch, togglingPause, refreshWorkspaces, bumpWorkspaceDataEpoch, t, toastResponseError]);

  const handleRenameBranch = useCallback(async () => {
    if (!selectedBranch || renaming) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error(t('renameEmpty'));
      return;
    }
    setRenaming(true);
    try {
      const res = await updateWorkspace(selectedBranch.id, { name: trimmed });
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('renameSuccess'));
      setRenameOpen(false);
      await refreshWorkspaces(selectedBranch.id);
      bumpWorkspaceDataEpoch();
    } catch {
      toast.error(t('renameFailed'));
    } finally {
      setRenaming(false);
    }
  }, [selectedBranch, renaming, renameValue, refreshWorkspaces, bumpWorkspaceDataEpoch, t, toastResponseError]);

  return (
    <main className="space-y-6 pb-12">
      {/* ── Page header with workspace selector ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
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
                className="min-w-[200px] justify-between rounded-lg gap-2"
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
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
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
            className="rounded-lg gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={ICON_STROKE} />
            {t('createNew')}
          </Button>

          {selectedBranch && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-lg gap-2"
                  aria-label={t('branchActions')}
                >
                  <MoreVertical className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                {canTogglePause && (
                  <DropdownMenuItem
                    className="gap-2 font-semibold"
                    disabled={togglingPause}
                    onSelect={(e) => {
                      e.preventDefault();
                      void handleTogglePause();
                    }}
                  >
                    {selectedBranch.isPaused ? (
                      <Play className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                    ) : (
                      <Pause className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                    )}
                    {selectedBranch.isPaused ? t('resumeBranch') : t('pauseBranch')}
                  </DropdownMenuItem>
                )}
                {canRenameBranch && (
                  <DropdownMenuItem
                    className="gap-2 font-semibold"
                    onSelect={(e) => {
                      e.preventDefault();
                      setRenameValue(selectedBranch.name);
                      setRenameOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                    {t('renameBranch')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="gap-2 font-semibold text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!canDeleteBranch) {
                      toast.error(t('deleteLastBranch'));
                      return;
                    }
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  {t('deleteBranch')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Branch cards grid ── */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspaces.map((ws) => (
            <BranchCard
              key={ws.id}
              ws={ws}
              isActive={ws.id === effectiveId}
              t={t}
              tWs={tWs}
              onClick={() => {
                setWorkspaceId(ws.id);
                bumpWorkspaceDataEpoch();
              }}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {workspaces.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('emptyTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyHint')}</p>
          </div>
          <Button variant="cta" className="rounded-lg gap-2" onClick={() => setCreateOpen(true)}>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm', { name: selectedBranch?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('deleteConfirmNo')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteBranch();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('deleteConfirmYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-base font-bold">{t('renameTitle')}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('renameDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="rename-branch">{t('renameLabel')}</Label>
              <Input
                id="rename-branch"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder={t('renamePlaceholder')}
                className="h-12 rounded-lg text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleRenameBranch();
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenameOpen(false)}
              disabled={renaming}
            >
              {t('renameCancel')}
            </Button>
            <Button
              type="button"
              variant="cta"
              onClick={() => void handleRenameBranch()}
              disabled={renaming}
              className="gap-2"
            >
              {renaming ? '…' : t('renameConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
