'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, Search, Info as InfoIcon, ListPlus, AlertCircle, RotateCcw, X, Loader2 } from 'lucide-react';
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
import { apiFetch } from '@/features/auth/session';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import {
  fetchMedia,
  fetchMediaPage,
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
import { fetchCurrentSubscription } from '@/features/billing/billing-api';
import { formatBytesLocale } from '@/features/dashboard/home-dashboard-types';
import { cn } from '@/lib/utils';
import { EmptyMediaIllustration } from '@/features/media/media-preview-components';
import { FolderSection, MediaGrid, type MediaFolder } from '@/features/media/media-grid-sections';
import { fetchPlaylists as apiFetchPlaylists, fetchPlaylistDetail as apiFetchPlaylistDetail, updatePlaylistItems as apiUpdatePlaylistItems } from '@/features/studio/studio-api';
import { readPageItems } from '@/features/api/page';

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
  expiresAt?: string | null;
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
  const [addToPlaylistTarget, setAddToPlaylistTarget] = useState<MediaItem | null>(null);
  const [playlistOptions, setPlaylistOptions] = useState<{ id: string; name: string; _count: { items: number } }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [savingExpiry, setSavingExpiry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [uploads, setUploads] = useState<Array<{ id: string; name: string; progress: number; status: 'uploading' | 'complete' | 'error'; file?: File }>>([]);
  const [deletePlaylistCount, setDeletePlaylistCount] = useState(0);
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
    setLoadError(false);
    setMediaPage(1);
    if (scope === 'all') {
      if (workspaces.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
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
      } catch {
        setLoadError(true);
        setItems([]);
      }
      setLoading(false);
      return;
    }
    if (!workspaceId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchMediaPage(workspaceId, 1);
      setItems(data.items);
      setMediaTotalPages(data.totalPages);
      setMediaTotal(data.total);
    } catch {
      setLoadError(true);
      setItems([]);
    }
    setLoading(false);
  }, [workspaceId, scope, workspaces]);

  const loadMore = useCallback(async () => {
    if (!workspaceId || scope === 'all') return;
    const nextPage = mediaPage + 1;
    if (nextPage > mediaTotalPages) return;
    setLoadingMore(true);
    try {
      const data = await fetchMediaPage(workspaceId, nextPage);
      setItems((prev) => [...prev, ...data.items]);
      setMediaPage(nextPage);
      setMediaTotalPages(data.totalPages);
      setMediaTotal(data.total);
    } finally {
      setLoadingMore(false);
    }
  }, [workspaceId, scope, mediaPage, mediaTotalPages]);

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
      const folderId = selectedFolderId !== 'all' ? selectedFolderId : undefined;

      // Pre-upload storage check (UJ-02)
      const totalUploadBytes = files.reduce((sum, f) => sum + f.size, 0);
      const currentUsed = items.reduce((sum, m) => sum + m.sizeBytes, 0);
      try {
        const subRes = await fetchCurrentSubscription(workspaceId);
        if (subRes.ok) {
          const sub = (await subRes.json()) as { storageLimitBytes: number | null };
          if (sub.storageLimitBytes != null && sub.storageLimitBytes > 0) {
            const projected = currentUsed + totalUploadBytes;
            const pct = Math.round((100 * currentUsed) / sub.storageLimitBytes);
            if (projected > sub.storageLimitBytes) {
              toast.error(t('storageWouldExceed', { size: formatBytesLocale(totalUploadBytes, locale) }));
              return;
            }
            if (pct >= 90) {
              toast.warning(t('storageNearLimit', { pct }));
            }
          }
        }
      } catch {
        // If subscription fetch fails, proceed with upload — server will enforce
      }

      const uploadItems = files.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        name: file.name,
        progress: 0,
        status: 'uploading' as const,
        file,
      }));
      setUploads((prev) => [...prev, ...uploadItems]);
      setPending(true);

      const MAX_CONCURRENT = 3;
      let activeCount = 0;
      let queueIndex = 0;
      let hasError = false;

      await new Promise<void>((resolve) => {
        const processNext = () => {
          while (activeCount < MAX_CONCURRENT && queueIndex < uploadItems.length) {
            const item = uploadItems[queueIndex++];
            activeCount++;
            void (async () => {
              try {
                const res = await uploadMedia(workspaceId, item.file!, folderId);
                if (!res.ok) {
                  throw await readApiError(res);
                }
                setUploads((prev) => prev.map((u) => u.id === item.id ? { ...u, progress: 100, status: 'complete' } : u));
                setTimeout(() => {
                  setUploads((prev) => prev.filter((u) => u.id !== item.id));
                }, 3000);
              } catch (e) {
                hasError = true;
                setUploads((prev) => prev.map((u) => u.id === item.id ? { ...u, status: 'error' } : u));
                if (isApiError(e)) {
                  toastApiError(e);
                } else {
                  toast.error(t('uploadFailed'));
                }
              } finally {
                activeCount--;
                if (queueIndex < uploadItems.length) {
                  processNext();
                } else if (activeCount === 0) {
                  resolve();
                }
              }
            })();
          }
        };
        processNext();
      });

      if (!hasError) {
        toast.success(t('uploadComplete'));
      }
      await load();
      await loadFolders();
      bumpWorkspaceDataEpoch();
      setPending(false);
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

  const openDeleteDialog = async (item: MediaItem) => {
    const wid = item.workspaceId ?? workspaceId;
    if (!wid) return;
    setDeleteTarget({ id: item.id, workspaceId: wid });
    setDeletePlaylistCount(0);
    try {
      const res = await apiFetch(`/playlists?workspaceId=${encodeURIComponent(wid)}`);
      if (res.ok) {
        const allPlaylists = await readPageItems<{ id: string; items?: Array<{ media?: { id: string } }> }>(res);
        const count = allPlaylists.filter((pl) => pl.items?.some((it) => it.media?.id === item.id)).length;
        setDeletePlaylistCount(count);
      }
    } catch {
      // ignore — default to 0
    }
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
      const filtered = items.filter((m) => {
        if (selectedFolderId !== 'all' && (m.folderId ?? null) !== selectedFolderId) return false;
        if (typeFilter === 'image' && !m.mimeType.startsWith('image/')) return false;
        if (typeFilter === 'video' && !m.mimeType.startsWith('video/')) return false;
        if (expiryFilter === 'active' && m.expiresAt && new Date(m.expiresAt) < new Date()) return false;
        if (expiryFilter === 'expired' && (!m.expiresAt || new Date(m.expiresAt) >= new Date())) return false;
        if (q) {
          return m.originalName.toLowerCase().includes(q);
        }
        return true;
      });
      const sorted = [...filtered];
      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.originalName.localeCompare(b.originalName);
          case 'oldest':
            return a.createdAt.localeCompare(b.createdAt);
          case 'largest':
            return b.sizeBytes - a.sizeBytes;
          case 'newest':
          default:
            return b.createdAt.localeCompare(a.createdAt);
        }
      });
      return sorted;
    },
    [items, selectedFolderId, searchQuery, typeFilter, expiryFilter, sortBy],
  );

  const openAddToPlaylist = async (item: MediaItem) => {
    setAddToPlaylistTarget(item);
    setSelectedPlaylistId('');
    const ws = item.workspaceId ?? workspaceId;
    if (!ws) return;
    const res = await apiFetchPlaylists(ws);
    if (res.ok) setPlaylistOptions(await readPageItems(res));
  };

  const confirmAddToPlaylist = async () => {
    if (!addToPlaylistTarget || !selectedPlaylistId) return;
    const ws = addToPlaylistTarget.workspaceId ?? workspaceId;
    if (!ws) return;
    setAddingToPlaylist(true);
    try {
      const detailRes = await apiFetchPlaylistDetail(ws, selectedPlaylistId);
      if (!detailRes.ok) {
        toast.error(t('addToPlaylistFailed'));
        return;
      }
      const data = (await detailRes.json()) as {
        items: Array<{ kind?: string; durationSec: number; media?: { id: string }; canvas?: { id: string } }>;
      };
      const existingItems = data.items.map((it) => {
        if (it.kind === 'canvas' && it.canvas) {
          return { canvasId: it.canvas.id, durationSec: it.durationSec };
        }
        return { mediaId: it.media?.id ?? '', durationSec: it.durationSec };
      }).filter((it) => 'mediaId' in it ? it.mediaId : it.canvasId);
      const newItems = [...existingItems, { mediaId: addToPlaylistTarget.id, durationSec: 10 }];
      const saveRes = await apiUpdatePlaylistItems(ws, selectedPlaylistId, { items: newItems });
      if (!saveRes.ok) {
        toast.error(t('addToPlaylistFailed'));
        return;
      }
      toast.success(t('addedToPlaylist'));
      setAddToPlaylistTarget(null);
      bumpWorkspaceDataEpoch();
    } finally {
      setAddingToPlaylist(false);
    }
  };

  const handleSaveExpiry = async () => {
    if (!infoTarget) return;
    const ws = infoTarget.workspaceId ?? workspaceId;
    if (!ws) return;
    setSavingExpiry(true);
    try {
      const res = await apiFetch(`/media/${infoTarget.id}/expiry?workspaceId=${encodeURIComponent(ws)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt: expiryDate || null }),
      });
      if (!res.ok) {
        toast.error(t('expirySaveFailed'));
        return;
      }
      toast.success(t('expirySaved'));
      setInfoTarget(null);
      await load();
    } catch {
      toast.error(t('expirySaveFailed'));
    } finally {
      setSavingExpiry(false);
    }
  };

  useEffect(() => {
    if (infoTarget?.expiresAt) {
      setExpiryDate(infoTarget.expiresAt.split('T')[0]);
    } else {
      setExpiryDate('');
    }
  }, [infoTarget]);

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
        className="flex flex-col gap-4 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
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
            aria-label={t('filterByType')}
          >
            <option value="all">{t('filterAll')}</option>
            <option value="image">{t('filterImages')}</option>
            <option value="video">{t('filterVideos')}</option>
          </select>
          <select
            className="h-10 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            aria-label={t('filterByExpiry')}
          >
            <option value="all">{t('expiryFilterAll')}</option>
            <option value="active">{t('expiryFilterActive')}</option>
            <option value="expired">{t('expiryFilterExpired')}</option>
          </select>
          <select
            className="h-10 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label={t('sortBy')}
          >
            <option value="newest">{t('sortNewest')}</option>
            <option value="oldest">{t('sortOldest')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="largest">{t('sortLargest')}</option>
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
          <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground" aria-busy="true" aria-live="polite">
            {t('loading')}
          </div>
        ) : loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/50" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">{t('loadErrorTitle')}</p>
            <Button variant="outline" onClick={() => void load()}>
              <RotateCcw className="me-2 h-4 w-4" />
              {t('retry')}
            </Button>
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
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">{t('noResultsTitle')}</p>
            <p className="max-w-md text-sm text-muted-foreground">{t('noResultsDesc')}</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setTypeFilter('all'); setExpiryFilter('all'); setSelectedFolderId('all'); }}>
              {t('clearFilters')}
            </Button>
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
            onDelete={(m) => void openDeleteDialog(m)}
            onMoveMedia={moveMedia}
            onInfo={(m) => setInfoTarget(m)}
            onAddToPlaylist={(m: MediaItem) => void openAddToPlaylist(m)}
          />
        )}
        {scope === 'branch' && mediaPage < mediaTotalPages && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? t('loading') : t('loadMore')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('showingCount', { shown: items.length, total: mediaTotal })}
            </span>
          </div>
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
              {deletePlaylistCount > 0 && (
                <span className="mt-2 block font-medium text-warning">
                  {t('playlistUsageWarning', { count: deletePlaylistCount })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus className="rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="rounded-xl bg-destructive hover:bg-destructive"
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
              className="rounded-xl bg-destructive hover:bg-destructive"
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
              <div className="space-y-2 border-t border-border pt-3">
                <label className="text-sm font-medium text-foreground">{t('expiryLabel')}</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="cta"
                    size="sm"
                    className="rounded-xl shrink-0"
                    disabled={savingExpiry}
                    onClick={() => void handleSaveExpiry()}
                  >
                    {t('expirySave')}
                  </Button>
                </div>
                {infoTarget.expiresAt && (
                  <p className="text-xs text-warning">
                    {t('expiryCurrent', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(infoTarget.expiresAt)) })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('expiryHint')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addToPlaylistTarget !== null} onOpenChange={() => setAddToPlaylistTarget(null)}>
        <DialogContent className="rounded-2xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-primary" />
              {t('addToPlaylist')}
            </DialogTitle>
          </DialogHeader>
          {addToPlaylistTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {t('addToPlaylistDescription', { name: addToPlaylistTarget.originalName })}
              </p>
              <select
                className="h-11 w-full rounded-xl border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                aria-label={t('selectPlaylist')}
              >
                <option value="">{t('selectPlaylist')}</option>
                {playlistOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p._count.items})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="cta"
                className="w-full rounded-xl font-semibold"
                disabled={!selectedPlaylistId || addingToPlaylist}
                onClick={() => void confirmAddToPlaylist()}
              >
                {addingToPlaylist ? t('adding') : t('addToPlaylistButton')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {uploads.length > 0 && (
        <div className="fixed bottom-4 end-4 z-toast w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg" role="status" aria-live="polite">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t('uploadProgress')}</p>
            <button
              type="button"
              onClick={() => setUploads((prev) => prev.filter((u) => u.status === 'uploading'))}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t('dismissCompleted')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {(() => {
              const total = uploads.length;
              const completed = uploads.filter((u) => u.status === 'complete' || u.status === 'error').length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('uploadTotalProgress', { completed, total })}
                    </span>
                    <span className="font-mono-nums text-xs font-semibold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('uploadTotalProgress', { completed, total })}>
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
            {uploads.map((u) => (
              <div key={u.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-foreground">{u.name}</span>
                  {u.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  {u.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (u.file) void uploadFiles([u.file]);
                        setUploads((prev) => prev.filter((x) => x.id !== u.id));
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t('retry')}
                    </button>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={u.status === 'complete' ? 100 : u.status === 'error' ? 100 : 50} aria-valuemin={0} aria-valuemax={100} aria-label={u.name}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      u.status === 'error' ? 'bg-destructive' : u.status === 'complete' ? 'bg-primary' : 'bg-primary',
                    )}
                    style={{ width: `${u.status === 'complete' ? 100 : u.status === 'error' ? 100 : 50}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
