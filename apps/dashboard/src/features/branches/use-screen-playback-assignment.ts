'use client';

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiFetch } from '@/features/auth/session';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import type { ScreenRow } from '@/features/screens/useApiScreens';
import type { BranchPlaylistRow } from './use-branch-playlists';

export function useScreenPlaybackAssignment(
  workspaceId: string,
  setScreens: Dispatch<SetStateAction<ScreenRow[]>>,
  playlists: BranchPlaylistRow[],
  onAssigned: () => void,
) {
  const t = useTranslations('branchDetail');
  const { toastResponseError } = useApiErrorToast();
  const [assigningScreenId, setAssigningScreenId] = useState<string | null>(null);

  const assign = useCallback(
    async (screenId: string, playlistId: string | null) => {
      if (!workspaceId) return;
      setAssigningScreenId(screenId);
      try {
        const res = await apiFetch(
          `/screens/${encodeURIComponent(screenId)}?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activePlaylistId: playlistId }),
          },
        );
        if (!res.ok) {
          await toastResponseError(res);
          return;
        }
        const name = playlistId === null ? null : (playlists.find((p) => p.id === playlistId)?.name ?? null);
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
        toast.success(t('screenPlaylistAssignOk'));
        onAssigned();
      } finally {
        setAssigningScreenId(null);
      }
    },
    [workspaceId, playlists, setScreens, t, onAssigned, toastResponseError],
  );

  return { assigningScreenId, assign };
}
