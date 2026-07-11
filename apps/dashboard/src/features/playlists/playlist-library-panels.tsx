'use client';

import {
  Draggable,
  Droppable,
} from '@hello-pangea/dnd';
import {
  Film,
  GripVertical,
  ImageIcon,
  Library,
  PenLine,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MediaItem } from '@/features/media/media-library-client';

export type CanvasSummary = {
  id: string;
  name: string;
};

type MediaLibraryPanelProps = {
  library: MediaItem[];
};

export function MediaLibraryPanel({ library }: MediaLibraryPanelProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-1">
      <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
        <Library className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t('mediaLibrary')}
        </h3>
        <span className="ms-auto font-mono-nums text-xs text-muted-foreground">
          {t('assetsCount', { count: library.length })}
        </span>
      </div>
      <Droppable droppableId="library" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="max-h-[min(52vh,520px)] space-y-2 overflow-y-auto p-4"
          >
            {library.map((m, index) => (
              <Draggable key={m.id} draggableId={`lib-${m.id}`} index={index}>
                {(p) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/80 px-3 py-2.5 shadow-sm transition hover:scale-[1.01] hover:shadow-md dark:bg-card/50"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {m.mimeType.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          src={m.publicUrl}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={m.publicUrl}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      )}
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 p-0.5">
                        {m.mimeType.startsWith('video/') ? (
                          <Film className="h-2.5 w-2.5 text-primary" />
                        ) : (
                          <ImageIcon className="h-2.5 w-2.5 text-white" />
                        )}
                      </span>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                      {m.originalName}
                    </span>
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

type CanvasLibraryPanelProps = {
  canvasLibrary: CanvasSummary[];
};

export function CanvasLibraryPanel({ canvasLibrary }: CanvasLibraryPanelProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-1">
      <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
        <PenLine className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t('canvasDesigns')}
        </h3>
        <span className="ms-auto font-mono-nums text-xs text-muted-foreground">
          {t('designsCount', { count: canvasLibrary.length })}
        </span>
      </div>
      <Droppable droppableId="canvas-library" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="max-h-[min(40vh,400px)] space-y-2 overflow-y-auto p-4"
          >
            {canvasLibrary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('canvasEmpty')}
              </p>
            ) : (
              canvasLibrary.map((c, index) => (
                <Draggable key={c.id} draggableId={`cvs-${c.id}`} index={index}>
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                      className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/80 px-3 py-2.5 shadow-sm transition hover:scale-[1.01] hover:shadow-md dark:bg-card/50"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
                        <PenLine className="h-5 w-5 text-white" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                        {c.name}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
