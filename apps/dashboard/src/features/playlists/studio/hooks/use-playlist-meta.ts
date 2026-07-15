'use client';

import { useCallback, useState } from 'react';
import {
  type PlaylistLocalMeta,
  DEFAULT_PLAYLIST_META,
  loadPlaylistMeta,
  savePlaylistMeta,
} from '@/features/playlists/playlist-transitions';

type UsePlaylistMetaReturn = {
  playlistMeta: PlaylistLocalMeta;
  setPlaylistMeta: React.Dispatch<React.SetStateAction<PlaylistLocalMeta>>;
  updatePlaylistMeta: (patch: Partial<PlaylistLocalMeta>) => void;
};

export function usePlaylistMeta(playlistId: string): UsePlaylistMetaReturn {
  const [playlistMeta, setPlaylistMeta] = useState<PlaylistLocalMeta>(DEFAULT_PLAYLIST_META);

  const updatePlaylistMeta = useCallback(
    (patch: Partial<PlaylistLocalMeta>) => {
      setPlaylistMeta((prev) => {
        const next = { ...prev, ...patch };
        if (playlistId) savePlaylistMeta(playlistId, next);
        return next;
      });
    },
    [playlistId],
  );

  return { playlistMeta, setPlaylistMeta, updatePlaylistMeta };
}
