import type { MediaItem } from '@/features/media/media-library-client';
import type { CanvasSummary } from '@/features/playlists/playlist-library-panels';
import type { TransitionType, PlaylistLocalMeta, PlaylistOrientation, PlaylistLayoutType } from '@/features/playlists/playlist-transitions';
import type { ZonePreset } from '@/features/studio/canvas-layout';

export type { MediaItem, CanvasSummary, TransitionType, PlaylistLocalMeta, PlaylistOrientation, PlaylistLayoutType, ZonePreset };

export type PlaylistSummary = {
  id: string;
  name: string;
  isPublished: boolean;
  workspaceId?: string | null;
  groupId?: string | null;
  _count: { items: number; screensInGroup?: number };
  items?: Array<{
    kind?: string;
    media?: { id: string; publicUrl: string; mimeType: string; originalName: string } | null;
    canvas?: { id: string; name: string; width?: number; height?: number } | null;
  }>;
};

export type PlaylistGroup = {
  id: string;
  name: string;
  _count: { playlists: number };
};

export type Row =
  | {
      clientId: string;
      kind: 'media';
      mediaId: string;
      durationSec: number;
      media: MediaItem;
      transition?: TransitionType;
      zoneName?: string | null;
    }
  | {
      clientId: string;
      kind: 'canvas';
      canvasId: string;
      durationSec: number;
      canvas: CanvasSummary;
      transition?: TransitionType;
      zoneName?: string | null;
    };

export type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewMode = 'grid' | 'editor';

export type SelectionContext = 'playlist' | 'zone' | 'item';

export type SaveState = 'idle' | 'saving' | 'saved' | 'unsaved';
