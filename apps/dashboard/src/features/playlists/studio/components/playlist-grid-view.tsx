'use client';

import { useTranslations } from 'next-intl';
import { ListVideo } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaylistToolbar } from './playlist-toolbar';
import { PlaylistCard } from './playlist-card';
import type { PlaylistSummary } from '../types';
import type { WorkspaceSummary } from '@/features/workspace/workspace-context';

type PlaylistGridViewProps = {
  loading: boolean;
  playlists: PlaylistSummary[];
  workspaces: WorkspaceSummary[];
  search: string;
  setSearch: (value: string) => void;
  playlistSort: string;
  setPlaylistSort: (value: string) => void;
  newName: string;
  setNewName: (name: string) => void;
  onCreatePlaylist: (name: string) => void;
  onOpenPlaylist: (id: string) => void;
  onDuplicatePlaylist: (id: string) => void;
  onDeletePlaylist: (id: string) => void;
};

export function PlaylistGridView({
  loading,
  playlists,
  workspaces,
  search,
  setSearch,
  playlistSort,
  setPlaylistSort,
  newName,
  setNewName,
  onCreatePlaylist,
  onOpenPlaylist,
  onDuplicatePlaylist,
  onDeletePlaylist,
}: PlaylistGridViewProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PlaylistToolbar
        search={search}
        setSearch={setSearch}
        playlistSort={playlistSort}
        setPlaylistSort={setPlaylistSort}
        newName={newName}
        setNewName={setNewName}
        onCreatePlaylist={onCreatePlaylist}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-video animate-pulse bg-muted/40" />
              <div className="space-y-2 p-3.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
                <div className="flex gap-1.5">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted/40" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState icon={ListVideo} title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((p, i) => {
            const ws = workspaces.find((w) => w.id === p.workspaceId);
            return (
              <PlaylistCard
                key={p.id}
                playlist={p}
                workspace={ws}
                index={i}
                onOpen={onOpenPlaylist}
                onDuplicate={onDuplicatePlaylist}
                onDelete={onDeletePlaylist}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
