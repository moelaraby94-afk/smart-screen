/**
 * Rendering Strategy — Single Source of Truth
 *
 * Combines orientation resolution + scaling resolution into a single
 * RenderDecision object. React components consume this decision and
 * translate it into CSS or Konva configuration.
 *
 * No React code. No CSS classes. No side effects. Pure function.
 */

import type {
  RenderingInput,
  RenderDecision,
  CanvasTransform,
} from './types';
import {
  resolveOrientation,
  resolveRotation,
  shouldSwapDimensions,
  getEffectiveViewport,
} from './orientation';
import {
  resolveObjectFit,
  resolveCanvasScaleMode,
  resolveAlignment,
  computeCanvasTransform,
} from './scaling';

/**
 * Computes the complete rendering decision from all rendering inputs.
 *
 * This is the only function that React components should call.
 * The returned RenderDecision is the single source of truth for:
 * - How media fits (objectFit)
 * - How canvas scales (scaleMode + canvasScale)
 * - Container rotation (rotation)
 * - Whether dimensions are swapped (swapDimensions)
 * - Alignment within viewport
 * - Effective viewport dimensions
 * - Effective orientation (AUTO resolved)
 */
export function computeRenderDecision(input: RenderingInput): RenderDecision {
  const effectiveOrientation = resolveOrientation(
    input.orientation,
    input.screenWidth,
    input.screenHeight,
  );

  const { containerRotation } = resolveRotation(
    effectiveOrientation,
    input.mediaRotation,
  );

  const swap = shouldSwapDimensions(
    effectiveOrientation,
    input.screenWidth,
    input.screenHeight,
  );

  const viewport = getEffectiveViewport(
    effectiveOrientation,
    input.screenWidth,
    input.screenHeight,
    input.targetWidth,
    input.targetHeight,
  );

  const objectFit = resolveObjectFit(input.renderMode);
  const scaleMode = resolveCanvasScaleMode(input.renderMode);
  const alignment = resolveAlignment(input.renderMode);

  // Compute canvas transform if canvas dimensions are provided
  const canvasWidth = input.canvasWidth ?? input.targetWidth ?? 1920;
  const canvasHeight = input.canvasHeight ?? input.targetHeight ?? 1080;
  const canvasTransform = computeCanvasTransform(
    scaleMode,
    canvasWidth,
    canvasHeight,
    viewport.width,
    viewport.height,
  );

  const canvasScale: CanvasTransform = {
    scale: canvasTransform.scale,
    offsetX: canvasTransform.offsetX,
    offsetY: canvasTransform.offsetY,
    scaleMode,
  };

  return {
    objectFit,
    scaleMode,
    rotation: containerRotation,
    swapDimensions: swap,
    alignment,
    viewport,
    canvasScale,
    effectiveOrientation,
  };
}

// ─── Convenience: media-only rendering ───────────────────────────────

/**
 * Computes a RenderDecision for a media item (image/video).
 * Uses playlist-level orientation + renderMode, plus media-specific dimensions.
 */
export function computeMediaRenderDecision(
  renderMode: RenderingInput['renderMode'],
  orientation: RenderingInput['orientation'],
  options: {
    screenWidth?: number | null;
    screenHeight?: number | null;
    targetWidth?: number | null;
    targetHeight?: number | null;
    mediaWidth?: number | null;
    mediaHeight?: number | null;
    mediaRotation?: number | null;
  } = {},
): RenderDecision {
  return computeRenderDecision({
    renderMode,
    orientation,
    ...options,
  });
}

// ─── Convenience: canvas-only rendering ──────────────────────────────

/**
 * Computes a RenderDecision for a canvas item.
 * Uses playlist-level orientation + renderMode, plus canvas-specific dimensions.
 */
export function computeCanvasRenderDecision(
  renderMode: RenderingInput['renderMode'],
  orientation: RenderingInput['orientation'],
  canvasWidth: number,
  canvasHeight: number,
  options: {
    screenWidth?: number | null;
    screenHeight?: number | null;
    targetWidth?: number | null;
    targetHeight?: number | null;
  } = {},
): RenderDecision {
  return computeRenderDecision({
    renderMode,
    orientation,
    canvasWidth,
    canvasHeight,
    ...options,
  });
}

// Re-export types and sub-modules for convenience
export type {
  RenderingInput,
  RenderDecision,
  ObjectFitMode,
  CanvasScaleMode,
  Alignment,
  Viewport,
  CanvasTransform,
  Orientation,
  RenderMode,
} from './types';
export { resolveOrientation, getContainerRotation, shouldSwapDimensions, getEffectiveViewport } from './orientation';
export { resolveObjectFit, resolveCanvasScaleMode, computeCanvasTransform } from './scaling';
