/**
 * Rendering Strategy — Type Definitions
 *
 * These types form the contract between the rendering strategy layer
 * and the React components that consume it. No CSS, no React — pure types.
 */

// ─── Input Types ─────────────────────────────────────────────────────

export type RenderMode = 'CONTAIN' | 'COVER' | 'CENTER' | 'FIT_WIDTH' | 'FIT_HEIGHT';

export type Orientation = 'AUTO' | 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';

/**
 * Inputs to the rendering strategy. All fields are optional except
 * renderMode and orientation — the strategy resolves defaults for the rest.
 */
export type RenderingInput = {
  /** Playlist render mode — controls how media fills the viewport */
  renderMode: RenderMode;
  /** Playlist/screen orientation */
  orientation: Orientation;
  /** Canvas design resolution width (source of truth for rendering) */
  targetWidth?: number | null;
  /** Canvas design resolution height (source of truth for rendering) */
  targetHeight?: number | null;
  /** Physical screen width in pixels */
  screenWidth?: number | null;
  /** Physical screen height in pixels */
  screenHeight?: number | null;
  /** Media actual width in pixels (from ffprobe/sharp) */
  mediaWidth?: number | null;
  /** Media actual height in pixels (from ffprobe/sharp) */
  mediaHeight?: number | null;
  /** Video rotation in degrees (0, 90, 180, 270) from ffprobe metadata */
  mediaRotation?: number | null;
  /** Canvas design width (for canvas items) */
  canvasWidth?: number;
  /** Canvas design height (for canvas items) */
  canvasHeight?: number;
};

// ─── Output Types ────────────────────────────────────────────────────

/**
 * How a media element should fit within its container.
 * Each value maps to a specific CSS object-fit + sizing strategy.
 */
export type ObjectFitMode = 'contain' | 'cover' | 'center' | 'fit_width' | 'fit_height';

/**
 * How a canvas should be scaled within the viewport.
 */
export type CanvasScaleMode = 'contain' | 'cover' | 'stretch';

/**
 * Alignment of media within the viewport when it doesn't fill completely.
 */
export type Alignment = 'center' | 'start' | 'end';

/**
 * The viewport dimensions after orientation resolution.
 * If portrait rotation swaps dimensions, these reflect the swapped state.
 */
export type Viewport = {
  width: number;
  height: number;
};

/**
 * Canvas scaling result — used by Konva Stage to position and scale content.
 */
export type CanvasTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
  scaleMode: CanvasScaleMode;
};

/**
 * The complete rendering decision — output of the rendering strategy.
 *
 * Each React component translates this into CSS or Konva configuration.
 * No component should make rendering decisions independently.
 */
export type RenderDecision = {
  /** How media should fit (maps to CSS object-fit) */
  objectFit: ObjectFitMode;
  /** How canvas should be scaled (maps to Konva scale calculation) */
  scaleMode: CanvasScaleMode;
  /** CSS rotation in degrees to apply to the container (0, 90, 180, 270) */
  rotation: number;
  /** Whether width/height should be swapped (portrait rotation) */
  swapDimensions: boolean;
  /** How to align media when it doesn't fill the viewport */
  alignment: Alignment;
  /** Effective viewport dimensions after orientation resolution */
  viewport: Viewport;
  /** Canvas scaling transform (scale + offset) */
  canvasScale: CanvasTransform;
  /** Resolved orientation (AUTO → LANDSCAPE/PORTRAIT/SQUARE based on screen) */
  effectiveOrientation: Orientation;
};
