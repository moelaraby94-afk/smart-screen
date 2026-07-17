'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment?: string) => Promise<void>;
  loading?: boolean;
  mode: 'approve' | 'reject';
};

export function CampaignReviewDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  mode,
}: Props) {
  const t = useTranslations('campaigns');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) setComment('');
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm(comment.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' ? t('approveTitle') : t('rejectTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'approve' ? t('approveTitle') : t('rejectTitle')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="review-comment">{t('commentLabel')}</Label>
            <Input
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant={mode === 'reject' ? 'destructive' : 'default'}
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading
              ? t('processing')
              : mode === 'approve'
                ? t('approve')
                : t('reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
