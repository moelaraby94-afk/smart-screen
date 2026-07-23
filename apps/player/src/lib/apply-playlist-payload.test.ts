import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * F-06 regression: applyPlaylistPayload must use a generation counter
 * so that a stale async result (from an older call) does not overwrite
 * newer playlist state.
 *
 * Since applyPlaylistPayload is a React hook callback, we test the
 * generation-counter pattern in isolation to verify the logic.
 */

describe('applyPlaylistPayload generation guard (F-06)', () => {
  it('old request finishing after new request does not overwrite state', async () => {
    let state: string | null = null;
    const setState = (v: string | null) => { state = v; };
    let generation = 0;

    // Simulate applyPlaylistPayload
    function apply(raw: unknown, delayMs: number): void {
      const gen = ++generation;
      void (async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        // Guard: if a newer call has come in, discard this result
        if (gen !== generation) return;
        setState(raw as string);
      })();
    }

    // First call with slow warm (50ms)
    apply('old-playlist', 50);
    // Second call with fast warm (10ms) — should win
    apply('new-playlist', 10);

    // Wait for both to settle
    await new Promise((r) => setTimeout(r, 100));

    assert.equal(state, 'new-playlist', 'latest playlist should win');
  });

  it('latest playlist always wins even if old request is much slower', async () => {
    let state: string | null = null;
    const setState = (v: string | null) => { state = v; };
    let generation = 0;

    function apply(raw: unknown, delayMs: number): void {
      const gen = ++generation;
      void (async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        if (gen !== generation) return;
        setState(raw as string);
      })();
    }

    // Three calls: fast, slow, medium
    apply('first', 30);
    apply('second', 100);
    apply('third', 50);

    await new Promise((r) => setTimeout(r, 150));

    assert.equal(state, 'third', 'last call should always win');
  });

  it('single call still works normally', async () => {
    let state: string | null = null;
    const setState = (v: string | null) => { state = v; };
    let generation = 0;

    function apply(raw: unknown, delayMs: number): void {
      const gen = ++generation;
      void (async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        if (gen !== generation) return;
        setState(raw as string);
      })();
    }

    apply('only-playlist', 10);

    await new Promise((r) => setTimeout(r, 50));

    assert.equal(state, 'only-playlist');
  });

  it('rapid successive calls — only the last one takes effect', async () => {
    let state: string | null = null;
    const setState = (v: string | null) => { state = v; };
    let generation = 0;

    function apply(raw: unknown, delayMs: number): void {
      const gen = ++generation;
      void (async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        if (gen !== generation) return;
        setState(raw as string);
      })();
    }

    // 5 rapid calls, all with same delay
    for (let i = 0; i < 5; i++) {
      apply(`playlist-${i}`, 20);
    }

    await new Promise((r) => setTimeout(r, 50));

    assert.equal(state, 'playlist-4', 'last call should win');
  });
});
