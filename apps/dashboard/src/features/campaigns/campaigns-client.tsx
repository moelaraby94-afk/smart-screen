'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Megaphone, MoreHorizontal, Eye, Pencil, Trash2, Send, Check, X, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { fetchScreens, fetchPlaylistOptions } from '@/features/screens/api/screens-api';
import { useCampaigns } from './hooks/use-campaigns';
import { CampaignStatusBadge } from './components/campaign-status-badge';
import { CampaignForm } from './components/campaign-form';
import { CampaignDetailDialog } from './components/campaign-detail-dialog';
import { CampaignReviewDialog } from './components/campaign-review-dialog';
import { getAvailableActions, formatDate, type CampaignAction, type Role } from './utils';
import type { Campaign, CampaignFormData } from './types';

type PlaylistOpt = { id: string; name: string };
type ScreenOpt = { id: string; name: string };

export function CampaignsClient() {
  const t = useTranslations('campaigns');
  const { workspaceId, workspaces } = useWorkspace();
  const {
    campaigns,
    loading,
    error,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    submitCampaign,
    approveCampaign,
    rejectCampaign,
    publishCampaign,
    pauseCampaign,
    resumeCampaign,
    endCampaign,
    fetchCampaignDetail,
    mutatingId,
  } = useCampaigns(workspaceId);

  const [playlists, setPlaylists] = useState<PlaylistOpt[]>([]);
  const [screens, setScreens] = useState<ScreenOpt[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [endTargetId, setEndTargetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentWs = workspaces.find((w) => w.id === workspaceId);
  const role = (currentWs?.role ?? 'VIEWER') as Role;

  useEffect(() => {
    if (workspaceId) {
      void loadCampaigns();
      void fetchPlaylistOptions(workspaceId).then(setPlaylists);
      void fetchScreens(workspaceId).then((s) =>
        setScreens(s.map((scr) => ({ id: scr.id, name: scr.name }))),
      );
    }
  }, [workspaceId, loadCampaigns]);

  const handleCreate = useCallback(
    async (data: CampaignFormData) => {
      setSubmitting(true);
      try {
        const created = await createCampaign(data);
        if (created) setFormOpen(false);
      } finally {
        setSubmitting(false);
      }
    },
    [createCampaign],
  );

  const handleEdit = useCallback(
    async (data: CampaignFormData) => {
      if (!editingCampaign) return;
      setSubmitting(true);
      try {
        const updated = await updateCampaign(editingCampaign.id, data);
        if (updated) {
          setFormOpen(false);
          setEditingCampaign(null);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [updateCampaign, editingCampaign],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    const ok = await deleteCampaign(deleteTargetId);
    if (ok) setDeleteTargetId(null);
  }, [deleteCampaign, deleteTargetId]);

  const handleEnd = useCallback(async () => {
    if (!endTargetId) return;
    const result = await endCampaign(endTargetId);
    if (result) setEndTargetId(null);
  }, [endCampaign, endTargetId]);

  const handleAction = useCallback(
    async (action: CampaignAction, campaign: Campaign) => {
      switch (action) {
        case 'edit':
          setEditingCampaign(campaign);
          setFormOpen(true);
          break;
        case 'submit':
          await submitCampaign(campaign.id);
          break;
        case 'approve':
          setReviewMode('approve');
          setReviewTargetId(campaign.id);
          setReviewOpen(true);
          break;
        case 'reject':
          setReviewMode('reject');
          setReviewTargetId(campaign.id);
          setReviewOpen(true);
          break;
        case 'publish':
          await publishCampaign(campaign.id);
          break;
        case 'pause':
          await pauseCampaign(campaign.id);
          break;
        case 'resume':
          await resumeCampaign(campaign.id);
          break;
        case 'end':
          setEndTargetId(campaign.id);
          break;
        case 'delete':
          setDeleteTargetId(campaign.id);
          break;
      }
    },
    [submitCampaign, publishCampaign, pauseCampaign, resumeCampaign],
  );

  const handleViewDetail = useCallback(
    async (campaign: Campaign) => {
      const detail = await fetchCampaignDetail(campaign.id);
      if (detail) {
        setDetailCampaign(detail);
        setDetailOpen(true);
      }
    },
    [fetchCampaignDetail],
  );

  const handleReviewConfirm = useCallback(
    async (comment?: string) => {
      if (!reviewTargetId) return;
      if (reviewMode === 'approve') {
        const result = await approveCampaign(reviewTargetId, comment);
        if (result) setReviewOpen(false);
      } else {
        const result = await rejectCampaign(reviewTargetId, comment);
        if (result) setReviewOpen(false);
      }
    },
    [reviewTargetId, reviewMode, approveCampaign, rejectCampaign],
  );

  const actionIcon: Record<CampaignAction, React.ReactNode> = {
    edit: <Pencil className="h-3.5 w-3.5" />,
    submit: <Send className="h-3.5 w-3.5" />,
    delete: <Trash2 className="h-3.5 w-3.5" />,
    approve: <Check className="h-3.5 w-3.5" />,
    reject: <X className="h-3.5 w-3.5" />,
    publish: <Play className="h-3.5 w-3.5" />,
    pause: <Pause className="h-3.5 w-3.5" />,
    resume: <RotateCcw className="h-3.5 w-3.5" />,
    end: <Square className="h-3.5 w-3.5" />,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Megaphone}
        title={t('errorTitle')}
        description={t('errorDescription')}
        actionLabel={t('retry')}
        onAction={() => void loadCampaigns()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('section')}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {role !== 'VIEWER' && (
          <Button
            onClick={() => {
              setEditingCampaign(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('createCampaign')}
          </Button>
        )}
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          actionLabel={role !== 'VIEWER' ? t('createCampaign') : undefined}
          onAction={
            role !== 'VIEWER'
              ? () => {
                  setEditingCampaign(null);
                  setFormOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead>{t('columns.playlist')}</TableHead>
                <TableHead>{t('columns.screen')}</TableHead>
                <TableHead>{t('columns.startDate')}</TableHead>
                <TableHead>{t('columns.endDate')}</TableHead>
                <TableHead>{t('columns.updated')}</TableHead>
                <TableHead className="text-end">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const actions = getAvailableActions(campaign.status, role);
                const isMutating = mutatingId === campaign.id;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="text-left hover:text-primary"
                        onClick={() => void handleViewDetail(campaign)}
                      >
                        {campaign.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.playlist?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.screen?.name ?? t('fields.allScreens')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(campaign.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(campaign.endDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(campaign.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => void handleViewDetail(campaign)}
                          title={t('viewDetail')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {actions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isMutating}
                                title={t('actions')}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action) => (
                                <DropdownMenuItem
                                  key={action}
                                  onClick={() => void handleAction(action, campaign)}
                                  className={
                                    action === 'delete' || action === 'end' || action === 'reject'
                                      ? 'text-destructive'
                                      : undefined
                                  }
                                >
                                  {actionIcon[action]}
                                  <span className="ms-2">{t(`actionLabel.${action}`)}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CampaignForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editingCampaign ? handleEdit : handleCreate}
        initial={editingCampaign}
        playlists={playlists}
        screens={screens}
        submitting={submitting}
      />

      <CampaignDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        campaign={detailCampaign}
      />

      <CampaignReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onConfirm={handleReviewConfirm}
        loading={mutatingId === reviewTargetId}
        mode={reviewMode}
      />

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={mutatingId === deleteTargetId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mutatingId === deleteTargetId ? t('processing') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!endTargetId}
        onOpenChange={(open) => !open && setEndTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('endTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('endDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleEnd()}
              disabled={mutatingId === endTargetId}
            >
              {mutatingId === endTargetId ? t('processing') : t('end')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
