'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchCanvases as apiFetchCanvases,
  fetchPlaylists as apiFetchPlaylists,
  fetchPlaylistDetail as apiFetchPlaylistDetail,
  fetchPlaylistGroups as apiFetchPlaylistGroups,
} from '@/features/studio/studio-api';
import { fetchMedia } from '@/features/media/api/media-api';
import { readPageItems } from '@/features/api/page';
import type { MediaItem } from '@/features/media/media-library-client';
import type { CanvasSummary } from '@/features/playlists/playlist-library-panels';
import { loadItemTransition, itemTransitionKey } from '@/features/playlists/playlist-transitions';
import type { PlaylistSummary, PlaylistGroup, Row } from '../types';

type UsePlaylistDataReturn = {
  library: MediaItem[];
  canvasLibrary: CanvasSummary[];
  playlists: PlaylistSummary[];
  groups: PlaylistGroup[];
  loading: boolean;
  setPlaylists: React.Dispatch<React.SetStateAction<PlaylistSummary[]>>;
  setGroups: React.Dispatch<React.SetStateAction<PlaylistGroup[]>>;
  setLibrary: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setCanvasLibrary: React.Dispatch<React.SetStateAction<CanvasSummary[]>>;
  loadLibrary: () => Promise<void>;
  loadPlaylists: () => Promise<void>;
  loadGroups: () => Promise<void>;
  loadCanvasLibrary: () => Promise<void>;
  loadPlaylistDetail: (id: string) => Promise<void>;
};

export function usePlaylistData(
  workspaceId: string | null,
  filterWorkspaceId: string,
  filterGroupId: string,
  setRows: React.Dispatch<React.SetStateAction<Row[]>>,
  setUndoStack: React.Dispatch<React.SetStateAction<Row[][]>>,
  setRedoStack: React.Dispatch<React.SetStateAction<Row[][]>>,
  skipHistoryRef: React.MutableRefObject<boolean>,
): UsePlaylistDataReturn {
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [canvasLibrary, setCanvasLibrary] = useState<CanvasSummary[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [groups, setGroups] = useState<PlaylistGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const items = await fetchMedia(workspaceId);
    setLibrary(items);
  }, [workspaceId]);

  const loadPlaylists = useCallback(async () => {
    const wsId = filterWorkspaceId || undefined;
    const grpId = filterGroupId || undefined;
    const res = await apiFetchPlaylists(wsId, grpId);
    if (res.ok) setPlaylists(await readPageItems<PlaylistSummary>(res));
  }, [filterWorkspaceId, filterGroupId]);

  const loadGroups = useCallback(async () => {
    const res = await apiFetchPlaylistGroups();
    if (res.ok) setGroups(await res.json());
  }, []);

  const loadCanvasLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const res = await apiFetchCanvases(workspaceId);
    if (res.ok) setCanvasLibrary(await readPageItems<CanvasSummary>(res));
  }, [workspaceId]);

  const loadPlaylistDetail = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      const res = await apiFetchPlaylistDetail(workspaceId, id);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: Array<{
          kind?: string;
          durationSec: number;
          zoneName?: string | null;
          media?: MediaItem;
          canvas?: { id: string; name: string };
        }>;
      };
      const mapped: Array<Row | null> = data.items.map((it, idx) => {
        const trKey = itemTransitionKey(it.kind ?? 'media', it.media?.id, it.canvas?.id, idx);
        const savedTransition = loadItemTransition(id, trKey);
        if (it.kind === 'canvas' && it.canvas) {
          return {
            clientId: crypto.randomUUID() as string,
            kind: 'canvas' as const,
            canvasId: it.canvas.id,
            durationSec: it.durationSec,
            canvas: { id: it.canvas.id, name: it.canvas.name },
            transition: savedTransition ?? undefined,
            zoneName: it.zoneName ?? null,
          };
        }
        if (it.media) {
          return {
            clientId: crypto.randomUUID() as string,
            kind: 'media' as const,
            mediaId: it.media.id,
            durationSec: it.durationSec,
            media: it.media,
            transition: savedTransition ?? undefined,
            zoneName: it.zoneName ?? null,
          };
        }
        return null;
      });
      skipHistoryRef.current = true;
      setUndoStack([]);
      setRedoStack([]);
      setRows(mapped.filter((r): r is Row => r !== null));
    },
    [workspaceId, setRows, setUndoStack, setRedoStack, skipHistoryRef],
  );

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    void (async () => {
      await loadLibrary();
      await loadPlaylists();
      await loadCanvasLibrary();
      await loadGroups();
      setLoading(false);
    })();
  }, [workspaceId, loadLibrary, loadPlaylists, loadCanvasLibrary, loadGroups]);

  return {
    library,
    canvasLibrary,
    playlists,
    groups,
    loading,
    setPlaylists,
    setGroups,
    setLibrary,
    setCanvasLibrary,
    loadLibrary,
    loadPlaylists,
    loadGroups,
    loadCanvasLibrary,
    loadPlaylistDetail,
  };
}
