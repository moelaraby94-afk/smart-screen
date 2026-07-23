'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CampaignStatusBadge } from './campaign-status-badge';
import { formatDateTime, formatDate } from '../utils';
import type { Campaign } from '../types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
};

export function CampaignDetailDialog({ open, onOpenChange, campaign }: Props) {
  const t = useTranslations('campaigns');

  if (!campaign) return null;

  const history = [...(campaign.history ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('detailTitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
            <span className="text-xs text-muted-foreground">
              {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
            </span>
          </div>

          {campaign.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('fields.playlist')}
              </span>
              <p className="text-foreground">
                {campaign.playlist?.name ?? '—'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('fields.screen')}
              </span>
              <p className="text-foreground">
                {campaign.screen?.name ?? t('fields.allScreens')}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('fields.startDate')}
              </span>
              <p className="text-foreground">{formatDate(campaign.startDate)}</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('fields.endDate')}
              </span>
              <p className="text-foreground">{formatDate(campaign.endDate)}</p>
            </div>
          </div>

          {campaign.reviewComment && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('reviewComment')}
              </span>
              <p className="mt-1 text-sm text-foreground">{campaign.reviewComment}</p>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('historyTitle')}
            </h4>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noHistory')}</p>
            ) : (
              <ol className="space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-2.5"
                  >
                    <div className="mt-0.5 flex flex-col items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {t(`action.${entry.action}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('statusTransition', {
                          from: t(`status.${entry.fromStatus}`),
                          to: t(`status.${entry.toStatus}`),
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                      {entry.comment && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.comment}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
