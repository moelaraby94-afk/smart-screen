'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Monitor, Plus, Search, Trash2, CheckSquare, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenActions } from '@/features/screens/hooks/use-screen-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsageIndicator } from '@/components/usage-indicator';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  fetchPlaylistOptions,
  updateScreen as apiUpdateScreen,
  deleteScreen as apiDeleteScreen,
  type PlaylistOption as ApiPlaylistOption,
} from '@/features/screens/api/screens-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { usePlayerPairing } from '@/features/branches/use-player-pairing';
import { BranchPairingDialog } from '@/features/branches/branch-pairing-dialog';
import { ScreenQuickEditPanel } from '@/features/screens/screen-quick-edit-panel';
import { useApiScreens, type ScreenRow } from './useApiScreens';
import { useScreenRealtime } from './useScreenRealtime';
import { ScreenVisualCard } from '@/features/screens/screen-visual-card';
import { ScreenAnalyticsPanel } from '@/features/screens/screen-analytics-panel';
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
  const { workspaceId, workspaces, workspaceDataEpoch, bumpWorkspaceDataEpoch, pairingActivityEpoch } =
    useWorkspace();
  const { screens, setScreens, isLoading, reload } = useApiScreens(workspaceId);
  useScreenRealtime(workspaceId, setScreens);

  const canAssignPlayback = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'EDITOR';
  }, [workspaces, workspaceId]);

  const canClaimPairing = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN';
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

  const pairing = usePlayerPairing(workspaceId ?? '', {
    canClaim: canClaimPairing,
    pairingActivityEpoch,
    onClaimed: reloadScreensAndBump,
  });

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkPlaylistId, setBulkPlaylistId] = useState<string>('');

  const filteredScreens = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return screens.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (q) {
        return (
          s.name.toLowerCase().includes(q) ||
          (s.location?.toLowerCase().includes(q) ?? false) ||
          s.serialNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [screens, searchQuery, statusFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredScreens.map((s) => s.id)));
  }, [filteredScreens]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkDelete = async () => {
    if (!workspaceId || selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map((id) => apiDeleteScreen(workspaceId, id)),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(t('bulkDeletePartial', { failed }));
      } else {
        toast.success(t('bulkDeleteOk', { count: ids.length }));
      }
      setSelectedIds(new Set());
      await reload();
      bumpWorkspaceDataEpoch();
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkAssignPlaylist = async () => {
    if (!workspaceId || selectedIds.size === 0 || !bulkPlaylistId) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const playlistName = playlists.find((p) => p.id === bulkPlaylistId)?.name ?? null;
      const results = await Promise.all(
        ids.map((id) => apiUpdateScreen(workspaceId, id, { activePlaylistId: bulkPlaylistId })),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(t('bulkAssignPartial', { failed }));
      } else {
        toast.success(t('bulkAssignOk', { count: ids.length, name: playlistName ?? '' }));
      }
      setScreens((prev) =>
        prev.map((s) =>
          selectedIds.has(s.id)
            ? { ...s, activePlaylistId: bulkPlaylistId, activePlaylist: playlistName ? { id: bulkPlaylistId, name: playlistName } : null }
            : s,
        ),
      );
      setSelectedIds(new Set());
      setBulkPlaylistId('');
      bumpWorkspaceDataEpoch();
    } finally {
      setBulkBusy(false);
    }
  };

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
        className="flex flex-col gap-4 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono-nums text-xs text-muted-foreground">
            <span className="text-foreground">{new Intl.NumberFormat(locale).format(screens.length)}</span> {t('screensCount')}
          </p>
          <Button variant="outline" className="rounded-xl" onClick={() => void reload()}>
            {t('refresh')}
          </Button>
          {canClaimPairing && (
            <Button
              variant="outline"
              className="rounded-xl font-semibold"
              onClick={pairing.open}
            >
              <Radio className="me-2 h-4 w-4" />
              {t('pairScreen')}
            </Button>
          )}
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-semibold" variant="cta">
                <Plus className="me-2 h-4 w-4" />
                {t('addScreen')}
              </Button>
            </DialogTrigger>
            <CreateScreenDialogContent
              workspaceId={workspaceId}
              onCancel={() => setOpenAdd(false)}
              onSuccess={async () => {
                setOpenAdd(false);
                await reload();
                bumpWorkspaceDataEpoch();
              }}
            />
          </Dialog>
        </div>
      </motion.div>

      {screens.length > 0 && <ScreenAnalyticsPanel />}

      {screens.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <UsageIndicator screenCount={screens.length} />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl ps-9"
            />
          </div>
          <select
            className="h-10 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('filterAll')}</option>
            <option value="ONLINE">{t('filterOnline')}</option>
            <option value="OFFLINE">{t('filterOffline')}</option>
            <option value="MAINTENANCE">{t('filterMaintenance')}</option>
          </select>
          {canAssignPlayback && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={selectAll}
              disabled={filteredScreens.length === 0}
            >
              <CheckSquare className="me-2 h-4 w-4" />
              {t('selectAll')}
            </Button>
          )}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <span className="text-sm font-semibold text-foreground">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
          {canAssignPlayback && (
            <select
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
              value={bulkPlaylistId}
              onChange={(e) => setBulkPlaylistId(e.target.value)}
              disabled={bulkBusy}
            >
              <option value="">{t('bulkAssignPlaceholder')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {canAssignPlayback && bulkPlaylistId && (
            <Button
              variant="cta"
              className="rounded-xl text-sm"
              disabled={bulkBusy}
              onClick={() => void bulkAssignPlaylist()}
            >
              {t('bulkAssign')}
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-xl text-sm hover:text-destructive"
            disabled={bulkBusy}
            onClick={() => void bulkDelete()}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t('bulkDelete')}
          </Button>
          <Button
            variant="ghost"
            className="rounded-xl text-sm"
            disabled={bulkBusy}
            onClick={clearSelection}
          >
            {t('clearSelection')}
          </Button>
        </div>
      )}

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
      ) : filteredScreens.length === 0 ? (
        <div className="vc-card-surface flex flex-col items-center gap-4 rounded-2xl py-16">
          <Monitor className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium text-foreground">{t('noResults')}</p>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {t('noResultsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredScreens.map((screen, i) => (
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
              selected={selectedIds.has(screen.id)}
              onToggleSelect={canAssignPlayback ? toggleSelect : undefined}
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

      <BranchPairingDialog
               pairing={pairing}
               branchName={workspaces.find((w) => w.id === workspaceId)?.name ?? ''}
               canClaim={canClaimPairing}
      />

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        {selected ? (
          <EditScreenDialogContent
            screen={selected}
            workspaceId={workspaceId}
            onCancel={() => {
              setOpenEdit(false);
              setSelected(null);
            }}
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
