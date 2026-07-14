'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  deleteScreen as apiDeleteScreen,
  sendRemoteCommand as apiSendRemoteCommand,
  updateScreen as apiUpdateScreen,
  type RemoteCommand,
  type ScreenUpdateInput,
} from '../api/screens-api';
import type { ScreenRow } from '../useApiScreens';

type UseScreenActionsParams = {
  workspaceId: string | null;
  setScreens: React.Dispatch<React.SetStateAction<ScreenRow[]>>;
  reload: () => Promise<void>;
  bumpWorkspaceDataEpoch: () => void;
};

export function useScreenActions({
  workspaceId,
  setScreens,
  reload,
  bumpWorkspaceDataEpoch,
}: UseScreenActionsParams) {
  const t = useTranslations('screensClient');

  const assignPlaybackPlaylist = useCallback(
    async (screenId: string, playlistId: string | null, playlistName?: string | null) => {
      if (!workspaceId) return;
      const res = await apiUpdateScreen(workspaceId, screenId, { activePlaylistId: playlistId });
      if (!res.ok) {
        toast.error(t('playlistAssignFailed'));
        return;
      }
      const name =
        playlistId === null
          ? null
          : (playlistName ?? null);
      setScreens((prev) =>
        prev.map((s) =>
          s.id === screenId
            ? {
                ...s,
                activePlaylistId: playlistId,
                activePlaylist: playlistId && name ? { id: playlistId, name } : null,
              }
            : s,
        ),
      );
      toast.success(t('playlistAssignedToast'));
      bumpWorkspaceDataEpoch();
    },
    [workspaceId, setScreens, bumpWorkspaceDataEpoch, t],
  );

  const onDelete = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      const response = await apiDeleteScreen(workspaceId, id);
      if (!response.ok) {
        toast.error(t('deleteFailed'));
        return;
      }
      toast.success(t('deleted'));
      await reload();
      bumpWorkspaceDataEpoch();
    },
    [workspaceId, reload, bumpWorkspaceDataEpoch, t],
  );

  const sendRemoteCommand = useCallback(
    async (screenId: string, command: RemoteCommand) => {
      if (!workspaceId) return;
      const response = await apiSendRemoteCommand(workspaceId, screenId, command);
      if (!response.ok) {
        toast.error(t('remoteFailed'));
        return;
      }
      if (command === 'refresh_content') {
        toast.success(t('syncContentOk'));
        bumpWorkspaceDataEpoch();
      } else if (command === 'identify') {
        toast.success(t('identifyOk'));
      } else {
        toast.success(t('remoteRefreshOk'));
      }
    },
    [workspaceId, t, bumpWorkspaceDataEpoch],
  );

  const updateScreenInline = useCallback(
    async (screenId: string, data: ScreenUpdateInput): Promise<boolean> => {
      if (!workspaceId) return false;
      const res = await apiUpdateScreen(workspaceId, screenId, data);
      if (!res.ok) return false;
      await reload();
      bumpWorkspaceDataEpoch();
      return true;
    },
    [workspaceId, reload, bumpWorkspaceDataEpoch],
  );

  return {
    assignPlaybackPlaylist,
    onDelete,
    sendRemoteCommand,
    updateScreenInline,
  };
}
