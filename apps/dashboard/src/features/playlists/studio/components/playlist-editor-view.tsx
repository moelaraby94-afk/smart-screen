'use client';

import { DragDropContext } from '@hello-pangea/dnd';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PlaylistTopBar } from './playlist-top-bar';
import { MediaLibrary } from './media-library';
import { InspectorPanel } from './inspector-panel';
import { PlaylistZonePreview, type Zone } from '@/features/playlists/playlist-zone-preview';
import { PlaylistTimeline, type Row } from '@/features/playlists/playlist-timeline';
import type { DropResult } from '@hello-pangea/dnd';
import type { PlaylistLocalMeta, TransitionType, PlaylistOrientation } from '@/features/playlists/playlist-transitions';
import type { ZonePreset, SelectionContext, SaveState } from '../types';
import type { MediaItem } from '@/features/media/media-library-client';
import type { CanvasSummary } from '@/features/playlists/playlist-library-panels';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';
import type { LucideIcon } from 'lucide-react';

type PlaylistEditorViewProps = {
  // Top bar
  playlistName: string;
  isPublished: boolean;
  canPublish: boolean;
  orientationIcon: LucideIcon;
  itemCount: number;
  undoStackLen: number;
  redoStackLen: number;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onNameChange: (name: string) => void;
  onNameBlur: () => void;
  onSave: () => void;
  saveState: SaveState;
  onTogglePublish: () => void;
  togglingPublish: boolean;
  onDuplicate: () => void;
  duplicating: boolean;
  onClone: (targetWs: string) => void;
  cloning: boolean;
  cloneTargetWs: string;
  setCloneTargetWs: (ws: string) => void;
  workspaces: WorkspaceSummary[];
  workspaceId: string | null;

  // Media library
  library: MediaItem[];
  canvasLibrary: CanvasSummary[];
  onUploadComplete: () => void;

  // Preview
  rowsByZone: Record<string, Row[]>;
  zones: Zone[];
  defaultTransition: TransitionType;
  transitionDuration: number;
  orientation: PlaylistOrientation;
  layoutType: 'single' | 'multi_zone';
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  canvasWidth: number;
  canvasHeight: number;

  // Timeline
  currentZoneRows: Row[];
  onUpdateDuration: (clientId: string, value: number) => void;
  onRemoveRow: (clientId: string) => void;
  onMoveRow: (index: number, delta: -1 | 1) => void;
  onDuplicateRow: (clientId: string) => void;
  onUpdateRowTransition: (clientId: string, transition: TransitionType) => void;
  onSelectRow?: (clientId: string | null) => void;
  selectedRowClientId?: string | null;

  // Inspector
  playlistMeta: PlaylistLocalMeta;
  updatePlaylistMeta: (patch: Partial<PlaylistLocalMeta>) => void;
  selectedZonePreset: ZonePreset | null;
  setSelectedZonePreset: (preset: ZonePreset | null) => void;
  zonePresets: ZonePreset[];
  setSelectedZoneId: (id: string) => void;
  selectionContext: SelectionContext;
  selectedRow: Row | null;
  onUpdateRowZone?: (clientId: string, zoneName: string | null) => void;

  // Drag
  onDragEnd: (result: DropResult) => void;

  onAssignScreens?: () => void;
  onPreview?: () => void;
};

export function PlaylistEditorView(props: PlaylistEditorViewProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="flex flex-col gap-3" role="toolbar" aria-label={t('studioEditor')}>
      <PlaylistTopBar
        playlistName={props.playlistName}
        isPublished={props.isPublished}
        canPublish={props.canPublish}
        orientationIcon={props.orientationIcon}
        itemCount={props.itemCount}
        undoStackLen={props.undoStackLen}
        redoStackLen={props.redoStackLen}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        onBack={props.onBack}
        onNameChange={props.onNameChange}
        onNameBlur={props.onNameBlur}
        onSave={props.onSave}
        saveState={props.saveState}
        onTogglePublish={props.onTogglePublish}
        togglingPublish={props.togglingPublish}
        onDuplicate={props.onDuplicate}
        duplicating={props.duplicating}
        onClone={props.onClone}
        cloning={props.cloning}
        cloneTargetWs={props.cloneTargetWs}
        setCloneTargetWs={props.setCloneTargetWs}
        workspaces={props.workspaces}
        workspaceId={props.workspaceId}
        onAssignScreens={props.onAssignScreens}
        onPreview={props.onPreview}
      />

      <DragDropContext onDragEnd={props.onDragEnd}>
        <div className="grid gap-3 xl:grid-cols-[280px_1fr_280px]">
          {/* Left: Media Library */}
          <div className="rounded-lg border border-border/60 bg-card/40 p-3 xl:order-1" role="region" aria-label={t('mediaLibrary')}>
            <MediaLibrary
              library={props.library}
              canvasLibrary={props.canvasLibrary}
              onUploadComplete={props.onUploadComplete}
              workspaceId={props.workspaceId}
              playlistMeta={props.playlistMeta}
            />
          </div>

          {/* Center: Preview + Timeline */}
          <div className="flex flex-col gap-3 xl:order-2">
            <PlaylistZonePreview
              rowsByZone={props.rowsByZone}
              zones={props.zones}
              defaultTransition={props.defaultTransition}
              transitionDuration={props.transitionDuration}
              orientation={props.orientation}
              layoutType={props.layoutType}
              selectedZoneId={props.selectedZoneId}
              onSelectZone={props.onSelectZone}
              canvasWidth={props.canvasWidth}
              canvasHeight={props.canvasHeight}
            />

            <div className="flex items-center gap-2 px-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{t('zoneTimeline')}</span>
              <Badge variant="muted" className="text-[10px]">
                {props.layoutType === 'single' ? t('singleZone') : (props.selectedZoneId ?? '—')}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {t('itemsCount', { count: props.currentZoneRows.length })}
              </span>
            </div>

            <PlaylistTimeline
              rows={props.currentZoneRows}
              onUpdateDuration={props.onUpdateDuration}
              onRemoveRow={props.onRemoveRow}
              onMoveRow={props.onMoveRow}
              onDuplicateRow={props.onDuplicateRow}
              onUpdateTransition={props.onUpdateRowTransition}
              onSelectRow={props.onSelectRow}
              selectedRowClientId={props.selectedRowClientId}
              defaultTransition={props.defaultTransition}
            />
          </div>

          {/* Right: Inspector */}
          <div className="xl:order-3" role="region" aria-label={t('inspector')}>
            <InspectorPanel
              selectionContext={props.selectionContext}
              playlistMeta={props.playlistMeta}
              updatePlaylistMeta={props.updatePlaylistMeta}
              selectedZonePreset={props.selectedZonePreset}
              setSelectedZonePreset={props.setSelectedZonePreset}
              zonePresets={props.zonePresets}
              selectedZoneId={props.selectedZoneId}
              setSelectedZoneId={props.setSelectedZoneId}
              presetW={props.canvasWidth}
              presetH={props.canvasHeight}
              selectedRow={props.selectedRow}
              onUpdateRowTransition={props.onUpdateRowTransition}
              onUpdateRowDuration={props.onUpdateDuration}
              onUpdateRowZone={props.onUpdateRowZone}
            />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
