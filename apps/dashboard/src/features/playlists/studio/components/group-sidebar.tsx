'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Move,
  Pencil,
  Trash2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ICON_STROKE } from '@/lib/icon-stroke';
import type { PlaylistGroup } from '../types';

type GroupSidebarProps = {
  groups: PlaylistGroup[];
  totalPlaylists: number;
  filterGroupId: string;
  setFilterGroupId: (id: string) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  onCreateGroup: (name: string, parentGroupId?: string | null) => void;
  renamingGroupId: string | null;
  setRenamingGroupId: (id: string | null) => void;
  renameGroupValue: string;
  setRenameGroupValue: (value: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onMoveGroup: (groupId: string, newParentId: string | null) => void;
};

type GroupNode = PlaylistGroup & { children: GroupNode[] };

function buildGroupTree(groups: PlaylistGroup[]): GroupNode[] {
  const map = new Map<string, GroupNode>();
  groups.forEach((g) => map.set(g.id, { ...g, children: [] }));
  const roots: GroupNode[] = [];
  map.forEach((node) => {
    if (node.parentGroupId && map.has(node.parentGroupId)) {
      map.get(node.parentGroupId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function collectDescendantIds(node: GroupNode): Set<string> {
  const ids = new Set<string>([node.id]);
  for (const child of node.children) {
    for (const id of collectDescendantIds(child)) ids.add(id);
  }
  return ids;
}

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
  onMoveGroup,
}: GroupSidebarProps) {
  const t = useTranslations('playlistStudioClient');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [subgroupInputId, setSubgroupInputId] = useState<string | null>(null);
  const [subgroupName, setSubgroupName] = useState('');

  const tree = useMemo(() => buildGroupTree(groups), [groups]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startCreateSubgroup = (parentId: string) => {
    setSubgroupInputId(parentId);
    setSubgroupName('');
    setExpandedIds((prev) => new Set(prev).add(parentId));
  };

  const submitSubgroup = () => {
    if (subgroupInputId && subgroupName.trim()) {
      void onCreateGroup(subgroupName, subgroupInputId);
      setSubgroupInputId(null);
      setSubgroupName('');
    }
  };

  const renderGroupNode = (node: GroupNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isActive = filterGroupId === node.id;
    const isRenaming = renamingGroupId === node.id;
    const isCreatingSubgroup = subgroupInputId === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-lg py-2 transition-all',
            isActive ? 'bg-primary/10' : 'hover:bg-muted/40',
          )}
          style={{ paddingInlineStart: `${depth * 12 + 12}px` }}
        >
          {isRenaming ? (
            <>
              <Input
                value={renameGroupValue}
                onChange={(e) => setRenameGroupValue(e.target.value)}
                className="h-7 flex-1 rounded-md text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') void onRenameGroup(node.id, renameGroupValue); }}
              />
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => void onRenameGroup(node.id, renameGroupValue)}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setRenamingGroupId(null); setRenameGroupValue(''); }}>
                ✕
              </Button>
            </>
          ) : (
            <>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={isExpanded ? t('collapse') : t('expand')}
                >
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    : <ChevronRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />}
                </button>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <button
                type="button"
                className={cn(
                  'min-w-0 flex-1 truncate text-start text-sm font-medium',
                  isActive ? 'text-primary' : 'text-foreground hover:text-primary',
                )}
                onClick={() => setFilterGroupId(isActive ? '' : node.id)}
              >
                {node.name}
              </button>
              <span className="shrink-0 font-mono-nums text-xs text-muted-foreground">{node._count.playlists}</span>
              <button
                type="button"
                className="shrink-0 text-muted-foreground/60 hover:text-primary"
                aria-label={t('createSubgroup')}
                onClick={() => startCreateSubgroup(node.id)}
              >
                <FolderPlus className="h-3 w-3" strokeWidth={ICON_STROKE} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground/60 hover:text-primary"
                    aria-label={t('moveGroup')}
                  >
                    <Move className="h-3 w-3" strokeWidth={ICON_STROKE} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  <DropdownMenuItem
                    className="cursor-pointer text-sm"
                    onSelect={(e) => { e.preventDefault(); void onMoveGroup(node.id, null); }}
                  >
                    {t('moveToRoot')}
                  </DropdownMenuItem>
                  {groups.length > 1 && <DropdownMenuSeparator />}
                  {groups
                    .filter((g) => {
                      if (g.id === node.id) return false;
                      const descendantIds = collectDescendantIds(node);
                      return !descendantIds.has(g.id);
                    })
                    .map((g) => (
                      <DropdownMenuItem
                        key={g.id}
                        className="cursor-pointer text-sm"
                        onSelect={(e) => { e.preventDefault(); void onMoveGroup(node.id, g.id); }}
                      >
                        {g.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                className="shrink-0 text-muted-foreground/60 hover:text-primary"
                aria-label={t('renameGroup')}
                onClick={() => { setRenamingGroupId(node.id); setRenameGroupValue(node.name); }}
              >
                <Pencil className="h-3 w-3" strokeWidth={ICON_STROKE} />
              </button>
              <button
                type="button"
                className="shrink-0 text-muted-foreground/60 hover:text-destructive"
                aria-label={t('deleteGroup')}
                onClick={() => void onDeleteGroup(node.id)}
              >
                <Trash2 className="h-3 w-3" strokeWidth={ICON_STROKE} />
              </button>
            </>
          )}
        </div>

        {isCreatingSubgroup && (
          <div
            className="flex items-center gap-1.5 rounded-lg py-1.5"
            style={{ paddingInlineStart: `${(depth + 1) * 12 + 12}px` }}
          >
            <Input
              value={subgroupName}
              onChange={(e) => setSubgroupName(e.target.value)}
              placeholder={t('subgroupPlaceholder')}
              className="h-7 flex-1 rounded-md text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSubgroup();
                if (e.key === 'Escape') { setSubgroupInputId(null); setSubgroupName(''); }
              }}
            />
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={submitSubgroup}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setSubgroupInputId(null); setSubgroupName(''); }}>
              ✕
            </Button>
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="flex flex-col gap-1">
            {node.children.map((child) => renderGroupNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

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

        {tree.map((node) => renderGroupNode(node, 0))}
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
