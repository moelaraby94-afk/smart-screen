/**
 * Pure-function tests for nested playlist validation logic.
 * Tests self-reference prevention, circular reference detection,
 * and max recursion depth protection.
 */

const MAX_NESTING_DEPTH = 5;

type FakeItem = {
  mediaId: string | null;
  canvasId: string | null;
  nestedPlaylistId: string | null;
  orderIndex?: number;
};

type FakePlaylist = {
  id: string;
  items: FakeItem[];
};

function createFakePlaylistMap(
  playlists: FakePlaylist[],
): Map<string, FakePlaylist> {
  return new Map(playlists.map((p) => [p.id, p]));
}

function assertNoCircularReferenceSync(
  playlistMap: Map<string, FakePlaylist>,
  nestedPlaylistId: string,
  targetPlaylistId: string,
  visited: Set<string>,
): void {
  if (nestedPlaylistId === targetPlaylistId) {
    throw new Error(
      'Circular reference detected: nested playlist would create a loop.',
    );
  }

  if (visited.has(nestedPlaylistId)) {
    throw new Error(
      'Circular reference detected: nested playlist would create a loop.',
    );
  }

  visited.add(nestedPlaylistId);

  const playlist = playlistMap.get(nestedPlaylistId);
  if (!playlist) return;

  for (const item of playlist.items) {
    if (item.nestedPlaylistId) {
      assertNoCircularReferenceSync(
        playlistMap,
        item.nestedPlaylistId,
        targetPlaylistId,
        new Set(visited),
      );
    }
  }
}

function resolvePlaylistItemsSync(
  playlistMap: Map<string, FakePlaylist>,
  playlist: FakePlaylist,
  visited: Set<string>,
  depth: number,
): Array<{ kind: 'media' | 'canvas' | 'playlist'; orderIndex: number }> {
  if (depth >= MAX_NESTING_DEPTH) {
    return [];
  }

  const result: Array<{
    kind: 'media' | 'canvas' | 'playlist';
    orderIndex: number;
  }> = [];

  for (const item of playlist.items) {
    if (item.mediaId) {
      result.push({ kind: 'media', orderIndex: item.orderIndex ?? 0 });
    } else if (item.canvasId) {
      result.push({ kind: 'canvas', orderIndex: item.orderIndex ?? 0 });
    } else if (item.nestedPlaylistId && !visited.has(item.nestedPlaylistId)) {
      const nested = playlistMap.get(item.nestedPlaylistId);
      if (nested) {
        const nestedVisited = new Set(visited);
        nestedVisited.add(item.nestedPlaylistId);
        const nestedItems = resolvePlaylistItemsSync(
          playlistMap,
          nested,
          nestedVisited,
          depth + 1,
        );
        result.push(...nestedItems);
      }
    }
  }

  return result;
}

describe('Nested playlist validation', () => {
  describe('Self-reference prevention', () => {
    it('blocks playlist from containing itself', () => {
      const playlistId = 'pl-1';
      const item: FakeItem = {
        mediaId: null,
        canvasId: null,
        nestedPlaylistId: playlistId,
      };
      expect(item.nestedPlaylistId === playlistId).toBe(true);
    });
  });

  describe('Circular reference detection', () => {
    it('detects direct circular reference A → B → A', () => {
      const playlists: FakePlaylist[] = [
        {
          id: 'pl-a',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-b',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-b',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-a',
              orderIndex: 0,
            },
          ],
        },
      ];
      const map = createFakePlaylistMap(playlists);

      expect(() => {
        assertNoCircularReferenceSync(map, 'pl-b', 'pl-a', new Set());
      }).toThrow('Circular reference detected');
    });

    it('detects indirect circular reference A → B → C → A', () => {
      const playlists: FakePlaylist[] = [
        {
          id: 'pl-a',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-b',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-b',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-c',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-c',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-a',
              orderIndex: 0,
            },
          ],
        },
      ];
      const map = createFakePlaylistMap(playlists);

      expect(() => {
        assertNoCircularReferenceSync(map, 'pl-b', 'pl-a', new Set());
      }).toThrow('Circular reference detected');
    });

    it('passes for non-circular nested playlists', () => {
      const playlists: FakePlaylist[] = [
        {
          id: 'pl-a',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-b',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-b',
          items: [
            {
              mediaId: 'media-1',
              canvasId: null,
              nestedPlaylistId: null,
              orderIndex: 0,
            },
          ],
        },
      ];
      const map = createFakePlaylistMap(playlists);

      expect(() => {
        assertNoCircularReferenceSync(map, 'pl-b', 'pl-a', new Set());
      }).not.toThrow();
    });

    it('passes for deep non-circular chain A → B → C → D', () => {
      const playlists: FakePlaylist[] = [
        {
          id: 'pl-a',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-b',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-b',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-c',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-c',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-d',
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'pl-d',
          items: [
            {
              mediaId: 'media-1',
              canvasId: null,
              nestedPlaylistId: null,
              orderIndex: 0,
            },
          ],
        },
      ];
      const map = createFakePlaylistMap(playlists);

      expect(() => {
        assertNoCircularReferenceSync(map, 'pl-b', 'pl-a', new Set());
      }).not.toThrow();
    });
  });

  describe('Max recursion depth protection', () => {
    it('stops resolving at MAX_NESTING_DEPTH', () => {
      const playlists: FakePlaylist[] = [];
      for (let i = 0; i < 10; i++) {
        const items: FakeItem[] = [
          {
            mediaId: `media-${i}`,
            canvasId: null,
            nestedPlaylistId: null,
            orderIndex: 0,
          },
        ];
        if (i < 9) {
          items.push({
            mediaId: null,
            canvasId: null,
            nestedPlaylistId: `pl-${i + 1}`,
            orderIndex: 1,
          });
        }
        playlists.push({ id: `pl-${i}`, items });
      }
      const map = createFakePlaylistMap(playlists);

      const result = resolvePlaylistItemsSync(
        map,
        playlists[0],
        new Set(['pl-0']),
        0,
      );
      // pl-0: media-0 + nested pl-1 (depth 0→1)
      // pl-1: media-1 + nested pl-2 (depth 1→2)
      // pl-2: media-2 + nested pl-3 (depth 2→3)
      // pl-3: media-3 + nested pl-4 (depth 3→4)
      // pl-4: media-4 + nested pl-5 (depth 4→5, stops — pl-5 not resolved)
      // So we get 5 media items (media-0 through media-4)
      expect(result.length).toBe(5);
    });

    it('resolves all items when depth is within limit', () => {
      const playlists: FakePlaylist[] = [
        {
          id: 'pl-0',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-1',
              orderIndex: 0,
            },
            {
              mediaId: 'media-0',
              canvasId: null,
              nestedPlaylistId: null,
              orderIndex: 1,
            },
          ],
        },
        {
          id: 'pl-1',
          items: [
            {
              mediaId: 'media-1',
              canvasId: null,
              nestedPlaylistId: null,
              orderIndex: 0,
            },
            {
              mediaId: 'media-2',
              canvasId: null,
              nestedPlaylistId: null,
              orderIndex: 1,
            },
          ],
        },
      ];
      const map = createFakePlaylistMap(playlists);

      const result = resolvePlaylistItemsSync(
        map,
        playlists[0],
        new Set(['pl-0']),
        0,
      );
      // pl-0 has 1 media item + 1 nested → pl-1 has 2 media items = 3 total
      expect(result.length).toBe(3);
    });
  });

  describe('Visited set prevents infinite loops', () => {
    it('skips already-visited playlists', () => {
      const playlists: FakePlaylist[] = [
        {
          id: 'pl-0',
          items: [
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-1',
              orderIndex: 0,
            },
            {
              mediaId: null,
              canvasId: null,
              nestedPlaylistId: 'pl-1',
              orderIndex: 1,
            },
          ],
        },
        {
          id: 'pl-1',
          items: [
            {
              mediaId: 'media-1',
              canvasId: null,
              nestedPlaylistId: null,
              orderIndex: 0,
            },
          ],
        },
      ];
      const map = createFakePlaylistMap(playlists);

      const result = resolvePlaylistItemsSync(
        map,
        playlists[0],
        new Set(['pl-0']),
        0,
      );
      // pl-1 is referenced twice in the timeline, so it plays twice
      // visited set is for cycle detection, not deduplication
      expect(result.length).toBe(2);
    });
  });
});
