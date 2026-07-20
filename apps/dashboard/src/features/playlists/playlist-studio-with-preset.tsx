'use client';

import { PlaylistStudioClient } from './playlist-studio-client';

/**
 * Wraps PlaylistStudioClient and presets the playlistId so it
 * opens directly in editor mode for a specific playlist.
 */
export function PlaylistStudioWithPreset({ playlistId }: { playlistId: string }) {
  return <PlaylistStudioClient initialPlaylistId={playlistId} />;
}
