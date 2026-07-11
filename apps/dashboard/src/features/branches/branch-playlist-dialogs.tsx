'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import type { BranchPlaylistRow } from '@/features/branches/use-branch-playlists';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';

type PlaylistDialogsProps = {
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  onCreatePlaylist: () => Promise<void>;
  isCreating: boolean;

  editOpen: boolean;
  setEditOpen: (v: boolean) => void;
  playlistToEdit: BranchPlaylistRow | null;
  setPlaylistToEdit: (v: BranchPlaylistRow | null) => void;
  editPlaylistName: string;
  setEditPlaylistName: (v: string) => void;
  editPlaylistPublished: boolean;
  setEditPlaylistPublished: (v: boolean) => void;
  savePlaylistEdit: () => Promise<void>;
  isSavingEdit: boolean;

  playlistToMove: BranchPlaylistRow | null;
  setPlaylistToMove: (v: BranchPlaylistRow | null) => void;
  moveTargetId: string;
  setMoveTargetId: (v: string) => void;
  confirmMovePlaylist: () => Promise<void>;
  isMoving: boolean;
  canDeletePlaylist: boolean;
  workspaces: WorkspaceSummary[];
  workspaceIdParam: string;

  playlistToDelete: BranchPlaylistRow | null;
  setPlaylistToDelete: (v: BranchPlaylistRow | null) => void;
  playlistDeleteForce: boolean;
  setPlaylistDeleteForce: (v: boolean) => void;
  confirmDeletePlaylist: () => Promise<void>;
  isDeleting: boolean;
};

export function BranchPlaylistDialogs(props: PlaylistDialogsProps) {
  const t = useTranslations('branchDetail');

  return (
    <>
      {/* Create playlist dialog */}
      <Dialog open={props.createOpen} onOpenChange={props.setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('playlistDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="pl-name">{t('playlistNameLabel')}</Label>
            <Input
              id="pl-name"
              value={props.newName}
              onChange={(e) => props.setNewName(e.target.value)}
              placeholder={t('playlistNamePlaceholder')}
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void props.onCreatePlaylist();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => props.setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold"
              variant="cta"
              disabled={props.isCreating || !props.newName.trim()}
              onClick={() => void props.onCreatePlaylist()}
            >
              {props.isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit playlist dialog */}
      <Dialog
        open={props.editOpen}
        onOpenChange={(open) => {
          props.setEditOpen(open);
          if (!open) props.setPlaylistToEdit(null);
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
                value={props.editPlaylistName}
                onChange={(e) => props.setEditPlaylistName(e.target.value)}
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void props.savePlaylistEdit();
                }}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input accent-primary"
                checked={props.editPlaylistPublished}
                onChange={(e) => props.setEditPlaylistPublished(e.target.checked)}
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
                props.setEditOpen(false);
                props.setPlaylistToEdit(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold"
              variant="cta"
              disabled={props.isSavingEdit || !props.editPlaylistName.trim()}
              onClick={() => void props.savePlaylistEdit()}
            >
              {props.isSavingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
              ) : (
                t('playlistEditSave')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move playlist dialog */}
      <Dialog
        open={props.playlistToMove !== null}
        onOpenChange={(open) => {
          if (!open) {
            props.setPlaylistToMove(null);
            props.setMoveTargetId('');
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
              value={props.moveTargetId}
              onChange={(e) => props.setMoveTargetId(e.target.value)}
            >
              <option value="">{t('playlistMoveChooseBranch')}</option>
              {props.workspaces
                .filter((w) => w.id !== props.workspaceIdParam)
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
                props.setPlaylistToMove(null);
                props.setMoveTargetId('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-xl font-semibold"
              variant="cta"
              disabled={
                !props.moveTargetId ||
                props.isMoving ||
                props.workspaces.filter((w) => w.id !== props.workspaceIdParam).length === 0
              }
              onClick={() => void props.confirmMovePlaylist()}
            >
              {props.isMoving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
              ) : props.canDeletePlaylist ? (
                t('playlistMoveConfirm')
              ) : (
                t('playlistMoveCopyOnly')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete playlist dialog */}
      <AlertDialog
        open={props.playlistToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            props.setPlaylistToDelete(null);
            props.setPlaylistDeleteForce(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('playlistDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {props.playlistDeleteForce ? t('playlistDeleteBodyForce') : t('playlistDeleteBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex cursor-pointer items-start gap-3 px-1 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input accent-primary"
              checked={props.playlistDeleteForce}
              onChange={(e) => props.setPlaylistDeleteForce(e.target.checked)}
            />
            <span>
              <span className="font-medium text-foreground dark:text-white">{t('playlistDeleteForceLabel')}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{t('playlistDeleteForceHint')}</span>
            </span>
          </label>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="rounded-xl" disabled={props.isDeleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              className="rounded-xl bg-red-600 font-semibold text-white hover:bg-red-600/90"
              disabled={props.isDeleting}
              onClick={() => void props.confirmDeletePlaylist()}
            >
              {props.isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
              ) : (
                t('playlistDelete')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
