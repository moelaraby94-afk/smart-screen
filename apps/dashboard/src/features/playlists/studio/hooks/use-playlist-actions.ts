'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  createPlaylist as apiCreatePlaylist,
  updatePlaylistItems as apiUpdatePlaylistItems,
  updatePlaylistMeta as apiUpdatePlaylistMeta,
} from '@/features/studio/studio-api';
import { apiFetch } from '@/features/auth/session';
import type { PlaylistSummary, Row } from '../types';

type UsePlaylistActionsParams = {
  workspaceId: string | null;
  filterWorkspaceId: string;
  filterGroupId: string;
  loadPlaylists: () => Promise<void>;
  loadPlaylistDetail: (id: string) => Promise<void>;
  bumpWorkspaceDataEpoch: () => void;
  setPlaylists: React.Dispatch<React.SetStateAction<PlaylistSummary[]>>;
  setPlaylistId: (id: string) => void;
  setNewName: (name: string) => void;
};

type UsePlaylistActionsReturn = {
  saving: boolean;
  togglingPublish: boolean;
  duplicating: boolean;
  cloning: boolean;
  createPlaylist: (name: string) => Promise<void>;
  savePlaylist: (playlistId: string, rows: Row[]) => Promise<void>;
  togglePublish: (playlistId: string, currentIsPublished: boolean) => Promise<void>;
  duplicatePlaylist: (playlistId: string) => Promise<void>;
  duplicatePlaylistById: (id: string) => Promise<void>;
  cloneToWorkspace: (playlistId: string, targetWs: string) => Promise<void>;
  handleDeletePlaylist: (id: string) => Promise<void>;
};

export function usePlaylistActions({
  workspaceId,
  filterWorkspaceId,
  filterGroupId,
  loadPlaylists,
  loadPlaylistDetail,
  bumpWorkspaceDataEpoch,
  setPlaylists,
  setPlaylistId,
  setNewName,
}: UsePlaylistActionsParams): UsePlaylistActionsReturn {
  const t = useTranslations('playlistStudioClient');
  const [saving, setSaving] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [cloning, setCloning] = useState(false);

  const createPlaylist = useCallback(
    async (name: string) => {
      if (!name.trim()) return;
      const wsId = filterWorkspaceId || workspaceId || null;
      const grpId = filterGroupId || null;
      const res = await apiCreatePlaylist(wsId, name.trim(), grpId);
      if (!res.ok) {
        toast.error(t('couldNotCreatePlaylist'));
        return;
      }
      const created = (await res.json()) as { id: string };
      toast.success(t('playlistCreated'));
      setNewName('');
      await loadPlaylists();
      bumpWorkspaceDataEpoch();
      setPlaylistId(created.id);
    },
    [filterWorkspaceId, workspaceId, filterGroupId, loadPlaylists, bumpWorkspaceDataEpoch, setPlaylistId, setNewName, t],
  );

  const savePlaylist = useCallback(
    async (playlistId: string, rows: Row[]) => {
      if (!workspaceId || !playlistId) return;
      setSaving(true);
      try {
        const body = {
          items: rows.map((r, index) =>
            r.kind === 'media'
              ? {
                  mediaId: r.mediaId,
                  durationSec: r.durationSec,
                  orderIndex: index,
                  zoneName: r.zoneName ?? null,
                }
              : {
                  canvasId: r.canvasId,
                  durationSec: r.durationSec,
                  orderIndex: index,
                  zoneName: r.zoneName ?? null,
                },
          ),
        };
        const res = await apiUpdatePlaylistItems(workspaceId, playlistId, body);
        if (!res.ok) throw new Error('save failed');
        toast.success(t('playlistSaved'));
        bumpWorkspaceDataEpoch();
        await loadPlaylistDetail(playlistId);
      } catch {
        toast.error(t('saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [workspaceId, loadPlaylistDetail, bumpWorkspaceDataEpoch, t],
  );

  const togglePublish = useCallback(
    async (playlistId: string, currentIsPublished: boolean) => {
      if (!workspaceId || !playlistId) return;
      setTogglingPublish(true);
      try {
        const res = await apiUpdatePlaylistMeta(workspaceId, playlistId, {
          isPublished: !currentIsPublished,
        });
        if (!res.ok) {
          toast.error(t('publishFailed'));
          return;
        }
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId ? { ...p, isPublished: !p.isPublished } : p,
          ),
        );
        toast.success(currentIsPublished ? t('unpublished') : t('published'));
        bumpWorkspaceDataEpoch();
      } finally {
        setTogglingPublish(false);
      }
    },
    [workspaceId, setPlaylists, bumpWorkspaceDataEpoch, t],
  );

  const duplicatePlaylist = useCallback(
    async (playlistId: string) => {
      if (!workspaceId || !playlistId) return;
      setDuplicating(true);
      try {
        const res = await apiFetch(
          `/playlists/${encodeURIComponent(playlistId)}/duplicate?workspaceId=${encodeURIComponent(workspaceId)}`,
          { method: 'POST' },
        );
        if (!res.ok) {
          toast.error(t('duplicateFailed'));
          return;
        }
        toast.success(t('duplicated'));
        await loadPlaylists();
        bumpWorkspaceDataEpoch();
      } finally {
        setDuplicating(false);
      }
    },
    [workspaceId, loadPlaylists, bumpWorkspaceDataEpoch, t],
  );

  const duplicatePlaylistById = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      const res = await apiFetch(
        `/playlists/${encodeURIComponent(id)}/duplicate?workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        toast.error(t('duplicateFailed'));
        return;
      }
      toast.success(t('duplicated'));
      await loadPlaylists();
      bumpWorkspaceDataEpoch();
    },
    [workspaceId, loadPlaylists, bumpWorkspaceDataEpoch, t],
  );

  const cloneToWorkspace = useCallback(
    async (playlistId: string, targetWs: string) => {
      if (!workspaceId || !playlistId || !targetWs) return;
      setCloning(true);
      try {
        const res = await apiFetch(
          `/playlists/${encodeURIComponent(playlistId)}/clone-to-workspace?workspaceId=${encodeURIComponent(workspaceId)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetWorkspaceId: targetWs }) },
        );
        if (!res.ok) {
          toast.error(t('cloneFailed'));
          return;
        }
        toast.success(t('cloned'));
        bumpWorkspaceDataEpoch();
      } finally {
        setCloning(false);
      }
    },
    [workspaceId, bumpWorkspaceDataEpoch, t],
  );

  const handleDeletePlaylist = useCallback(
    async (id: string) => {
      const wsId = workspaceId;
      if (!wsId) return;
      const res = await apiFetch(`/playlists/${id}?workspaceId=${encodeURIComponent(wsId)}&force=true`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error(t('couldNotDeletePlaylist'));
        return;
      }
      toast.success(t('playlistDeleted'));
      await loadPlaylists();
      bumpWorkspaceDataEpoch();
    },
    [workspaceId, loadPlaylists, bumpWorkspaceDataEpoch, t],
  );

  return {
    saving,
    togglingPublish,
    duplicating,
    cloning,
    createPlaylist,
    savePlaylist,
    togglePublish,
    duplicatePlaylist,
    duplicatePlaylistById,
    cloneToWorkspace,
    handleDeletePlaylist,
  };
}
