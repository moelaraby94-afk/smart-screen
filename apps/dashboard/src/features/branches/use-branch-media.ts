'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/features/auth/session';
import { type MediaItem } from '@/features/media/media-library-client';

export function useBranchMedia(workspaceId: string) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setMediaItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await apiFetch(`/media?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const data = (await res.json()) as MediaItem[];
      setMediaItems(Array.isArray(data) ? data : []);
    } else {
      setMediaItems([]);
    }
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { mediaItems, isLoading, reload };
}
