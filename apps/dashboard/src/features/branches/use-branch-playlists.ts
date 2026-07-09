'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiFetch, readApiErrorMessage } from '@/features/auth/session';

export type BranchPlaylistRow = {
  id: string;
  workspaceId: string;
  name: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { items: number; screensInGroup: number };
};

export function useBranchPlaylists(workspaceId: string, onMutated: () => void) {
  const t = useTranslations('branchDetail');
  const [playlists, setPlaylists] = useState<BranchPlaylistRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setPlaylists([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await apiFetch(`/playlists?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const data = (await res.json()) as BranchPlaylistRow[];
      setPlaylists(
        Array.isArray(data) ? data.map((p) => ({ ...p, isPublished: p.isPublished === true })) : [],
      );
    } else {
      setPlaylists([]);
      if (res.status !== 401) {
        toast.error(await readApiErrorMessage(res));
      }
    }
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed || !workspaceId) return false;
      setIsCreating(true);
      try {
        const res = await apiFetch('/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, name: trimmed }),
        });
        if (!res.ok) {
          toast.error(await readApiErrorMessage(res));
          return false;
        }
        toast.success(t('playlistCreated'));
        await reload();
        onMutated();
        return true;
      } finally {
        setIsCreating(false);
      }
    },
    [workspaceId, t, reload, onMutated],
  );

  const duplicate = useCallback(
    async (playlist: BranchPlaylistRow) => {
      if (!workspaceId) return;
      setDuplicatingId(playlist.id);
      try {
        const res = await apiFetch(
          `/playlists/${encodeURIComponent(playlist.id)}/duplicate?workspaceId=${encodeURIComponent(workspaceId)}`,
          { method: 'POST' },
        );
        if (!res.ok) {
          toast.error(await readApiErrorMessage(res));
          return;
        }
        toast.success(t('playlistDuplicated'));
        await reload();
        onMutated();
      } finally {
        setDuplicatingId(null);
      }
    },
    [workspaceId, t, reload, onMutated],
  );

  const remove = useCallback(
    async (playlist: BranchPlaylistRow, force: boolean): Promise<boolean> => {
      if (!workspaceId) return false;
      setIsDeleting(true);
      try {
        const forceQ = force ? '&force=true' : '';
        const res = await apiFetch(
          `/playlists/${encodeURIComponent(playlist.id)}?workspaceId=${encodeURIComponent(workspaceId)}${forceQ}`,
          { method: 'DELETE' },
        );
        if (!res.ok) {
          toast.error(await readApiErrorMessage(res));
          return false;
        }
        toast.success(t('playlistDeleted'));
        await reload();
        onMutated();
        return true;
      } finally {
        setIsDeleting(false);
      }
    },
    [workspaceId, t, reload, onMutated],
  );

  const move = useCallback(
    async (playlist: BranchPlaylistRow, targetWorkspaceId: string, alsoDeleteSource: boolean): Promise<boolean> => {
      if (!workspaceId || !targetWorkspaceId) return false;
      if (targetWorkspaceId === workspaceId) {
        toast.error(t('playlistMoveChooseBranch'));
        return false;
      }
      setIsMoving(true);
      try {
        const cloneRes = await apiFetch(
          `/playlists/${encodeURIComponent(playlist.id)}/clone-to-workspace?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetWorkspaceId }),
          },
        );
        if (!cloneRes.ok) {
          toast.error(await readApiErrorMessage(cloneRes));
          return false;
        }
        if (alsoDeleteSource) {
          const delRes = await apiFetch(
            `/playlists/${encodeURIComponent(playlist.id)}?workspaceId=${encodeURIComponent(workspaceId)}&force=true`,
            { method: 'DELETE' },
          );
          if (!delRes.ok) {
            toast.warning(t('playlistMovePartial', { message: await readApiErrorMessage(delRes) }));
          } else {
            toast.success(t('playlistMoved'));
          }
        } else {
          toast.success(t('playlistClonedToBranch'));
        }
        await reload();
        onMutated();
        return true;
      } finally {
        setIsMoving(false);
      }
    },
    [workspaceId, t, reload, onMutated],
  );

  const update = useCallback(
    async (playlist: BranchPlaylistRow, changes: { name: string; isPublished: boolean }): Promise<boolean> => {
      if (!workspaceId) return false;
      const name = changes.name.trim();
      if (!name) {
        toast.error(t('playlistNameRequired'));
        return false;
      }
      setIsSavingEdit(true);
      try {
        const res = await apiFetch(
          `/playlists/${encodeURIComponent(playlist.id)}?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, isPublished: changes.isPublished }),
          },
        );
        if (!res.ok) {
          toast.error(await readApiErrorMessage(res));
          return false;
        }
        toast.success(t('playlistUpdated'));
        await reload();
        onMutated();
        return true;
      } finally {
        setIsSavingEdit(false);
      }
    },
    [workspaceId, t, reload, onMutated],
  );

  return {
    playlists,
    isLoading,
    reload,
    create,
    isCreating,
    duplicate,
    duplicatingId,
    remove,
    isDeleting,
    move,
    isMoving,
    update,
    isSavingEdit,
  };
}
