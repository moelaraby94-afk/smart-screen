import { devWarn } from '@/lib/dev-log';

const CACHE_NAME = 'smartscreen-player-v1';

/**
 * Maximum number of entries to keep in the Cache API. Beyond this, the oldest
 * entries (by cache key insertion order, which approximates LRU for a player
 * that receives sequential playlist updates) are evicted. Set high enough that
 * a normal playlist's media all fits, but low enough to bound disk usage on
 * long-running kiosks.
 */
const MAX_CACHE_ENTRIES = 200;

/** Maps canonical media URL → object URL (deduped until cleared). */
const urlToBlob = new Map<string, string>();

function revokeAllBlobUrls(): void {
  for (const u of urlToBlob.values()) {
    try {
      URL.revokeObjectURL(u);
    } catch {
      // ignore
    }
  }
  urlToBlob.clear();
}

/**
 * Deletes the player Cache Storage bucket and revokes blob URLs created for playback.
 */
export async function clearPlayerMediaCache(): Promise<void> {
  revokeAllBlobUrls();
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // ignore
  }
}

/** Drop in-memory blob URLs without touching Cache Storage (e.g. after playlist refresh). */
export function invalidateResolvedBlobUrls(): void {
  revokeAllBlobUrls();
}

async function openCache(): Promise<Cache> {
  return caches.open(CACHE_NAME);
}

/**
 * Background prefetch: stores responses in Cache API for offline playback.
 */
export async function warmMediaUrls(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  const cache = await openCache();
  await Promise.all(
    unique.map(async (url) => {
      const hit = await cache.match(url);
      if (hit) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (res.ok) await cache.put(url, res.clone());
      } catch (err) {
        devWarn('[media-cache] Prefetch failed', url, err);
      }
    }),
  );
  await evictStaleMedia(unique);
}

/**
 * Removes Cache API entries that are no longer part of the current playlist,
 * plus enforces a hard cap on total entry count to bound disk usage on
 * long-running kiosks. Entries not in `currentUrls` are deleted first; if
 * the remaining count still exceeds MAX_CACHE_ENTRIES, the oldest entries
 * (by cache.keys() order) are trimmed.
 */
export async function evictStaleMedia(currentUrls: string[]): Promise<void> {
  try {
    const cache = await openCache();
    const keepSet = new Set(currentUrls);
    const keys = await cache.keys();

    // Phase 1: delete entries not in the current playlist
    const stale = keys.filter((k) => !keepSet.has(k.url));
    await Promise.all(
      stale.map((k) => cache.delete(k).catch(() => {})),
    );

    // Phase 2: if still over the cap, trim oldest entries
    if (stale.length > 0) {
      // Re-read keys after deletions
      const remaining = await cache.keys();
      if (remaining.length > MAX_CACHE_ENTRIES) {
        const excess = remaining.length - MAX_CACHE_ENTRIES;
        const toTrim = remaining.slice(0, excess);
        await Promise.all(
          toTrim.map((k) => cache.delete(k).catch(() => {})),
        );
      }
    }
  } catch {
    // Cache API may be unavailable (private browsing, quota exceeded)
  }
}

/**
 * Resolves a playable URL: prefers Cache when offline; fetches and caches when online.
 */
export async function resolvePlaybackUrl(mediaUrl: string): Promise<string> {
  const cached = urlToBlob.get(mediaUrl);
  if (cached) return cached;

  const cache = await openCache();
  let response = await cache.match(mediaUrl);

  if (!response && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await fetch(mediaUrl, { mode: 'cors', credentials: 'omit' });
      if (res.ok) {
        await cache.put(mediaUrl, res.clone());
        response = await cache.match(mediaUrl);
      }
    } catch {
      response = undefined;
    }
  }

  if (!response) {
    response = await cache.match(mediaUrl);
  }

  if (!response) {
    throw new Error('MEDIA_UNAVAILABLE');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  urlToBlob.set(mediaUrl, blobUrl);
  return blobUrl;
}

/** Estimate total cached media size (bytes) for HUD display. */
export async function getMediaCacheSize(): Promise<number> {
  try {
    const cache = await openCache();
    const keys = await cache.keys();
    let total = 0;
    for (const key of keys) {
      const res = await cache.match(key);
      if (res) {
        const len = res.headers.get('Content-Length');
        if (len) {
          total += Number(len);
        } else {
          const blob = await res.blob();
          total += blob.size;
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
}
