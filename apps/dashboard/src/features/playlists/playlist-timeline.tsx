'use client';

import {
  Draggable,
  Droppable,
} from '@hello-pangea/dnd';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Layers,
  PenLine,
  Trash2,
  CopyPlus,
  Wand2,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type TransitionType,
  TRANSITIONS,
} from '@/features/playlists/playlist-transitions';
import type { Row } from './studio/types';

export type { Row };

type PlaylistTimelineProps = {
  rows: Row[];
  onUpdateDuration: (clientId: string, value: number) => void;
  onRemoveRow: (clientId: string) => void;
  onMoveRow: (index: number, delta: -1 | 1) => void;
  onDuplicateRow: (clientId: string) => void;
  onUpdateTransition: (clientId: string, transition: TransitionType) => void;
  onSelectRow?: (clientId: string | null) => void;
  selectedRowClientId?: string | null;
  defaultTransition: TransitionType;
};

export function PlaylistTimeline({
  rows,
  onUpdateDuration,
  onRemoveRow,
  onMoveRow,
  onDuplicateRow,
  onUpdateTransition,
  onSelectRow,
  selectedRowClientId,
  defaultTransition,
}: PlaylistTimelineProps) {
  const t = useTranslations('playlistStudioClient');
  const locale = useLocale();

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40" role="listbox" aria-label={t('programTimeline')}>
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t('programTimeline')}
        </h3>
        <span className="ms-auto font-mono-nums text-xs text-muted-foreground">
          {t('itemsCount', { count: rows.length })}
        </span>
      </div>
      <Droppable droppableId="playlist" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[min(50vh,480px)] space-y-2 p-3"
          >
            {rows.length === 0 && !provided.placeholder ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 py-12">
                <Layers className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t('dragHereHint')}</p>
              </div>
            ) : (
              rows.map((row, index) => {
                const rowTransition = row.transition ?? defaultTransition;
                return (
                <Draggable key={row.clientId} draggableId={row.clientId} index={index}>
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      role="option"
                      aria-selected={selectedRowClientId === row.clientId}
                      onClick={() => onSelectRow?.(selectedRowClientId === row.clientId ? null : row.clientId)}
                      className={cn(
                        'cursor-pointer rounded-xl border bg-background p-3 transition hover:border-primary/30 hover:shadow-sm',
                        selectedRowClientId === row.clientId ? 'border-primary ring-1 ring-primary/20' : 'border-border/60',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag handle + index */}
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className="text-muted-foreground/60 hover:text-foreground"
                            {...p.dragHandleProps}
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {row.kind === 'media' ? (
                            row.media.mimeType.startsWith('image/') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt={row.media.originalName} src={row.media.publicUrl} className="h-full w-full object-cover" />
                            ) : (
                              <video src={row.media.publicUrl} className="h-full w-full object-cover" muted playsInline />
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10">
                              <PenLine className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Info + controls */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {row.kind === 'media' ? row.media.originalName : row.canvas.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {row.kind === 'media' ? t('media') : t('canvas')}
                            </span>

                            {/* Duration */}
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={1}
                                className="h-7 w-16 rounded-md border-border/60 bg-background px-2 text-xs font-mono-nums"
                                value={row.durationSec}
                                onChange={(e) => onUpdateDuration(row.clientId, Number(e.target.value) || 1)}
                              />
                              <span className="text-[10px] text-muted-foreground">s</span>
                            </div>

                            {/* Transition */}
                            <div className="flex items-center gap-1">
                              <Wand2 className="h-3 w-3 text-primary/60" />
                              <select
                                className="h-7 rounded-md border border-border/60 bg-background px-1.5 text-[11px] outline-none focus:border-primary/40"
                                value={rowTransition}
                                onChange={(e) => onUpdateTransition(row.clientId, e.target.value as TransitionType)}
                                aria-label={t('transitionLabel')}
                                title={t('transitionLabel')}
                              >
                                {TRANSITIONS.map((tr) => (
                                  <option key={tr.id} value={tr.id}>
                                    {locale === 'ar' ? tr.nameAr : tr.nameEn}
                                  </option>
                                ))}
                              </select>
                              {row.transition && (
                                <button
                                  type="button"
                                  className="text-[10px] text-muted-foreground hover:text-primary"
                                  onClick={() => onUpdateTransition(row.clientId, defaultTransition)}
                                  title={t('resetTransition')}
                                >
                                  ↺
                                </button>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="ms-auto flex items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                disabled={index === 0}
                                title={t('moveUp')}
                                aria-label={t('moveUp')}
                                onClick={() => onMoveRow(index, -1)}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                disabled={index >= rows.length - 1}
                                title={t('moveDown')}
                                aria-label={t('moveDown')}
                                onClick={() => onMoveRow(index, 1)}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary"
                                title={t('duplicateItem')}
                                aria-label={t('duplicateItem')}
                                onClick={() => onDuplicateRow(row.clientId)}
                              >
                                <CopyPlus className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title={t('delete')}
                                aria-label={t('delete')}
                                onClick={() => onRemoveRow(row.clientId)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
                );
              })
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
