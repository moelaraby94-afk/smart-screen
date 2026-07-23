import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeRenderDecision,
  computeMediaRenderDecision,
  computeCanvasRenderDecision,
} from './rendering-strategy';
import type { RenderMode } from './types';

// ─── computeRenderDecision — basic ───────────────────────────────────

describe('computeRenderDecision', () => {
  it('produces a complete RenderDecision with all required fields', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });

    assert.ok(rd.objectFit, 'objectFit must be defined');
    assert.ok(rd.scaleMode, 'scaleMode must be defined');
    assert.ok(typeof rd.rotation === 'number', 'rotation must be a number');
    assert.ok(typeof rd.swapDimensions === 'boolean', 'swapDimensions must be boolean');
    assert.ok(rd.alignment, 'alignment must be defined');
    assert.ok(rd.viewport, 'viewport must be defined');
    assert.ok(rd.canvasScale, 'canvasScale must be defined');
    assert.ok(rd.effectiveOrientation, 'effectiveOrientation must be defined');
  });

  it('resolves AUTO orientation based on screen dimensions', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'AUTO',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.effectiveOrientation, 'LANDSCAPE');
    assert.equal(rd.rotation, 0);
    assert.equal(rd.swapDimensions, false);
  });

  it('resolves AUTO to PORTRAIT and swaps dimensions on landscape screen', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'AUTO',
      screenWidth: 1080,
      screenHeight: 1920,
    });
    // 1080×1920 is portrait screen → AUTO resolves to PORTRAIT
    // But portrait screen is already taller than wide → no swap needed
    assert.equal(rd.effectiveOrientation, 'PORTRAIT');
    assert.equal(rd.swapDimensions, false);
  });
});

// ─── RenderMode mapping ──────────────────────────────────────────────

describe('RenderMode mapping in RenderDecision', () => {
  const modes: RenderMode[] = ['CONTAIN', 'COVER', 'CENTER', 'FIT_WIDTH', 'FIT_HEIGHT'];

  for (const mode of modes) {
    it(`maps ${mode} to correct objectFit`, () => {
      const rd = computeRenderDecision({
        renderMode: mode,
        orientation: 'LANDSCAPE',
        screenWidth: 1920,
        screenHeight: 1080,
      });

      const expectedFit = {
        CONTAIN: 'contain',
        COVER: 'cover',
        CENTER: 'center',
        FIT_WIDTH: 'fit_width',
        FIT_HEIGHT: 'fit_height',
      }[mode];

      assert.equal(rd.objectFit, expectedFit);
    });
  }
});

// ─── Portrait dimension swap ─────────────────────────────────────────

describe('Portrait dimension swap', () => {
  it('swaps viewport dimensions for PORTRAIT on landscape screen', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'PORTRAIT',
      screenWidth: 1920,
      screenHeight: 1080,
    });

    assert.equal(rd.swapDimensions, true);
    assert.equal(rd.rotation, 90);
    // Viewport is swapped: 1080×1920
    assert.equal(rd.viewport.width, 1080);
    assert.equal(rd.viewport.height, 1920);
  });

  it('does not swap for PORTRAIT on portrait screen', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'PORTRAIT',
      screenWidth: 1080,
      screenHeight: 1920,
    });

    assert.equal(rd.swapDimensions, false);
    assert.equal(rd.rotation, 90);
    assert.equal(rd.viewport.width, 1080);
    assert.equal(rd.viewport.height, 1920);
  });

  it('does not swap for LANDSCAPE', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });

    assert.equal(rd.swapDimensions, false);
    assert.equal(rd.viewport.width, 1920);
    assert.equal(rd.viewport.height, 1080);
  });
});

// ─── CENTER behavior (must differ from CONTAIN) ──────────────────────

describe('CENTER behavior', () => {
  it('CENTER produces objectFit "center" (not "contain")', () => {
    const rd = computeRenderDecision({
      renderMode: 'CENTER',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.objectFit, 'center');
    assert.notEqual(rd.objectFit, 'contain');
  });

  it('CENTER canvas scaleMode is "contain" (canvas always fully visible)', () => {
    const rd = computeRenderDecision({
      renderMode: 'CENTER',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.scaleMode, 'contain');
  });
});

// ─── FIT_WIDTH behavior ──────────────────────────────────────────────

describe('FIT_WIDTH behavior', () => {
  it('FIT_WIDTH produces objectFit "fit_width"', () => {
    const rd = computeRenderDecision({
      renderMode: 'FIT_WIDTH',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.objectFit, 'fit_width');
  });

  it('FIT_WIDTH canvas scaleMode is "contain"', () => {
    const rd = computeRenderDecision({
      renderMode: 'FIT_WIDTH',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.scaleMode, 'contain');
  });
});

// ─── FIT_HEIGHT behavior ─────────────────────────────────────────────

describe('FIT_HEIGHT behavior', () => {
  it('FIT_HEIGHT produces objectFit "fit_height"', () => {
    const rd = computeRenderDecision({
      renderMode: 'FIT_HEIGHT',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.objectFit, 'fit_height');
  });

  it('FIT_HEIGHT canvas scaleMode is "contain"', () => {
    const rd = computeRenderDecision({
      renderMode: 'FIT_HEIGHT',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.scaleMode, 'contain');
  });
});

// ─── Canvas scaling ──────────────────────────────────────────────────

describe('Canvas scaling in RenderDecision', () => {
  it('contain: canvas fits entirely within viewport', () => {
    const rd = computeCanvasRenderDecision(
      'CONTAIN',
      'LANDSCAPE',
      1920,
      1080,
      { screenWidth: 1920, screenHeight: 1080 },
    );
    assert.equal(rd.canvasScale.scale, 1);
    assert.equal(rd.canvasScale.offsetX, 0);
    assert.equal(rd.canvasScale.offsetY, 0);
  });

  it('cover: canvas fills viewport, may crop', () => {
    const rd = computeCanvasRenderDecision(
      'COVER',
      'LANDSCAPE',
      1920,
      1080,
      { screenWidth: 1080, screenHeight: 1920 },
    );
    assert.ok(rd.canvasScale.scale > 1, 'cover should scale up');
    assert.equal(rd.canvasScale.scaleMode, 'cover');
  });

  it('uses targetWidth/targetHeight when canvas dimensions not in input', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'LANDSCAPE',
      screenWidth: 1920,
      screenHeight: 1080,
      targetWidth: 3840,
      targetHeight: 2160,
    });
    // Canvas defaults to targetWidth/Height
    // 3840×2160 in 1920×1080 → scale 0.5
    assert.equal(rd.canvasScale.scale, 0.5);
  });
});

// ─── computeMediaRenderDecision ──────────────────────────────────────

describe('computeMediaRenderDecision', () => {
  it('produces valid RenderDecision for media', () => {
    const rd = computeMediaRenderDecision('COVER', 'LANDSCAPE', {
      screenWidth: 1920,
      screenHeight: 1080,
      mediaWidth: 3840,
      mediaHeight: 2160,
    });
    assert.equal(rd.objectFit, 'cover');
    assert.equal(rd.effectiveOrientation, 'LANDSCAPE');
  });

  it('includes media rotation in the decision', () => {
    const rd = computeMediaRenderDecision('CONTAIN', 'LANDSCAPE', {
      screenWidth: 1920,
      screenHeight: 1080,
      mediaRotation: 90,
    });
    // Container rotation is 0 (landscape), media rotation is handled by component
    assert.equal(rd.rotation, 0);
  });
});

// ─── SQUARE orientation ──────────────────────────────────────────────

describe('SQUARE orientation', () => {
  it('SQUARE has no rotation and no swap', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'SQUARE',
      screenWidth: 1080,
      screenHeight: 1080,
    });
    assert.equal(rd.rotation, 0);
    assert.equal(rd.swapDimensions, false);
    assert.equal(rd.viewport.width, 1080);
    assert.equal(rd.viewport.height, 1080);
  });

  it('SQUARE on non-square screen still has no rotation', () => {
    const rd = computeRenderDecision({
      renderMode: 'CONTAIN',
      orientation: 'SQUARE',
      screenWidth: 1920,
      screenHeight: 1080,
    });
    assert.equal(rd.rotation, 0);
    assert.equal(rd.swapDimensions, false);
  });
});
