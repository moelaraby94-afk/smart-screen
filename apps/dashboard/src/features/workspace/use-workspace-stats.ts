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
    if (!workspaceId) {
      setCounts({ media: 0, screens: 0, playlists: 0 });
      return;
    }
    let cancelled = false;
    /**
     * Three counts, three `total` fields. This used to download the entire media
     * library and the entire playlist list and take `.length` of each — a full
     * table scan over the wire per sidebar render, and a wrong number as soon as
     * the server's page cap bit. `limit=1` fetches one row for its `total`.
     */
    const countOnly = (path: string) =>
      apiFetch(`${path}&page=1&limit=1`);

    (async () => {
      try {
        const ws = encodeURIComponent(workspaceId);
        const [mRes, sRes, pRes] = await Promise.all([
          countOnly(`/media?workspaceId=${ws}`),
          countOnly(`/screens?workspaceId=${ws}`),
          countOnly(`/playlists?workspaceId=${ws}`),
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
