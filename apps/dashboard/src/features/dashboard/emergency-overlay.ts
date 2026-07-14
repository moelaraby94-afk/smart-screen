import {
  createCanvas,
  createPlaylist,
  updateCanvas,
  updatePlaylistItems,
  updatePlaylistMeta,
  fetchPlaylists,
  fetchPlaylistDetail,
} from '@/features/studio/studio-api';
import { readPageItems } from '@/features/api/page';

/**
 * Emergency broadcast overlay.
 *
 * The screen-override mechanism forces a *playlist* onto a screen. To make an
 * emergency *message* actually appear, we render it as a full-screen canvas
 * (red background + large centered text) inside a single reusable playlist, then
 * point the override at that playlist. This reuses the existing player canvas
 * renderer — no backend/player/schema changes needed.
 *
 * A single marker-named playlist is reused per workspace (its canvas text is
 * refreshed each activation) so repeated emergencies don't clutter the library.
 */
const EMERGENCY_MARKER = '⚠ Emergency Broadcast';
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const LOOP_SEC = 3600;

function buildEmergencyLayout(message: string): Record<string, unknown> {
  return {
    version: 1,
    objects: [
      { id: 'emg-bg', type: 'rect', x: 0, y: 0, width: CANVAS_W, height: CANVAS_H, fill: '#b91c1c' },
      {
        id: 'emg-msg',
        type: 'text',
        x: 160,
        y: 300,
        width: CANVAS_W - 320,
        height: 480,
        text: message,
        fontSize: 84,
        fontStyle: 'bold',
        fill: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
      },
    ],
  };
}

type PlaylistLite = { id: string; name: string };
type PlaylistDetail = { items?: Array<{ canvas?: { id: string } | null }> };

/**
 * Create or refresh the reusable emergency-overlay playlist for `message` and
 * return its id (to be used as the screen override target). Throws on failure.
 */
export async function ensureEmergencyOverlayPlaylist(
  workspaceId: string,
  message: string,
): Promise<string> {
  const layoutData = buildEmergencyLayout(message);

  const listRes = await fetchPlaylists(workspaceId);
  const playlists = listRes.ok ? await readPageItems<PlaylistLite>(listRes) : [];
  const existing = playlists.find((p) => p.name === EMERGENCY_MARKER);

  // Reuse the existing playlist's canvas — just refresh its text.
  if (existing) {
    const detRes = await fetchPlaylistDetail(workspaceId, existing.id);
    if (detRes.ok) {
      const detail = (await detRes.json()) as PlaylistDetail;
      const canvasId = detail.items?.find((it) => it.canvas?.id)?.canvas?.id;
      if (canvasId) {
        const upd = await updateCanvas(workspaceId, canvasId, { layoutData });
        if (upd.ok) {
          await updatePlaylistMeta(workspaceId, existing.id, { isPublished: true });
          return existing.id;
        }
      }
    }
  }

  // Otherwise build a fresh canvas and (re)attach it to the playlist.
  const canvasRes = await createCanvas(workspaceId, {
    name: EMERGENCY_MARKER,
    width: CANVAS_W,
    height: CANVAS_H,
    layoutData,
    durationSec: LOOP_SEC,
  });
  if (!canvasRes.ok) throw new Error('Failed to create emergency canvas');
  const canvas = (await canvasRes.json()) as { id: string };

  let playlistId = existing?.id;
  if (!playlistId) {
    const plRes = await createPlaylist(workspaceId, EMERGENCY_MARKER);
    if (!plRes.ok) throw new Error('Failed to create emergency playlist');
    playlistId = ((await plRes.json()) as { id: string }).id;
  }

  const itemsRes = await updatePlaylistItems(workspaceId, playlistId, {
    items: [{ canvasId: canvas.id, durationSec: LOOP_SEC }],
  });
  if (!itemsRes.ok) throw new Error('Failed to attach emergency canvas');

  await updatePlaylistMeta(workspaceId, playlistId, { isPublished: true });
  return playlistId;
}
