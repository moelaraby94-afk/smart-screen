'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  Clapperboard,
  Copy,
  Image as ImageIcon,
  Loader2,
  Monitor,
  MoreVertical,
  PenLine,
  Plus,
  Power,
  Radio,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteBranchScreen as apiDeleteBranchScreen } from '@/features/branches/branches-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { CreateScreenDialog } from '@/features/branches/create-screen-dialog';
import { BranchWorkspaceToolbar, type BranchTab } from '@/features/branches/branch-workspace-toolbar';
import { ScreenQuickEditPanel } from '@/features/screens/screen-quick-edit-panel';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import { type ScreenRow, useApiScreens } from '@/features/screens/useApiScreens';
import { useShellHeaderInsetSetter } from '@/components/layout/shell-header-inset-context';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { computeBranchScreenStats, computeOnlineByPlaylistId } from '@/features/branches/branch-stats';
import { useBranchMedia } from '@/features/branches/use-branch-media';
import { type BranchPlaylistRow, useBranchPlaylists } from '@/features/branches/use-branch-playlists';
import { useScreenPlaybackAssignment } from '@/features/branches/use-screen-playback-assignment';
import { usePlayerPairing } from '@/features/branches/use-player-pairing';

type Props = {
  locale: string;
};

export function BranchDetailClient({ locale }: Props) {
  const t = useTranslations('branchDetail');
  const { toastResponseError } = useApiErrorToast();
  const tToolbar = useTranslations('branchToolbar');
  const params = useParams();
  const workspaceIdParam = typeof params.workspaceId === 'string' ? params.workspaceId : '';
  const {
    workspaces,
    setWorkspaceId,
    bumpWorkspaceDataEpoch,
    pairingActivityEpoch,
  } = useWorkspace();
  const branch = useMemo(
    () => workspaces.find((w) => w.id === workspaceIdParam),
    [workspaces, workspaceIdParam],
  );

  const { screens, setScreens, isLoading: screensLoading, reload: reloadScreens } = useApiScreens(
    workspaceIdParam || null,
  );

  const branchPlaylists = useBranchPlaylists(workspaceIdParam, bumpWorkspaceDataEpoch);
  const branchMedia = useBranchMedia(workspaceIdParam);
  const screenAssignment = useScreenPlaybackAssignment(
    workspaceIdParam,
    setScreens,
    branchPlaylists.playlists,
    bumpWorkspaceDataEpoch,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [screenDialogOpen, setScreenDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BranchTab>('playlists');
  const [editOpen, setEditOpen] = useState(false);
  const [editScreen, setEditScreen] = useState<ScreenRow | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<BranchPlaylistRow | null>(null);
  const [playlistToMove, setPlaylistToMove] = useState<BranchPlaylistRow | null>(null);
  const [moveTargetId, setMoveTargetId] = useState('');
  const [playlistDeleteForce, setPlaylistDeleteForce] = useState(false);
  const [playlistEditOpen, setPlaylistEditOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<BranchPlaylistRow | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState('');
  const [editPlaylistPublished, setEditPlaylistPublished] = useState(false);

  const canDeletePlaylist = Boolean(
    branch && (branch.role === 'OWNER' || branch.role === 'ADMIN'),
  );
  const canClaimPlayerPairing = canDeletePlaylist;
  const canEditPlaylist = Boolean(branch && branch.role !== 'VIEWER');

  useEffect(() => {
    if (workspaceIdParam) {
      setWorkspaceId(workspaceIdParam);
      bumpWorkspaceDataEpoch();
    }
  }, [workspaceIdParam, setWorkspaceId, bumpWorkspaceDataEpoch]);

  const pairing = usePlayerPairing(workspaceIdParam, {
    canClaim: canClaimPlayerPairing,
    pairingActivityEpoch,
    onClaimed: useCallback(async () => {
      await reloadScreens();
      bumpWorkspaceDataEpoch();
    }, [reloadScreens, bumpWorkspaceDataEpoch]),
  });

  const setHeaderInset = useShellHeaderInsetSetter();

  const branchHeaderToolbar = useMemo(
    () => (
      <BranchWorkspaceToolbar
        variant="inline"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewPlaylist={() => setCreateOpen(true)}
        onNewScreen={() => setScreenDialogOpen(true)}
        onNewMedia={() => {
          window.location.assign(`/${locale}/media`);
        }}
        onOpenPairingModal={pairing.open}
      />
    ),
    [activeTab, locale, pairing.open],
  );

  useLayoutEffect(() => {
    if (!setHeaderInset) return;
    if (!branch) {
      setHeaderInset(null);
      return;
    }
    setHeaderInset(branchHeaderToolbar);
    return () => setHeaderInset(null);
  }, [setHeaderInset, branch, branchHeaderToolbar]);

  const onlineByPlaylistId = useMemo(() => computeOnlineByPlaylistId(screens), [screens]);
  const stats = useMemo(() => computeBranchScreenStats(screens), [screens]);

  const onCreatePlaylist = useCallback(async () => {
    const ok = await branchPlaylists.create(newName);
    if (ok) {
      setNewName('');
      setCreateOpen(false);
    }
  }, [branchPlaylists, newName]);

  const confirmDeletePlaylist = useCallback(async () => {
    if (!playlistToDelete) return;
    const ok = await branchPlaylists.remove(playlistToDelete, playlistDeleteForce);
    if (ok) {
      setPlaylistToDelete(null);
      setPlaylistDeleteForce(false);
    }
  }, [branchPlaylists, playlistToDelete, playlistDeleteForce]);

  const confirmMovePlaylist = useCallback(async () => {
    if (!playlistToMove) return;
    const ok = await branchPlaylists.move(playlistToMove, moveTargetId, canDeletePlaylist);
    if (ok) {
      setPlaylistToMove(null);
      setMoveTargetId('');
    }
  }, [branchPlaylists, playlistToMove, moveTargetId, canDeletePlaylist]);

  const savePlaylistEdit = useCallback(async () => {
    if (!playlistToEdit) return;
    const ok = await branchPlaylists.update(playlistToEdit, {
      name: editPlaylistName,
      isPublished: editPlaylistPublished,
    });
    if (ok) {
      setPlaylistEditOpen(false);
      setPlaylistToEdit(null);
    }
  }, [branchPlaylists, playlistToEdit, editPlaylistName, editPlaylistPublished]);

  if (!branch) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">{t('notFound')}</p>
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link href={`/${locale}/overview` as Route}>{t('backOverview')}</Link>
        </Button>
      </div>
    );
  }

  const loading = screensLoading || branchPlaylists.isLoading;

  return (
    <main className="space-y-8 pb-12">
      <CreateScreenDialog
        open={screenDialogOpen}
        onOpenChange={setScreenDialogOpen}
        workspaceId={workspaceIdParam}
        onCreated={() => {
          void reloadScreens();
          void branchPlaylists.reload();
        }}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
          {t('statsTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: t('statTotal'),
              value: loading ? '…' : String(stats.total),
              icon: Monitor,
              accent: 'from-primary/20 to-primary/5',
            },
            {
              label: t('statOnline'),
              value: loading ? '…' : String(stats.online),
              icon: Radio,
              accent: 'from-emerald-950/50 to-emerald-900/30',
            },
            {
              label: t('statInactive'),
              value: loading ? '…' : String(stats.inactive),
              icon: Power,
              accent: 'from-rose-500/15 to-muted',
              sub: loading
                ? undefined
                : t('inactiveDetail', {
                    offline: stats.offline,
                    maintenance: stats.maintenance,
                  }),
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className={cn(
                'vc-card-surface relative overflow-hidden rounded-2xl border border-border p-5',
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90',
                  item.accent,
                )}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                    {item.label}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">
                    {item.value}
                  </p>
                  {'sub' in item && item.sub ? (
                    <p className="mt-1 text-[11px] text-white/55">{item.sub}</p>
                  ) : null}
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <item.icon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {activeTab === 'playlists' ? (
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
              {t('playlistsTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('playlistsSub')}</p>
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition',
              'border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted',
            )}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
            {t('addPlaylist')}
          </button>
        </div>

        {branchPlaylists.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : branchPlaylists.playlists.length === 0 ? (
          <div className="vc-card-surface rounded-2xl border border-dashed border-border p-10 text-center">
            <Clapperboard className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
            <p className="mt-3 text-sm font-medium text-foreground">{t('noPlaylists')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('noPlaylistsHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branchPlaylists.playlists.map((pl, i) => {
              const totalScreens = pl._count.screensInGroup;
              const online = onlineByPlaylistId.get(pl.id) ?? 0;
              const dupBusy = branchPlaylists.duplicatingId === pl.id;
              return (
                <motion.div
                  key={pl.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.3 }}
                  className="group/card relative"
                >
                  <Link
                    href={`/${locale}/branches/${workspaceIdParam}/playlists/${pl.id}` as Route}
                    className={cn(
                      'flex flex-col rounded-2xl border border-border bg-card p-5 pe-12 transition-all duration-200',
                      'hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-md',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground dark:text-white">{pl.name}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {t('playlistScreenStats', { total: totalScreens, online })}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/90">
                          {t('playlistItemsCount', { count: pl._count.items })}
                        </p>
                      </div>
                      <Clapperboard className="h-5 w-5 shrink-0 text-primary" strokeWidth={ICON_STROKE} />
                    </div>
                    <span className="mt-4 inline-flex items-center text-xs font-semibold text-primary">
                      {t('openPlaylist')} →
                    </span>
                  </Link>
                  {canEditPlaylist ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-2 top-2 z-20 h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={t('playlistActionsAria')}
                          onClick={(e) => e.preventDefault()}
                        >
                          {dupBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
                          ) : (
                            <MoreVertical className="h-4 w-4" strokeWidth={ICON_STROKE} />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[12rem]">
                        <DropdownMenuItem
                          className="gap-2 font-semibold"
                          disabled={dupBusy}
                          onClick={() => void branchPlaylists.duplicate(pl)}
                        >
                          <Copy className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                          {t('playlistDuplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 font-semibold"
                          onClick={() => {
                            setPlaylistToEdit(pl);
                            setEditPlaylistName(pl.name);
                            setEditPlaylistPublished(pl.isPublished === true);
                            setPlaylistEditOpen(true);
                          }}
                        >
                          <PenLine className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                          {t('playlistEdit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 font-semibold"
                          onClick={() => {
                            setPlaylistToMove(pl);
                            setMoveTargetId('');
                          }}
                        >
                          <Monitor className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                          {t('playlistMoveToBranch')}
                        </DropdownMenuItem>
                        {canDeletePlaylist ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 font-semibold text-red-600 focus:text-red-600"
                              onClick={() => setPlaylistToDelete(pl)}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                              {t('playlistDelete')}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'screens' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
              {t('screensTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('screensSub')}</p>
          </div>
          {screensLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : screens.length === 0 ? (
            <div className="vc-card-surface rounded-2xl border border-dashed border-border p-10 text-center">
              <Monitor className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <p className="mt-3 text-sm font-medium text-foreground">{t('noScreens')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {screens.map((screen) => (
                <div
                  key={screen.id}
                  className="vc-card-surface rounded-2xl border border-border/60 p-4 dark:border-white/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground dark:text-white">{screen.name}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{screen.serialNumber}</p>
                    </div>
                    <ScreenFleetStatusBadge
                      tone="card"
                      status={screen.status}
                      lastSeenAt={screen.lastSeenAt}
                      locale={locale}
                      className="items-end"
                    />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label
                      htmlFor={`screen-pl-${screen.id}`}
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {t('screenPlaybackPlaylist')}
                    </Label>
                    <div className="relative">
                      <select
                        id={`screen-pl-${screen.id}`}
                        className={cn(
                          'h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-3 pe-9 text-sm outline-none',
                          'focus-visible:ring-2 focus-visible:ring-primary/25',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                        disabled={!canEditPlaylist || screenAssignment.assigningScreenId === screen.id}
                        value={screen.activePlaylistId ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          void screenAssignment.assign(screen.id, v || null);
                        }}
                      >
                        <option value="">{t('screenPlaybackNone')}</option>
                        {branchPlaylists.playlists.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.name}
                          </option>
                        ))}
                      </select>
                      {screenAssignment.assigningScreenId === screen.id ? (
                        <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={ICON_STROKE} />
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-lg px-3 font-semibold" variant="cta"
                      onClick={() => {
                        setEditScreen(screen);
                        setEditOpen(true);
                      }}
                    >
                      {t('screenQuickEdit')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => {
                        window.location.assign(`/${locale}/studio`);
                      }}
                    >
                      <PenLine className="me-1 h-3.5 w-3.5" />
                      {t('screenFullEditor')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                      onClick={async () => {
                        const ok = window.confirm(t('screenDeleteConfirm'));
                        if (!ok) return;
                        const res = await apiDeleteBranchScreen(workspaceIdParam, screen.id);
                        if (!res.ok) {
                          await toastResponseError(res);
                          return;
                        }
                        toast.success(t('screenDeleted'));
                        await reloadScreens();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'media' ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-white">
              {t('mediaTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('mediaSub')}</p>
          </div>
          {branchMedia.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : branchMedia.mediaItems.length === 0 ? (
            <div className="vc-card-surface rounded-2xl border border-dashed border-border p-10 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <p className="mt-3 text-sm font-medium text-foreground">{t('noMedia')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {branchMedia.mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="vc-card-surface rounded-2xl border border-border/60 p-4 dark:border-white/10"
                >
                  <p className="truncate text-sm font-semibold text-foreground dark:text-white">{item.originalName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.mimeType}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <Dialog
        open={pairing.isOpen}
        onOpenChange={(open) => {
          if (!open) pairing.close();
        }}
      >
        <DialogContent className="max-h-[min(90vh,560px)] overflow-y-auto sm:max-w-md">
          <DialogHeader className="space-y-1 text-center sm:text-center">
            <DialogTitle className="text-xl font-semibold">{t('pairingModalTitle')}</DialogTitle>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {tToolbar('branchLabel')} · {branch.name}
            </p>
          </DialogHeader>
          {pairing.showProgressBanner ? (
            <p
              role="status"
              className="rounded-xl border border-primary/40 bg-primary/12 px-3 py-2 text-center text-xs font-medium leading-relaxed text-foreground"
            >
              {t('pairingProgressBanner')}
            </p>
          ) : null}
          <div className="space-y-5 py-2">
            {pairing.success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2
                  className="h-14 w-14 text-emerald-500"
                  strokeWidth={ICON_STROKE}
                  aria-hidden
                />
                <p className="text-base font-semibold text-foreground dark:text-white">
                  {t('pairingSuccessMessage')}
                </p>
              </div>
            ) : !canClaimPlayerPairing ? (
              <p className="text-center text-sm text-muted-foreground">{t('pairingViewOnly')}</p>
            ) : (
              <>
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                  {t('pairingModalDescription')}
                </p>
                {pairing.error ? (
                  <p
                    className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                    role="alert"
                  >
                    {pairing.error}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="player-pair-code" className="sr-only">
                    {t('pairingCodeFieldLabel')}
                  </Label>
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    {t('pairingCodeFieldLabel')}
                  </p>
                  <Input
                    id="player-pair-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={t('pairingCodePlaceholder')}
                    value={pairing.code}
                    onChange={(e) => pairing.setCode(e.target.value)}
                    className="h-14 rounded-xl text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground"
                    aria-invalid={Boolean(pairing.error)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player-pair-name">{t('pairingNameFieldLabel')}</Label>
                  <Input
                    id="player-pair-name"
                    value={pairing.name}
                    onChange={(e) => pairing.setName(e.target.value)}
                    placeholder={t('pairingNamePlaceholder')}
                    className="rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void pairing.claim();
                    }}
                  />
                </div>
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl font-semibold" variant="cta"
                  disabled={pairing.busy || pairing.code.length !== 6}
                  onClick={() => void pairing.claim()}
                >
                  {pairing.busy ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={ICON_STROKE} />
                    </span>
                  ) : (
                    t('pairingCompleteButton')
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={playlistEditOpen}
        onOpenChange={(open) => {
          setPlaylistEditOpen(open);
          if (!open) setPlaylistToEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('playlistEditTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pl-edit-name">{t('playlistNameLabel')}</Label>
              <Input
                id="pl-edit-name"
                value={editPlaylistName}
                onChange={(e) => setEditPlaylistName(e.target.value)}
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void savePlaylistEdit();
                }}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input accent-primary"
                checked={editPlaylistPublished}
                onChange={(e) => setEditPlaylistPublished(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground dark:text-white">{t('playlistPublishedLabel')}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{t('playlistPublishedHint')}</span>
              </span>
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setPlaylistEditOpen(false);
                setPlaylistToEdit(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold" variant="cta"
              disabled={branchPlaylists.isSavingEdit || !editPlaylistName.trim()}
              onClick={() => void savePlaylistEdit()}
            >
              {branchPlaylists.isSavingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
              ) : (
                t('playlistEditSave')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('playlistDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="pl-name">{t('playlistNameLabel')}</Label>
            <Input
              id="pl-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('playlistNamePlaceholder')}
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onCreatePlaylist();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold" variant="cta"
              disabled={branchPlaylists.isCreating || !newName.trim()}
              onClick={() => void onCreatePlaylist()}
            >
              {branchPlaylists.isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={playlistToMove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlaylistToMove(null);
            setMoveTargetId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('playlistMoveTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('playlistMoveHint')}</p>
          <div className="space-y-2 py-2">
            <Label htmlFor="move-branch">{t('playlistMoveTargetLabel')}</Label>
            <select
              id="move-branch"
              className={cn(
                'flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40',
              )}
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
            >
              <option value="">{t('playlistMoveChooseBranch')}</option>
              {workspaces
                .filter((w) => w.id !== workspaceIdParam)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setPlaylistToMove(null);
                setMoveTargetId('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold" variant="cta"
              disabled={
                !moveTargetId ||
                branchPlaylists.isMoving ||
                workspaces.filter((w) => w.id !== workspaceIdParam).length === 0
              }
              onClick={() => void confirmMovePlaylist()}
            >
              {branchPlaylists.isMoving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
              ) : canDeletePlaylist ? (
                t('playlistMoveConfirm')
              ) : (
                t('playlistMoveCopyOnly')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={playlistToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlaylistToDelete(null);
            setPlaylistDeleteForce(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('playlistDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {playlistDeleteForce ? t('playlistDeleteBodyForce') : t('playlistDeleteBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex cursor-pointer items-start gap-3 px-1 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input accent-primary"
              checked={playlistDeleteForce}
              onChange={(e) => setPlaylistDeleteForce(e.target.checked)}
            />
            <span>
              <span className="font-medium text-foreground dark:text-white">{t('playlistDeleteForceLabel')}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{t('playlistDeleteForceHint')}</span>
            </span>
          </label>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="rounded-xl" disabled={branchPlaylists.isDeleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              className="rounded-xl bg-red-600 font-semibold text-white hover:bg-red-600/90"
              disabled={branchPlaylists.isDeleting}
              onClick={() => void confirmDeletePlaylist()}
            >
              {branchPlaylists.isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
              ) : (
                t('playlistDelete')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScreenQuickEditPanel
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditScreen(null);
        }}
        screen={editScreen}
        workspaceId={workspaceIdParam}
        locale={locale}
        onSaved={reloadScreens}
        onEditScreen={() => {
          window.location.assign(`/${locale}/studio`);
        }}
      />
    </main>
  );
}
