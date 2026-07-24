'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/features/auth/session';
import { readPage } from '@/features/api/page';

export type WorkspaceCounts = {
  media: number;
  screens: number;
  playlists: number;
};

export function useWorkspaceStats(
  workspaceId: string | null,
  dataEpoch: number,
): WorkspaceCounts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<WorkspaceCounts>({
    media: 0,
    screens: 0,
    playlists: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const buildUrl = (resource: string) => {
      const params = new URLSearchParams({ page: '1', limit: '1' });
      if (workspaceId) params.set('workspaceId', workspaceId);
      return apiFetch(`/${resource}?${params.toString()}`);
    };

    (async () => {
      try {
        const [mRes, sRes, pRes] = await Promise.all([
          buildUrl('media'),
          buildUrl('screens'),
          buildUrl('playlists'),
        ]);
        const [media, screens, playlists] = await Promise.all([
          readPage(mRes),
          readPage(sRes),
          readPage(pRes),
        ]);
        if (cancelled) return;
        setCounts({
          media: media.total,
          screens: screens.total,
          playlists: playlists.total,
        });
      } catch {
        if (!cancelled) setCounts({ media: 0, screens: 0, playlists: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, dataEpoch, pathname]);

  return counts;
}
