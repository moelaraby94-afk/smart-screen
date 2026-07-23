'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { AlertCircle, Monitor, MonitorOff, Smartphone, Square } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { makeZonePresets, type ZonePreset } from '@/lib/zone-presets';
import {
  DEFAULT_PLAYLIST_META,
  loadPlaylistMeta,
  type PlaylistLocalMeta,
} from '@/features/playlists/playlist-transitions';
import { updatePlaylistMeta as apiUpdatePlaylistMeta } from '@/features/playlists/api/playlists-api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { PlaylistEditorView } from './studio/components/playlist-editor-view';
import { PlaylistPreviewOverlay } from './playlist-preview-overlay';

import { usePlaylistData } from './studio/hooks/use-playlist-data';
import { usePlaylistActions } from './studio/hooks/use-playlist-actions';
import { useTimelineEdit } from './studio/hooks/use-timeline-edit';
import { usePlaylistMeta } from './studio/hooks/use-playlist-meta';

import type { Row, Zone, SaveState, SelectionContext } from './studio/types';

export function PlaylistStudioClient({ initialPlaylistId }: { initialPlaylistId?: string } = {}) {
  const t = useTranslations('playlistStudioClient');
  const locale = useLocale();
  const router = useRouter();
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const currentWs = workspaces.find((w) => w.id === workspaceId);
  const canPublish = Boolean(
    currentWs && (currentWs.role === 'OWNER' || currentWs.role === 'ADMIN'),
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
    if (initialPlaylistId) {
      router.push(`/${locale}/content/playlists/${initialPlaylistId}` as Route);
    } else {
      router.push(`/${locale}/content/playlists` as Route);
    }
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
    return <p className="text-[15px] text-muted-foreground">{t('selectWorkspaceFirst')}</p>;
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
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
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
      onAssignScreens={() => router.push(`/${locale}/content/playlists/${playlistId}` as Route)}
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
                if (initialPlaylistId) {
                  router.push(`/${locale}/content/playlists/${initialPlaylistId}` as Route);
                } else {
                  router.push(`/${locale}/content/playlists` as Route);
                }
              }
              setShowUnsavedDialog(false);
            }}>{t('discard')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await handleSave();
              if (pendingBackRef.current) {
                pendingBackRef.current = false;
                if (initialPlaylistId) {
                  router.push(`/${locale}/content/playlists/${initialPlaylistId}` as Route);
                } else {
                  router.push(`/${locale}/content/playlists` as Route);
                }
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
    </>
  );
}
