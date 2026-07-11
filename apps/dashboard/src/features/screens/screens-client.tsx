'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Monitor, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenActions } from '@/features/screens/hooks/use-screen-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  fetchPlaylistOptions,
  updateScreen as apiUpdateScreen,
  type PlaylistOption as ApiPlaylistOption,
} from '@/features/screens/api/screens-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ScreenQuickEditPanel } from '@/features/screens/screen-quick-edit-panel';
import { useApiScreens, type ScreenRow } from './useApiScreens';
import { useScreenRealtime } from './useScreenRealtime';
import { ScreenVisualCard } from '@/features/screens/screen-visual-card';
import {
  CreateScreenDialogContent,
  EditScreenDialogContent,
} from '@/features/screens/screen-dialogs';

type Props = {
  locale: string;
};

type PlaylistOption = ApiPlaylistOption;

export function ScreensClient({ locale }: Props) {
  const t = useTranslations('screensClient');
  const { workspaceId, workspaces, workspaceDataEpoch, bumpWorkspaceDataEpoch } =
    useWorkspace();
  const { screens, setScreens, isLoading, reload } = useApiScreens(workspaceId);
  useScreenRealtime(workspaceId, setScreens);

  const canAssignPlayback = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'EDITOR';
  }, [workspaces, workspaceId]);

  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [assignPlaylistScreenId, setAssignPlaylistScreenId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setPlaylists([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const items = await fetchPlaylistOptions(workspaceId);
      if (!cancelled) setPlaylists(items);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, workspaceDataEpoch]);

  const reloadScreensAndBump = useCallback(async () => {
    await reload();
    bumpWorkspaceDataEpoch();
  }, [reload, bumpWorkspaceDataEpoch]);

  const { onDelete, sendRemoteCommand } = useScreenActions({
    workspaceId,
    setScreens,
    reload,
    bumpWorkspaceDataEpoch,
  });

  const assignPlaybackPlaylist = useCallback(
    async (screenId: string, playlistId: string | null) => {
      if (!workspaceId) return;
      setAssignPlaylistScreenId(screenId);
      try {
        const playlistName =
          playlistId === null
            ? null
            : (playlists.find((p) => p.id === playlistId)?.name ?? null);
        const res = await apiUpdateScreen(workspaceId, screenId, { activePlaylistId: playlistId });
        if (!res.ok) {
          toast.error(t('playlistAssignFailed'));
          return;
        }
        setScreens((prev) =>
          prev.map((s) =>
            s.id === screenId
              ? {
                  ...s,
                  activePlaylistId: playlistId,
                  activePlaylist:
                    playlistId && playlistName ? { id: playlistId, name: playlistName } : null,
                }
              : s,
          ),
        );
        toast.success(t('playlistAssignedToast'));
        bumpWorkspaceDataEpoch();
      } finally {
        setAssignPlaylistScreenId(null);
      }
    },
    [workspaceId, playlists, setScreens, bumpWorkspaceDataEpoch, t],
  );

  const [selected, setSelected] = useState<ScreenRow | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickScreen, setQuickScreen] = useState<ScreenRow | null>(null);

  const openQuick = (s: ScreenRow) => {
    setQuickScreen(s);
    setQuickOpen(true);
  };

  if (!workspaceId) {
    return (
      <p className="text-[15px] text-muted-foreground">{t('selectWorkspace')}</p>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-card-surface flex flex-col gap-4 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="vc-page-kicker">{t('fleet')}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{t('title')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono-nums text-xs text-muted-foreground">
            <span className="text-foreground">{new Intl.NumberFormat(locale).format(screens.length)}</span> {t('screensCount')}
          </p>
          <Button variant="outline" className="rounded-xl" onClick={() => void reload()}>
            {t('refresh')}
          </Button>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-semibold" variant="cta">
                <Plus className="me-2 h-4 w-4" />
                {t('addScreen')}
              </Button>
            </DialogTrigger>
            <CreateScreenDialogContent
              workspaceId={workspaceId}
              onSuccess={async () => {
                setOpenAdd(false);
                await reload();
                bumpWorkspaceDataEpoch();
              }}
            />
          </Dialog>
        </div>
      </motion.div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : screens.length === 0 ? (
        <div className="vc-card-surface flex flex-col items-center gap-4 rounded-2xl py-16">
          <Monitor className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium text-foreground">{t('emptyTitle')}</p>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {t('emptyDescription')}
          </p>
          <Button
            className="rounded-xl font-semibold" variant="cta"
            onClick={() => setOpenAdd(true)}
          >
            <Plus className="me-2 h-4 w-4" />
            {t('addScreen')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {screens.map((screen, i) => (
            <ScreenVisualCard
              key={screen.id}
              screen={screen}
              locale={locale}
              workspaceId={workspaceId}
              index={i}
              onCardClick={openQuick}
              onEdit={(s) => {
                setSelected(s);
                setOpenEdit(true);
              }}
              onDelete={(id) => void onDelete(id)}
              onRemote={(id, cmd) => void sendRemoteCommand(id, cmd)}
              playlists={playlists}
              canAssignPlayback={canAssignPlayback}
              assignPlaylistBusy={assignPlaylistScreenId === screen.id}
              onAssignPlaybackPlaylist={assignPlaybackPlaylist}
            />
          ))}
        </div>
      )}

      <ScreenQuickEditPanel
        open={quickOpen}
        onOpenChange={setQuickOpen}
        screen={quickScreen}
        workspaceId={workspaceId}
        locale={locale}
        onSaved={reloadScreensAndBump}
        onEditScreen={() => {
          if (quickScreen) {
            setSelected(quickScreen);
            setOpenEdit(true);
          }
        }}
      />

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        {selected ? (
          <EditScreenDialogContent
            screen={selected}
            workspaceId={workspaceId}
            onSuccess={async () => {
              setOpenEdit(false);
              setSelected(null);
              await reload();
              bumpWorkspaceDataEpoch();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
