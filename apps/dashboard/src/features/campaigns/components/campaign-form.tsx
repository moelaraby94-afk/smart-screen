'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Campaign, CampaignFormData } from '../types';

type Option = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  initial?: Campaign | null;
  playlists: Option[];
  screens: Option[];
  submitting?: boolean;
};

export function CampaignForm({
  open,
  onOpenChange,
  onSubmit,
  initial,
  playlists,
  screens,
  submitting,
}: Props) {
  const t = useTranslations('campaigns');
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [playlistId, setPlaylistId] = useState(initial?.playlistId ?? '');
  const [screenId, setScreenId] = useState(initial?.screenId ?? '');
  const [startDate, setStartDate] = useState(
    initial?.startDate ? initial.startDate.slice(0, 10) : '',
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ? initial.endDate.slice(0, 10) : '',
  );
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setPlaylistId(initial?.playlistId ?? '');
      setScreenId(initial?.screenId ?? '');
      setStartDate(initial?.startDate ? initial.startDate.slice(0, 10) : '');
      setEndDate(initial?.endDate ? initial.endDate.slice(0, 10) : '');
      setValidationError('');
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError(t('validation.nameRequired'));
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setValidationError(t('validation.dateRange'));
      return;
    }
    setValidationError('');
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      playlistId: playlistId || undefined,
      screenId: screenId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t('editTitle') : t('createTitle')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">{t('fields.name')}</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fields.namePlaceholder')}
              required
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-description">{t('fields.description')}</Label>
            <Input
              id="campaign-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('fields.descriptionPlaceholder')}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-playlist">{t('fields.playlist')}</Label>
            <select
              id="campaign-playlist"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/40"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
            >
              <option value="">{t('fields.selectPlaylist')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-screen">{t('fields.screen')}</Label>
            <select
              id="campaign-screen"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/40"
              value={screenId}
              onChange={(e) => setScreenId(e.target.value)}
            >
              <option value="">{t('fields.selectScreen')}</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-start">{t('fields.startDate')}</Label>
              <Input
                id="campaign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-end">{t('fields.endDate')}</Label>
              <Input
                id="campaign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('saving') : isEdit ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
