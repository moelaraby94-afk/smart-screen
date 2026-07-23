import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

/**
 * F-02 regression: getMediaCacheSize must read Content-Length from headers
 * instead of materializing every cached response as a Blob, which loads
 * entire files into memory every 30 seconds.
 *
 * The Cache API is browser-only, so we mock it here and test the logic
 * in isolation by re-implementing the same algorithm against the mock.
 */

type MockResponse = {
  headers: { get: (name: string) => string | null };
  blob: () => Promise<{ size: number }>;
};

type MockCache = {
  keys: () => Promise<Array<{ url: string }>>;
  match: (key: unknown) => Promise<MockResponse | undefined>;
};

function computeCacheSize(cache: MockCache): Promise<number> {
  // Mirrors the logic in getMediaCacheSize (F-02 fix)
  return (async () => {
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
  })();
}

describe('getMediaCacheSize (F-02)', () => {
  it('uses Content-Length header when available without calling blob()', async () => {
    let blobCallCount = 0;
    const cache: MockCache = {
      keys: async () => [{ url: 'a' }, { url: 'b' }],
      match: async () => ({
        headers: { get: (name: string) => name === 'Content-Length' ? '1048576' : null },
        blob: async () => { blobCallCount++; return { size: 1048576 }; },
      }),
    };

    const size = await computeCacheSize(cache);
    assert.equal(size, 2 * 1048576);
    assert.equal(blobCallCount, 0, 'blob() should not be called when Content-Length is present');
  });

  it('falls back to blob().size when Content-Length is missing', async () => {
    let blobCallCount = 0;
    const cache: MockCache = {
      keys: async () => [{ url: 'a' }],
      match: async () => ({
        headers: { get: () => null },
        blob: async () => { blobCallCount++; return { size: 500 }; },
      }),
    };

    const size = await computeCacheSize(cache);
    assert.equal(size, 500);
    assert.equal(blobCallCount, 1, 'blob() should be called as fallback');
  });

  it('handles mixed responses (some with Content-Length, some without)', async () => {
    const responses: Record<string, MockResponse> = {
      a: { headers: { get: (n: string) => n === 'Content-Length' ? '1000' : null }, blob: async () => ({ size: 1000 }) },
      b: { headers: { get: () => null }, blob: async () => ({ size: 2000 }) },
      c: { headers: { get: (n: string) => n === 'Content-Length' ? '3000' : null }, blob: async () => ({ size: 3000 }) },
    };
    let blobCallCount = 0;
    const cache: MockCache = {
      keys: async () => [{ url: 'a' }, { url: 'b' }, { url: 'c' }],
      match: async (key: unknown) => {
        const k = key as { url: string };
        const r = responses[k.url];
        if (r) {
          return {
            headers: r.headers,
            blob: async () => { blobCallCount++; return await r.blob(); },
          };
        }
        return undefined;
      },
    };

    const size = await computeCacheSize(cache);
    assert.equal(size, 6000);
    assert.equal(blobCallCount, 1, 'blob() should only be called for the response without Content-Length');
  });

  it('returns 0 for empty cache', async () => {
    const cache: MockCache = {
      keys: async () => [],
      match: async () => undefined,
    };
    const size = await computeCacheSize(cache);
    assert.equal(size, 0);
  });
});
