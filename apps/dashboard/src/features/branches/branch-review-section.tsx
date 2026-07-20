'use client';

import { motion } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { BranchPlaylistRow } from '@/features/branches/use-branch-playlists';
import { apiFetch } from '@/features/auth/session';
import { toast } from 'sonner';

type Props = {
  playlists: BranchPlaylistRow[];
  workspaceId: string;
  onReviewed: () => void;
};

export function BranchReviewSection({ playlists, workspaceId, onReviewed }: Props) {
  const t = useTranslations('branchDetail');

  const pending = playlists.filter((p) => !p.isPublished);

  if (pending.length === 0) return null;

  const approve = async (pl: BranchPlaylistRow) => {
    const res = await apiFetch(
      `/playlists/${encodeURIComponent(pl.id)}?workspaceId=${encodeURIComponent(workspaceId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      },
    );
    if (!res.ok) {
      toast.error(t('reviewApproveFailed'));
      return;
    }
    toast.success(t('reviewApproved'));
    onReviewed();
  };

  const reject = async (_pl: BranchPlaylistRow) => {
    toast.info(t('reviewRejected'));
    onReviewed();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="vc-card-surface rounded-lg border border-border p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 ring-1 ring-warning/20">
          <Clock className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t('reviewTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('reviewDescription')}
          </p>
        </div>
        <span className="ms-auto rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
          {pending.length}
        </span>
      </div>

      <div className="space-y-2">
        {pending.map((pl) => (
          <div
            key={pl.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{pl.name}</p>
              <p className="text-xs text-muted-foreground">
                {t('reviewItems', { count: pl._count.items })} ·{' '}
                {new Date(pl.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => void reject(pl)}
            >
              <X className="me-1 h-3.5 w-3.5" />
              {t('reviewReject')}
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              onClick={() => void approve(pl)}
            >
              <Check className="me-1 h-3.5 w-3.5" />
              {t('reviewApprove')}
            </Button>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
