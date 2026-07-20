'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { apiFetch } from '@/features/auth/session';

export type ScreenStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export type ScreenRow = {
  id: string;
  name: string;
  serialNumber: string;
  location?: string | null;
  resolutionWidth?: number;
  resolutionHeight?: number;
  status: ScreenStatus;
  isOfflineCacheMode?: boolean;
  lastSeenAt?: string | null;
  playlistGroupId?: string | null;
  playlistGroup?: { id: string; name: string } | null;
  activePlaylistId: string | null;
  activePlaylist: { id: string; name: string } | null;
  overridePlaylistId?: string | null;
  overrideExpiresAt?: string | null;
  playerTicker?: string | null;
  orientation?: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
  playerPlatform?: string | null;
  updatedAt: string;
};

type ListResponse = {
  items: ScreenRow[];
  page?: number;
  total?: number;
};

type ScreensOptions = {
  playlistGroupId?: string;
};

async function screensFetcher(key: string): Promise<ScreenRow[]> {
  const response = await apiFetch(key, { method: 'GET' });
  if (!response.ok) throw new Error(`Failed to fetch screens: ${response.status}`);
  const payload = (await response.json()) as ListResponse | ScreenRow[];
  const items = Array.isArray(payload) ? payload : payload.items;
  return Array.isArray(items) ? items : [];
}

export function useApiScreens(workspaceId: string | null, options?: ScreensOptions) {
  const playlistGroupId = options?.playlistGroupId;

  const params = new URLSearchParams();
  if (workspaceId) {
    params.set('workspaceId', workspaceId);
    params.set('limit', '500');
    params.set('page', '1');
  }
  if (playlistGroupId) params.set('playlistGroupId', playlistGroupId);

  const key = workspaceId ? `/screens?${params.toString()}` : null;

  const { data, isLoading, error, mutate } = useSWR(key, screensFetcher, {
    fallbackData: [] as ScreenRow[],
  });

  const screens = data ?? [];
  const isError = Boolean(error);

  const setScreens = useCallback(
    (updater: ScreenRow[] | ((prev: ScreenRow[]) => ScreenRow[])) => {
      void mutate(
        typeof updater === 'function'
          ? (current: ScreenRow[] | undefined) => updater(current ?? [])
          : updater,
        false,
      );
    },
    [mutate],
  );

  const reload = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return { screens, setScreens, isLoading, isError, reload };
}
