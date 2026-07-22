'use client';

import { useRef, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import {
  Film, GripVertical, ImageIcon, Library, PenLine, Upload, Search, Clock, AlertTriangle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { MediaItem } from '@/features/media/media-library-client';
import { uploadMedia as apiUploadMedia } from '@/features/media/api/media-api';
import type { CanvasSummary } from '@/features/playlists/playlist-library-panels';
import type { PlaylistLocalMeta } from '@/features/playlists/playlist-transitions';

type MediaLibraryProps = {
  library: MediaItem[];
  canvasLibrary: CanvasSummary[];
  onUploadComplete: () => void;
  workspaceId: string | null;
  playlistMeta?: PlaylistLocalMeta;
};

function isMediaOrientationMismatch(
  media: MediaItem,
  orientation: PlaylistLocalMeta['orientation'],
): boolean {
  if (!media.width || !media.height) return false;
  const isLandscape = media.width > media.height;
  const isPortrait = media.height > media.width;
  if (orientation === 'landscape' && isPortrait) return true;
  if (orientation === 'portrait' && isLandscape) return true;
  return false;
}

export function MediaLibrary({ library, canvasLibrary, onUploadComplete, workspaceId, playlistMeta }: MediaLibraryProps) {
  const t = useTranslations('playlistStudioClient');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('media');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? library.filter((m) => m.originalName.toLowerCase().includes(search.trim().toLowerCase()))
    : library;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await apiUploadMedia(workspaceId, file);
        if (!res.ok) {
          toast.error(t('uploadFailed'));
          return;
        }
      }
      toast.success(t('uploadSuccess'));
      onUploadComplete();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchMedia')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg ps-9"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 rounded-lg"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="me-1.5 h-4 w-4" />
          {uploading ? t('uploading') : t('upload')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="w-full">
          <TabsTrigger value="media" className="flex-1">
            <Library className="me-1.5 h-3.5 w-3.5" />
            {t('mediaTab')}
          </TabsTrigger>
          <TabsTrigger value="canvas" className="flex-1">
            <PenLine className="me-1.5 h-3.5 w-3.5" />
            {t('canvasTab')}
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-1">
            <Clock className="me-1.5 h-3.5 w-3.5" />
            {t('recent')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-0 flex-1 overflow-hidden">
          <Droppable droppableId="library" direction="vertical" isDropDisabled>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="max-h-[calc(100vh-280px)] space-y-1.5 overflow-y-auto p-1"
              >
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">{t('noMedia')}</p>
                ) : (
                  filtered.map((m, index) => (
                    <Draggable key={m.id} draggableId={`lib-${m.id}`} index={index}>
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-2.5 py-2 transition hover:border-primary/30 hover:bg-primary/[0.03]"
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {m.mimeType.startsWith('image/') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt={m.originalName} src={m.publicUrl} className="h-full w-full object-cover" />
                            ) : (
                              <video src={m.publicUrl} className="h-full w-full object-cover" muted playsInline />
                            )}
                            <span className="absolute bottom-0.5 end-0.5 rounded bg-black/60 p-0.5">
                              {m.mimeType.startsWith('video/') ? (
                                <Film className="h-2.5 w-2.5 text-primary" />
                              ) : (
                                <ImageIcon className="h-2.5 w-2.5 text-white" />
                              )}
                            </span>
                          </div>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                            {m.originalName}
                          </span>
                          {playlistMeta && isMediaOrientationMismatch(m, playlistMeta.orientation) && (
                            <span
                              title={t('orientationMismatchWarning')}
                              className="shrink-0 text-amber-500"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {m.width && m.height && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {m.width}×{m.height}
                            </span>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </TabsContent>

        <TabsContent value="canvas" className="mt-0 flex-1 overflow-hidden">
          <Droppable droppableId="canvas-library" direction="vertical" isDropDisabled>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="max-h-[calc(100vh-280px)] space-y-1.5 overflow-y-auto p-1"
              >
                {canvasLibrary.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">{t('canvasEmpty')}</p>
                ) : (
                  canvasLibrary.map((c, index) => (
                    <Draggable key={c.id} draggableId={`cvs-${c.id}`} index={index}>
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-2.5 py-2 transition hover:border-primary/30 hover:bg-primary/[0.03]"
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <PenLine className="h-4 w-4 text-primary" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
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
        </TabsContent>

        <TabsContent value="recent" className="mt-0 flex-1 overflow-hidden">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-1">
            {[...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-2.5 py-2 mb-1.5"
              >
                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {m.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={m.originalName} src={m.publicUrl} className="h-full w-full object-cover" />
                  ) : (
                    <video src={m.publicUrl} className="h-full w-full object-cover" muted playsInline />
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                  {m.originalName}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">{t('noMedia')}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
