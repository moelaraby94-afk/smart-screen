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
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MediaItem } from '@/features/media/media-library-client';
import type { CanvasSummary } from './playlist-library-panels';

export type Row =
  | {
      clientId: string;
      kind: 'media';
      mediaId: string;
      durationSec: number;
      media: MediaItem;
    }
  | {
      clientId: string;
      kind: 'canvas';
      canvasId: string;
      durationSec: number;
      canvas: CanvasSummary;
    };

type PlaylistTimelineProps = {
  rows: Row[];
  onUpdateDuration: (clientId: string, value: number) => void;
  onRemoveRow: (clientId: string) => void;
  onMoveRow: (index: number, delta: -1 | 1) => void;
};

export function PlaylistTimeline({
  rows,
  onUpdateDuration,
  onRemoveRow,
  onMoveRow,
}: PlaylistTimelineProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-1 shadow-inner">
      <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
        <Layers className="h-5 w-5 text-primary" />
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
            className="min-h-[min(60vh,560px)] space-y-2 p-4"
          >
            {rows.map((row, index) => (
              <Draggable key={row.clientId} draggableId={row.clientId} index={index}>
                {(p) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-1 text-muted-foreground"
                        {...p.dragHandleProps}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {row.kind === 'media' ? (
                          row.media.mimeType.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={row.media.originalName}
                              src={row.media.publicUrl}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <video
                              src={row.media.publicUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                            />
                          )
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <PenLine className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="truncate text-[15px] font-semibold text-foreground">
                          {row.kind === 'media'
                            ? row.media.originalName
                            : row.canvas.name}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                          {row.kind === 'media' ? t('media') : t('canvas')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs">{t('durationSec')}</Label>
                            {row.kind === 'media' &&
                            row.media.mimeType.startsWith('image/') ? (
                              <p className="max-w-[14rem] text-[11px] leading-snug text-muted-foreground">
                                {t('imageDurationHint')}
                              </p>
                            ) : null}
                          </div>
                          <Input
                            type="number"
                            min={1}
                            className="h-9 w-24 rounded-lg font-mono-nums"
                            value={row.durationSec}
                            onChange={(e) =>
                              onUpdateDuration(row.clientId, Number(e.target.value) || 1)
                            }
                          />
                          <div className="ms-auto flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 shrink-0 rounded-lg"
                              disabled={index === 0}
                              title={t('moveUp')}
                              onClick={() => onMoveRow(index, -1)}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 shrink-0 rounded-lg"
                              disabled={index >= rows.length - 1}
                              title={t('moveDown')}
                              onClick={() => onMoveRow(index, 1)}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                              onClick={() => onRemoveRow(row.clientId)}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              {t('delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
