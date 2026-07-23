/**
 * Scaling Resolution Module
 *
 * Handles:
 * - CONTAIN: entire media visible, letterboxed (object-fit: contain)
 * - COVER: media fills viewport, may crop (object-fit: cover)
 * - CENTER: media at original size, centered (object-fit: none + center)
 * - FIT_WIDTH: media fits width, height auto (object-fit: contain + w-full)
 * - FIT_HEIGHT: media fits height, width auto (object-fit: contain + h-full)
 *
 * Also handles canvas scaling modes for Konva Stage.
 *
 * Pure functions — no React, no CSS, no side effects.
 */

import type { RenderMode, ObjectFitMode, CanvasScaleMode, Alignment } from './types';

/**
 * Maps a RenderMode to an ObjectFitMode (abstract, no CSS).
 *
 * - CONTAIN → contain (letterbox, entire media visible)
 * - COVER → cover (fill viewport, crop overflow)
 * - CENTER → center (original size, centered — NOT same as contain)
 * - FIT_WIDTH → fit_width (scale to viewport width, preserve aspect ratio)
 * - FIT_HEIGHT → fit_height (scale to viewport height, preserve aspect ratio)
 */
export function resolveObjectFit(renderMode: RenderMode): ObjectFitMode {
  switch (renderMode) {
    case 'COVER':
      return 'cover';
    case 'CENTER':
      return 'center';
    case 'FIT_WIDTH':
      return 'fit_width';
    case 'FIT_HEIGHT':
      return 'fit_height';
    case 'CONTAIN':
    default:
      return 'contain';
  }
}

/**
 * Maps a RenderMode to a CanvasScaleMode for Konva Stage.
 *
 * - CONTAIN → contain (entire canvas visible, centered with black bars)
 * - COVER → cover (canvas fills viewport, may crop edges)
 * - CENTER → contain (canvas at original size if it fits, otherwise contain)
 * - FIT_WIDTH → contain (canvas fits width — same as contain for canvas)
 * - FIT_HEIGHT → contain (canvas fits height — same as contain for canvas)
 *
 * Note: FIT_WIDTH and FIT_HEIGHT are media-specific modes.
 * For canvas, they fall back to contain since canvas is a vector layout
 * that should always be fully visible.
 */
export function resolveCanvasScaleMode(renderMode: RenderMode): CanvasScaleMode {
  switch (renderMode) {
    case 'COVER':
      return 'cover';
    case 'CONTAIN':
    case 'CENTER':
    case 'FIT_WIDTH':
    case 'FIT_HEIGHT':
    default:
      return 'contain';
  }
}

/**
 * Determines alignment for media within the viewport.
 *
 * - COVER: center (media fills viewport, alignment doesn't matter)
 * - CONTAIN: center (letterboxed, centered)
 * - CENTER: center (original size, centered)
 * - FIT_WIDTH: center (horizontally centered, vertically auto)
 * - FIT_HEIGHT: center (vertically centered, horizontally auto)
 */
export function resolveAlignment(_renderMode: RenderMode): Alignment {
  return 'center';
}

/**
 * Computes the canvas scale factor and offset for Konva Stage.
 *
 * @param scaleMode - How the canvas should scale
 * @param canvasWidth - Canvas design width
 * @param canvasHeight - Canvas design height
 * @param viewportWidth - Available viewport width
 * @param viewportHeight - Available viewport height
 * @param maxScale - Maximum scale factor (default 4 to prevent pixelation)
 *
 * @returns scale, offsetX, offsetY for Konva Group transform
 */
export function computeCanvasTransform(
  scaleMode: CanvasScaleMode,
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  maxScale: number = 4,
): { scale: number; offsetX: number; offsetY: number } {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const scaleX = viewportWidth / canvasWidth;
  const scaleY = viewportHeight / canvasHeight;

  let scale: number;
  let offsetX: number;
  let offsetY: number;

  switch (scaleMode) {
    case 'cover': {
      // Fill viewport, crop overflow
      scale = Math.max(scaleX, scaleY);
      scale = Math.min(scale, maxScale);
      // Center the canvas (cropped edges are equal on both sides)
      offsetX = (viewportWidth - canvasWidth * scale) / 2;
      offsetY = (viewportHeight - canvasHeight * scale) / 2;
      break;
    }
    case 'stretch': {
      // Non-uniform scale — fill viewport exactly (may distort)
      // Not currently used but available for future modes
      scale = Math.min(scaleX, scaleY, maxScale);
      offsetX = (viewportWidth - canvasWidth * scale) / 2;
      offsetY = (viewportHeight - canvasHeight * scale) / 2;
      break;
    }
    case 'contain':
    default: {
      // Entire canvas visible, centered with black bars
      scale = Math.min(scaleX, scaleY, maxScale);
      offsetX = (viewportWidth - canvasWidth * scale) / 2;
      offsetY = (viewportHeight - canvasHeight * scale) / 2;
      break;
    }
  }

  return { scale, offsetX, offsetY };
}
