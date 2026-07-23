'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Film, Folder, FolderPlus, ImageIcon, Info, ListPlus, Pencil, Trash2, X, Zap, LayoutGrid, Table as TableIcon, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MediaPreviewImage, MediaPreviewVideo } from '@/features/media/media-preview-components';
import { QuickPublishDialog } from '@/features/playlists/quick-publish-dialog';
import type { MediaItem } from '@/features/media/media-library-client';

function getExpiryBadge(m: MediaItem, t: ReturnType<typeof useTranslations<'mediaClient'>>) {
  if (!m.expiresAt) return null;
  const expiry = new Date(m.expiresAt);
  const now = new Date();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (expiry < now) {
    return { label: t('expired'), className: 'bg-destructive/15 text-destructive', icon: AlertTriangle };
  }
  if (expiry.getTime() - now.getTime() < sevenDays) {
    return { label: t('expiringSoon'), className: 'bg-warning/15 text-warning', icon: Clock };
  }
  return null;
}

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
    <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
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
            <button type="button" onClick={() => props.onDeleteFolder(folder.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
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
  canEdit: boolean;
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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
            <span className="font-mono-nums text-foreground">{new Intl.NumberFormat(props.locale).format(props.items.length)}</span> {t('files', { count: props.items.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {props.selectedIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">
                {props.selectedIds.size} {t('selected')}
              </span>
              {props.canEdit && (
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
              )}
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
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {props.isDragActive ? t('releaseToAdd') : t('dropMore')}
              </p>
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition',
                    viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-label={t('viewCards')}
                  aria-pressed={viewMode === 'cards'}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition',
                    viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-label={t('viewTable')}
                  aria-pressed={viewMode === 'table'}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="vc-table-head-surface">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colName')}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colType')}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colSize')}</th>
                {props.scope === 'branch' && <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colFolder')}</th>}
                <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colCreated')}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colExpiry')}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {props.filteredItems.map((m) => (
                <tr key={m.id} className="vc-table-row border-t">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => props.onToggleSelect(m.id)}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border-2 transition',
                        props.selectedIds.has(m.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-transparent hover:border-primary',
                      )}
                      aria-label={t('select')}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-foreground">{m.originalName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      {m.mimeType.startsWith('video/') ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      {m.mimeType.startsWith('video/') ? t('video') : t('image')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono-nums text-muted-foreground">{new Intl.NumberFormat(props.locale, { maximumFractionDigits: 2 }).format(m.sizeBytes / 1024 / 1024)} MB</td>
                  {props.scope === 'branch' && (
                    <td className="px-4 py-3 text-muted-foreground">{m.folderName ?? t('noFolder')}</td>
                  )}
                  <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString(props.locale)}</td>
                  <td className="px-4 py-3">
                    {(() => { const badge = getExpiryBadge(m, t); return badge ? (
                      <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold', badge.className)}>
                        <badge.icon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    ); })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {props.canEdit && (
                      <QuickPublishDialog media={m}>
                        <button type="button" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t('quickPublish')}>
                          <Zap className="h-4 w-4" />
                        </button>
                      </QuickPublishDialog>
                      )}
                      <a href={m.publicUrl} download={m.originalName} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t('download')}>
                        <Download className="h-4 w-4" />
                      </a>
                      <button type="button" onClick={() => props.onAddToPlaylist(m)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t('addToPlaylist')}>
                        <ListPlus className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => props.onInfo(m)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t('info')}>
                        <Info className="h-4 w-4" />
                      </button>
                      {props.canEdit && (
                      <button type="button" onClick={() => props.onDelete(m)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={t('delete')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {props.filteredItems.map((m, i) => (
            <motion.div
              key={m.workspaceId ? `${m.workspaceId}-${m.id}` : m.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              className="ngl-media-tile group relative overflow-hidden rounded-lg"
              role="img"
              aria-label={`${m.originalName}, ${m.mimeType.startsWith('video/') ? t('video') : t('image')}, ${new Intl.NumberFormat(props.locale, { maximumFractionDigits: 2 }).format(m.sizeBytes / 1024 / 1024)} MB`}
            >
              <div className="relative aspect-[4/3] bg-black/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onToggleSelect(m.id);
                  }}
                  className={cn(
                    'absolute start-2 top-2 z-card flex h-6 w-6 items-center justify-center rounded-lg border-2 transition',
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
                <div className="absolute start-2 top-2 flex items-center gap-1 rounded-lg border border-border bg-card/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm">
                  {m.mimeType.startsWith('video/') ? (
                    <Film className="ngl-media-icon-accent h-3 w-3" />
                  ) : (
                    <ImageIcon className="ngl-media-icon-accent h-3 w-3" />
                  )}
                  {m.mimeType.startsWith('video/') ? t('video') : t('image')}
                </div>
                <div className="absolute end-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                  {(() => { const badge = getExpiryBadge(m, t); return badge ? (
                    <span className={cn('flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold', badge.className)}>
                      <badge.icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  ) : null; })()}
                  {props.canEdit && (
                  <QuickPublishDialog media={m}>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90 hover:text-primary-foreground"
                      aria-label={t('quickPublish')}
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </QuickPublishDialog>
                  )}
                  <a
                    href={m.publicUrl}
                    download={m.originalName}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90 hover:text-primary-foreground"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90 hover:text-primary-foreground"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-primary/90 hover:text-primary-foreground"
                    aria-label={t('info')}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  {props.canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onDelete(m);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-white shadow-lg backdrop-blur transition hover:bg-destructive/90 hover:text-destructive-foreground"
                    aria-label={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  )}
                </div>
              </div>
              <div className="space-y-1 p-3">
                {props.scope === 'branch' && props.canEdit ? (
                  <select
                    className="h-7 w-full rounded-lg border border-border bg-background px-2 text-xs"
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
                  <p className="mb-1 truncate text-xs font-bold uppercase tracking-wide text-primary">
                    {m.workspaceName}
                  </p>
                ) : null}
                <p className="truncate text-sm font-medium leading-tight text-foreground">
                  {m.originalName}
                </p>
                <p className="font-mono-nums text-xs text-muted-foreground">
                  {new Intl.NumberFormat(props.locale, { maximumFractionDigits: 2 }).format(m.sizeBytes / 1024 / 1024)} MB
                </p>
                {(() => { const badge = getExpiryBadge(m, t); return badge ? (
                  <span className={cn('mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold', badge.className)}>
                    <badge.icon className="h-3 w-3" />
                    {badge.label}
                  </span>
                ) : null; })()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
