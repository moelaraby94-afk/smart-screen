/**
 * Orientation Resolution Module
 *
 * Handles:
 * - AUTO resolution (infers orientation from screen dimensions)
 * - LANDSCAPE / PORTRAIT / SQUARE explicit modes
 * - Rotation calculation (CSS degrees for portrait rotation)
 * - Dimension swapping (when portrait rotation swaps width/height)
 *
 * Pure functions — no React, no CSS, no side effects.
 */

import type { Orientation } from './types';

/**
 * Resolves AUTO orientation based on screen dimensions.
 *
 * - If screen is wider than tall → LANDSCAPE
 * - If screen is taller than wide → PORTRAIT
 * - If screen is square → SQUARE
 *
 * If screen dimensions are unavailable, defaults to LANDSCAPE
 * (the most common digital signage orientation).
 */
export function resolveOrientation(
  orientation: Orientation,
  screenWidth?: number | null,
  screenHeight?: number | null,
): Orientation {
  if (orientation !== 'AUTO') return orientation;

  if (screenWidth && screenHeight) {
    if (screenWidth > screenHeight) return 'LANDSCAPE';
    if (screenHeight > screenWidth) return 'PORTRAIT';
    return 'SQUARE';
  }

  return 'LANDSCAPE';
}

/**
 * Calculates the CSS rotation in degrees for a given orientation.
 *
 * - PORTRAIT: 90deg rotation (assumes landscape screen displaying portrait content)
 * - LANDSCAPE/SQUARE/AUTO: 0deg (no rotation needed)
 *
 * Note: This is the container rotation, not media rotation.
 * Media rotation (from ffprobe) is handled separately via mediaRotation input.
 */
export function getContainerRotation(orientation: Orientation): number {
  switch (orientation) {
    case 'PORTRAIT':
      return 90;
    case 'LANDSCAPE':
    case 'SQUARE':
    case 'AUTO':
    default:
      return 0;
  }
}

/**
 * Determines whether width and height should be swapped.
 *
 * When a landscape screen displays portrait content via 90° rotation,
 * the effective viewport dimensions are swapped (width ↔ height).
 *
 * - PORTRAIT on a landscape screen → swap = true
 * - All other cases → swap = false
 */
export function shouldSwapDimensions(
  orientation: Orientation,
  screenWidth?: number | null,
  screenHeight?: number | null,
): boolean {
  const resolved = resolveOrientation(orientation, screenWidth, screenHeight);

  if (resolved === 'PORTRAIT') {
    // Only swap if the physical screen is landscape (wider than tall)
    if (screenWidth && screenHeight) {
      return screenWidth > screenHeight;
    }
    // Assume landscape screen if dimensions unknown
    return true;
  }

  return false;
}

/**
 * Returns the effective viewport dimensions after orientation resolution.
 *
 * If dimensions are swapped (portrait rotation), width and height are exchanged.
 * Falls back to targetWidth/targetHeight if screen dimensions are unavailable.
 */
export function getEffectiveViewport(
  orientation: Orientation,
  screenWidth?: number | null,
  screenHeight?: number | null,
  targetWidth?: number | null,
  targetHeight?: number | null,
): { width: number; height: number } {
  const w = screenWidth ?? targetWidth ?? 1920;
  const h = screenHeight ?? targetHeight ?? 1080;
  const swap = shouldSwapDimensions(orientation, screenWidth, screenHeight);

  return {
    width: swap ? h : w,
    height: swap ? w : h,
  };
}

/**
 * Combines container rotation with media rotation (from ffprobe).
 *
 * Media rotation is the intrinsic video rotation (e.g., 90° for portrait video
 * shot on a phone). Container rotation is the display rotation for portrait
 * orientation on a landscape screen.
 *
 * The total effective rotation is (containerRotation + mediaRotation) % 360.
 * However, media rotation is applied to the media element itself (via CSS transform),
 * not the container. So this function returns them separately.
 *
 * @returns containerRotation and mediaRotation as separate values
 */
export function resolveRotation(
  orientation: Orientation,
  mediaRotation?: number | null,
): { containerRotation: number; mediaRotation: number } {
  return {
    containerRotation: getContainerRotation(orientation),
    mediaRotation: mediaRotation ?? 0,
  };
}
