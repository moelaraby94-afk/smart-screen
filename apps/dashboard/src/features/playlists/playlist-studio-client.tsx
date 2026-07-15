'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Copy, Eye, EyeOff, FolderInput, FolderPlus,
  Layout as LayoutIcon, Monitor, MonitorPlay, MoreVertical, Pencil, PenLine,
  Plus, Redo2, Save, Smartphone, Square, Trash2, Undo2, Wand2, ListVideo,
  Clock, Layers,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { type CanvasSummary } from '@/features/playlists/playlist-library-panels';
import { PlaylistTimeline, type Row } from '@/features/playlists/playlist-timeline';
import { PlaylistZonePreview, type Zone } from '@/features/playlists/playlist-zone-preview';
import { PlaylistMediaLibrary } from '@/features/playlists/playlist-media-library';
import { makeZonePresets, type ZonePreset } from '@/features/studio/canvas-layout';
import {
  type TransitionType,
  type PlaylistLocalMeta,
  DEFAULT_PLAYLIST_META,
  loadPlaylistMeta,
  savePlaylistMeta,
  saveItemTransition,
  loadItemTransition,
  itemTransitionKey,
  TRANSITIONS,
} from '@/features/playlists/playlist-transitions';

type PlaylistSummary = {
  id: string;
  name: string;
  isPublished: boolean;
  workspaceId?: string | null;
  groupId?: string | null;
  _count: { items: number; screensInGroup?: number };
  items?: Array<{
    kind?: string;
    media?: { id: string; publicUrl: string; mimeType: string; originalName: string } | null;
    canvas?: { id: string; name: string; width?: number; height?: number } | null;
  }>;
};

type PlaylistGroup = {
  id: string;
  name: string;
  _count: { playlists: number };
};

export function PlaylistStudioClient() {
  const t = useTranslations('playlistStudioClient');
  const locale = useLocale();
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
  const [duplicating, setDuplicating] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneTargetWs, setCloneTargetWs] = useState('');
  const [playlistSort, setPlaylistSort] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'editor'>('grid');
  const [selectedZonePreset, setSelectedZonePreset] = useState<ZonePreset | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('full');
  const [playlistMeta, setPlaylistMeta] = useState<PlaylistLocalMeta>(DEFAULT_PLAYLIST_META);
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
          zoneName?: string | null;
          media?: MediaItem;
          canvas?: { id: string; name: string };
        }>;
      };
      const mapped: Array<Row | null> = data.items.map((it, idx) => {
        const trKey = itemTransitionKey(it.kind ?? 'media', it.media?.id, it.canvas?.id, idx);
        const savedTransition = loadItemTransition(id, trKey);
        if (it.kind === 'canvas' && it.canvas) {
          return {
            clientId: crypto.randomUUID() as string,
            kind: 'canvas' as const,
            canvasId: it.canvas.id,
            durationSec: it.durationSec,
            canvas: { id: it.canvas.id, name: it.canvas.name },
            transition: savedTransition ?? undefined,
            zoneName: it.zoneName ?? null,
          };
        }
        if (it.media) {
          return {
            clientId: crypto.randomUUID() as string,
            kind: 'media' as const,
            mediaId: it.media.id,
            durationSec: it.durationSec,
            media: it.media,
            transition: savedTransition ?? undefined,
            zoneName: it.zoneName ?? null,
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
    if (playlistId) {
      void loadPlaylistDetail(playlistId);
      setPlaylistMeta(loadPlaylistMeta(playlistId));
      setViewMode('editor');
    } else {
      setRows([]);
      setPlaylistMeta(DEFAULT_PLAYLIST_META);
      setViewMode('grid');
    }
  }, [playlistId, loadPlaylistDetail]);

  const openPlaylist = (id: string) => {
    setPlaylistId(id);
  };

  const backToGrid = () => {
    setPlaylistId('');
    setViewMode('grid');
  };

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

    const currentZone = playlistMeta.layoutType === 'single' ? 'full' : (selectedZoneId ?? '__default__');

    // For zone-filtered timelines, map the visible index to the global rows index
    const zoneRowClientIds = playlistMeta.layoutType === 'single'
      ? rows.map((r) => r.clientId)
      : rows.filter((r) => (r.zoneName ?? '__default__') === currentZone).map((r) => r.clientId);

    if (source.droppableId === 'library' && destination.droppableId === 'playlist') {
      const mediaId = draggableId.replace('lib-', '');
      const media = library.find((m) => m.id === mediaId);
      if (!media) return;

      // Find the global insertion index based on the zone-filtered position
      let globalIndex: number;
      if (playlistMeta.layoutType === 'single' || zoneRowClientIds.length === 0) {
        globalIndex = destination.index;
      } else {
        if (destination.index >= zoneRowClientIds.length) {
          // Insert after the last zone item in the global array
          const lastZoneClientId = zoneRowClientIds[zoneRowClientIds.length - 1]!;
          globalIndex = rows.findIndex((r) => r.clientId === lastZoneClientId) + 1;
        } else {
          const targetClientId = zoneRowClientIds[destination.index]!;
          globalIndex = rows.findIndex((r) => r.clientId === targetClientId);
        }
      }

      const next = Array.from(rows);
      next.splice(globalIndex, 0, {
        clientId: crypto.randomUUID(),
        kind: 'media',
        mediaId: media.id,
        durationSec: 10,
        media,
        zoneName: playlistMeta.layoutType === 'single' ? null : currentZone,
      });
      pushHistory(rows);
      setRows(next);
      return;
    }

    if (source.droppableId === 'canvas-library' && destination.droppableId === 'playlist') {
      const canvasId = draggableId.replace('cvs-', '');
      const canvas = canvasLibrary.find((c) => c.id === canvasId);
      if (!canvas) return;

      let globalIndex: number;
      if (playlistMeta.layoutType === 'single' || zoneRowClientIds.length === 0) {
        globalIndex = destination.index;
      } else {
        if (destination.index >= zoneRowClientIds.length) {
          const lastZoneClientId = zoneRowClientIds[zoneRowClientIds.length - 1]!;
          globalIndex = rows.findIndex((r) => r.clientId === lastZoneClientId) + 1;
        } else {
          const targetClientId = zoneRowClientIds[destination.index]!;
          globalIndex = rows.findIndex((r) => r.clientId === targetClientId);
        }
      }

      const next = Array.from(rows);
      next.splice(globalIndex, 0, {
        clientId: crypto.randomUUID(),
        kind: 'canvas',
        canvasId: canvas.id,
        durationSec: 15,
        canvas: { id: canvas.id, name: canvas.name },
        zoneName: playlistMeta.layoutType === 'single' ? null : currentZone,
      });
      pushHistory(rows);
      setRows(next);
      return;
    }

    if (source.droppableId === 'playlist' && destination.droppableId === 'playlist') {
      // Reorder within the same zone timeline
      if (playlistMeta.layoutType === 'single') {
        // Single zone: indices match directly
        const next = Array.from(rows);
        const [removed] = next.splice(source.index, 1);
        if (!removed) return;
        next.splice(destination.index, 0, removed);
        pushHistory(rows);
        setRows(next);
      } else {
        // Multi-zone: map zone indices to global indices
        const fromClientId = zoneRowClientIds[source.index];
        const toClientId = zoneRowClientIds[destination.index];
        if (!fromClientId || !toClientId) return;
        const fromGlobal = rows.findIndex((r) => r.clientId === fromClientId);
        const toGlobal = rows.findIndex((r) => r.clientId === toClientId);
        if (fromGlobal === -1 || toGlobal === -1) return;
        const next = Array.from(rows);
        const [removed] = next.splice(fromGlobal, 1);
        if (!removed) return;
        next.splice(toGlobal, 0, removed);
        pushHistory(rows);
        setRows(next);
      }
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
      // For zone-filtered timelines, find the actual clientIds at the visible positions
      const currentZone = playlistMeta.layoutType === 'single' ? 'full' : (selectedZoneId ?? '__default__');
      const zoneRows = playlistMeta.layoutType === 'single'
        ? prev
        : prev.filter((r) => (r.zoneName ?? '__default__') === currentZone);

      const fromRow = zoneRows[index];
      const toRow = zoneRows[index + delta];
      if (!fromRow || !toRow) return prev;

      const fromGlobal = prev.findIndex((r) => r.clientId === fromRow.clientId);
      const toGlobal = prev.findIndex((r) => r.clientId === toRow.clientId);
      if (fromGlobal === -1 || toGlobal === -1) return prev;

      const next = [...prev];
      const tmp = next[fromGlobal];
      next[fromGlobal] = next[toGlobal]!;
      next[toGlobal] = tmp!;
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

  const updateRowTransition = (clientId: string, transition: TransitionType) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.clientId === clientId);
      if (idx === -1) return prev;
      const row = prev[idx]!;
      const trKey = itemTransitionKey(row.kind, row.kind === 'media' ? row.mediaId : undefined, row.kind === 'canvas' ? row.canvasId : undefined, idx);
      if (playlistId) saveItemTransition(playlistId, trKey, transition);
      return prev.map((r) =>
        r.clientId === clientId ? { ...r, transition } : r,
      );
    });
  };

  const updatePlaylistMeta = (patch: Partial<PlaylistLocalMeta>) => {
    setPlaylistMeta((prev) => {
      const next = { ...prev, ...patch };
      if (playlistId) savePlaylistMeta(playlistId, next);
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
                zoneName: r.zoneName ?? null,
              }
            : {
                canvasId: r.canvasId,
                durationSec: r.durationSec,
                orderIndex: index,
                zoneName: r.zoneName ?? null,
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

  const duplicatePlaylistById = async (id: string) => {
    const p = playlists.find((pl) => pl.id === id);
    const wsId = p?.workspaceId ?? workspaceId;
    if (!wsId) return;
    const res = await apiFetch(
      `/playlists/${encodeURIComponent(id)}/duplicate?workspaceId=${encodeURIComponent(wsId)}`,
      { method: 'POST' },
    );
    if (!res.ok) {
      toast.error(t('duplicateFailed'));
      return;
    }
    toast.success(t('duplicated'));
    await loadPlaylists();
    bumpWorkspaceDataEpoch();
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

  const selectedPlaylist = playlists.find((p) => p.id === playlistId);
  const orientationIcon = playlistMeta.orientation === 'portrait' ? Smartphone : playlistMeta.orientation === 'square' ? Square : Monitor;
  const presetW = playlistMeta.orientation === 'portrait' ? 1080 : playlistMeta.orientation === 'square' ? 1080 : 1920;
  const presetH = playlistMeta.orientation === 'portrait' ? 1920 : playlistMeta.orientation === 'square' ? 1080 : 1080;
  const zonePresets = makeZonePresets(presetW, presetH);

  const handleDeletePlaylist = async (id: string) => {
    const p = playlists.find((pl) => pl.id === id);
    const wsId = p?.workspaceId ?? workspaceId;
    if (!wsId) return;
    const res = await apiFetch(`/playlists/${id}?workspaceId=${encodeURIComponent(wsId)}&force=true`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('couldNotDeletePlaylist'));
      return;
    }
    toast.success(t('playlistDeleted'));
    await loadPlaylists();
    bumpWorkspaceDataEpoch();
  };

  if (!workspaceId) {
    return <p className="text-[15px] text-muted-foreground">{t('selectWorkspaceFirst')}</p>;
  }

  if (viewMode === 'editor' && playlistId) {
    const zones: Zone[] = playlistMeta.layoutType === 'multi_zone' && selectedZonePreset
      ? selectedZonePreset.zones.map((z) => ({
          id: z.name, name: z.name, x: z.x, y: z.y, width: z.width, height: z.height,
        }))
      : [];

    const rowsByZone: Record<string, Row[]> = {};
    if (playlistMeta.layoutType === 'single') {
      rowsByZone['full'] = rows;
    } else {
      for (const row of rows) {
        const zn = row.zoneName ?? '__default__';
        if (!rowsByZone[zn]) rowsByZone[zn] = [];
        rowsByZone[zn].push(row);
      }
    }

    const currentZoneRows = playlistMeta.layoutType === 'single'
      ? rows
      : (selectedZoneId ? (rowsByZone[selectedZoneId] ?? []) : []);

    return (
      <div className="flex flex-col gap-4">
        {/* ─── Top bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vc-glass vc-card-surface rounded-2xl px-4 py-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={backToGrid} title={t('backToList')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                {(() => { const Icon = orientationIcon; return <Icon className="h-4.5 w-4.5 text-primary" />; })()}
              </div>
              <Input
                value={selectedPlaylist?.name ?? ''}
                onChange={(e) => {
                  const name = e.target.value;
                  setPlaylists((prev) => prev.map((p) => p.id === playlistId ? { ...p, name } : p));
                }}
                className="h-9 max-w-[220px] rounded-xl border-transparent bg-transparent text-base font-bold hover:border-border focus:border-border"
                onBlur={() => {
                  if (workspaceId && selectedPlaylist) {
                    void apiUpdatePlaylistMeta(workspaceId, playlistId, { name: selectedPlaylist.name });
                  }
                }}
              />
              {selectedPlaylist?.isPublished && (
                <Badge variant="success" className="shrink-0">
                  <Eye className="me-1 h-3 w-3" />
                  {t('publishedBadge')}
                </Badge>
              )}
              <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
                <Layers className="h-3.5 w-3.5" />
                {rows.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" disabled={undoStack.length === 0} onClick={undo} title={t('undo')}>
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" disabled={redoStack.length === 0} onClick={redo} title={t('redo')}>
                  <Redo2 className="h-4 w-4" />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-lg" disabled={duplicating || cloning}>
                    <MoreVertical className="me-1.5 h-4 w-4" />
                    {t('actions')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => void duplicatePlaylist()} disabled={duplicating}>
                    <Copy className="me-2 h-4 w-4" />
                    {duplicating ? t('duplicating') : t('duplicate')}
                  </DropdownMenuItem>
                  {workspaces.length > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => void cloneToWorkspace()}
                        disabled={cloning || !cloneTargetWs}
                      >
                        <FolderInput className="me-2 h-4 w-4" />
                        {cloning ? t('cloning') : t('cloneToWorkspace')}
                      </DropdownMenuItem>
                      <div className="px-3 py-1.5">
                        <select
                          className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
                          value={cloneTargetWs}
                          onChange={(e) => setCloneTargetWs(e.target.value)}
                        >
                          <option value="">{t('selectOption')}</option>
                          {workspaces.filter((w) => w.id !== workspaceId).map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="cta" size="sm" className="rounded-lg" onClick={() => void savePlaylist()} disabled={saving}>
                <Save className="me-1.5 h-4 w-4" />
                {saving ? t('saving') : t('savePlaylist')}
              </Button>

              {(() => {
                if (!selectedPlaylist) return null;
                if (canPublish) {
                  return (
                    <Button
                      variant={selectedPlaylist.isPublished ? 'outline' : 'default'}
                      size="sm"
                      className="rounded-lg"
                      disabled={togglingPublish}
                      onClick={() => void togglePublish()}
                    >
                      {selectedPlaylist.isPublished ? <EyeOff className="me-1.5 h-4 w-4" /> : <Eye className="me-1.5 h-4 w-4" />}
                      {selectedPlaylist.isPublished ? t('unpublish') : t('publish')}
                    </Button>
                  );
                }
                if (selectedPlaylist.isPublished) return null;
                return (
                  <Button variant="outline" size="sm" className="rounded-lg" disabled={saving} onClick={() => toast.info(t('submittedForReview'))}>
                    <Eye className="me-1.5 h-4 w-4" />
                    {t('submitForReview')}
                  </Button>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* ─── Settings bar ─── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-2xl border border-border/60 bg-card/40 px-4 py-2.5">
          {/* Orientation */}
          <div className="flex items-center gap-2">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('orientation')}</Label>
            <div className="flex items-center gap-1">
              {([
                { id: 'landscape' as const, icon: Monitor },
                { id: 'portrait' as const, icon: Smartphone },
                { id: 'square' as const, icon: Square },
              ]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePlaylistMeta({ orientation: opt.id })}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                      playlistMeta.orientation === opt.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    )}
                    title={opt.id}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-6 w-px bg-border/60" />

          {/* Layout */}
          <div className="flex items-center gap-2">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('layoutType')}</Label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updatePlaylistMeta({ layoutType: 'single' })}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all',
                  playlistMeta.layoutType === 'single'
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <LayoutIcon className="h-3.5 w-3.5" />
                {t('singleZone')}
              </button>
              <button
                type="button"
                onClick={() => updatePlaylistMeta({ layoutType: 'multi_zone' })}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all',
                  playlistMeta.layoutType === 'multi_zone'
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <MonitorPlay className="h-3.5 w-3.5" />
                {t('multiZone')}
              </button>
            </div>
          </div>

          {playlistMeta.layoutType === 'multi_zone' && (
            <>
              <div className="h-6 w-px bg-border/60" />
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-medium text-muted-foreground">{t('zonePreset')}</Label>
                <select
                  className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-primary/40"
                  value={selectedZonePreset?.id ?? ''}
                  onChange={(e) => {
                    const preset = zonePresets.find((z) => z.id === e.target.value) ?? null;
                    setSelectedZonePreset(preset);
                    if (preset) setSelectedZoneId(preset.zones[0]?.name ?? null);
                  }}
                >
                  <option value="">{t('choosePreset')}</option>
                  {zonePresets.map((z) => (
                    <option key={z.id} value={z.id}>{locale === 'ar' ? z.nameAr : z.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="h-6 w-px bg-border/60" />

          {/* Transition */}
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <select
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-primary/40"
              value={playlistMeta.defaultTransition}
              onChange={(e) => updatePlaylistMeta({ defaultTransition: e.target.value as TransitionType })}
              aria-label={t('transitionLabel')}
            >
              {TRANSITIONS.map((tr) => (
                <option key={tr.id} value={tr.id}>{locale === 'ar' ? tr.nameAr : tr.nameEn}</option>
              ))}
            </select>
            <input
              type="range" min={0.2} max={2} step={0.1}
              value={playlistMeta.transitionDuration}
              onChange={(e) => updatePlaylistMeta({ transitionDuration: Number(e.target.value) })}
              className="h-1.5 w-20 cursor-pointer accent-primary"
            />
            <span className="font-mono-nums text-[11px] text-muted-foreground">{playlistMeta.transitionDuration.toFixed(1)}s</span>
          </div>
        </div>

        {/* ─── Zone preset mini-map ─── */}
        {playlistMeta.layoutType === 'multi_zone' && selectedZonePreset && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-2">
            <div className="relative h-10 w-16 overflow-hidden rounded-md border border-border/40 bg-background">
              {selectedZonePreset.zones.map((z, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute border',
                    selectedZoneId === z.name ? 'border-primary bg-primary/30' : 'border-emerald-500/50 bg-emerald-500/15',
                  )}
                  style={{
                    left: `${(z.x / presetW) * 100}%`,
                    top: `${(z.y / presetH) * 100}%`,
                    width: `${(z.width / presetW) * 100}%`,
                    height: `${(z.height / presetH) * 100}%`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedZonePreset.zones.map((z, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedZoneId(z.name)}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] font-medium transition',
                    selectedZoneId === z.name ? 'bg-primary text-white' : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400',
                  )}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Main workspace ─── */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            {/* Left: Preview + Timeline */}
            <div className="flex flex-col gap-3">
              <PlaylistZonePreview
                rowsByZone={rowsByZone}
                zones={zones}
                defaultTransition={playlistMeta.defaultTransition}
                transitionDuration={playlistMeta.transitionDuration}
                orientation={playlistMeta.orientation}
                layoutType={playlistMeta.layoutType}
                selectedZoneId={selectedZoneId}
                onSelectZone={setSelectedZoneId}
                canvasWidth={presetW}
                canvasHeight={presetH}
              />

              {/* Zone timeline header */}
              <div className="flex items-center gap-2 px-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{t('zoneTimeline')}</span>
                <Badge variant="muted" className="text-[10px]">
                  {playlistMeta.layoutType === 'single' ? t('singleZone') : (selectedZoneId ?? '—')}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {t('itemsCount', { count: currentZoneRows.length })}
                </span>
              </div>

              <PlaylistTimeline
                rows={currentZoneRows}
                onUpdateDuration={updateDuration}
                onRemoveRow={removeRow}
                onMoveRow={moveRow}
                onDuplicateRow={duplicateRow}
                onUpdateTransition={updateRowTransition}
                defaultTransition={playlistMeta.defaultTransition}
              />
            </div>

            {/* Right: Media Library */}
            <PlaylistMediaLibrary
              library={library}
              canvasLibrary={canvasLibrary}
              onUploadComplete={() => void loadLibrary()}
              workspaceId={workspaceId}
            />
          </div>
        </DragDropContext>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Page header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t('pageTitle')}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('pageDescription')}</p>
        </div>
      </div>

      {/* ─── Workspace pills ─── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFilterWorkspaceId('')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all',
            !filterWorkspaceId
              ? 'bg-primary text-white shadow-sm'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
          )}
        >
          {t('allWorkspaces')}
        </button>
        {workspaces.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setFilterWorkspaceId(w.id)}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all',
              filterWorkspaceId === w.id
                ? 'bg-primary text-white shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
            )}
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-2">
          <Label className="text-[11px] font-medium text-muted-foreground">{t('filterByGroup')}</Label>
          <select
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40"
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
          >
            <option value="">{t('allGroups')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g._count.playlists})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-[11px] font-medium text-muted-foreground">{t('sortBy')}</Label>
          <select
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40"
            value={playlistSort}
            onChange={(e) => setPlaylistSort(e.target.value)}
          >
            <option value="name">{t('sortName')}</option>
            <option value="items">{t('sortItems')}</option>
            <option value="screens">{t('sortScreens')}</option>
          </select>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <Input
            placeholder={t('newPlaylistPlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 max-w-[220px] rounded-xl"
            onKeyDown={(e) => { if (e.key === 'Enter') void createPlaylist(); }}
          />
          <Button variant="default" className="rounded-xl" onClick={() => void createPlaylist()}>
            <Plus className="me-2 h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      </div>

      {/* ─── Groups row ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <div
            key={g.id}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all',
              filterGroupId === g.id
                ? 'border-primary/40 bg-primary/5'
                : 'border-border/50 bg-card/50',
            )}
          >
            {renamingGroupId === g.id ? (
              <>
                <Input
                  value={renameGroupValue}
                  onChange={(e) => setRenameGroupValue(e.target.value)}
                  className="h-7 w-28 rounded-md text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleRenameGroup(g.id); }}
                />
                <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => void handleRenameGroup(g.id)}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => { setRenamingGroupId(null); setRenameGroupValue(''); }}>
                  ✕
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="text-sm font-medium text-foreground hover:text-primary"
                  onClick={() => setFilterGroupId(filterGroupId === g.id ? '' : g.id)}
                >
                  {g.name}
                </button>
                <span className="text-[11px] text-muted-foreground">({g._count.playlists})</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => { setRenamingGroupId(g.id); setRenameGroupValue(g.name); }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => void handleDeleteGroup(g.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Input
            placeholder={t('newGroupPlaceholder')}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="h-8 w-36 rounded-lg text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateGroup(); }}
          />
          <Button variant="ghost" size="sm" className="h-8 rounded-lg" onClick={() => void handleCreateGroup()}>
            <FolderPlus className="me-1.5 h-3.5 w-3.5" />
            {t('createGroup')}
          </Button>
        </div>
      </div>

      {/* ─── Playlist cards ─── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">{t('loadingStudio')}</p>
          </div>
        </div>
      ) : sortedPlaylists.length === 0 ? (
        <EmptyState icon={ListVideo} title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedPlaylists.map((p, i) => {
            const ws = workspaces.find((w) => w.id === p.workspaceId);
            const meta = loadPlaylistMeta(p.id);
            const Icon = meta.orientation === 'portrait' ? Smartphone : meta.orientation === 'square' ? Square : Monitor;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => openPlaylist(p.id)}
                  className="flex flex-1 flex-col text-start"
                >
                  {/* Thumbnail */}
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-muted/40 to-muted/5">
                    {(() => {
                      const firstItem = p.items?.[0];
                      if (firstItem?.media?.publicUrl && firstItem.media.mimeType.startsWith('image/')) {
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={firstItem.media.publicUrl} alt={firstItem.media.originalName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        );
                      }
                      if (firstItem?.media?.publicUrl && firstItem.media.mimeType.startsWith('video/')) {
                        return <video src={firstItem.media.publicUrl} className="h-full w-full object-cover" muted playsInline />;
                      }
                      if (firstItem?.canvas) {
                        return (
                          <div className="flex flex-col items-center gap-1.5">
                            <PenLine className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
                            <span className="text-[10px] text-muted-foreground">{firstItem.canvas.name}</span>
                          </div>
                        );
                      }
                      return <Icon className="h-10 w-10 text-muted-foreground/20 transition group-hover:text-primary/40" strokeWidth={1.5} />;
                    })()}

                    {/* Overlay badges */}
                    <div className="absolute inset-x-2 top-2 flex items-center justify-between">
                      {p.isPublished && (
                        <Badge variant="success" className="shadow-sm">
                          <Eye className="me-1 h-2.5 w-2.5" />
                          {t('publishedBadge')}
                        </Badge>
                      )}
                      <div className={cn('ms-auto flex items-center gap-1', !p.isPublished && 'ms-0')}>
                        <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                          {p._count.items} {t('itemsCount', { count: p._count.items })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1.5 p-3.5">
                    <h3 className="truncate text-sm font-bold text-foreground transition group-hover:text-primary">{p.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {ws && <span className="truncate">{ws.name}</span>}
                      <span>·</span>
                      <span>{p._count.screensInGroup ?? 0} {t('screens')}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="muted" className="text-[9px]">
                        {meta.orientation === 'portrait' ? (locale === 'ar' ? 'عمودي' : 'Portrait') : meta.orientation === 'square' ? (locale === 'ar' ? 'مربع' : 'Square') : (locale === 'ar' ? 'أفقي' : 'Landscape')}
                      </Badge>
                      <Badge variant="muted" className="text-[9px]">
                        {meta.layoutType === 'single' ? t('singleZone') : t('multiZone')}
                      </Badge>
                    </div>
                  </div>
                </button>

                {/* Card actions — always visible on hover for ALL playlists */}
                <div className="absolute end-2 top-2 z-10 opacity-0 transition group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-white hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openPlaylist(p.id)}>
                        <Pencil className="me-2 h-4 w-4" />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void duplicatePlaylistById(p.id)}>
                        <Copy className="me-2 h-4 w-4" />
                        {t('duplicate')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 dark:text-red-400"
                        onClick={() => void handleDeletePlaylist(p.id)}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
