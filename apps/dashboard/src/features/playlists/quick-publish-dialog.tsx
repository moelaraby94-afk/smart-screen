'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createPlaylist, updatePlaylistItems } from '@/features/studio/studio-api';
import { fetchPlaylistOptions, updateScreen, type PlaylistOption } from '@/features/screens/api/screens-api';
import { fetchScreens } from '@/features/screens/api/screens-api';
import type { ScreenRow } from '@/features/screens/useApiScreens';
import { useWorkspace } from '@/features/workspace/workspace-context';
import type { MediaItem } from '@/features/media/media-library-client';

type Props = {
  media: MediaItem;
  children?: React.ReactNode;
};

export function QuickPublishDialog({ media, children }: Props) {
  const t = useTranslations('quickPublish');
  const { workspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [existingPlaylists, setExistingPlaylists] = useState<PlaylistOption[]>([]);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [screenId, setScreenId] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [existingPlaylistId, setExistingPlaylistId] = useState('');
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [scr, pls] = await Promise.all([
        fetchScreens(workspaceId),
        fetchPlaylistOptions(workspaceId),
      ]);
      setScreens(scr);
      setExistingPlaylists(pls);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (open && media) {
      setPlaylistName(media.originalName.replace(/\.[^.]+$/, '').slice(0, 40));
      setScreenId('');
      setExistingPlaylistId('');
      setMode('new');
      setDuration(10);
    }
  }, [open, media]);

  const publish = async () => {
    if (!workspaceId || !screenId) {
      toast.error(t('selectScreenFirst'));
      return;
    }
    setBusy(true);
    try {
      let playlistId: string;

      if (mode === 'new') {
        const name = playlistName.trim() || media.originalName;
        const createRes = await createPlaylist(workspaceId, name);
        if (!createRes.ok) throw new Error('create failed');
        const created = await createRes.json();
        playlistId = created.id;

        const itemsRes = await updatePlaylistItems(workspaceId, playlistId, {
          items: [
            {
              mediaId: media.id,
              durationSec: duration,
              orderIndex: 0,
            },
          ],
        });
        if (!itemsRes.ok) throw new Error('items failed');
      } else {
        if (!existingPlaylistId) {
          toast.error(t('selectPlaylistFirst'));
          setBusy(false);
          return;
        }
        playlistId = existingPlaylistId;
      }

      const assignRes = await updateScreen(workspaceId, screenId, {
        activePlaylistId: playlistId,
      });
      if (!assignRes.ok) throw new Error('assign failed');

      const screen = screens.find((s) => s.id === screenId);
      toast.success(t('published', { screen: screen?.name ?? screenId }));
      bumpWorkspaceDataEpoch();
      setOpen(false);
    } catch {
      toast.error(t('publishFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
          >
            <Zap className="me-1.5 h-4 w-4" />
            {t('quickPublish')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">{t('mediaLabel')}</p>
              <p className="truncate text-sm font-medium">{media.originalName}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('targetScreen')}</Label>
              <select
                className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
                value={screenId}
                onChange={(e) => setScreenId(e.target.value)}
                aria-label={t('targetScreen')}
              >
                <option value="">{t('selectScreen')}</option>
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t('playlistMode')}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${mode === 'new' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setMode('new')}
                >
                  {t('createNew')}
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${mode === 'existing' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setMode('existing')}
                >
                  {t('useExisting')}
                </button>
              </div>
            </div>

            {mode === 'new' ? (
              <>
                <div className="space-y-2">
                  <Label>{t('playlistName')}</Label>
                  <input
                    type="text"
                    className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    aria-label={t('playlistName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('durationSec')}</Label>
                  <select
                    className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    aria-label={t('durationSec')}
                  >
                    <option value={5}>{t('duration5s')}</option>
                    <option value={10}>{t('duration10s')}</option>
                    <option value={15}>{t('duration15s')}</option>
                    <option value={30}>{t('duration30s')}</option>
                    <option value={60}>{t('duration60s')}</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>{t('existingPlaylist')}</Label>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
                  value={existingPlaylistId}
                  onChange={(e) => setExistingPlaylistId(e.target.value)}
                  aria-label={t('existingPlaylist')}
                >
                  <option value="">{t('selectPlaylist')}</option>
                  {existingPlaylists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            className="rounded-lg font-semibold"
            variant="cta"
            disabled={busy || !screenId || loading}
            onClick={() => void publish()}
          >
            {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Zap className="me-2 h-4 w-4" />}
            {t('publishNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
