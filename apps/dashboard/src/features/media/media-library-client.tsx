'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Check, Trash2, Upload, Search, X, Info as InfoIcon } from 'lucide-react';
import { toast } from 'sonner';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsageIndicator } from '@/components/usage-indicator';
import { isApiError, readApiError } from '@/features/api/api-error';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import {
  fetchMedia,
  fetchMediaFolders,
  uploadMedia,
  deleteMedia,
  createFolder as apiCreateFolder,
  renameFolder as apiRenameFolder,
  deleteFolder as apiDeleteFolder,
  moveMediaToFolder,
  seedDemoContent,
} from '@/features/media/api/media-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/utils';
import { EmptyMediaIllustration } from '@/features/media/media-preview-components';
import { FolderSection, MediaGrid, type MediaFolder } from '@/features/media/media-grid-sections';

export type MediaItem = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  createdAt: string;
  workspaceId?: string;
  workspaceName?: string;
  folderId?: string | null;
  folderName?: string | null;
};

export function MediaLibraryClient() {
  const locale = useLocale();
  const t = useTranslations('mediaClient');
  const { toastApiError } = useApiErrorToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope = searchParams.get('scope') === 'all' ? 'all' : 'branch';
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; workspaceId: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [infoTarget, setInfoTarget] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSeedAttemptedRef = useRef(false);

  const setScope = useCallback(
    (next: 'branch' | 'all') => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'all') params.set('scope', 'all');
      else params.delete('scope');
      const q = params.toString();
      router.push((q ? `${pathname}?${q}` : pathname) as Route);
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    if (scope === 'all') {
      if (workspaces.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const results = await Promise.all(
        workspaces.map(async (w) => {
          const data = await fetchMedia(w.id);
          return data.map((m) => ({
            ...m,
            workspaceId: w.id,
            workspaceName: w.name,
          }));
        }),
      );
      setItems(results.flat());
      setLoading(false);
      return;
    }
    if (!workspaceId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setItems(await fetchMedia(workspaceId));
    setLoading(false);
  }, [workspaceId, scope, workspaces]);

  const loadFolders = useCallback(async () => {
    if (!workspaceId || scope === 'all') {
      setFolders([]);
      return;
    }
    const rows = await fetchMediaFolders(workspaceId);
    setFolders(rows);
  }, [workspaceId, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (scope !== 'branch') return;
    if (workspaceId) return;
    if (workspaces.length === 0) return;
    setScope('all');
  }, [scope, workspaceId, workspaces.length, setScope]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    if (scope !== 'branch' || !workspaceId || loading || pending || items.length > 0) return;
    if (autoSeedAttemptedRef.current) return;
    autoSeedAttemptedRef.current = true;
    void (async () => {
      const res = await seedDemoContent(workspaceId);
      if (res.ok) {
        bumpWorkspaceDataEpoch();
        await load();
      } else {
        autoSeedAttemptedRef.current = false;
      }
    })();
  }, [scope, workspaceId, loading, pending, items.length, load, bumpWorkspaceDataEpoch]);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (scope === 'all') {
        toast.error(t('uploadRequiresBranch'));
        return;
      }
      if (!workspaceId || files.length === 0) return;
      setPending(true);
      try {
        for (const file of files) {
          const folderId = selectedFolderId !== 'all' ? selectedFolderId : undefined;
          const res = await uploadMedia(workspaceId, file, folderId);
          if (!res.ok) {
            throw await readApiError(res);
          }
        }
        toast.success(t('uploadComplete'));
        await load();
        await loadFolders();
        bumpWorkspaceDataEpoch();
      } catch (e) {
        if (isApiError(e)) {
          toastApiError(e);
        } else {
          toast.error(t('uploadFailed'));
        }
      } finally {
        setPending(false);
      }
    },
    [load, workspaceId, bumpWorkspaceDataEpoch, scope, t, selectedFolderId, loadFolders, toastApiError],
  );

  const onDrop = useCallback(
    async (accepted: File[]) => {
      await uploadFiles(accepted);
    },
    [uploadFiles],
  );

  const dropzoneEnabled = Boolean(workspaceId && scope === 'branch' && !pending);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    disabled: !workspaceId || pending || scope === 'all',
    noClick: !dropzoneEnabled,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxSize: 150 * 1024 * 1024,
  });

  const onPickClick = () => {
    fileInputRef.current?.click();
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (f?.length) void uploadFiles(f);
    e.target.value = '';
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const ws = deleteTarget.workspaceId;
    const res = await deleteMedia(ws, deleteTarget.id);
    setDeleteTarget(null);
    if (!res.ok) {
      toast.error(t('deleteFailed'));
      return;
    }
    toast.success(t('deleted'));
    await load();
    await loadFolders();
    bumpWorkspaceDataEpoch();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === filteredItems.length) return new Set();
      return new Set(filteredItems.map((m) => m.id));
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    let failed = 0;
    for (const m of items) {
      if (!selectedIds.has(m.id)) continue;
      const ws = m.workspaceId ?? workspaceId;
      if (!ws) { failed++; continue; }
      const res = await deleteMedia(ws, m.id);
      if (!res.ok) failed++;
    }
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    if (failed > 0) {
      toast.error(t('bulkDeletePartial', { count: failed }));
    } else {
      toast.success(t('bulkDeleteSuccess'));
    }
    await load();
    await loadFolders();
    bumpWorkspaceDataEpoch();
  };

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!workspaceId || !name || scope === 'all') return;
    const res = await apiCreateFolder(workspaceId, name);
    if (!res.ok) {
      toast.error(t('folderCreateFailed'));
      return;
    }
    setNewFolderName('');
    toast.success(t('folderCreated'));
    await loadFolders();
  };

  const renameFolder = async (folderId: string, current: string) => {
    if (!workspaceId || scope === 'all') return;
    const name = window.prompt(t('folderRenamePrompt'), current)?.trim();
    if (!name || name === current) return;
    const res = await apiRenameFolder(workspaceId, folderId, name);
    if (!res.ok) {
      toast.error(t('folderRenameFailed'));
      return;
    }
    toast.success(t('folderRenamed'));
    await loadFolders();
  };

  const deleteFolder = async (folderId: string) => {
    if (!workspaceId || scope === 'all') return;
    const confirmed = window.confirm(t('folderDeleteConfirm'));
    if (!confirmed) return;
    const res = await apiDeleteFolder(workspaceId, folderId);
    if (!res.ok) {
      toast.error(t('folderDeleteFailed'));
      return;
    }
    if (selectedFolderId === folderId) {
      setSelectedFolderId('all');
    }
    toast.success(t('folderDeleted'));
    await loadFolders();
    await load();
  };

  const moveMedia = async (mediaId: string, folderId: string) => {
    if (!workspaceId || scope === 'all') return;
    const nextFolderId = folderId === 'all' ? null : folderId;
    const res = await moveMediaToFolder(workspaceId, mediaId, nextFolderId);
    if (!res.ok) {
      toast.error(t('moveFolderFailed'));
      return;
    }
    await load();
    await loadFolders();
  };

  const filteredItems = useMemo(
    () => {
      const q = searchQuery.trim().toLowerCase();
      return items.filter((m) => {
        if (selectedFolderId !== 'all' && (m.folderId ?? null) !== selectedFolderId) return false;
        if (typeFilter === 'image' && !m.mimeType.startsWith('image/')) return false;
        if (typeFilter === 'video' && !m.mimeType.startsWith('video/')) return false;
        if (q) {
          return m.originalName.toLowerCase().includes(q);
        }
        return true;
      });
    },
    [items, selectedFolderId, searchQuery, typeFilter],
  );

  if (scope === 'branch' && !workspaceId) {
    return <p className="text-[15px] text-muted-foreground">{t('selectWorkspace')}</p>;
  }

  if (scope === 'all' && workspaces.length === 0) {
    return <p className="text-[15px] text-muted-foreground">{t('selectWorkspace')}</p>;
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-card-surface flex flex-col gap-6 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="min-w-0 flex-1">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {scope === 'all' ? t('descriptionAllBranches') : t('description')}
          </p>
          {workspaces.length > 1 ? (
            <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setScope('branch')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  scope === 'branch'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('scopeBranch')}
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  scope === 'all'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('scopeAll')}
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={onFileInputChange}
          />
          <Button
            type="button"
            variant="cta"
            className="rounded-xl font-semibold"
            onClick={onPickClick}
            disabled={pending || scope === 'all'}
          >
            <Upload className="h-4 w-4 shrink-0" strokeWidth={2} />
            {pending ? t('uploading') : t('uploadFiles')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={open}
            disabled={pending || scope === 'all'}
          >
            {t('browse')}
          </Button>
        </div>
      </motion.div>

      {scope === 'branch' ? (
        <FolderSection
          folders={folders}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          onCreateFolder={() => void createFolder()}
          onRenameFolder={(fid, name) => void renameFolder(fid, name)}
          onDeleteFolder={(fid) => void deleteFolder(fid)}
        />
      ) : null}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {scope === 'branch' && (
            <UsageIndicator storageUsedBytes={items.reduce((sum, m) => sum + m.sizeBytes, 0)} />
          )}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl ps-9"
            />
          </div>
          <select
            className="h-10 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">{t('filterAll')}</option>
            <option value="image">{t('filterImages')}</option>
            <option value="video">{t('filterVideos')}</option>
          </select>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'relative flex min-h-[320px] flex-1 flex-col rounded-3xl border-2 border-dashed transition-colors',
          isDragActive
            ? 'border-primary/50 bg-primary/[0.04]'
            : 'border-border bg-muted/20',
        )}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
            {t('loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
            <EmptyMediaIllustration />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">{t('emptyTitle')}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {t('emptyDescription')}
              </p>
            </div>
            {scope === 'branch' ? (
              <Button
                type="button"
                variant="cta"
                className="rounded-xl font-semibold"
                onClick={onPickClick}
              >
                <Upload className="h-4 w-4 shrink-0" strokeWidth={2} />
                {t('uploadFirst')}
              </Button>
            ) : (
              <p className="max-w-md text-sm text-muted-foreground">{t('emptyAllBranchesHint')}</p>
            )}
          </div>
        ) : (
          <MediaGrid
            items={items}
            filteredItems={filteredItems}
            locale={locale}
            scope={scope}
            workspaceId={workspaceId}
            folders={folders}
            isDragActive={isDragActive}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onClearSelection={clearSelection}
            onDelete={(m) => {
              const wid = m.workspaceId ?? workspaceId;
              if (!wid) return;
              setDeleteTarget({ id: m.id, workspaceId: wid });
            }}
            onMoveMedia={moveMedia}
            onInfo={(m) => setInfoTarget(m)}
          />
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="rounded-xl bg-red-600 hover:bg-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulkDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulkDeleteDescription', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmBulkDelete()}
              disabled={bulkDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-600"
            >
              {bulkDeleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={infoTarget !== null} onOpenChange={() => setInfoTarget(null)}>
        <DialogContent className="rounded-2xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-primary" />
              {t('infoTitle')}
            </DialogTitle>
          </DialogHeader>
          {infoTarget && (
            <div className="space-y-3 py-2">
              {infoTarget.mimeType.startsWith('image/') ? (
                <img src={infoTarget.publicUrl} alt={infoTarget.originalName} className="max-h-48 w-full rounded-xl object-contain bg-black/10" />
              ) : (
                <video src={infoTarget.publicUrl} className="max-h-48 w-full rounded-xl bg-black" controls />
              )}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t('infoName')}</dt>
                  <dd className="truncate font-medium text-end">{infoTarget.originalName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t('infoType')}</dt>
                  <dd className="font-mono text-xs">{infoTarget.mimeType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t('infoSize')}</dt>
                  <dd className="font-mono-nums">{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(infoTarget.sizeBytes / 1024 / 1024)} MB</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t('infoUploaded')}</dt>
                  <dd>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(infoTarget.createdAt))}</dd>
                </div>
                {infoTarget.workspaceName && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('infoWorkspace')}</dt>
                    <dd className="font-medium">{infoTarget.workspaceName}</dd>
                  </div>
                )}
                {infoTarget.folderName && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{t('infoFolder')}</dt>
                    <dd className="font-medium">{infoTarget.folderName}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t('infoUrl')}</dt>
                  <dd className="max-w-[200px] truncate font-mono text-xs text-primary">{infoTarget.publicUrl}</dd>
                </div>
              </dl>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
