export type PlaylistMedia = {
  id: string;
  mimeType: string;
  publicUrl: string;
};

export type PlaylistCanvasCompiled = {
  id: string;
  name: string;
  width: number;
  height: number;
  durationSec: number;
  layoutData: unknown;
};

export type PlaylistMediaItem = {
  kind: 'media';
  orderIndex: number;
  durationSec: number;
  media: PlaylistMedia;
};

export type PlaylistCanvasItem = {
  kind: 'canvas';
  orderIndex: number;
  durationSec: number;
  canvas: PlaylistCanvasCompiled;
};

export type PlaylistItemUnion = PlaylistMediaItem | PlaylistCanvasItem;

export type RenderMode = 'CONTAIN' | 'COVER' | 'CENTER' | 'FIT_WIDTH' | 'FIT_HEIGHT';

export type PlaylistPayload = {
  workspaceId: string;
  screenId: string;
  playlistId: string | null;
  name: string | null;
  /** override | schedule | rotation | default — from scheduling engine */
  activeSource?: 'override' | 'schedule' | 'rotation' | 'default';
  renderMode?: RenderMode;
  orientation?: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
  targetWidth?: number | null;
  targetHeight?: number | null;
  items: PlaylistItemUnion[];
};

export type BootstrapResponse = {
  screenId: string;
  serialNumber: string;
  workspaceId: string;
  /** Display name for idle / placeholder UI when no playlist is assigned. */
  workspaceName?: string | null;
  ticker: string | null;
  orientation?: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
  resolutionWidth?: number;
  resolutionHeight?: number;
  playlist: PlaylistPayload;
};
