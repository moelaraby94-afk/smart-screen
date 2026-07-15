'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Plus, Save, ListVideo, Eye, EyeOff, Play, Copy, FolderInput, Undo2, Redo2, Search, FolderPlus, Trash2, Pencil } from 'lucide-react';
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
  fetchPlaylistGroups as apiFetchPlaylistGroups,
  createPlaylistGroup as apiCreatePlaylistGroup,
  renamePlaylistGroup as apiRenamePlaylistGroup,
  deletePlaylistGroup as apiDeletePlaylistGroup,
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
  workspaceId?: string | null;
  groupId?: string | null;
  _count: { items: number; screensInGroup?: number };
};

type PlaylistGroup = {
  id: string;
  name: string;
  _count: { playlists: number };
};

export function PlaylistStudioClient() {
  const t = useTranslations('playlistStudioClient');
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const currentWs = workspaces.find((w) => w.id === workspaceId);
  const canPublish = Boolean(
    currentWs && (currentWs.role === 'OWNER' || currentWs.role === 'ADMIN'),
  );
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
  const [mediaSearch, setMediaSearch] = useState('');
  const [playlistSort, setPlaylistSort] = useState<string>('name');
  const [undoStack, setUndoStack] = useState<Row[][]>([]);
  const [redoStack, setRedoStack] = useState<Row[][]>([]);
  const skipHistoryRef = useRef(false);

  // Account-level state
  const [groups, setGroups] = useState<PlaylistGroup[]>([]);
  const [filterWorkspaceId, setFilterWorkspaceId] = useState<string>('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameGroupValue, setRenameGroupValue] = useState('');

  const sortedPlaylists = useMemo(
    () => {
      const sorted = [...playlists];
      sorted.sort((a, b) => {
        switch (playlistSort) {
          case 'items':
            return b._count.items - a._count.items;
          case 'screens':
            return (b._count.screensInGroup ?? 0) - (a._count.screensInGroup ?? 0);
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
      return sorted;
    },
    [playlists, playlistSort],
  );

  const loadLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const items = await fetchMedia(workspaceId);
    setLibrary(items);
  }, [workspaceId]);

  const loadPlaylists = useCallback(async () => {
    const wsId = filterWorkspaceId || undefined;
    const grpId = filterGroupId || undefined;
    const res = await apiFetchPlaylists(wsId, grpId);
    if (res.ok) setPlaylists(await readPageItems<PlaylistSummary>(res));
  }, [filterWorkspaceId, filterGroupId]);

  const loadGroups = useCallback(async () => {
    const res = await apiFetchPlaylistGroups();
    if (res.ok) setGroups(await res.json());
  }, []);

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
      skipHistoryRef.current = true;
      setUndoStack([]);
      setRedoStack([]);
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
      await loadGroups();
      setLoading(false);
    })();
  }, [workspaceId, loadLibrary, loadPlaylists, loadCanvasLibrary, loadGroups]);

  useEffect(() => {
    if (playlistId) void loadPlaylistDetail(playlistId);
    else setRows([]);
  }, [playlistId, loadPlaylistDetail]);

  const createPlaylist = async () => {
    if (!newName.trim()) return;
    const wsId = filterWorkspaceId || workspaceId || null;
    const grpId = filterGroupId || null;
    const res = await apiCreatePlaylist(wsId, newName.trim(), grpId);
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const res = await apiCreatePlaylistGroup(newGroupName.trim());
    if (!res.ok) {
      toast.error(t('couldNotCreateGroup'));
      return;
    }
    toast.success(t('groupCreated'));
    setNewGroupName('');
    await loadGroups();
  };

  const handleRenameGroup = async (groupId: string) => {
    if (!renameGroupValue.trim()) return;
    const res = await apiRenamePlaylistGroup(groupId, renameGroupValue.trim());
    if (!res.ok) {
      toast.error(t('couldNotRenameGroup'));
      return;
    }
    toast.success(t('groupRenamed'));
    setRenamingGroupId(null);
    setRenameGroupValue('');
    await loadGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    const res = await apiDeletePlaylistGroup(groupId);
    if (!res.ok) {
      toast.error(t('couldNotDeleteGroup'));
      return;
    }
    toast.success(t('groupDeleted'));
    if (filterGroupId === groupId) setFilterGroupId('');
    await loadGroups();
    await loadPlaylists();
  };

  const pushHistory = useCallback((prev: Row[]) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    setUndoStack((s) => [...s.slice(-49), prev]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const prev = prevStack[prevStack.length - 1];
      setRows((current) => {
        setRedoStack((r) => [...r, current]);
        return prev;
      });
      return prevStack.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const next = prevStack[prevStack.length - 1];
      setRows((current) => {
        setUndoStack((u) => [...u, current]);
        return next;
      });
      return prevStack.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

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
      pushHistory(rows);
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
      pushHistory(rows);
      setRows(next);
      return;
    }

    if (source.droppableId === 'playlist' && destination.droppableId === 'playlist') {
      const next = Array.from(rows);
      const [removed] = next.splice(source.index, 1);
      if (!removed) return;
      next.splice(destination.index, 0, removed);
      pushHistory(rows);
      setRows(next);
    }
  };

  const updateDuration = (clientId: string, value: number) => {
    setRows((prev) => {
      pushHistory(prev);
      return prev.map((r) =>
        r.clientId === clientId ? { ...r, durationSec: Math.max(1, value) } : r,
      );
    });
  };

  const removeRow = (clientId: string) => {
    setRows((prev) => {
      pushHistory(prev);
      return prev.filter((r) => r.clientId !== clientId);
    });
  };

  const moveRow = (index: number, delta: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j]!;
      next[j] = tmp!;
      pushHistory(prev);
      return next;
    });
  };

  const duplicateRow = (clientId: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.clientId === clientId);
      if (idx === -1) return prev;
      const orig = prev[idx]!;
      const clone: Row = {
        ...orig,
        clientId: crypto.randomUUID(),
      };
      pushHistory(prev);
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
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
      {/* Workspace & Group Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('filterByWorkspace')}</Label>
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={filterWorkspaceId}
            onChange={(e) => setFilterWorkspaceId(e.target.value)}
          >
            <option value="">{t('allWorkspaces')}</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('filterByGroup')}</Label>
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
          >
            <option value="">{t('allGroups')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g._count.playlists})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Group Management */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
        <Input
          placeholder={t('newGroupPlaceholder')}
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="max-w-xs rounded-xl"
          onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateGroup(); }}
        />
        <Button variant="outline" className="rounded-xl" onClick={() => void handleCreateGroup()}>
          <FolderPlus className="mr-2 h-4 w-4" />
          {t('createGroup')}
        </Button>
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-1 rounded-lg border border-border/40 bg-card px-2 py-1">
            {renamingGroupId === g.id ? (
              <>
                <Input
                  value={renameGroupValue}
                  onChange={(e) => setRenameGroupValue(e.target.value)}
                  className="h-8 w-32 rounded-md text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleRenameGroup(g.id); }}
                />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => void handleRenameGroup(g.id)}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setRenamingGroupId(null); setRenameGroupValue(''); }}>
                  ✕
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">{g.name}</span>
                <span className="text-xs text-muted-foreground">({g._count.playlists})</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1"
                  onClick={() => { setRenamingGroupId(g.id); setRenameGroupValue(g.name); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1 text-destructive"
                  onClick={() => void handleDeleteGroup(g.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
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
              {sortedPlaylists.map((p) => (
                <option key={p.id} value={p.id}>
                  {t('playlistItems', { name: p.name, count: p._count.items, screens: p._count.screensInGroup ?? 0 })}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground outline-none"
              value={playlistSort}
              onChange={(e) => setPlaylistSort(e.target.value)}
              aria-label={t('sortBy')}
            >
              <option value="name">{t('sortName')}</option>
              <option value="items">{t('sortItems')}</option>
              <option value="screens">{t('sortScreens')}</option>
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
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  disabled={undoStack.length === 0}
                  onClick={undo}
                  title={t('undo')}
                  aria-label={t('undo')}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  disabled={redoStack.length === 0}
                  onClick={redo}
                  title={t('redo')}
                  aria-label={t('redo')}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </div>
            )}
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
              if (canPublish) {
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
              }
              if (selected.isPublished) return null;
              return (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-semibold"
                  disabled={saving}
                  onClick={() => {
                    toast.info(t('submittedForReview'));
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t('submitForReview')}
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
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchMedia')}
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="rounded-xl ps-9"
                />
              </div>
              <MediaLibraryPanel library={mediaSearch.trim() ? library.filter((m) => m.originalName.toLowerCase().includes(mediaSearch.trim().toLowerCase())) : library} />
            </div>
            <CanvasLibraryPanel canvasLibrary={canvasLibrary} />
          </div>
          <PlaylistTimeline
            rows={rows}
            onUpdateDuration={updateDuration}
            onRemoveRow={removeRow}
            onMoveRow={moveRow}
            onDuplicateRow={duplicateRow}
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
