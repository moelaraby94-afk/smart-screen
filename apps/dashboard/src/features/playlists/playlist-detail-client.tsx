'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Pencil,
  Play,
  Pause,
  Trash2,
  Copy,
  Monitor,
  Send,
  Image as ImageIcon,
  Video,
  CalendarPlus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { apiFetch } from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

type PlaylistItem = {
  id: string;
  kind: string;
  durationSec: number;
  media?: {
    id: string;
    publicUrl: string;
    mimeType: string;
    originalName: string;
    sizeBytes?: number;
  } | null;
  canvas?: { id: string; name: string } | null;
};

type PlaylistDetail = {
  id: string;
  name: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  items: PlaylistItem[];
};

type AssignedScreen = {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastSeenAt?: string | null;
};

export function PlaylistDetailClient({ playlistId }: { playlistId: string }) {
  const t = useTranslations('playlistDetail');
  const tStudio = useTranslations('playlistStudioClient');
  const locale = useLocale();
  const router = useRouter();
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [screens, setScreens] = useState<AssignedScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishScreens, setPublishScreens] = useState<AssignedScreen[]>([]);
  const [selectedScreenIds, setSelectedScreenIds] = useState<Set<string>>(new Set());
  const [publishingScreens, setPublishingScreens] = useState(false);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);

  const canEdit = (() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws && (ws.role === 'OWNER' || ws.role === 'ADMIN' || ws.role === 'EDITOR');
  })();

  const load = useCallback(async () => {
    if (!workspaceId || !playlistId) return;
    setLoading(true);
    try {
      const [plRes, scrRes] = await Promise.all([
        apiFetch(`/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}`),
        apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}&playlistId=${encodeURIComponent(playlistId)}`),
      ]);
      if (plRes.ok) {
        setPlaylist(await plRes.json());
      } else if (plRes.status === 404) {
        setNotFound(true);
      }
      if (scrRes.ok) {
        const data = await scrRes.json();
        const items = Array.isArray(data) ? data : data.items;
        setScreens(Array.isArray(items) ? items : []);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [workspaceId, playlistId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-rotate preview items
  useEffect(() => {
    if (!previewPlaying || !playlist || playlist.items.length === 0) return;
    const current = playlist.items[previewIndex];
    if (!current) return;
    const duration = current.durationSec * 1000;
    const timer = setTimeout(() => {
      setPreviewIndex((i) => (i + 1) % playlist.items.length);
    }, Math.min(duration, 10000));
    return () => clearTimeout(timer);
  }, [previewPlaying, playlist, previewIndex]);

  const handleDelete = async () => {
    if (!workspaceId) return;
    setDeleting(true);
    try {
      const res = await apiFetch(
        `/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}&force=true`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        toast.error(tStudio('couldNotDeletePlaylist'));
        return;
      }
      toast.success(tStudio('playlistDeleted'));
      bumpWorkspaceDataEpoch();
      router.push(`/${locale}/content` as never as Route);
    } catch {
      toast.error(tStudio('couldNotDeletePlaylist'));
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  const handleDuplicate = async () => {
    if (!workspaceId) return;
    setDuplicating(true);
    try {
      const res = await apiFetch(
        `/playlists/${playlistId}/duplicate?workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        void toastResponseError(res);
        return;
      }
      toast.success(tStudio('duplicated'));
      bumpWorkspaceDataEpoch();
    } catch {
      toast.error(tStudio('duplicateFailed'));
    }
    setDuplicating(false);
  };

  const handlePublish = async () => {
    if (!workspaceId) return;
    setPublishing(true);
    try {
      const res = await apiFetch(
        `/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !playlist?.isPublished }),
        },
      );
      if (!res.ok) {
        void toastResponseError(res);
        return;
      }
      toast.success(playlist?.isPublished ? tStudio('unpublished') : tStudio('published'));
      void load();
    } catch {
      toast.error(tStudio('publishFailed'));
    }
    setPublishing(false);
  };

  const openPublishDialog = async () => {
    if (!workspaceId) return;
    setPublishDialogOpen(true);
    setSelectedScreenIds(new Set());
    try {
      const res = await apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items;
        setPublishScreens(Array.isArray(items) ? items : []);
      }
    } catch {
      setPublishScreens([]);
    }
  };

  const toggleScreenSelection = (id: string) => {
    setSelectedScreenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllScreens = () => {
    setSelectedScreenIds((prev) => {
      if (prev.size === publishScreens.length) return new Set();
      return new Set(publishScreens.map((s) => s.id));
    });
  };

  const confirmPublishToScreens = async () => {
    if (!workspaceId || selectedScreenIds.size === 0) return;
    setPublishingScreens(true);
    try {
      let successCount = 0;
      for (const screenId of selectedScreenIds) {
        const res = await apiFetch(
          `/screens/${screenId}?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activePlaylistId: playlistId }),
          },
        );
        if (res.ok) successCount++;
      }
      if (successCount > 0) {
        if (!playlist?.isPublished) {
          await apiFetch(
            `/playlists/${playlistId}?workspaceId=${encodeURIComponent(workspaceId)}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPublished: true }),
            },
          );
        }
        toast.success(t('publishedToScreens', { count: successCount }));
        bumpWorkspaceDataEpoch();
        setPublishDialogOpen(false);
        void load();
      } else {
        toast.error(t('publishFailed'));
      }
    } catch {
      toast.error(t('publishFailed'));
    }
    setPublishingScreens(false);
  };

  const openDeleteDialog = async () => {
    setDeleteOpen(true);
    setScheduleCount(0);
    if (!workspaceId) return;
    try {
      const res = await apiFetch(`/schedules?workspaceId=${encodeURIComponent(workspaceId)}&playlistId=${encodeURIComponent(playlistId)}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items;
        setScheduleCount(Array.isArray(items) ? items.length : 0);
      }
    } catch {
      // ignore
    }
  };

  if (notFound) {
    return (
      <main className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg font-bold text-foreground">{t('notFound')}</p>
          <p className="text-sm text-muted-foreground">{t('notFoundDesc')}</p>
          <Link href={`/${locale}/content` as Route}>
            <Button variant="outline">
              <ArrowLeft className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
              {t('backToContent')}
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const totalDuration = playlist?.items.reduce((sum, item) => sum + item.durationSec, 0) ?? 0;
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentItem = playlist?.items[previewIndex];
  const isVideo = currentItem?.media?.mimeType.startsWith('video/');
  const isImage = currentItem?.media?.mimeType.startsWith('image/');

  return (
    <main className="mx-auto max-w-[1200px] space-y-6 px-6 py-6" aria-label={playlist?.name ?? t('loading')}>
      {/* Breadcrumbs */}
      <nav aria-label={t('breadcrumbAria')} className="flex items-center gap-2 text-sm">
        <Link href={`/${locale}/content` as Route} className="text-muted-foreground hover:text-foreground hover:underline">
          {t('contentBreadcrumb')}
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">{playlist?.name ?? '…'}</span>
      </nav>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : !playlist ? null : (
        <>
          {/* Header */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{playlist.name}</h1>
              {playlist.isPublished ? (
                <Badge variant="success">
                  <Eye className="me-1 h-3 w-3" />
                  {tStudio('publishedBadge')}
                </Badge>
              ) : (
                <Badge variant="muted">{tStudio('draftPlaylists')}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <Button
                    variant="default"
                    onClick={() => void openPublishDialog()}
                    disabled={publishing}
                  >
                    <Send className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                    {t('publishToScreens')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/content/playlists/${playlistId}/studio` as never as Route)}
                  >
                    <Pencil className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                    {t('editInStudio')}
                  </Button>
                  <Button variant="outline" onClick={() => void handleDuplicate()} disabled={duplicating}>
                    <Copy className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                    {tStudio('duplicate')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/scheduling?playlistId=${playlistId}` as never as Route)}
                  >
                    <CalendarPlus className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                    {t('createSchedule')}
                  </Button>
                </>
              )}
            </div>
          </motion.section>

          {/* Preview + Metadata */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Preview */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="overflow-hidden rounded-lg border border-border bg-card"
              role="img"
              aria-label={t('previewAria')}
            >
              <div className="relative aspect-video bg-black">
                {playlist.items.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <p className="text-sm">{t('noItems')}</p>
                  </div>
                ) : currentItem?.media?.publicUrl && isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentItem.media.publicUrl} alt={currentItem.media.originalName} className="h-full w-full object-contain" />
                ) : currentItem?.media?.publicUrl && isVideo ? (
                  <video
                    key={currentItem.media.id}
                    src={currentItem.media.publicUrl}
                    className="h-full w-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : currentItem?.canvas ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Pencil className="h-8 w-8" strokeWidth={1.5} />
                    <span className="text-sm">{currentItem.canvas.name}</span>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
                  </div>
                )}

                {/* Preview controls */}
                {playlist.items.length > 0 && (
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewPlaying((p) => !p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                      aria-label={previewPlaying ? t('pause') : t('play')}
                    >
                      {previewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
                      {previewIndex + 1} / {playlist.items.length}
                    </span>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Metadata */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-lg border border-border bg-card p-4"
              role="region"
              aria-label={t('metadataAria')}
            >
              <h2 className="mb-3 text-sm font-bold tracking-tight text-foreground">{t('metadata')}</h2>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{t('created')}</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {new Date(playlist.createdAt).toLocaleDateString(locale, { dateStyle: 'medium' })}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{t('modified')}</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {new Date(playlist.updatedAt).toLocaleDateString(locale, { dateStyle: 'medium' })}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{t('itemCount')}</dt>
                  <dd className="text-sm font-medium text-foreground">{playlist.items.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{t('totalDuration')}</dt>
                  <dd className="text-sm font-medium text-foreground">{formatDuration(totalDuration)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{t('status')}</dt>
                  <dd>
                    {playlist.isPublished ? (
                      <Badge variant="success">{tStudio('publishedBadge')}</Badge>
                    ) : (
                      <Badge variant="muted">{tStudio('draftPlaylists')}</Badge>
                    )}
                  </dd>
                </div>
              </dl>
            </motion.section>
          </div>

          {/* Media Items */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-lg border border-border bg-card p-4"
            role="region"
            aria-label={t('itemsAria')}
          >
            <h2 className="mb-3 text-sm font-bold tracking-tight text-foreground">{t('itemsTitle')}</h2>
            {playlist.items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">{t('noItems')}</p>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/content/playlists/${playlistId}/studio` as never as Route)}
                  >
                    <Pencil className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                    {t('editInStudio')}
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-2" role="list">
                {playlist.items.map((item, idx) => (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-2 transition-colors',
                      idx === previewIndex ? 'border-primary/30 bg-primary/5' : 'border-border',
                    )}
                  >
                    <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-muted/30">
                      {item.media?.publicUrl && item.media.mimeType.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.media.publicUrl} alt="" className="h-full w-full object-cover" />
                      ) : item.media?.publicUrl && item.media.mimeType.startsWith('video/') ? (
                        <video src={item.media.publicUrl} className="h-full w-full object-cover" muted />
                      ) : item.canvas ? (
                        <Pencil className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground/30" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.media?.originalName ?? item.canvas?.name ?? t('unnamedItem')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.media?.mimeType.startsWith('video/') ? (
                          <Video className="h-3 w-3" strokeWidth={ICON_STROKE} />
                        ) : (
                          <ImageIcon className="h-3 w-3" strokeWidth={ICON_STROKE} />
                        )}
                        <span>{formatDuration(item.durationSec)}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{idx + 1}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* Assigned Screens */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-lg border border-border bg-card p-4"
            role="region"
            aria-label={t('screensAria')}
          >
            <h2 className="mb-3 text-sm font-bold tracking-tight text-foreground">{t('screensTitle')}</h2>
            {screens.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Monitor className="h-8 w-8 text-muted-foreground/30" strokeWidth={ICON_STROKE} />
                <p className="text-sm text-muted-foreground">{t('noScreens')}</p>
                {canEdit && (
                  <Button variant="outline" onClick={() => void handlePublish()} disabled={publishing}>
                    <Send className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                    {t('publishToScreens')}
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-2" role="list">
                {screens.map((screen) => (
                  <li key={screen.id}>
                    <Link
                      href={`/${locale}/screens/${screen.id}` as Route}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{screen.name}</p>
                      </div>
                      <ScreenFleetStatusBadge
                        status={screen.status}
                        lastSeenAt={screen.lastSeenAt}
                        locale={locale}
                        tone="card"
                        className="text-[11px]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* Danger Zone */}
          {canEdit && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              role="region"
              aria-label={t('dangerZoneAria')}
            >
              <h2 className="mb-2 text-sm font-bold tracking-tight text-destructive">{t('dangerZone')}</h2>
              <p className="mb-3 text-sm text-muted-foreground">{t('dangerZoneDesc')}</p>
              <Button variant="destructive" onClick={() => void openDeleteDialog()}>
                <Trash2 className="me-2 h-4 w-4" strokeWidth={ICON_STROKE} />
                {t('deletePlaylist')}
              </Button>
            </motion.section>
          )}
        </>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: playlist?.name ?? '' })}
              {scheduleCount > 0 && (
                <span className="mt-2 block font-medium text-warning">
                  {tStudio('scheduleImpactWarning', { count: scheduleCount })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus disabled={deleting}>{tStudio('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('deleting') : t('deletePlaylist')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish to Screens Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('publishToScreens')}</DialogTitle>
            <DialogDescription>{t('publishDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto py-2">
            {publishScreens.length > 1 && (
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Checkbox
                  checked={selectedScreenIds.size === publishScreens.length}
                  onCheckedChange={() => toggleAllScreens()}
                  id="select-all-screens"
                />
                <label htmlFor="select-all-screens" className="text-sm font-medium text-foreground cursor-pointer">
                  {t('selectAllScreens')}
                </label>
              </div>
            )}
            {publishScreens.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('noScreensToPublish')}</p>
            ) : (
              publishScreens.map((screen) => (
                <div key={screen.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <Checkbox
                    checked={selectedScreenIds.has(screen.id)}
                    onCheckedChange={() => toggleScreenSelection(screen.id)}
                    id={`screen-${screen.id}`}
                    aria-label={screen.name}
                  />
                  <label htmlFor={`screen-${screen.id}`} className="flex flex-1 items-center justify-between gap-2 cursor-pointer">
                    <span className="truncate text-sm font-medium text-foreground">{screen.name}</span>
                    <ScreenFleetStatusBadge
                      status={screen.status}
                      lastSeenAt={screen.lastSeenAt}
                      locale={locale}
                      tone="card"
                      className="text-[11px]"
                    />
                  </label>
                </div>
              ))
            )}
            {selectedScreenIds.size > 0 && publishScreens.some((s) => selectedScreenIds.has(s.id) && s.status !== 'ONLINE') && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-warning">{t('offlineWarning')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPublishDialogOpen(false)} disabled={publishingScreens}>
              {tStudio('cancel')}
            </Button>
            <Button
              variant="default"
              onClick={() => void confirmPublishToScreens()}
              disabled={selectedScreenIds.size === 0 || publishingScreens}
            >
              {publishingScreens ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
              {publishingScreens ? t('publishing') : t('publishNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
