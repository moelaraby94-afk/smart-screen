'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Plus, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchCanvases as apiFetchCanvases,
  fetchPlaylists as apiFetchPlaylists,
  fetchPlaylistDetail as apiFetchPlaylistDetail,
  createPlaylist as apiCreatePlaylist,
  updatePlaylistItems as apiUpdatePlaylistItems,
} from '@/features/studio/studio-api';
import { fetchMedia } from '@/features/media/api/media-api';
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

type PlaylistSummary = {
  id: string;
  name: string;
  _count: { items: number };
};

export function PlaylistStudioClient() {
  const t = useTranslations('playlistStudioClient');
  const { workspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [canvasLibrary, setCanvasLibrary] = useState<CanvasSummary[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20">
          <p className="text-[15px] text-muted-foreground">{t('loadingStudio')}</p>
        </div>
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
    </div>
  );
}
