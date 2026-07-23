'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Search, ListVideo, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';
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
import { apiFetch } from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { readPageItems } from '@/features/api/page';
import {
  fetchPlaylists as apiFetchPlaylists,
  createPlaylist as apiCreatePlaylist,
} from '@/features/playlists/api/playlists-api';
import { UnifiedPlaylistCard } from '@/features/playlists/components/unified-playlist-card';
import { PlaylistCreateWizard } from '@/features/playlists/playlist-create-wizard';
import { PlaylistPreviewOverlay } from '@/features/playlists/playlist-preview-overlay';
import type { PlaylistSummary } from '@/features/playlists/studio/types';
import type { Row } from '@/features/playlists/playlist-timeline';

type StatusFilter = 'all' | 'published' | 'draft';
type ExpiryFilter = 'all' | 'expiring' | 'expired';

export function PlaylistListClient() {
  const t = useTranslations('playlistStudioClient');
  const tDetail = useTranslations('playlistDetail');
  const locale = useLocale();
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const router = useRouter();

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all');
  const [sortBy, setSortBy] = useState('name');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlaylistSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [previewPlaylist, setPreviewPlaylist] = useState<{ rows: Row[]; name: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canEdit = useMemo(() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws && (ws.role === 'OWNER' || ws.role === 'ADMIN' || ws.role === 'EDITOR');
  }, [workspaces, workspaceId]);

  const loadPlaylists = useCallback(async () => {
    if (!workspaceId) {
      setPlaylists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const res = await apiFetchPlaylists(workspaceId);
      if (res.ok) {
        setPlaylists(await readPageItems<PlaylistSummary>(res));
      } else {
        setPlaylists([]);
        setLoadError(true);
      }
    } catch {
      setPlaylists([]);
      setLoadError(true);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    let result = playlists;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (statusFilter === 'published') {
      result = result.filter((p) => p.isPublished);
    } else if (statusFilter === 'draft') {
      result = result.filter((p) => !p.isPublished);
    }
    if (expiryFilter === 'expiring') {
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      result = result.filter((p) => {
        if (!p.expiresAt) return false;
        const diff = new Date(p.expiresAt).getTime() - now;
        return diff > 0 && diff <= sevenDays;
      });
    } else if (expiryFilter === 'expired') {
      const now = Date.now();
      result = result.filter((p) => p.expiresAt && new Date(p.expiresAt).getTime() < now);
    }
    const sorted = [...result];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'items') {
      sorted.sort((a, b) => b._count.items - a._count.items);
    } else if (sortBy === 'screens') {
      sorted.sort((a, b) => (b._count.screensInGroup ?? 0) - (a._count.screensInGroup ?? 0));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? ''));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => (a.updatedAt ?? a.createdAt ?? '').localeCompare(b.updatedAt ?? b.createdAt ?? ''));
    }
    return sorted;
  }, [playlists, debouncedSearch, statusFilter, expiryFilter, sortBy]);

  const handleCreate = async (data: { name: string }) => {
    if (!workspaceId) return;
    const res = await apiCreatePlaylist(workspaceId, data.name);
    if (!res.ok) {
      toast.error(t('couldNotCreatePlaylist'));
      return;
    }
    const created = (await res.json()) as { id: string };
    toast.success(t('playlistCreated'));
    bumpWorkspaceDataEpoch();
    setWizardOpen(false);
    router.push(`/${locale}/playlists/${created.id}/studio` as Route);
  };

  const handleDuplicate = async (id: string) => {
    if (!workspaceId) return;
    try {
      const res = await apiFetch(`/playlists/${id}/duplicate?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        void toastResponseError(res);
        return;
      }
      toast.success(t('duplicated'));
      bumpWorkspaceDataEpoch();
      void loadPlaylists();
    } catch {
      toast.error(t('duplicateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !workspaceId) return;
    setDeleting(true);
    try {
      const res = await apiFetch(
        `/playlists/${deleteTarget.id}?workspaceId=${encodeURIComponent(workspaceId)}&force=true`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        toast.error(t('couldNotDeletePlaylist'));
        return;
      }
      toast.success(t('playlistDeleted'));
      bumpWorkspaceDataEpoch();
      void loadPlaylists();
    } catch {
      toast.error(t('couldNotDeletePlaylist'));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openPreview = async (playlist: PlaylistSummary) => {
    if (!workspaceId) return;
    setPreviewLoading(true);
    try {
      const res = await apiFetch(`/playlists/${playlist.id}?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        const data = await res.json();
        const rows: Row[] = (data.items ?? []).map((item: { id: string; kind: string; durationSec: number; media?: { id: string; publicUrl: string; mimeType: string; originalName: string } | null; canvas?: { id: string; name: string; width?: number; height?: number } | null }, i: number) => {
          if (item.kind === 'media' && item.media) {
            return {
              clientId: item.id ?? `item-${i}`,
              kind: 'media' as const,
              mediaId: item.media.id,
              durationSec: item.durationSec ?? 5,
              media: item.media,
            };
          }
          if (item.kind === 'canvas' && item.canvas) {
            return {
              clientId: item.id ?? `item-${i}`,
              kind: 'canvas' as const,
              canvasId: item.canvas.id,
              durationSec: item.durationSec ?? 5,
              canvas: item.canvas,
            };
          }
          return null;
        }).filter(Boolean) as Row[];
        if (rows.length === 0) {
          toast.error(t('previewEmpty'));
          setPreviewLoading(false);
          return;
        }
        setPreviewPlaylist({ rows, name: playlist.name });
      } else {
        toast.error(t('loadErrorTitle'));
      }
    } catch {
      toast.error(t('loadErrorTitle'));
    }
    setPreviewLoading(false);
  };

  const openDeleteDialog = async (playlist: PlaylistSummary) => {
    setDeleteTarget(playlist);
    setScheduleCount(0);
    if (!workspaceId) return;
    try {
      const res = await apiFetch(`/schedules?workspaceId=${encodeURIComponent(workspaceId)}&playlistId=${encodeURIComponent(playlist.id)}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items;
        setScheduleCount(Array.isArray(items) ? items.length : 0);
      }
    } catch {
      // ignore — default to 0
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4" role="region" aria-label={t('pageTitle')}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaylists')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg ps-9"
            aria-label={t('searchPlaylists')}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">{t('sortBy')}</Label>
          <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label={t('sortBy')}
          >
            <option value="name">{t('sortName')}</option>
            <option value="newest">{t('sortNewest')}</option>
            <option value="oldest">{t('sortOldest')}</option>
            <option value="items">{t('sortItems')}</option>
            <option value="screens">{t('sortScreens')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">{tDetail('statusFilter')}</Label>
          <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label={tDetail('statusFilter')}
          >
            <option value="all">{tDetail('statusAll')}</option>
            <option value="published">{tDetail('statusPublished')}</option>
            <option value="draft">{tDetail('statusDraft')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">{t('expiryFilter')}</Label>
          <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
            aria-label={t('expiryFilter')}
          >
            <option value="all">{t('expiryAll')}</option>
            <option value="expiring">{t('expiryExpiring')}</option>
            <option value="expired">{t('expiryExpired')}</option>
          </select>
        </div>

        {canEdit && (
          <Button variant="cta" className="ms-auto rounded-lg" onClick={() => setWizardOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {tDetail('createPlaylist')}
          </Button>
        )}
      </div>

      {/* Grid */}
      {loadError ? (
        <ErrorState
          icon={AlertCircle}
          title={t('loadErrorTitle')}
          retryLabel={t('retry')}
          onRetry={() => void loadPlaylists()}
        />
      ) : loading ? (
        <div aria-busy="true" aria-live="polite">
          <CardGridSkeleton count={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title={playlists.length === 0 ? t('emptyTitle') : tDetail('noResults')}
          description={playlists.length === 0 ? t('emptyDescription') : tDetail('noResultsDesc')}
          actionLabel={canEdit && playlists.length === 0 ? tDetail('createPlaylist') : playlists.length > 0 ? tDetail('clearFilters') : undefined}
          onAction={
            canEdit && playlists.length === 0
              ? () => setWizardOpen(true)
              : playlists.length > 0
                ? () => { setSearch(''); setStatusFilter('all'); setExpiryFilter('all'); }
                : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p, i) => (
            <UnifiedPlaylistCard
              key={p.id}
              playlist={p}
              index={i}
              onOpen={(id) => router.push(`/${locale}/playlists/${id}/studio` as Route)}
              onPreview={(id) => {
                const target = filtered.find((pl) => pl.id === id);
                if (target) void openPreview(target);
              }}
              onDuplicate={(id) => void handleDuplicate(id)}
              onDelete={(id) => {
                const target = filtered.find((pl) => pl.id === id);
                if (target) void openDeleteDialog(target);
              }}
              canEdit={!!canEdit}
              canDelete={!!canEdit}
              previewLoading={previewLoading}
            />
          ))}
        </div>
      )}

      {/* Create Playlist Wizard */}
      <PlaylistCreateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDetail('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tDetail('deleteDescription', { name: deleteTarget?.name ?? '' })}
              {scheduleCount > 0 && (
                <span className="mt-2 block font-medium text-warning">
                  {t('scheduleImpactWarning', { count: scheduleCount })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus disabled={deleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('saving') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Playlist Preview */}
      <PlaylistPreviewOverlay
        open={!!previewPlaylist}
        onClose={() => setPreviewPlaylist(null)}
        rows={previewPlaylist?.rows ?? []}
        defaultTransition="fade"
      />
    </div>
  );
}
