'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ICON_STROKE } from '@/lib/icon-stroke';

type RenameDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  setValue: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
};

export function RenameBranchDialog(props: RenameDialogProps) {
  const t = useTranslations('clientHome');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('renameDialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="branch-rename">{t('renameLabel')}</Label>
          <Input
            id="branch-rename"
            value={props.value}
            onChange={(e) => props.setValue(e.target.value)}
            className="rounded-xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void props.onSubmit();
            }}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            className="rounded-lg bg-primary font-semibold text-white hover:bg-primary/90"
            disabled={props.busy || !props.value.trim() || props.value.trim().length < 2}
            onClick={() => void props.onSubmit()}
          >
            {props.busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} /> : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy: boolean;
  onConfirm: () => void;
};

export function DeleteBranchDialog(props: DeleteDialogProps) {
  const t = useTranslations('clientHome');

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteBranchTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteBranchBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel className="rounded-xl" disabled={props.busy}>
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            className="rounded-xl bg-red-600 font-semibold text-white hover:bg-red-600/90"
            disabled={props.busy}
            onClick={() => void props.onConfirm()}
          >
            {props.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
            ) : (
              t('deleteBranchConfirm')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
