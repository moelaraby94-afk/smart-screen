'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BranchRow } from '@/features/admin/admin-customer-profile-types';

type AddBranchDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  adding: boolean;
  onCreate: () => void;
};

export function AddBranchDialog(props: AddBranchDialogProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="rounded-3xl border-border/80 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogNewTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>{t('displayName')}</Label>
          <Input
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            placeholder={t('branchPlaceholder')}
            className="rounded-xl"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            className="rounded-xl font-semibold"
            variant="cta"
            disabled={props.adding}
            onClick={props.onCreate}
          >
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EditBranchDialogProps = {
  editWs: BranchRow | null;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  saving: boolean;
  onSave: () => void;
};

export function EditBranchDialog(props: EditBranchDialogProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <Dialog open={Boolean(props.editWs)} onOpenChange={props.onClose}>
      <DialogContent className="rounded-3xl border-border/80 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogRenameTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>{t('displayName')}</Label>
          <Input
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={props.onClose}>
            {t('cancel')}
          </Button>
          <Button
            className="rounded-xl font-semibold"
            variant="cta"
            disabled={props.saving}
            onClick={props.onSave}
          >
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteBranchDialogProps = {
  deleteWs: BranchRow | null;
  onClose: () => void;
  deleting: boolean;
  onConfirm: () => void;
};

export function DeleteBranchDialog(props: DeleteBranchDialogProps) {
  const t = useTranslations('adminCustomerProfile');

  return (
    <Dialog open={Boolean(props.deleteWs)} onOpenChange={props.onClose}>
      <DialogContent className="rounded-3xl border-border/80 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogDeleteTitle')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('dialogDeleteBody', { name: props.deleteWs?.name ?? '' })}
        </p>
        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={props.onClose}>
            {t('cancel')}
          </Button>
          <Button
            className="rounded-2xl bg-destructive hover:bg-destructive/90"
            disabled={props.deleting}
            onClick={props.onConfirm}
          >
            {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
