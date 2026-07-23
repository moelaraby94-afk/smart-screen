import { extractImageUrlsFromLayout } from '@/types/canvas-layout';
import type { PlaylistItemUnion, PlaylistPayload } from '@/types/player-playlist';

export function collectMediaUrls(playlist: PlaylistPayload | null): string[] {
  if (!playlist?.items?.length) return [];
  const urls: string[] = [];
  for (const it of playlist.items) {
    if (it.kind === 'media') {
      urls.push(it.media.publicUrl);
    } else if (it.kind === 'canvas') {
      urls.push(...extractImageUrlsFromLayout(it.canvas.layoutData));
    }
  }
  return urls;
}

function normalizeItem(raw: unknown): PlaylistItemUnion | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  if (o.kind === 'media' && o.media && typeof o.media === 'object') {
    const m = o.media as Record<string, unknown>;
    return {
      kind: 'media',
      orderIndex: Number(o.orderIndex ?? 0),
      durationSec: Number(o.durationSec ?? 10),
      media: {
        id: String(m.id ?? ''),
        mimeType: String(m.mimeType ?? ''),
        publicUrl: String(m.publicUrl ?? ''),
        ...(m.width != null ? { width: Number(m.width) } : {}),
        ...(m.height != null ? { height: Number(m.height) } : {}),
        ...(m.durationSec != null ? { durationSec: Number(m.durationSec) } : {}),
        ...(m.rotation != null ? { rotation: Number(m.rotation) } : {}),
      },
    };
  }

  if (o.kind === 'canvas' && o.canvas && typeof o.canvas === 'object') {
    const c = o.canvas as Record<string, unknown>;
    return {
      kind: 'canvas',
      orderIndex: Number(o.orderIndex ?? 0),
      durationSec: Number(o.durationSec ?? 15),
      canvas: {
        id: String(c.id ?? ''),
        name: String(c.name ?? 'Canvas'),
        width: Number(c.width ?? 1920),
        height: Number(c.height ?? 1080),
        durationSec: Number(c.durationSec ?? 15),
        layoutData: c.layoutData ?? {},
      },
    };
  }

  if (o.media && typeof o.media === 'object' && !o.kind) {
    const m = o.media as Record<string, unknown>;
    return {
      kind: 'media',
      orderIndex: Number(o.orderIndex ?? 0),
      durationSec: Number(o.durationSec ?? 10),
      media: {
        id: String(m.id ?? ''),
        mimeType: String(m.mimeType ?? ''),
        publicUrl: String(m.publicUrl ?? ''),
        ...(m.width != null ? { width: Number(m.width) } : {}),
        ...(m.height != null ? { height: Number(m.height) } : {}),
        ...(m.durationSec != null ? { durationSec: Number(m.durationSec) } : {}),
        ...(m.rotation != null ? { rotation: Number(m.rotation) } : {}),
      },
    };
  }

  return null;
}

export function parsePlaylistPayload(raw: unknown): PlaylistPayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;
  const items = o.items.map(normalizeItem).filter((x): x is PlaylistItemUnion => x !== null);
  const src = o.activeSource;
  const rm = o.renderMode;
  const ort = o.orientation;
  return {
    workspaceId: String(o.workspaceId ?? ''),
    screenId: String(o.screenId ?? ''),
    playlistId: o.playlistId == null ? null : String(o.playlistId),
    name: o.name == null ? null : String(o.name),
    ...(src === 'override' || src === 'schedule' || src === 'rotation' || src === 'default'
      ? { activeSource: src }
      : {}),
    ...(rm === 'CONTAIN' || rm === 'COVER' || rm === 'CENTER' || rm === 'FIT_WIDTH' || rm === 'FIT_HEIGHT'
      ? { renderMode: rm }
      : {}),
    ...(ort === 'AUTO' || ort === 'LANDSCAPE' || ort === 'PORTRAIT' || ort === 'SQUARE'
      ? { orientation: ort }
      : {}),
    ...(o.targetWidth != null ? { targetWidth: Number(o.targetWidth) } : {}),
    ...(o.targetHeight != null ? { targetHeight: Number(o.targetHeight) } : {}),
    items,
  };
}
