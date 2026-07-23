import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveOrientation,
  getContainerRotation,
  shouldSwapDimensions,
  getEffectiveViewport,
  resolveRotation,
} from './orientation';

// ─── resolveOrientation ──────────────────────────────────────────────

describe('resolveOrientation', () => {
  it('resolves AUTO to LANDSCAPE when screen is wider than tall', () => {
    assert.equal(resolveOrientation('AUTO', 1920, 1080), 'LANDSCAPE');
  });

  it('resolves AUTO to PORTRAIT when screen is taller than wide', () => {
    assert.equal(resolveOrientation('AUTO', 1080, 1920), 'PORTRAIT');
  });

  it('resolves AUTO to SQUARE when screen dimensions are equal', () => {
    assert.equal(resolveOrientation('AUTO', 1080, 1080), 'SQUARE');
  });

  it('resolves AUTO to LANDSCAPE when screen dimensions are unavailable', () => {
    assert.equal(resolveOrientation('AUTO', null, null), 'LANDSCAPE');
    assert.equal(resolveOrientation('AUTO'), 'LANDSCAPE');
  });

  it('passes through explicit LANDSCAPE', () => {
    assert.equal(resolveOrientation('LANDSCAPE', 1080, 1920), 'LANDSCAPE');
  });

  it('passes through explicit PORTRAIT', () => {
    assert.equal(resolveOrientation('PORTRAIT', 1920, 1080), 'PORTRAIT');
  });

  it('passes through explicit SQUARE', () => {
    assert.equal(resolveOrientation('SQUARE', 1920, 1080), 'SQUARE');
  });
});

// ─── getContainerRotation ────────────────────────────────────────────

describe('getContainerRotation', () => {
  it('returns 90 for PORTRAIT', () => {
    assert.equal(getContainerRotation('PORTRAIT'), 90);
  });

  it('returns 0 for LANDSCAPE', () => {
    assert.equal(getContainerRotation('LANDSCAPE'), 0);
  });

  it('returns 0 for SQUARE', () => {
    assert.equal(getContainerRotation('SQUARE'), 0);
  });

  it('returns 0 for AUTO', () => {
    assert.equal(getContainerRotation('AUTO'), 0);
  });
});

// ─── shouldSwapDimensions ────────────────────────────────────────────

describe('shouldSwapDimensions', () => {
  it('returns true for PORTRAIT on landscape screen', () => {
    assert.equal(shouldSwapDimensions('PORTRAIT', 1920, 1080), true);
  });

  it('returns false for PORTRAIT on portrait screen', () => {
    assert.equal(shouldSwapDimensions('PORTRAIT', 1080, 1920), false);
  });

  it('returns false for PORTRAIT on square screen', () => {
    assert.equal(shouldSwapDimensions('PORTRAIT', 1080, 1080), false);
  });

  it('returns false for LANDSCAPE on any screen', () => {
    assert.equal(shouldSwapDimensions('LANDSCAPE', 1920, 1080), false);
    assert.equal(shouldSwapDimensions('LANDSCAPE', 1080, 1920), false);
  });

  it('returns false for SQUARE on any screen', () => {
    assert.equal(shouldSwapDimensions('SQUARE', 1920, 1080), false);
  });

  it('returns true for PORTRAIT when screen dimensions unknown (assumes landscape)', () => {
    assert.equal(shouldSwapDimensions('PORTRAIT', null, null), true);
  });

  it('resolves AUTO→PORTRAIT on portrait screen (no swap needed)', () => {
    // AUTO on 1080×1920 → PORTRAIT, but screen is already portrait → no swap
    assert.equal(shouldSwapDimensions('AUTO', 1080, 1920), false);
  });
});

// ─── getEffectiveViewport ────────────────────────────────────────────

describe('getEffectiveViewport', () => {
  it('swaps dimensions for PORTRAIT on landscape screen', () => {
    const vp = getEffectiveViewport('PORTRAIT', 1920, 1080);
    assert.equal(vp.width, 1080);
    assert.equal(vp.height, 1920);
  });

  it('does not swap for LANDSCAPE', () => {
    const vp = getEffectiveViewport('LANDSCAPE', 1920, 1080);
    assert.equal(vp.width, 1920);
    assert.equal(vp.height, 1080);
  });

  it('does not swap for SQUARE', () => {
    const vp = getEffectiveViewport('SQUARE', 1080, 1080);
    assert.equal(vp.width, 1080);
    assert.equal(vp.height, 1080);
  });

  it('falls back to targetWidth/targetHeight when screen dimensions unavailable', () => {
    const vp = getEffectiveViewport('LANDSCAPE', null, null, 3840, 2160);
    assert.equal(vp.width, 3840);
    assert.equal(vp.height, 2160);
  });

  it('falls back to 1920×1080 when no dimensions available', () => {
    const vp = getEffectiveViewport('LANDSCAPE', null, null, null, null);
    assert.equal(vp.width, 1920);
    assert.equal(vp.height, 1080);
  });

  it('swaps target dimensions for PORTRAIT with no screen dimensions', () => {
    const vp = getEffectiveViewport('PORTRAIT', null, null, 1080, 1920);
    // Screen unknown → assumes landscape → swap
    assert.equal(vp.width, 1920);
    assert.equal(vp.height, 1080);
  });
});

// ─── resolveRotation ─────────────────────────────────────────────────

describe('resolveRotation', () => {
  it('returns containerRotation 90 for PORTRAIT', () => {
    const { containerRotation, mediaRotation } = resolveRotation('PORTRAIT');
    assert.equal(containerRotation, 90);
    assert.equal(mediaRotation, 0);
  });

  it('returns containerRotation 0 for LANDSCAPE', () => {
    const { containerRotation } = resolveRotation('LANDSCAPE');
    assert.equal(containerRotation, 0);
  });

  it('includes mediaRotation from ffprobe when provided', () => {
    const { containerRotation, mediaRotation } = resolveRotation('LANDSCAPE', 90);
    assert.equal(containerRotation, 0);
    assert.equal(mediaRotation, 90);
  });

  it('defaults mediaRotation to 0 when not provided', () => {
    const { mediaRotation } = resolveRotation('PORTRAIT', null);
    assert.equal(mediaRotation, 0);
  });
});
