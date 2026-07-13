'use client';

import { useCallback, useEffect, useState } from 'react';
import { Group, Plus, Monitor, MoreVertical, Loader2, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { toast } from 'sonner';

type PlaylistGroup = {
  id: string;
  name: string;
  isPublished: boolean;
  updatedAt: string;
  _count: { items: number; screensInGroup: number };
};

export function DisplayGroupsClient() {
  const t = useTranslations('displayGroupsPage');
  const { workspaceId, workspaceDataEpoch, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const [groups, setGroups] = useState<PlaylistGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editGroup, setEditGroup] = useState<PlaylistGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState<PlaylistGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setGroups([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await apiFetch(`/playlists?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const items = await readPageItems<PlaylistGroup>(res);
      setGroups(items);
    } else {
      setGroups([]);
    }
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => { void reload(); }, [reload, workspaceDataEpoch]);

  const handleCreate = useCallback(async () => {
    if (!workspaceId || !newName.trim()) return;
    setCreating(true);
    const res = await apiFetch('/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name: newName.trim() }),
    });
    if (res.ok) {
      toast.success(t('created'));
      setNewName('');
      setCreateOpen(false);
      await reload();
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
    setCreating(false);
  }, [workspaceId, newName, reload, toastResponseError, bumpWorkspaceDataEpoch, t]);

  const handleSaveEdit = useCallback(async () => {
    if (!workspaceId || !editGroup || !editName.trim()) return;
    setSavingEdit(true);
    const res = await apiFetch(`/playlists/${editGroup.id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (res.ok) {
      toast.success(t('updated'));
      setEditOpen(false);
      setEditGroup(null);
      await reload();
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
    setSavingEdit(false);
  }, [workspaceId, editGroup, editName, reload, toastResponseError, bumpWorkspaceDataEpoch, t]);

  const handleDelete = useCallback(async () => {
    if (!workspaceId || !deleteGroup) return;
    setDeleting(true);
    const res = await apiFetch(`/playlists/${deleteGroup.id}?workspaceId=${encodeURIComponent(workspaceId)}&force=true`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success(t('deleted'));
      setDeleteOpen(false);
      setDeleteGroup(null);
      await reload();
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
    setDeleting(false);
  }, [workspaceId, deleteGroup, reload, toastResponseError, bumpWorkspaceDataEpoch, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="vc-icon-glass-circle h-10 w-10">
            <Group className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{groups.length} {t('groupsCount')}</p>
            <p className="text-xs text-muted-foreground">{groups.reduce((acc, g) => acc + g._count.screensInGroup, 0)} {t('totalDisplays')}</p>
          </div>
        </div>
        <Button size="sm" variant="cta" className="rounded-xl font-semibold" onClick={() => setCreateOpen(true)}>
          <Plus className="me-1.5 h-4 w-4" />
          {t('createGroup')}
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('newGroup')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="dg-name">{t('groupName')}</Label>
            <Input
              id="dg-name"
              placeholder={t('groupName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl"
              disabled={creating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !creating) void handleCreate();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" disabled={creating} onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="cta"
              className="rounded-xl font-semibold"
              disabled={!newName.trim() || creating}
              onClick={() => void handleCreate()}
            >
              {creating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editGroup')}</DialogTitle>
            <DialogDescription>{t('editGroupDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="eg-name">{t('groupName')}</Label>
            <Input
              id="eg-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="rounded-xl"
              disabled={savingEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !savingEdit) void handleSaveEdit();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" disabled={savingEdit} onClick={() => setEditOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="cta"
              className="rounded-xl font-semibold"
              disabled={!editName.trim() || savingEdit}
              onClick={() => void handleSaveEdit()}
            >
              {savingEdit ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteGroup')}</DialogTitle>
            <DialogDescription>{t('deleteGroupDesc', { name: deleteGroup?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" disabled={deleting} onClick={() => setDeleteOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl font-semibold"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Group}
          title={t('noGroups')}
          description={t('noGroupsDesc')}
          actionLabel={t('createGroup')}
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="vc-card-surface rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="vc-icon-glass-circle h-10 w-10">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group._count.screensInGroup} {t('displays')} · {group._count.items} {t('items')}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl" aria-label={t('actions')}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[11rem] rounded-xl">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditGroup(group);
                        setEditName(group.name);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="me-2 h-4 w-4" />
                      {t('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setDeleteGroup(group);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={group.isPublished ? 'success' : 'muted'}>
                  {group.isPublished ? t('published') : t('draft')}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-primary hover:bg-primary/10"
                  asChild
                >
                  <a href={`/${workspaceId}/playlists/${group.id}`}>
                    <FolderOpen className="me-1.5 h-4 w-4" />
                    {t('manage')}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
