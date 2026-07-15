'use client';

import { useTranslations } from 'next-intl';
import { FolderPlus, Pencil, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PlaylistGroup } from '../types';

type GroupSidebarProps = {
  groups: PlaylistGroup[];
  totalPlaylists: number;
  filterGroupId: string;
  setFilterGroupId: (id: string) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  onCreateGroup: (name: string) => void;
  renamingGroupId: string | null;
  setRenamingGroupId: (id: string | null) => void;
  renameGroupValue: string;
  setRenameGroupValue: (value: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
};

export function GroupSidebar({
  groups,
  totalPlaylists,
  filterGroupId,
  setFilterGroupId,
  newGroupName,
  setNewGroupName,
  onCreateGroup,
  renamingGroupId,
  setRenamingGroupId,
  renameGroupValue,
  setRenameGroupValue,
  onRenameGroup,
  onDeleteGroup,
}: GroupSidebarProps) {
  const t = useTranslations('playlistStudioClient');

  return (
    <aside className="flex w-full flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-3 xl:w-[240px] xl:shrink-0">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {t('groups')}
      </h3>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setFilterGroupId('')}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all',
            !filterGroupId
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          <span>{t('allGroups')}</span>
          <span className="font-mono-nums text-xs text-muted-foreground">{totalPlaylists}</span>
        </button>

        {groups.map((g) => (
          <div
            key={g.id}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all',
              filterGroupId === g.id
                ? 'bg-primary/10'
                : 'hover:bg-muted/40',
            )}
          >
            {renamingGroupId === g.id ? (
              <>
                <Input
                  value={renameGroupValue}
                  onChange={(e) => setRenameGroupValue(e.target.value)}
                  className="h-7 flex-1 rounded-md text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') void onRenameGroup(g.id, renameGroupValue); }}
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => void onRenameGroup(g.id, renameGroupValue)}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setRenamingGroupId(null); setRenameGroupValue(''); }}>
                  ✕
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={cn(
                    'min-w-0 flex-1 truncate text-start text-sm font-medium',
                    filterGroupId === g.id ? 'text-primary' : 'text-foreground hover:text-primary',
                  )}
                  onClick={() => setFilterGroupId(filterGroupId === g.id ? '' : g.id)}
                >
                  {g.name}
                </button>
                <span className="shrink-0 font-mono-nums text-xs text-muted-foreground">{g._count.playlists}</span>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground/60 hover:text-primary"
                  onClick={() => { setRenamingGroupId(g.id); setRenameGroupValue(g.name); }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground/60 hover:text-red-500"
                  onClick={() => void onDeleteGroup(g.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-1.5 border-t border-border/40 pt-3">
        <Input
          placeholder={t('newGroupPlaceholder')}
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="h-8 flex-1 rounded-lg text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') void onCreateGroup(newGroupName); }}
        />
        <Button variant="ghost" size="sm" className="h-8 shrink-0 rounded-lg" onClick={() => void onCreateGroup(newGroupName)}>
          <FolderPlus className="me-1 h-3.5 w-3.5" />
          {t('createGroup')}
        </Button>
      </div>
    </aside>
  );
}
