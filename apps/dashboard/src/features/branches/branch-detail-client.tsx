'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { deleteBranchScreen as apiDeleteBranchScreen } from '@/features/branches/branches-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { CreateScreenDialog } from '@/features/branches/create-screen-dialog';
import { BranchWorkspaceToolbar, type BranchTab } from '@/features/branches/branch-workspace-toolbar';
import { ScreenQuickEditPanel } from '@/features/screens/screen-quick-edit-panel';
import { type ScreenRow, useApiScreens } from '@/features/screens/useApiScreens';
import { useShellHeaderInsetSetter } from '@/components/layout/shell-header-inset-context';
import { computeBranchScreenStats, computeOnlineByPlaylistId } from '@/features/branches/branch-stats';
import { useBranchMedia } from '@/features/branches/use-branch-media';
import { type BranchPlaylistRow, useBranchPlaylists } from '@/features/branches/use-branch-playlists';
import { useScreenPlaybackAssignment } from '@/features/branches/use-screen-playback-assignment';
import { usePlayerPairing } from '@/features/branches/use-player-pairing';
import { BranchPairingDialog } from '@/features/branches/branch-pairing-dialog';
import { BranchPlaylistDialogs } from '@/features/branches/branch-playlist-dialogs';
import {
  BranchStatsSection,
  BranchPlaylistsSection,
  BranchScreensSection,
  BranchMediaSection,
} from '@/features/branches/branch-tab-sections';
import { BranchReviewSection } from '@/features/branches/branch-review-section';

type Props = {
  locale: string;
  workspaceIdOverride?: string;
};

export function BranchDetailClient({ locale, workspaceIdOverride }: Props) {
  const t = useTranslations('branchDetail');
  const { toastResponseError } = useApiErrorToast();
  const params = useParams();
  const router = useRouter();
  const workspaceIdParam = workspaceIdOverride ?? (typeof params.workspaceId === 'string' ? params.workspaceId : '');
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
  const [screenToDelete, setScreenToDelete] = useState<ScreenRow | null>(null);
  const [screenDeleting, setScreenDeleting] = useState(false);

  const canDeletePlaylist = Boolean(
    branch && (branch.role === 'OWNER' || branch.role === 'ADMIN'),
  );
  const canClaimPlayerPairing = Boolean(
    branch && (branch.role === 'OWNER' || branch.role === 'EDITOR'),
  );
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
          router.push(`/${locale}/media` as Route);
        }}
        onOpenPairingModal={pairing.open}
      />
    ),
    [activeTab, locale, pairing.open, router],
  );

  useLayoutEffect(() => {
    if (!setHeaderInset || workspaceIdOverride) return;
    if (!branch) {
      setHeaderInset(null);
      return;
    }
    setHeaderInset(branchHeaderToolbar);
    return () => setHeaderInset(null);
  }, [setHeaderInset, branch, branchHeaderToolbar, workspaceIdOverride]);

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

  const onDeleteScreen = useCallback(
    async (screen: ScreenRow) => {
      setScreenDeleting(true);
      try {
        const res = await apiDeleteBranchScreen(workspaceIdParam, screen.id);
        if (!res.ok) {
          await toastResponseError(res);
          return;
        }
        toast.success(t('screenDeleted'));
        setScreenToDelete(null);
        await reloadScreens();
      } finally {
        setScreenDeleting(false);
      }
    },
    [workspaceIdParam, reloadScreens, t, toastResponseError],
  );

  if (!branch) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">{t('notFound')}</p>
        <Button type="button" variant="outline" className="rounded-lg" asChild>
          <Link href={`/${locale}/overview` as Route}>{t('backOverview')}</Link>
        </Button>
      </div>
    );
  }

  const loading = screensLoading || branchPlaylists.isLoading;

  return (
    <div className="space-y-8 pb-12">
      {/* Inline toolbar for branches page (header inset is skipped when workspaceIdOverride is set) */}
      {workspaceIdOverride && (
        <BranchWorkspaceToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewPlaylist={() => setCreateOpen(true)}
          onNewScreen={() => setScreenDialogOpen(true)}
          onNewMedia={() => {
            router.push(`/${locale}/media` as Route);
          }}
          onOpenPairingModal={pairing.open}
        />
      )}

      <CreateScreenDialog
        open={screenDialogOpen}
        onOpenChange={setScreenDialogOpen}
        workspaceId={workspaceIdParam}
        onCreated={() => {
          void reloadScreens();
          void branchPlaylists.reload();
        }}
      />

      <BranchStatsSection stats={stats} loading={loading} showHero={!workspaceIdOverride} />

      {activeTab === 'playlists' && canDeletePlaylist ? (
        <BranchReviewSection
          playlists={branchPlaylists.playlists}
          workspaceId={workspaceIdParam}
          onReviewed={() => void branchPlaylists.reload()}
        />
      ) : null}

      {activeTab === 'playlists' ? (
        <BranchPlaylistsSection
          playlists={branchPlaylists.playlists}
          isLoading={branchPlaylists.isLoading}
          duplicatingId={branchPlaylists.duplicatingId}
          onlineByPlaylistId={onlineByPlaylistId}
          locale={locale}
          workspaceIdParam={workspaceIdParam}
          canEditPlaylist={canEditPlaylist}
          canDeletePlaylist={canDeletePlaylist}
          onNewPlaylist={() => setCreateOpen(true)}
          onDuplicate={(pl) => void branchPlaylists.duplicate(pl)}
          onEdit={(pl) => {
            setPlaylistToEdit(pl);
            setEditPlaylistName(pl.name);
            setEditPlaylistPublished(pl.isPublished === true);
            setPlaylistEditOpen(true);
          }}
          onMove={(pl) => {
            setPlaylistToMove(pl);
            setMoveTargetId('');
          }}
          onDelete={(pl) => setPlaylistToDelete(pl)}
        />
      ) : null}

      {activeTab === 'screens' ? (
        <BranchScreensSection
          screens={screens}
          isLoading={screensLoading}
          locale={locale}
          workspaceIdParam={workspaceIdParam}
          canEditPlaylist={canEditPlaylist}
          playlists={branchPlaylists.playlists}
          assigningScreenId={screenAssignment.assigningScreenId}
          onAssign={(screenId, playlistId) => void screenAssignment.assign(screenId, playlistId)}
          onQuickEdit={(screen) => {
            setEditScreen(screen);
            setEditOpen(true);
          }}
          onDeleteScreen={async (screen) => setScreenToDelete(screen)}
        />
      ) : null}

      {activeTab === 'media' ? (
        <BranchMediaSection
          mediaItems={branchMedia.mediaItems}
          isLoading={branchMedia.isLoading}
        />
      ) : null}

      <BranchPairingDialog
        pairing={pairing}
        branchName={branch.name}
        canClaim={canClaimPlayerPairing}
      />

      <BranchPlaylistDialogs
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        newName={newName}
        setNewName={setNewName}
        onCreatePlaylist={onCreatePlaylist}
        isCreating={branchPlaylists.isCreating}
        editOpen={playlistEditOpen}
        setEditOpen={setPlaylistEditOpen}
        playlistToEdit={playlistToEdit}
        setPlaylistToEdit={setPlaylistToEdit}
        editPlaylistName={editPlaylistName}
        setEditPlaylistName={setEditPlaylistName}
        editPlaylistPublished={editPlaylistPublished}
        setEditPlaylistPublished={setEditPlaylistPublished}
        savePlaylistEdit={savePlaylistEdit}
        isSavingEdit={branchPlaylists.isSavingEdit}
        playlistToMove={playlistToMove}
        setPlaylistToMove={setPlaylistToMove}
        moveTargetId={moveTargetId}
        setMoveTargetId={setMoveTargetId}
        confirmMovePlaylist={confirmMovePlaylist}
        isMoving={branchPlaylists.isMoving}
        canDeletePlaylist={canDeletePlaylist}
        workspaces={workspaces}
        workspaceIdParam={workspaceIdParam}
        playlistToDelete={playlistToDelete}
        setPlaylistToDelete={setPlaylistToDelete}
        playlistDeleteForce={playlistDeleteForce}
        setPlaylistDeleteForce={setPlaylistDeleteForce}
        confirmDeletePlaylist={confirmDeletePlaylist}
        isDeleting={branchPlaylists.isDeleting}
      />

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
          if (editScreen) {
            router.push(`/${locale}/screens/${editScreen.id}` as Route);
          } else {
            router.push(`/${locale}/screens` as Route);
          }
        }}
      />

      <AlertDialog
        open={screenToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setScreenToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('screenDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('screenDeleteConfirm', { name: screenToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="rounded-lg" disabled={screenDeleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-destructive font-semibold text-white hover:bg-destructive/90"
              disabled={screenDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (screenToDelete) void onDeleteScreen(screenToDelete);
              }}
            >
              {t('screenDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
