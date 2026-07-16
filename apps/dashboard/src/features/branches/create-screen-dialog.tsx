'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchBranchPlaylists as apiFetchBranchPlaylists,
  createBranchPlaylist as apiCreateBranchPlaylist,
  createBranchScreen as apiCreateBranchScreen,
} from '@/features/branches/branches-api';
import { readPageItems } from '@/features/api/page';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';

type PlaylistRow = { id: string; name: string };

type PlaylistMode = 'none' | 'existing' | 'new';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onCreated: () => void;
};

export function CreateScreenDialog({ open, onOpenChange, workspaceId, onCreated }: Props) {
  const t = useTranslations('createScreenDialog');
  const { toastResponseError } = useApiErrorToast();
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [playlistMode, setPlaylistMode] = useState<PlaylistMode>('none');
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [existingPlaylistId, setExistingPlaylistId] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPlaylists = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingPlaylists(true);
    const res = await apiFetchBranchPlaylists(workspaceId);
    if (res.ok) {
      setPlaylists(await readPageItems<PlaylistRow>(res));
    } else {
      setPlaylists([]);
    }
    setLoadingPlaylists(false);
  }, [workspaceId]);

  useEffect(() => {
    if (!open || !workspaceId) return;
    void loadPlaylists();
    setName('');
    setSerialNumber('');
    setLocation('');
    setPlaylistMode('none');
    setExistingPlaylistId('');
    setNewPlaylistName('');
  }, [open, workspaceId, loadPlaylists]);

  const submit = async () => {
    const n = name.trim();
    const sn = serialNumber.trim();
    if (!n || !sn) {
      toast.error(t('validationRequired'));
      return;
    }
    if (playlistMode === 'existing' && !existingPlaylistId) {
      toast.error(t('validationPlaylist'));
      return;
    }
    if (playlistMode === 'new' && !newPlaylistName.trim()) {
      toast.error(t('validationNewPlaylist'));
      return;
    }

    setSubmitting(true);
    try {
      let playlistGroupId: string | null | undefined = undefined;

      if (playlistMode === 'new') {
        const gr = await apiCreateBranchPlaylist(workspaceId, newPlaylistName.trim());
        if (!gr.ok) {
          await toastResponseError(gr);
          return;
        }
        const created = (await gr.json()) as { id: string };
        playlistGroupId = created.id;
      } else if (playlistMode === 'existing') {
        playlistGroupId = existingPlaylistId;
      } else {
        playlistGroupId = undefined;
      }

      const body: Record<string, unknown> = {
        workspaceId,
        name: n,
        serialNumber: sn,
        ...(location.trim() ? { location: location.trim() } : {}),
      };
      if (playlistGroupId !== undefined) {
        body.playlistGroupId = playlistGroupId ?? null;
      }

      const res = await apiCreateBranchScreen(body);
      if (!res.ok) {
        /**
         * No special case for the screen limit: the API answers
         * SCREEN_LIMIT_REACHED with `details.limit`, and the message catalogue
         * interpolates it. This used to parse the limit out of the error text.
         */
        await toastResponseError(res);
        return;
      }
      toast.success(t('success'));
      onOpenChange(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto rounded-lg border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cs-name">{t('name')}</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg"
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-serial">{t('serial')}</Label>
            <Input
              id="cs-serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="rounded-lg"
              placeholder={t('serialPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-loc">{t('location')}</Label>
            <Input
              id="cs-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg"
              placeholder={t('locationPlaceholder')}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">{t('playlistSection')}</p>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-primary/5">
                <input
                  type="radio"
                  name="pmode"
                  checked={playlistMode === 'none'}
                  onChange={() => setPlaylistMode('none')}
                  className="h-4 w-4 accent-primary"
                />
                {t('playlistNone')}
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-primary/5">
                <input
                  type="radio"
                  name="pmode"
                  checked={playlistMode === 'existing'}
                  onChange={() => setPlaylistMode('existing')}
                  className="h-4 w-4 accent-primary"
                />
                {t('playlistExisting')}
              </label>
              {playlistMode === 'existing' ? (
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                  value={existingPlaylistId}
                  onChange={(e) => setExistingPlaylistId(e.target.value)}
                  disabled={loadingPlaylists}
                >
                  <option value="">{loadingPlaylists ? t('loadingPlaylists') : t('pickPlaylist')}</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-primary/5">
                <input
                  type="radio"
                  name="pmode"
                  checked={playlistMode === 'new'}
                  onChange={() => setPlaylistMode('new')}
                  className="h-4 w-4 accent-primary"
                />
                {t('playlistNew')}
              </label>
              {playlistMode === 'new' ? (
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="rounded-lg"
                  placeholder={t('newPlaylistPlaceholder')}
                />
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-lg" disabled={submitting} onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="cta"
            className="rounded-lg font-semibold"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
