'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  createPlaylistGroup as apiCreatePlaylistGroup,
  renamePlaylistGroup as apiRenamePlaylistGroup,
  deletePlaylistGroup as apiDeletePlaylistGroup,
  movePlaylistGroup as apiMovePlaylistGroup,
} from '@/features/studio/studio-api';

type UseGroupActionsParams = {
  loadGroups: () => Promise<void>;
  loadPlaylists: () => Promise<void>;
  filterGroupId: string;
  setFilterGroupId: (id: string) => void;
  setNewGroupName: (name: string) => void;
  setRenamingGroupId: (id: string | null) => void;
  setRenameGroupValue: (value: string) => void;
};

type UseGroupActionsReturn = {
  handleCreateGroup: (name: string, parentGroupId?: string | null) => Promise<void>;
  handleRenameGroup: (groupId: string, newName: string) => Promise<void>;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  handleMoveGroup: (groupId: string, newParentId: string | null) => Promise<void>;
};

export function useGroupActions({
  loadGroups,
  loadPlaylists,
  filterGroupId,
  setFilterGroupId,
  setNewGroupName,
  setRenamingGroupId,
  setRenameGroupValue,
}: UseGroupActionsParams): UseGroupActionsReturn {
  const t = useTranslations('playlistStudioClient');

  const handleCreateGroup = useCallback(
    async (name: string, parentGroupId?: string | null) => {
      if (!name.trim()) return;
      const res = await apiCreatePlaylistGroup(name.trim(), parentGroupId ?? null);
      if (!res.ok) {
        toast.error(t('couldNotCreateGroup'));
        return;
      }
      toast.success(t('groupCreated'));
      setNewGroupName('');
      await loadGroups();
    },
    [loadGroups, setNewGroupName, t],
  );

  const handleRenameGroup = useCallback(
    async (groupId: string, newName: string) => {
      if (!newName.trim()) return;
      const res = await apiRenamePlaylistGroup(groupId, newName.trim());
      if (!res.ok) {
        toast.error(t('couldNotRenameGroup'));
        return;
      }
      toast.success(t('groupRenamed'));
      setRenamingGroupId(null);
      setRenameGroupValue('');
      await loadGroups();
    },
    [loadGroups, setRenamingGroupId, setRenameGroupValue, t],
  );

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      const res = await apiDeletePlaylistGroup(groupId);
      if (!res.ok) {
        toast.error(t('couldNotDeleteGroup'));
        return;
      }
      toast.success(t('groupDeleted'));
      if (filterGroupId === groupId) setFilterGroupId('');
      await loadGroups();
      await loadPlaylists();
    },
    [filterGroupId, setFilterGroupId, loadGroups, loadPlaylists, t],
  );

  const handleMoveGroup = useCallback(
    async (groupId: string, newParentId: string | null) => {
      const res = await apiMovePlaylistGroup(groupId, newParentId);
      if (!res.ok) {
        toast.error(t('couldNotMoveGroup'));
        return;
      }
      toast.success(t('groupMoved'));
      await loadGroups();
    },
    [loadGroups, t],
  );

  return { handleCreateGroup, handleRenameGroup, handleDeleteGroup, handleMoveGroup };
}
