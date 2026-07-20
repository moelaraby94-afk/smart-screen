'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  getStoredAccessToken,
  setStoredAccessToken,
  apiFetch,
} from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';

function getRealtimeBaseUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4000';
}

type RealtimeContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
  isConnected: false,
});

export function useRealtimeSocket(): Socket | null {
  return useContext(RealtimeContext).socket;
}

export function useRealtimeConnected(): boolean {
  return useContext(RealtimeContext).isConnected;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await apiFetch('/auth/refresh', {
      method: 'POST',
      omitAuth: true,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { accessToken?: string };
    if (body.accessToken) {
      setStoredAccessToken(body.accessToken);
      return body.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { workspaceId, isAuthenticated } = useWorkspace();
  const tErrors = useTranslations('errors');
  const socketRef = useRef<Socket | null>(null);
  const connectedRef = useRef(false);
  const toastShownRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !workspaceId) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const createSocket = (token: string | null) => {
      const socket = io(`${getRealtimeBaseUrl()}/realtime`, {
        path: '/socket.io',
        withCredentials: true,
        auth: token ? { token } : undefined,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 15000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        connectedRef.current = true;
        toastShownRef.current = false;
        socket.emit('dashboard:subscribe', { workspaceId });
      });

      socket.on('dashboard:error', async () => {
        if (toastShownRef.current || refreshingRef.current) return;
        refreshingRef.current = true;

        const newToken = await refreshAccessToken();
        refreshingRef.current = false;

        if (newToken) {
          socket.disconnect();
          socketRef.current = createSocket(newToken);
        } else {
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.error(tErrors('REALTIME_CONNECTION_REJECTED'));
          }
        }
      });

      socket.on('connect_error', () => {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.error(tErrors('REALTIME_CONNECTION_FAILED'));
        }
      });

      socket.on('disconnect', (reason) => {
        connectedRef.current = false;
        if (reason === 'io server disconnect') {
          reconnectTimer = setTimeout(() => socket.connect(), 1000);
        }
      });

      return socket;
    };

    const token = getStoredAccessToken();
    socketRef.current = createSocket(token);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      connectedRef.current = false;
      toastShownRef.current = false;
    };
  }, [workspaceId, isAuthenticated, tErrors]);

  return (
    <RealtimeContext.Provider
      value={{
        socket: socketRef.current,
        isConnected: connectedRef.current,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
