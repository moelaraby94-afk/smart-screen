import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveObjectFit,
  resolveCanvasScaleMode,
  resolveAlignment,
  computeCanvasTransform,
} from './scaling';

// ─── resolveObjectFit ────────────────────────────────────────────────

describe('resolveObjectFit', () => {
  it('maps CONTAIN → contain', () => {
    assert.equal(resolveObjectFit('CONTAIN'), 'contain');
  });

  it('maps COVER → cover', () => {
    assert.equal(resolveObjectFit('COVER'), 'cover');
  });

  it('maps CENTER → center (NOT contain)', () => {
    assert.equal(resolveObjectFit('CENTER'), 'center');
  });

  it('maps FIT_WIDTH → fit_width', () => {
    assert.equal(resolveObjectFit('FIT_WIDTH'), 'fit_width');
  });

  it('maps FIT_HEIGHT → fit_height', () => {
    assert.equal(resolveObjectFit('FIT_HEIGHT'), 'fit_height');
  });
});

// ─── resolveCanvasScaleMode ──────────────────────────────────────────

describe('resolveCanvasScaleMode', () => {
  it('maps CONTAIN → contain', () => {
    assert.equal(resolveCanvasScaleMode('CONTAIN'), 'contain');
  });

  it('maps COVER → cover', () => {
    assert.equal(resolveCanvasScaleMode('COVER'), 'cover');
  });

  it('maps CENTER → contain (canvas always fully visible)', () => {
    assert.equal(resolveCanvasScaleMode('CENTER'), 'contain');
  });

  it('maps FIT_WIDTH → contain (canvas always fully visible)', () => {
    assert.equal(resolveCanvasScaleMode('FIT_WIDTH'), 'contain');
  });

  it('maps FIT_HEIGHT → contain (canvas always fully visible)', () => {
    assert.equal(resolveCanvasScaleMode('FIT_HEIGHT'), 'contain');
  });
});

// ─── resolveAlignment ────────────────────────────────────────────────

describe('resolveAlignment', () => {
  it('returns center for CONTAIN', () => {
    assert.equal(resolveAlignment('CONTAIN'), 'center');
  });

  it('returns center for COVER', () => {
    assert.equal(resolveAlignment('COVER'), 'center');
  });

  it('returns center for CENTER', () => {
    assert.equal(resolveAlignment('CENTER'), 'center');
  });

  it('returns center for FIT_WIDTH', () => {
    assert.equal(resolveAlignment('FIT_WIDTH'), 'center');
  });

  it('returns center for FIT_HEIGHT', () => {
    assert.equal(resolveAlignment('FIT_HEIGHT'), 'center');
  });
});

// ─── computeCanvasTransform ──────────────────────────────────────────

describe('computeCanvasTransform', () => {
  it('contain: scales down to fit entirely within viewport', () => {
    // 1920×1080 canvas in 960×540 viewport → scale 0.5
    const t = computeCanvasTransform('contain', 1920, 1080, 960, 540);
    assert.equal(t.scale, 0.5);
    assert.equal(t.offsetX, 0);
    assert.equal(t.offsetY, 0);
  });

  it('contain: centers with letterbox bars when aspect ratios differ', () => {
    // 1920×1080 canvas in 1920×1080 viewport → scale 1, no offset
    const t = computeCanvasTransform('contain', 1920, 1080, 1920, 1080);
    assert.equal(t.scale, 1);
    assert.equal(t.offsetX, 0);
    assert.equal(t.offsetY, 0);
  });

  it('contain: letterboxes 16:9 canvas in 16:10 viewport', () => {
    // 1920×1080 canvas in 1920×1200 viewport → scale 1, vertical bars
    const t = computeCanvasTransform('contain', 1920, 1080, 1920, 1200);
    assert.equal(t.scale, 1);
    assert.equal(t.offsetX, 0);
    assert.equal(t.offsetY, 60); // (1200 - 1080) / 2
  });

  it('cover: scales up to fill viewport, crops overflow', () => {
    // 1920×1080 canvas in 1080×1920 viewport (portrait)
    // scaleX = 1080/1920 = 0.5625, scaleY = 1920/1080 = 1.778
    // cover uses max → scale = 1.778
    const t = computeCanvasTransform('cover', 1920, 1080, 1080, 1920);
    assert.ok(t.scale > 1, 'cover scale should be > 1 to fill');
    // Canvas overflows viewport — offset centers the crop
    assert.ok(t.offsetX < 0, 'offsetX should be negative (cropped)');
    assert.equal(t.offsetY, 0);
  });

  it('cover: no crop when aspect ratios match', () => {
    const t = computeCanvasTransform('cover', 1920, 1080, 1920, 1080);
    assert.equal(t.scale, 1);
    assert.equal(t.offsetX, 0);
    assert.equal(t.offsetY, 0);
  });

  it('caps scale at maxScale (default 4)', () => {
    // Tiny canvas in huge viewport → would scale to 10, capped at 4
    const t = computeCanvasTransform('contain', 100, 100, 1000, 1000);
    assert.equal(t.scale, 4);
  });

  it('returns scale 1 for zero/negative canvas dimensions', () => {
    const t = computeCanvasTransform('contain', 0, 0, 1920, 1080);
    assert.equal(t.scale, 1);
    assert.equal(t.offsetX, 0);
    assert.equal(t.offsetY, 0);
  });

  it('contain: scales up when canvas smaller than viewport', () => {
    // 480×270 canvas in 1920×1080 viewport → scale 4 (capped)
    const t = computeCanvasTransform('contain', 480, 270, 1920, 1080);
    assert.equal(t.scale, 4);
  });
});
