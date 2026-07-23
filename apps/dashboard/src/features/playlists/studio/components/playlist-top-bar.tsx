'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowLeft, Copy, Eye, EyeOff, FolderInput, MoreVertical,
  Redo2, Save, Undo2, MonitorPlay, Play, Send, CalendarPlus, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SaveState } from '../types';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';
import type { LucideIcon } from 'lucide-react';

type PlaylistTopBarProps = {
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
  onPublishToScreens?: () => void;
  onCreateSchedule?: () => void;
  onDeletePlaylist?: () => void;
  canEdit?: boolean;
  onPreview?: () => void;
};

export function PlaylistTopBar({
  playlistName,
  isPublished,
  canPublish,
  orientationIcon: Icon,
  itemCount,
  undoStackLen,
  redoStackLen,
  onUndo,
  onRedo,
  onBack,
  onNameChange,
  onNameBlur,
  onSave,
  saveState,
  onTogglePublish,
  togglingPublish,
  onDuplicate,
  duplicating,
  onClone,
  cloning,
  cloneTargetWs,
  setCloneTargetWs,
  workspaces,
  workspaceId,
  onPublishToScreens,
  onCreateSchedule,
  onDeletePlaylist,
  canEdit = false,
  onPreview,
}: PlaylistTopBarProps) {
  const t = useTranslations('playlistStudioClient');

  const saveLabel = saveState === 'saving'
    ? t('saving')
    : saveState === 'saved'
    ? t('saved')
    : saveState === 'unsaved'
    ? t('unsavedChanges')
    : t('savePlaylist');

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg" onClick={onBack} title={t('backToList')} aria-label={t('backToList')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <Input
          value={playlistName}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-9 max-w-[220px] rounded-lg border-transparent bg-transparent text-base font-bold hover:border-border focus:border-border"
          onBlur={onNameBlur}
        />
        {isPublished && (
          <Badge variant="success" className="shrink-0">
            <Eye className="me-1 h-3 w-3" />
            {t('publishedBadge')}
          </Badge>
        )}
        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
          <MonitorPlay className="h-3.5 w-3.5" />
          {itemCount}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" disabled={undoStackLen === 0} onClick={onUndo} title={t('undo')} aria-label={t('undo')}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" disabled={redoStackLen === 0} onClick={onRedo} title={t('redo')} aria-label={t('redo')}>
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
            <DropdownMenuItem onClick={onDuplicate} disabled={duplicating}>
              <Copy className="me-2 h-4 w-4" />
              {duplicating ? t('duplicating') : t('duplicate')}
            </DropdownMenuItem>
            {onCreateSchedule && (
              <DropdownMenuItem onClick={onCreateSchedule}>
                <CalendarPlus className="me-2 h-4 w-4" />
                {t('createSchedule')}
              </DropdownMenuItem>
            )}
            {canEdit && onDeletePlaylist && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDeletePlaylist} className="text-destructive focus:text-destructive">
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('deletePlaylist')}
                </DropdownMenuItem>
              </>
            )}
            {workspaces.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onClone(cloneTargetWs)}
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

        {onPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={onPreview}
          >
            <Play className="me-1.5 h-4 w-4" />
            {t('preview')}
          </Button>
        )}

        <Button
          variant="cta"
          size="sm"
          className={cn('rounded-lg', saveState === 'unsaved' && 'ring-2 ring-primary/30')}
          onClick={onSave}
          disabled={saveState === 'saving'}
        >
          <Save className="me-1.5 h-4 w-4" />
          {saveLabel}
        </Button>

        {canPublish ? (
          <Button
            variant={isPublished ? 'outline' : 'default'}
            size="sm"
            className="rounded-lg"
            disabled={togglingPublish}
            onClick={onTogglePublish}
          >
            {isPublished ? <EyeOff className="me-1.5 h-4 w-4" /> : <Eye className="me-1.5 h-4 w-4" />}
            {isPublished ? t('unpublish') : t('publish')}
          </Button>
        ) : !isPublished ? (
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => toast.info(t('submittedForReview'))}>
            <Eye className="me-1.5 h-4 w-4" />
            {t('submitForReview')}
          </Button>
        ) : null}

        {onPublishToScreens && (
          <Button variant="outline" size="sm" className="rounded-lg" onClick={onPublishToScreens}>
            <Send className="me-1.5 h-4 w-4" />
            {t('publishToScreens')}
          </Button>
        )}
      </div>
    </div>
  );
}
