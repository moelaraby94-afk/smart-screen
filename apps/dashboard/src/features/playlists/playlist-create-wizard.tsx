'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string }) => void;
};

export function PlaylistCreateWizard({ open, onClose, onCreate }: Props) {
  const t = useTranslations('playlistWizard');
  const [name, setName] = useState('');

  const reset = () => {
    setName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    await onCreate({ name: name.trim() || t('untitledPlaylist') });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{t('createPlaylist')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('playlistName')}
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4 pe-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{t('createPlaylist')}</h2>
            <p className="text-xs text-muted-foreground">{t('nameStepTitle')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="wizard-name">{t('playlistName')}</Label>
            <Input
              id="wizard-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="h-12 rounded-lg text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="cta"
            onClick={() => void handleCreate()}
            className="gap-2"
          >
            {t('create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
