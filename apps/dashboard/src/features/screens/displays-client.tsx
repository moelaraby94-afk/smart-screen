'use client';

import { useCallback, useMemo, useState } from 'react';
import { Monitor, Plus, Loader2, Radio } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useApiScreens, type ScreenRow } from '@/features/screens/useApiScreens';
import { usePlayerPairing } from '@/features/branches/use-player-pairing';
import { BranchPairingDialog } from '@/features/branches/branch-pairing-dialog';
import { deleteScreen as apiDeleteScreen } from '@/features/screens/api/screens-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { CreateScreenDialogContent } from '@/features/screens/screen-dialogs';
import { toast } from 'sonner';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
  ONLINE: 'success',
  OFFLINE: 'danger',
  MAINTENANCE: 'muted',
};

function formatLastSeen(dateStr: string | null | undefined, t: (k: string) => string): string {
  if (!dateStr) return t('never');
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return `${diffMin} ${t('minAgo')}`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ${t('hoursAgo')}`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} ${t('daysAgo')}`;
}

export function DisplaysClient() {
  const t = useTranslations('displaysPage');
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch, pairingActivityEpoch } = useWorkspace();
  const { screens, setScreens, isLoading, reload } = useApiScreens(workspaceId);
  const { toastResponseError } = useApiErrorToast();

  const canClaimPairing = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN';
  }, [workspaces, workspaceId]);

  const canEdit = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'EDITOR';
  }, [workspaces, workspaceId]);

  const reloadAndBump = useCallback(async () => {
    await reload();
    bumpWorkspaceDataEpoch();
  }, [reload, bumpWorkspaceDataEpoch]);

  const pairing = usePlayerPairing(workspaceId!, {
    canClaim: canClaimPairing,
    pairingActivityEpoch,
    onClaimed: reloadAndBump,
  });

  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);

  const handleDelete = useCallback(async (screenId: string) => {
    if (!workspaceId) return;
    const res = await apiDeleteScreen(workspaceId, screenId);
    if (res.ok) {
      setScreens(prev => prev.filter(s => s.id !== screenId));
      toast.success(t('deleted'));
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
  }, [workspaceId, setScreens, toastResponseError, bumpWorkspaceDataEpoch]);

  const filtered = screens.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = screens.filter(s => s.status === 'ONLINE').length;
  const offlineCount = screens.length - onlineCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{screens.length} {t('displaysCount')}</p>
            <p className="text-xs text-muted-foreground">
              {onlineCount} {t('online')} · {offlineCount} {t('offline')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs rounded-xl"
          />
          {canClaimPairing && (
            <Button size="sm" variant="outline" className="rounded-xl font-semibold" onClick={pairing.open}>
              <Radio className="me-1.5 h-4 w-4" />
              {t('enrollNew')}
            </Button>
          )}
          {canEdit && (
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button size="sm" variant="cta" className="rounded-xl font-semibold">
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('addScreen')}
                </Button>
              </DialogTrigger>
              <CreateScreenDialogContent
                workspaceId={workspaceId!}
                onCancel={() => setOpenAdd(false)}
                onSuccess={async () => {
                  setOpenAdd(false);
                  await reloadAndBump();
                }}
              />
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title={t('noDisplays')}
          description={t('noDisplaysDesc')}
          actionLabel={canClaimPairing ? t('enrollNew') : undefined}
          onAction={canClaimPairing ? pairing.open : undefined}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('location')}</TableHead>
                <TableHead>{t('lastSeen')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((screen: ScreenRow) => (
                <TableRow key={screen.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{screen.name}</span>
                      <span className="text-xs text-muted-foreground">{screen.serialNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[screen.status] || 'muted'}>
                      {t(`status_${screen.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{screen.location || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatLastSeen(screen.lastSeenAt, t)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-destructive hover:text-destructive"
                          onClick={() => handleDelete(screen.id)}
                        >
                          {t('delete')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <BranchPairingDialog pairing={pairing} branchName={workspaces.find(w => w.id === workspaceId)?.name ?? ''} canClaim={canClaimPairing} />
    </div>
  );
}
