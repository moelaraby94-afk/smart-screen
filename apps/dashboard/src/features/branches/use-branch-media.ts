'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
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
      setMediaItems(await readPageItems<MediaItem>(res));
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
