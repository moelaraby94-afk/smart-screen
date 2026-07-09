import type { ScreenRow } from '@/features/screens/useApiScreens';

export function computeOnlineByPlaylistId(screens: ScreenRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const screen of screens) {
    if (!screen.playlistGroupId || screen.status !== 'ONLINE') continue;
    const id = screen.playlistGroupId;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export type BranchScreenStats = {
  total: number;
  online: number;
  inactive: number;
  offline: number;
  maintenance: number;
};

export function computeBranchScreenStats(screens: ScreenRow[]): BranchScreenStats {
  let online = 0;
  let offline = 0;
  let maintenance = 0;
  for (const screen of screens) {
    if (screen.status === 'ONLINE') online += 1;
    else if (screen.status === 'MAINTENANCE') maintenance += 1;
    else offline += 1;
  }
  return {
    total: screens.length,
    online,
    inactive: offline + maintenance,
    offline,
    maintenance,
  };
}
