'use client';

import { useTranslations } from 'next-intl';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type PlaylistToolbarProps = {
  search: string;
  setSearch: (value: string) => void;
  playlistSort: string;
  setPlaylistSort: (value: string) => void;
  newName: string;
  setNewName: (name: string) => void;
  onCreatePlaylist: (name: string) => void;
};

export function PlaylistToolbar({
  search,
  setSearch,
  playlistSort,
  setPlaylistSort,
  newName,
  setNewName,
  onCreatePlaylist,
}: PlaylistToolbarProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaylists')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg ps-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-[11px] font-medium text-muted-foreground">{t('sortBy')}</Label>
        <select
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40"
          value={playlistSort}
          onChange={(e) => setPlaylistSort(e.target.value)}
        >
          <option value="name">{t('sortName')}</option>
          <option value="items">{t('sortItems')}</option>
          <option value="screens">{t('sortScreens')}</option>
        </select>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <Input
          placeholder={t('newPlaylistPlaceholder')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-9 max-w-[220px] rounded-xl"
          onKeyDown={(e) => { if (e.key === 'Enter') void onCreatePlaylist(newName); }}
        />
        <Button variant="default" className="rounded-xl" onClick={() => void onCreatePlaylist(newName)}>
          <Plus className="me-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>
    </div>
  );
}
