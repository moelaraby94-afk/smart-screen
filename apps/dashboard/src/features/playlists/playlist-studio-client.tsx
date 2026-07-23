'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertCircle, Monitor, MonitorOff, Smartphone, Square, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { apiFetch } from '@/features/auth/session';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import { makeZonePresets, type ZonePreset } from '@/lib/zone-presets';
import {
  DEFAULT_PLAYLIST_META,
  loadPlaylistMeta,
  type PlaylistLocalMeta,
} from '@/features/playlists/playlist-transitions';
import { updatePlaylistMeta as apiUpdatePlaylistMeta } from '@/features/playlists/api/playlists-api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

import { PlaylistEditorView } from './studio/components/playlist-editor-view';
import { PlaylistPreviewOverlay } from './playlist-preview-overlay';

import { usePlaylistData } from './studio/hooks/use-playlist-data';
import { usePlaylistActions } from './studio/hooks/use-playlist-actions';
import { useTimelineEdit } from './studio/hooks/use-timeline-edit';
import { usePlaylistMeta } from './studio/hooks/use-playlist-meta';

import type { Row, Zone, SaveState, SelectionContext } from './studio/types';

type AssignedScreen = {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastSeenAt?: string | null;
};

type PlaylistInfo = {
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
};

export function PlaylistStudioClient({ initialPlaylistId }: { initialPlaylistId?: string } = {}) {
  const t = useTranslations('playlistStudioClient');
  const locale = useLocale();
  const router = useRouter();
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const currentWs = workspaces.find((w) => w.id === workspaceId);
  const canPublish = Boolean(
    currentWs && (currentWs.role === 'OWNER' || currentWs.role === 'ADMIN'),
  );
  const canEdit = Boolean(
    currentWs && (currentWs.role === 'OWNER' || currentWs.role === 'ADMIN' || currentWs.role === 'EDITOR'),
  );

  // ── State ──────────────────────────────────────────────
  const [playlistId, setPlaylistId] = useState<string>(initialPlaylistId ?? '');
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedZonePreset, setSelectedZonePreset] = useState<ZonePreset | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('full');
  const [cloneTargetWs, setCloneTargetWs] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [selectedRowClientId, setSelectedRowClientId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showZoneSwitchDialog, setShowZoneSwitchDialog] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const pendingBackRef = useRef(false);
  const pendingMetaPatchRef = useRef<Partial<PlaylistLocalMeta> | null>(null);

  // Merged from detail page
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [assignedScreens, setAssignedScreens] = useState<AssignedScreen[]>([]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishScreens, setPublishScreens] = useState<AssignedScreen[]>([]);
  const [selectedScreenIds, setSelectedScreenIds] = useState<Set<string>>(new Set());
  const [publishingScreens, setPublishingScreens] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduleCount, setScheduleCount] = useState(0);

  // Account-level constants (grid view removed)
  const filterWorkspaceId = '';
  const filterGroupId = '';

  // ── Hooks ──────────────────────────────────────────────
  const { playlistMeta, setPlaylistMeta, updatePlaylistMeta: rawUpdatePlaylistMeta } = usePlaylistMeta(playlistId);

  // Wrap updatePlaylistMeta to intercept multi_zone→single switches and sync to server
  const updatePlaylistMeta = useCallback((patch: Partial<PlaylistLocalMeta>) => {
    if (patch.layoutType === 'single' && playlistMeta.layoutType === 'multi_zone') {
      pendingMetaPatchRef.current = patch;
      setShowZoneSwitchDialog(true);
      return;
    }
    rawUpdatePlaylistMeta(patch);
    // Persist orientation and renderMode to server
    if (workspaceId && playlistId && (patch.orientation || patch.renderMode)) {
      const apiData: Record<string, unknown> = {};
      if (patch.orientation) {
        const ortMap: Record<string, string> = { landscape: 'LANDSCAPE', portrait: 'PORTRAIT', square: 'SQUARE' };
        apiData.orientation = ortMap[patch.orientation] ?? 'AUTO';
      }
      if (patch.renderMode) {
        apiData.renderMode = patch.renderMode;
      }
      void apiUpdatePlaylistMeta(workspaceId, playlistId, apiData);
    }
  }, [playlistMeta.layoutType, rawUpdatePlaylistMeta, workspaceId, playlistId]);

  const skipHistoryRef = useRef(false);
  const latestNameRef = useRef<string>('');

  const {
    library, canvasLibrary, playlists, loading, detailError,
    setPlaylists, loadPlaylists, loadLibrary, loadPlaylistDetail,
  } = usePlaylistData(
    workspaceId, filterWorkspaceId, filterGroupId,
    setRows, null, null, skipHistoryRef,
  );

  const {
    togglingPublish, duplicating, cloning,
    savePlaylist, togglePublish,
    duplicatePlaylist, cloneToWorkspace,
  } = usePlaylistActions({
    workspaceId, filterWorkspaceId, filterGroupId,
    loadPlaylists, loadPlaylistDetail, bumpWorkspaceDataEpoch,
    setPlaylists,
  });

  const {
    undoStack, redoStack, clearHistory, undo, redo, onDragEnd,
    updateDuration, removeRow, moveRow, duplicateRow, updateRowTransition, updateRowZone,
  } = useTimelineEdit({
    rows, setRows, playlistMeta, selectedZoneId, playlistId,
    mediaLibrary: library, canvasLibrary, skipHistoryRef,
  });

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
    if (playlistId) {
      clearHistory();
      setPlaylistMeta(loadPlaylistMeta(playlistId));
      latestNameRef.current = '';
      void loadPlaylistDetail(playlistId).then((serverMeta) => {
        if (!serverMeta) return;
        const ortMap: Record<string, string> = { LANDSCAPE: 'landscape', PORTRAIT: 'portrait', SQUARE: 'square', AUTO: 'landscape' };
        const serverOrientation = serverMeta.orientation ? (ortMap[serverMeta.orientation] ?? 'landscape') : undefined;
        const serverRenderMode = serverMeta.renderMode as PlaylistLocalMeta['renderMode'] | undefined;
        if (serverOrientation || serverRenderMode) {
          setPlaylistMeta((prev) => ({
            ...prev,
            ...(serverOrientation ? { orientation: serverOrientation as PlaylistLocalMeta['orientation'] } : {}),
            ...(serverRenderMode ? { renderMode: serverRenderMode } : {}),
          }));
        }
      });
    } else {
      setRows([]);
      setPlaylistMeta(DEFAULT_PLAYLIST_META);
    }
  }, [playlistId, loadPlaylistDetail, setPlaylistMeta, clearHistory]);

  // Fetch playlist metadata + assigned screens (merged from detail page)
  const loadPlaylistInfo = useCallback(async () => {
    if (!workspaceId || !playlistId) return;
    try {
      const [plRes, scrRes] = await Promise.all([
        apiFetch(`/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}`),
        apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}&playlistId=${encodeURIComponent(playlistId)}`),
      ]);
      if (plRes.ok) {
        const data = await plRes.json();
        setPlaylistInfo({
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isPublished: data.isPublished,
        });
      }
      if (scrRes.ok) {
        const data = await scrRes.json();
        const items = Array.isArray(data) ? data : data.items;
        setAssignedScreens(Array.isArray(items) ? items : []);
      }
    } catch {
      // non-critical — inspector info is supplementary
    }
  }, [workspaceId, playlistId]);

  useEffect(() => {
    if (playlistId) void loadPlaylistInfo();
  }, [playlistId, loadPlaylistInfo]);

  // ── Publish to Screens handlers ───────────────────────
  const openPublishDialog = useCallback(async () => {
    if (!workspaceId) return;
    setPublishDialogOpen(true);
    setSelectedScreenIds(new Set());
    try {
      const res = await apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items;
        setPublishScreens(Array.isArray(items) ? items : []);
      }
    } catch {
      setPublishScreens([]);
    }
  }, [workspaceId]);

  const toggleScreenSelection = useCallback((id: string) => {
    setSelectedScreenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllScreens = useCallback(() => {
    setSelectedScreenIds((prev) => {
      if (prev.size === publishScreens.length) return new Set();
      return new Set(publishScreens.map((s) => s.id));
    });
  }, [publishScreens]);

  const confirmPublishToScreens = useCallback(async () => {
    if (!workspaceId || selectedScreenIds.size === 0) return;
    setPublishingScreens(true);
    try {
      let successCount = 0;
      for (const screenId of selectedScreenIds) {
        const res = await apiFetch(
          `/screens/${screenId}?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activePlaylistId: playlistId }),
          },
        );
        if (res.ok) successCount++;
      }
      if (successCount > 0) {
        const currentIsPublished = playlistInfo?.isPublished ?? false;
        if (!currentIsPublished) {
          await apiFetch(
            `/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPublished: true }),
            },
          );
        }
        toast.success(t('publishedToScreens', { count: successCount }));
        bumpWorkspaceDataEpoch();
        setPublishDialogOpen(false);
        void loadPlaylistInfo();
      } else {
        toast.error(t('publishFailed'));
      }
    } catch {
      toast.error(t('publishFailed'));
    }
    setPublishingScreens(false);
  }, [workspaceId, selectedScreenIds, playlistId, playlistInfo, bumpWorkspaceDataEpoch, loadPlaylistInfo, t]);

  // ── Delete playlist handler ───────────────────────────
  const openDeleteDialog = useCallback(async () => {
    setDeleteDialogOpen(true);
    setScheduleCount(0);
    if (!workspaceId) return;
    try {
      const res = await apiFetch(`/schedules?workspaceId=${encodeURIComponent(workspaceId)}&playlistId=${encodeURIComponent(playlistId)}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items;
        setScheduleCount(Array.isArray(items) ? items.length : 0);
      }
    } catch {
      // ignore
    }
  }, [workspaceId, playlistId]);

  const handleDelete = useCallback(async () => {
    if (!workspaceId) return;
    setDeleting(true);
    try {
      const res = await apiFetch(
        `/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}&force=true`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        toast.error(t('couldNotDeletePlaylist'));
        return;
      }
      toast.success(t('playlistDeleted'));
      bumpWorkspaceDataEpoch();
      router.push(`/${locale}/playlists` as Route);
    } catch {
      toast.error(t('couldNotDeletePlaylist'));
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
  }, [workspaceId, playlistId, bumpWorkspaceDataEpoch, router, locale, t]);

  // ── Create schedule handler ───────────────────────────
  const handleCreateSchedule = useCallback(() => {
    router.push(`/${locale}/scheduling?playlistId=${playlistId}` as Route);
  }, [router, locale, playlistId]);

  // Viewport width tracking for responsive guards
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Track save state
  const lastSavedRowsRef = useRef<Row[]>([]);
  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      lastSavedRowsRef.current = rows;
      setSaveState('saved');
    } else if (rows !== lastSavedRowsRef.current) {
      setSaveState('unsaved');
    }
  }, [rows]);

  // ── Derived values ─────────────────────────────────────
  const selectedPlaylist = playlists.find((p) => p.id === playlistId);
  const orientationIcon = playlistMeta.orientation === 'portrait' ? Smartphone : playlistMeta.orientation === 'square' ? Square : Monitor;
  const presetW = playlistMeta.orientation === 'portrait' ? 1080 : playlistMeta.orientation === 'square' ? 1080 : 1920;
  const presetH = playlistMeta.orientation === 'portrait' ? 1920 : playlistMeta.orientation === 'square' ? 1080 : 1080;
  const zonePresets = makeZonePresets(presetW, presetH);

  // Restore zone preset from saved meta
  useEffect(() => {
    if (playlistMeta.zonePresetId && playlistMeta.layoutType === 'multi_zone') {
      const preset = zonePresets.find((z) => z.id === playlistMeta.zonePresetId) ?? null;
      if (preset && (!selectedZonePreset || selectedZonePreset.id !== preset.id)) {
        setSelectedZonePreset(preset);
        setSelectedZoneId(preset.zones[0]?.name ?? '');
      }
    } else if (!playlistMeta.zonePresetId && selectedZonePreset) {
      setSelectedZonePreset(null);
    }
  }, [playlistMeta.zonePresetId, playlistMeta.layoutType, zonePresets, selectedZonePreset]);

  const handleSetSelectedZonePreset = useCallback((preset: ZonePreset | null) => {
    setSelectedZonePreset(preset);
    updatePlaylistMeta({ zonePresetId: preset?.id ?? null });
  }, [updatePlaylistMeta]);

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

  const selectedRow = selectedRowClientId ? rows.find((r) => r.clientId === selectedRowClientId) ?? null : null;

  const selectionContext: SelectionContext = selectedRowClientId
    ? 'item'
    : (playlistMeta.layoutType === 'multi_zone' && selectedZoneId && selectedZoneId !== 'full')
    ? 'zone'
    : 'playlist';

  // ── Handlers ───────────────────────────────────────────
  const backToGrid = () => {
    if (saveState === 'unsaved') {
      pendingBackRef.current = true;
      setShowUnsavedDialog(true);
      return;
    }
    router.push(`/${locale}/playlists` as Route);
  };

  const handleSave = async () => {
    setSaveState('saving');
    await savePlaylist(playlistId, rows);
    lastSavedRowsRef.current = rows;
    setSaveState('saved');
  };

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveState === 'unsaved' || saveState === 'idle') {
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveState]);

  const handleNameBlur = () => {
    if (workspaceId && playlistId && latestNameRef.current) {
      void apiUpdatePlaylistMeta(workspaceId, playlistId, { name: latestNameRef.current });
    }
  };

  const handleNameChange = (name: string) => {
    latestNameRef.current = name;
    setPlaylists((prev) => prev.map((p) => p.id === playlistId ? { ...p, name } : p));
  };

  const handleTogglePublish = () => {
    if (selectedPlaylist) void togglePublish(playlistId, selectedPlaylist.isPublished);
  };

  if (!workspaceId) {
    return <p className="text-sm text-muted-foreground">{t('selectWorkspaceFirst')}</p>;
  }

  // ── Editor View ────────────────────────────────────────

  // Mobile guard — Studio editor is desktop-only
  if (viewportWidth < 768) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-border p-8 text-center">
        <MonitorOff className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-base font-semibold">{t('mobileNotSupported')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('mobileNotSupportedDesc')}</p>
        </div>
        <Button variant="outline" onClick={backToGrid}>
          {t('backToList')}
        </Button>
      </div>
    );
  }

  // Detail load error — show retry UI
  if (detailError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-border p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-1">
          <p className="text-base font-semibold">{t('loadFailed')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={backToGrid}>{t('backToList')}</Button>
          <Button variant="cta" onClick={() => void loadPlaylistDetail(playlistId)}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewportWidth >= 768 && viewportWidth < 1024 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{t('tabletWarning')}</p>
        </div>
      )}
      <PlaylistEditorView
      playlistName={selectedPlaylist?.name ?? ''}
      isPublished={selectedPlaylist?.isPublished ?? false}
      canPublish={canPublish}
      orientationIcon={orientationIcon}
      itemCount={rows.length}
      undoStackLen={undoStack.length}
      redoStackLen={redoStack.length}
      onUndo={undo}
      onRedo={redo}
      onBack={backToGrid}
      onNameChange={handleNameChange}
      onNameBlur={handleNameBlur}
      onSave={handleSave}
      saveState={saveState}
      onTogglePublish={handleTogglePublish}
      togglingPublish={togglingPublish}
      onDuplicate={() => void duplicatePlaylist(playlistId)}
      duplicating={duplicating}
      onClone={(targetWs) => void cloneToWorkspace(playlistId, targetWs)}
      cloning={cloning}
      cloneTargetWs={cloneTargetWs}
      setCloneTargetWs={setCloneTargetWs}
      workspaces={workspaces}
      workspaceId={workspaceId}
      library={library}
      canvasLibrary={canvasLibrary}
      onUploadComplete={() => void loadLibrary()}
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
      currentZoneRows={currentZoneRows}
      onUpdateDuration={updateDuration}
      onRemoveRow={removeRow}
      onMoveRow={moveRow}
      onDuplicateRow={duplicateRow}
      onUpdateRowTransition={updateRowTransition}
      playlistMeta={playlistMeta}
      updatePlaylistMeta={updatePlaylistMeta}
      selectedZonePreset={selectedZonePreset}
      setSelectedZonePreset={handleSetSelectedZonePreset}
      zonePresets={zonePresets}
      setSelectedZoneId={setSelectedZoneId}
      selectionContext={selectionContext}
      selectedRow={selectedRow}
      onUpdateRowZone={updateRowZone}
      onDragEnd={onDragEnd}
      playlistInfo={playlistInfo}
      assignedScreens={assignedScreens}
      onPublishToScreens={() => void openPublishDialog()}
      onCreateSchedule={handleCreateSchedule}
      onDeletePlaylist={() => void openDeleteDialog()}
      canEdit={canEdit}
      onPreview={() => setPreviewOpen(true)}
      onSelectRow={setSelectedRowClientId}
      selectedRowClientId={selectedRowClientId}
    />

      <PlaylistPreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rows={rows}
        defaultTransition={playlistMeta.defaultTransition}
        transitionDuration={playlistMeta.transitionDuration}
      />

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unsavedChangesTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('unsavedChangesDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (pendingBackRef.current) {
                pendingBackRef.current = false;
                router.push(`/${locale}/playlists` as Route);
              }
              setShowUnsavedDialog(false);
            }}>{t('discard')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await handleSave();
              if (pendingBackRef.current) {
                pendingBackRef.current = false;
                router.push(`/${locale}/playlists` as Route);
              }
              setShowUnsavedDialog(false);
            }}>{t('save')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Zone switch confirmation dialog */}
      <AlertDialog open={showZoneSwitchDialog} onOpenChange={setShowZoneSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('zoneSwitchTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('zoneSwitchDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              pendingMetaPatchRef.current = null;
              setShowZoneSwitchDialog(false);
            }}>{t('zoneSwitchCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingMetaPatchRef.current) {
                rawUpdatePlaylistMeta(pendingMetaPatchRef.current);
                pendingMetaPatchRef.current = null;
              }
              setShowZoneSwitchDialog(false);
            }}>{t('zoneSwitchConfirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish to Screens Dialog (merged from detail page) */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('publishToScreens')}</DialogTitle>
            <DialogDescription>{t('publishDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto py-2">
            {publishScreens.length > 1 && (
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Checkbox
                  checked={selectedScreenIds.size === publishScreens.length}
                  onCheckedChange={() => toggleAllScreens()}
                  id="select-all-screens"
                />
                <label htmlFor="select-all-screens" className="cursor-pointer text-sm font-medium text-foreground">
                  {t('selectAllScreens')}
                </label>
              </div>
            )}
            {publishScreens.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('noScreensToPublish')}</p>
            ) : (
              publishScreens.map((screen) => (
                <div key={screen.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <Checkbox
                    checked={selectedScreenIds.has(screen.id)}
                    onCheckedChange={() => toggleScreenSelection(screen.id)}
                    id={`screen-${screen.id}`}
                    aria-label={screen.name}
                  />
                  <label htmlFor={`screen-${screen.id}`} className="flex flex-1 cursor-pointer items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{screen.name}</span>
                    <ScreenFleetStatusBadge
                      status={screen.status}
                      lastSeenAt={screen.lastSeenAt}
                      locale={locale}
                      tone="card"
                      className="text-xs"
                    />
                  </label>
                </div>
              ))
            )}
            {selectedScreenIds.size > 0 && publishScreens.some((s) => selectedScreenIds.has(s.id) && s.status !== 'ONLINE') && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-warning">{t('offlineWarning')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPublishDialogOpen(false)} disabled={publishingScreens}>
              {t('cancel')}
            </Button>
            <Button
              variant="default"
              onClick={() => void confirmPublishToScreens()}
              disabled={selectedScreenIds.size === 0 || publishingScreens}
            >
              {publishingScreens ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
              {publishingScreens ? t('publishing') : t('publishNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Dialog (merged from detail page) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: selectedPlaylist?.name ?? '' })}
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
              {deleting ? t('deleting') : t('deletePlaylist')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
