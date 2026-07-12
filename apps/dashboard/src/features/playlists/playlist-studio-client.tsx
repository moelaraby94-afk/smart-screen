'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Plus, Save, ListVideo, Eye, EyeOff, Play, Copy, FolderInput } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchCanvases as apiFetchCanvases,
  fetchPlaylists as apiFetchPlaylists,
  fetchPlaylistDetail as apiFetchPlaylistDetail,
  createPlaylist as apiCreatePlaylist,
  updatePlaylistItems as apiUpdatePlaylistItems,
  updatePlaylistMeta as apiUpdatePlaylistMeta,
} from '@/features/studio/studio-api';
import { fetchMedia } from '@/features/media/api/media-api';
import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
import { useWorkspace } from '@/features/workspace/workspace-context';
import type { MediaItem } from '@/features/media/media-library-client';
import {
  MediaLibraryPanel,
  CanvasLibraryPanel,
  type CanvasSummary,
} from '@/features/playlists/playlist-library-panels';
import {
  PlaylistTimeline,
  type Row,
} from '@/features/playlists/playlist-timeline';
import { PlaylistPreviewOverlay } from '@/features/playlists/playlist-preview-overlay';

type PlaylistSummary = {
  id: string;
  name: string;
  isPublished: boolean;
  _count: { items: number };
};

export function PlaylistStudioClient() {
  const t = useTranslations('playlistStudioClient');
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [canvasLibrary, setCanvasLibrary] = useState<CanvasSummary[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneTargetWs, setCloneTargetWs] = useState('');

  const loadLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const items = await fetchMedia(workspaceId);
    setLibrary(items);
  }, [workspaceId]);

  const loadPlaylists = useCallback(async () => {
    if (!workspaceId) return;
    const res = await apiFetchPlaylists(workspaceId);
    if (res.ok) setPlaylists(await readPageItems<PlaylistSummary>(res));
  }, [workspaceId]);

  const loadCanvasLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const res = await apiFetchCanvases(workspaceId);
    if (res.ok) setCanvasLibrary(await readPageItems<CanvasSummary>(res));
  }, [workspaceId]);

  const loadPlaylistDetail = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      const res = await apiFetchPlaylistDetail(workspaceId, id);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: Array<{
          kind?: string;
          durationSec: number;
          media?: MediaItem;
          canvas?: { id: string; name: string };
        }>;
      };
      const mapped: Array<Row | null> = data.items.map((it) => {
        if (it.kind === 'canvas' && it.canvas) {
          return {
            clientId: crypto.randomUUID() as string,
            kind: 'canvas' as const,
            canvasId: it.canvas.id,
            durationSec: it.durationSec,
            canvas: { id: it.canvas.id, name: it.canvas.name },
          };
        }
        if (it.media) {
          return {
            clientId: crypto.randomUUID() as string,
            kind: 'media' as const,
            mediaId: it.media.id,
            durationSec: it.durationSec,
            media: it.media,
          };
        }
        return null;
      });
      setRows(mapped.filter((r): r is Row => r !== null));
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    void (async () => {
      await loadLibrary();
      await loadPlaylists();
      await loadCanvasLibrary();
      setLoading(false);
    })();
  }, [workspaceId, loadLibrary, loadPlaylists, loadCanvasLibrary]);

  useEffect(() => {
    if (playlistId) void loadPlaylistDetail(playlistId);
    else setRows([]);
  }, [playlistId, loadPlaylistDetail]);

  const createPlaylist = async () => {
    if (!workspaceId || !newName.trim()) return;
    const res = await apiCreatePlaylist(workspaceId, newName.trim());
    if (!res.ok) {
      toast.error(t('couldNotCreatePlaylist'));
      return;
    }
    const created = (await res.json()) as { id: string };
    toast.success(t('playlistCreated'));
    setNewName('');
    await loadPlaylists();
    bumpWorkspaceDataEpoch();
    setPlaylistId(created.id);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === 'library' && destination.droppableId === 'playlist') {
      const mediaId = draggableId.replace('lib-', '');
      const media = library.find((m) => m.id === mediaId);
      if (!media) return;
      const next = Array.from(rows);
      next.splice(destination.index, 0, {
        clientId: crypto.randomUUID(),
        kind: 'media',
        mediaId: media.id,
        durationSec: 10,
        media,
      });
      setRows(next);
      return;
    }

    if (source.droppableId === 'canvas-library' && destination.droppableId === 'playlist') {
      const canvasId = draggableId.replace('cvs-', '');
      const canvas = canvasLibrary.find((c) => c.id === canvasId);
      if (!canvas) return;
      const next = Array.from(rows);
      next.splice(destination.index, 0, {
        clientId: crypto.randomUUID(),
        kind: 'canvas',
        canvasId: canvas.id,
        durationSec: 15,
        canvas: { id: canvas.id, name: canvas.name },
      });
      setRows(next);
      return;
    }

    if (source.droppableId === 'playlist' && destination.droppableId === 'playlist') {
      const next = Array.from(rows);
      const [removed] = next.splice(source.index, 1);
      if (!removed) return;
      next.splice(destination.index, 0, removed);
      setRows(next);
    }
  };

  const updateDuration = (clientId: string, value: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.clientId === clientId ? { ...r, durationSec: Math.max(1, value) } : r,
      ),
    );
  };

  const removeRow = (clientId: string) => {
    setRows((prev) => prev.filter((r) => r.clientId !== clientId));
  };

  const moveRow = (index: number, delta: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j]!;
      next[j] = tmp!;
      return next;
    });
  };

  const togglePublish = async () => {
    if (!workspaceId || !playlistId) return;
    const current = playlists.find((p) => p.id === playlistId);
    if (!current) return;
    setTogglingPublish(true);
    try {
      const res = await apiUpdatePlaylistMeta(workspaceId, playlistId, {
        isPublished: !current.isPublished,
      });
      if (!res.ok) {
        toast.error(t('publishFailed'));
        return;
      }
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, isPublished: !p.isPublished } : p,
        ),
      );
      toast.success(current.isPublished ? t('unpublished') : t('published'));
      bumpWorkspaceDataEpoch();
    } finally {
      setTogglingPublish(false);
    }
  };

  const savePlaylist = async () => {
    if (!workspaceId || !playlistId) return;
    setSaving(true);
    try {
      const body = {
        items: rows.map((r, index) =>
          r.kind === 'media'
            ? {
                mediaId: r.mediaId,
                durationSec: r.durationSec,
                orderIndex: index,
              }
            : {
                canvasId: r.canvasId,
                durationSec: r.durationSec,
                orderIndex: index,
              },
        ),
      };
      const res = await apiUpdatePlaylistItems(workspaceId, playlistId, body);
      if (!res.ok) throw new Error('save failed');
      toast.success(t('playlistSaved'));
      bumpWorkspaceDataEpoch();
      await loadPlaylistDetail(playlistId);
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const duplicatePlaylist = async () => {
    if (!workspaceId || !playlistId) return;
    setDuplicating(true);
    try {
      const res = await apiFetch(
        `/playlists/${encodeURIComponent(playlistId)}/duplicate?workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        toast.error(t('duplicateFailed'));
        return;
      }
      toast.success(t('duplicated'));
      await loadPlaylists();
      bumpWorkspaceDataEpoch();
    } finally {
      setDuplicating(false);
    }
  };

  const cloneToWorkspace = async () => {
    if (!workspaceId || !playlistId || !cloneTargetWs) return;
    setCloning(true);
    try {
      const res = await apiFetch(
        `/playlists/${encodeURIComponent(playlistId)}/clone-to-workspace?workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetWorkspaceId: cloneTargetWs }) },
      );
      if (!res.ok) {
        toast.error(t('cloneFailed'));
        return;
      }
      toast.success(t('cloned'));
      setCloneTargetWs('');
      bumpWorkspaceDataEpoch();
    } finally {
      setCloning(false);
    }
  };

  if (!workspaceId) {
    return <p className="text-[15px] text-muted-foreground">{t('selectWorkspaceFirst')}</p>;
  }

  return (
    <div className="space-y-10">
      <motion.div
        className="vc-glass vc-card-surface rounded-3xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-8">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="playlist-select">{t('playlist')}</Label>
            <select
              id="playlist-select"
              className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
            >
              <option value="">{t('selectOption')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {t('playlistItems', { name: p.name, count: p._count.items })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-wrap gap-3">
            <Input
              placeholder={t('newPlaylistPlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-xs rounded-xl"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => void createPlaylist()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('create')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold" variant="cta"
              onClick={() => void savePlaylist()}
              disabled={!playlistId || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? t('saving') : t('savePlaylist')}
            </Button>
            {playlistId && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-semibold"
                disabled={duplicating}
                onClick={() => void duplicatePlaylist()}
              >
                <Copy className="mr-2 h-4 w-4" />
                {duplicating ? t('duplicating') : t('duplicate')}
              </Button>
            )}
            {playlistId && workspaces.length > 1 && (
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                  value={cloneTargetWs}
                  onChange={(e) => setCloneTargetWs(e.target.value)}
                >
                  <option value="">{t('cloneToWorkspace')}</option>
                  {workspaces.filter((w) => w.id !== workspaceId).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-semibold"
                  disabled={!cloneTargetWs || cloning}
                  onClick={() => void cloneToWorkspace()}
                >
                  <FolderInput className="mr-2 h-4 w-4" />
                  {cloning ? t('cloning') : t('clone')}
                </Button>
              </div>
            )}
            {playlistId && rows.length > 0 && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-semibold"
                onClick={() => setPreviewOpen(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                {t('preview')}
              </Button>
            )}
            {playlistId && (() => {
              const selected = playlists.find((p) => p.id === playlistId);
              if (!selected) return null;
              return (
                <Button
                  type="button"
                  variant={selected.isPublished ? 'outline' : 'default'}
                  className="rounded-xl font-semibold"
                  disabled={togglingPublish}
                  onClick={() => void togglePublish()}
                >
                  {selected.isPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {selected.isPublished ? t('unpublish') : t('publish')}
                </Button>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20">
          <p className="text-[15px] text-muted-foreground">{t('loadingStudio')}</p>
        </div>
      ) : playlists.length === 0 && library.length === 0 && canvasLibrary.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-8 xl:grid-cols-2 xl:gap-10">
            <div className="space-y-8">
              <MediaLibraryPanel library={library} />
              <CanvasLibraryPanel canvasLibrary={canvasLibrary} />
            </div>
            <PlaylistTimeline
              rows={rows}
              onUpdateDuration={updateDuration}
              onRemoveRow={removeRow}
              onMoveRow={moveRow}
            />
          </div>
        </DragDropContext>
      )}

      <PlaylistPreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rows={rows}
      />
    </div>
  );
}
