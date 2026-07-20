'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useRealtimeSocket } from '@/features/realtime/realtime-provider';
import type { ScreenRow, ScreenStatus } from './useApiScreens';

type ScreenStatusPayload = {
  screenId: string;
  serialNumber: string;
  status: ScreenStatus;
  lastSeenAt: string;
  isOfflineCacheMode?: boolean;
};

export function useScreenRealtime(
  workspaceId: string | null,
  setScreens: Dispatch<SetStateAction<ScreenRow[]>>,
): void {
  const socket = useRealtimeSocket();

  useEffect(() => {
    if (!socket || !workspaceId) return;

    socket.on('screen:status', (payload: ScreenStatusPayload) => {
      setScreens((prev) =>
        prev.map((screen) =>
          screen.id === payload.screenId
            ? {
                ...screen,
                status: payload.status,
                lastSeenAt: payload.lastSeenAt,
                updatedAt: payload.lastSeenAt,
                ...(typeof payload.isOfflineCacheMode === 'boolean'
                  ? { isOfflineCacheMode: payload.isOfflineCacheMode }
                  : {}),
              }
            : screen,
        ),
      );
    });

    return () => {
      socket.off('screen:status');
    };
  }, [socket, workspaceId, setScreens]);
}
