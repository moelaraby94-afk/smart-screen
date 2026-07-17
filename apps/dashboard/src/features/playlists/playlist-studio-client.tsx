'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Monitor, MonitorOff, Smartphone, Square } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { makeZonePresets, type ZonePreset } from '@/features/studio/canvas-layout';
import {
  DEFAULT_PLAYLIST_META,
  loadPlaylistMeta,
} from '@/features/playlists/playlist-transitions';
import { updatePlaylistMeta as apiUpdatePlaylistMeta } from '@/features/studio/studio-api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { PlaylistHeader } from './studio/components/playlist-header';
import { WorkspaceTabs } from './studio/components/workspace-tabs';
import { GroupSidebar } from './studio/components/group-sidebar';
import { PlaylistGridView } from './studio/components/playlist-grid-view';
import { PlaylistEditorView } from './studio/components/playlist-editor-view';
import { PlaylistPreviewOverlay } from './playlist-preview-overlay';

import { usePlaylistData } from './studio/hooks/use-playlist-data';
import { usePlaylistActions } from './studio/hooks/use-playlist-actions';
import { useGroupActions } from './studio/hooks/use-group-actions';
import { useTimelineEdit } from './studio/hooks/use-timeline-edit';
import { usePlaylistMeta } from './studio/hooks/use-playlist-meta';

import type { Row, Zone, SaveState, SelectionContext } from './studio/types';

export function PlaylistStudioClient() {
  const t = useTranslations('playlistStudioClient');
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const currentWs = workspaces.find((w) => w.id === workspaceId);
  const canPublish = Boolean(
    currentWs && (currentWs.role === 'OWNER' || currentWs.role === 'ADMIN'),
  );

  // ── State ──────────────────────────────────────────────
  const [playlistId, setPlaylistId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [playlistSort, setPlaylistSort] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'editor'>('grid');
  const [selectedZonePreset, setSelectedZonePreset] = useState<ZonePreset | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('full');
  const [cloneTargetWs, setCloneTargetWs] = useState('');
  const [search, setSearch] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [selectedRowClientId, setSelectedRowClientId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const pendingBackRef = useRef(false);

  // Account-level state
  const [filterWorkspaceId, setFilterWorkspaceId] = useState<string>('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameGroupValue, setRenameGroupValue] = useState('');

  // ── Hooks ──────────────────────────────────────────────
  const { playlistMeta, setPlaylistMeta, updatePlaylistMeta } = usePlaylistMeta(playlistId);

  const skipHistoryRef = useRef(false);

  const {
    library, canvasLibrary, playlists, groups, loading,
    setPlaylists, loadPlaylists, loadGroups, loadLibrary, loadPlaylistDetail,
  } = usePlaylistData(
    workspaceId, filterWorkspaceId, filterGroupId,
    setRows, null, null, skipHistoryRef,
  );

  const {
    togglingPublish, duplicating, cloning,
    createPlaylist, savePlaylist, togglePublish,
    duplicatePlaylist, duplicatePlaylistById, cloneToWorkspace, handleDeletePlaylist,
  } = usePlaylistActions({
    workspaceId, filterWorkspaceId, filterGroupId,
    loadPlaylists, loadPlaylistDetail, bumpWorkspaceDataEpoch,
    setPlaylists, setPlaylistId, setNewName,
  });

  const { handleCreateGroup, handleRenameGroup, handleDeleteGroup, handleMoveGroup } = useGroupActions({
    loadGroups, loadPlaylists, filterGroupId, setFilterGroupId,
    setNewGroupName, setRenamingGroupId, setRenameGroupValue,
  });

  const {
    undoStack, redoStack, undo, redo, onDragEnd,
    updateDuration, removeRow, moveRow, duplicateRow, updateRowTransition,
  } = useTimelineEdit({
    rows, setRows, playlistMeta, selectedZoneId, playlistId,
    mediaLibrary: library, canvasLibrary, skipHistoryRef,
  });

  // ── Effects ────────────────────────────────────────────
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
  }, [playlistId, loadPlaylistDetail, setPlaylistMeta]);

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
    } else if (viewMode === 'editor' && rows !== lastSavedRowsRef.current) {
      setSaveState('unsaved');
    }
  }, [rows, viewMode]);

  // ── Derived values ─────────────────────────────────────
  const sortedPlaylists = useMemo(() => {
    const sorted = [...playlists];
    const q = search.trim().toLowerCase();
    const filtered = q ? sorted.filter((p) => p.name.toLowerCase().includes(q)) : sorted;
    filtered.sort((a, b) => {
      switch (playlistSort) {
        case 'items': return b._count.items - a._count.items;
        case 'screens': return (b._count.screensInGroup ?? 0) - (a._count.screensInGroup ?? 0);
        case 'name': default: return a.name.localeCompare(b.name);
      }
    });
    return filtered;
  }, [playlists, playlistSort, search]);

  const selectedPlaylist = playlists.find((p) => p.id === playlistId);
  const orientationIcon = playlistMeta.orientation === 'portrait' ? Smartphone : playlistMeta.orientation === 'square' ? Square : Monitor;
  const presetW = playlistMeta.orientation === 'portrait' ? 1080 : playlistMeta.orientation === 'square' ? 1080 : 1920;
  const presetH = playlistMeta.orientation === 'portrait' ? 1920 : playlistMeta.orientation === 'square' ? 1080 : 1080;
  const zonePresets = makeZonePresets(presetW, presetH);

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

  // ── Stats ──────────────────────────────────────────────
  const publishedCount = playlists.filter((p) => p.isPublished).length;
  const draftCount = playlists.length - publishedCount;

  // ── Handlers ───────────────────────────────────────────
  const openPlaylist = (id: string) => setPlaylistId(id);
  const backToGrid = () => {
    if (saveState === 'unsaved') {
      pendingBackRef.current = true;
      setShowUnsavedDialog(true);
      return;
    }
    setPlaylistId('');
    setViewMode('grid');
    setSelectedRowClientId(null);
  };

  const handleSave = async () => {
    setSaveState('saving');
    await savePlaylist(playlistId, rows);
    lastSavedRowsRef.current = rows;
    setSaveState('saved');
  };

  const handleNameBlur = () => {
    if (workspaceId && selectedPlaylist) {
      void apiUpdatePlaylistMeta(workspaceId, playlistId, { name: selectedPlaylist.name });
    }
  };

  const handleNameChange = (name: string) => {
    setPlaylists((prev) => prev.map((p) => p.id === playlistId ? { ...p, name } : p));
  };

  const handleTogglePublish = () => {
    if (selectedPlaylist) void togglePublish(playlistId, selectedPlaylist.isPublished);
  };

  if (!workspaceId) {
    return <p className="text-[15px] text-muted-foreground">{t('selectWorkspaceFirst')}</p>;
  }

  // ── Grid View ──────────────────────────────────────────
  if (viewMode === 'grid' || !playlistId) {
    return (
      <div className="space-y-5">
        <PlaylistHeader
          total={playlists.length}
          published={publishedCount}
          draft={draftCount}
        />
        <WorkspaceTabs
          workspaces={workspaces}
          filterWorkspaceId={filterWorkspaceId}
          setFilterWorkspaceId={setFilterWorkspaceId}
        />
        <div className="flex flex-col gap-4 xl:flex-row">
          <GroupSidebar
            groups={groups}
            totalPlaylists={playlists.length}
            filterGroupId={filterGroupId}
            setFilterGroupId={setFilterGroupId}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            onCreateGroup={handleCreateGroup}
            renamingGroupId={renamingGroupId}
            setRenamingGroupId={setRenamingGroupId}
            renameGroupValue={renameGroupValue}
            setRenameGroupValue={setRenameGroupValue}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onMoveGroup={handleMoveGroup}
          />
          <PlaylistGridView
            loading={loading}
            playlists={sortedPlaylists}
            workspaces={workspaces}
            search={search}
            setSearch={setSearch}
            playlistSort={playlistSort}
            setPlaylistSort={setPlaylistSort}
            newName={newName}
            setNewName={setNewName}
            onCreatePlaylist={createPlaylist}
            onOpenPlaylist={openPlaylist}
            onDuplicatePlaylist={duplicatePlaylistById}
            onDeletePlaylist={handleDeletePlaylist}
          />
        </div>
      </div>
    );
  }

  // ── Editor View ────────────────────────────────────────

  // Mobile guard — Studio editor is desktop-only
  if (viewportWidth < 768) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-border p-8 text-center">
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
      setSelectedZonePreset={setSelectedZonePreset}
      zonePresets={zonePresets}
      setSelectedZoneId={setSelectedZoneId}
      selectionContext={selectionContext}
      selectedRow={selectedRow}
      onDragEnd={onDragEnd}
      onPreview={() => setPreviewOpen(true)}
    />

      <PlaylistPreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rows={currentZoneRows}
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
                setPlaylistId('');
                setViewMode('grid');
                setSelectedRowClientId(null);
              }
              setShowUnsavedDialog(false);
            }}>{t('discard')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await handleSave();
              if (pendingBackRef.current) {
                pendingBackRef.current = false;
                setPlaylistId('');
                setViewMode('grid');
                setSelectedRowClientId(null);
              }
              setShowUnsavedDialog(false);
            }}>{t('save')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
