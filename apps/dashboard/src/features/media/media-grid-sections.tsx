'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Film, Folder, FolderPlus, ImageIcon, Info, ListPlus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MediaPreviewImage, MediaPreviewVideo } from '@/features/media/media-preview-components';
import type { MediaItem } from '@/features/media/media-library-client';

export type MediaFolder = {
  id: string;
  name: string;
  createdAt: string;
  _count: { medias: number };
};

type FolderSectionProps = {
  folders: MediaFolder[];
  selectedFolderId: string;
  setSelectedFolderId: (v: string) => void;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folderId: string, current: string) => void;
  onDeleteFolder: (folderId: string) => void;
};

export function FolderSection(props: FolderSectionProps) {
  const t = useTranslations('mediaClient');

  return (
    <div className="vc-card-surface rounded-2xl border border-border/70 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Folder className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{t('foldersTitle')}</p>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => props.setSelectedFolderId('all')}
          className={cn(
            'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors',
            props.selectedFolderId === 'all'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {t('allFolders')}
        </button>
        {props.folders.map((folder) => (
          <div key={folder.id} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => props.setSelectedFolderId(folder.id)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors',
                props.selectedFolderId === folder.id
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {folder.name} ({folder._count.medias})
            </button>
            <button type="button" onClick={() => props.onRenameFolder(folder.id, folder.name)} className="rounded p-1 text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => props.onDeleteFolder(folder.id)} className="rounded p-1 text-muted-foreground hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={props.newFolderName}
          onChange={(e) => props.setNewFolderName(e.target.value)}
          placeholder={t('folderNamePlaceholder')}
          className="h-9 min-w-[220px] rounded-lg border border-border bg-background px-3 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          onClick={props.onCreateFolder}
          disabled={!props.newFolderName.trim()}
        >
          <FolderPlus className="me-1 h-4 w-4" />
          {t('createFolder')}
        </Button>
      </div>
    </div>
  );
}

type MediaGridProps = {
  items: MediaItem[];
  filteredItems: MediaItem[];
  locale: string;
  scope: 'branch' | 'all';
  workspaceId: string | null;
  folders: MediaFolder[];
  isDragActive: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onDelete: (item: MediaItem) => void;
  onMoveMedia: (mediaId: string, folderId: string) => void;
  onInfo: (item: MediaItem) => void;
  onAddToPlaylist: (item: MediaItem) => void;
};

export function MediaGrid(props: MediaGridProps) {
  const t = useTranslations('mediaClient');
  const allSelected = props.selectedIds.size > 0 && props.selectedIds.size === props.filteredItems.length;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={props.onToggleSelectAll}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg border transition',
              allSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            aria-label={t('selectAll')}
          >
            {allSelected && <Check className="h-4 w-4" />}
          </button>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono-nums text-foreground">{new Intl.NumberFormat(props.locale).format(props.items.length)}</span> {t('files')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {props.selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">
                {props.selectedIds.size} {t('selected')}
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-lg"
                onClick={props.onBulkDelete}
              >
                <Trash2 className="me-1 h-3.5 w-3.5" />
                {t('deleteSelected')}
              </Button>
              <button
                type="button"
                onClick={props.onClearSelection}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label={t('clearSelection')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {props.isDragActive ? t('releaseToAdd') : t('dropMore')}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {props.filteredItems.map((m, i) => (
            <motion.div
              key={m.workspaceId ? `${m.workspaceId}-${m.id}` : m.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              className="ngl-media-tile group relative overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-[4/3] bg-black/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onToggleSelect(m.id);
                  }}
                  className={cn(
                    'absolute start-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition',
                    props.selectedIds.has(m.id)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-white/70 bg-black/40 text-transparent hover:border-white',
                  )}
                  aria-label={t('select')}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                {m.mimeType.startsWith('image/') ? (
                  <MediaPreviewImage src={m.publicUrl} alt="" />
                ) : (
                  <MediaPreviewVideo src={m.publicUrl} />
                )}
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg border border-border bg-card/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm">
                  {m.mimeType.startsWith('video/') ? (
                    <Film className="ngl-media-icon-accent h-3 w-3" />
                  ) : (
                    <ImageIcon className="ngl-media-icon-accent h-3 w-3" />
                  )}
                  {m.mimeType.startsWith('video/') ? t('video') : t('image')}
                </div>
                <div className="absolute end-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                  <a
                    href={m.publicUrl}
                    download={m.originalName}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90"
                    aria-label={t('download')}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onAddToPlaylist(m);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90"
                    aria-label={t('addToPlaylist')}
                  >
                    <ListPlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onInfo(m);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90"
                    aria-label={t('info')}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onDelete(m);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-red-600/90"
                    aria-label={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 p-3">
                {props.scope === 'branch' ? (
                  <select
                    className="h-7 w-full rounded border border-border bg-background px-2 text-[11px]"
                    value={m.folderId ?? 'all'}
                    aria-label={t('moveToFolderAria', { name: m.originalName })}
                    onChange={(e) => {
                      void props.onMoveMedia(m.id, e.target.value);
                    }}
                  >
                    <option value="all">{t('noFolder')}</option>
                    {props.folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                {m.workspaceName ? (
                  <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-wide text-primary">
                    {m.workspaceName}
                  </p>
                ) : null}
                <p className="truncate text-sm font-medium leading-tight text-foreground">
                  {m.originalName}
                </p>
                <p className="font-mono-nums text-xs text-muted-foreground">
                  {new Intl.NumberFormat(props.locale, { maximumFractionDigits: 2 }).format(m.sizeBytes / 1024 / 1024)} MB
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
