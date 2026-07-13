'use client';

import { useId } from 'react';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import {
  createScreen as apiCreateScreen,
  updateScreen as apiUpdateScreen,
} from '@/features/screens/api/screens-api';
import type { ScreenRow } from './useApiScreens';

const screenSchema = z.object({
  name: z.string().min(2),
  serialNumber: z.string().min(4),
  location: z.string().optional(),
});

const editSchema = screenSchema.extend({
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE']),
});

function FieldInput({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  const fieldId = useId();
  const errorId = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div id={fieldId}>
        {children}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}

export function CreateScreenDialogContent({
  workspaceId,
  onSuccess,
  onCancel,
}: {
  workspaceId: string;
  onSuccess: () => Promise<void>;
  onCancel?: () => void;
}) {
  const t = useTranslations('screensClient.dialogs');
  const { toastResponseError } = useApiErrorToast();
  const form = useForm<z.infer<typeof screenSchema>>({
    resolver: zodResolver(screenSchema),
    defaultValues: {
      name: '',
      serialNumber: '',
      location: '',
    },
  });

  const submit = async (values: z.infer<typeof screenSchema>) => {
    const response = await apiCreateScreen(workspaceId, values);
    if (!response.ok) {
      await toastResponseError(response);
      return;
    }
    toast.success(t('createSuccess'));
    form.reset();
    await onSuccess();
  };

  return (
    <DialogContent className="rounded-2xl border-border sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('addTitle')}</DialogTitle>
        <DialogDescription>{t('addDescription')}</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <FieldInput label={t('screenName')} error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} className="rounded-xl" placeholder={t('screenName')} />
        </FieldInput>
        <FieldInput label={t('serialNumber')} error={form.formState.errors.serialNumber?.message}>
          <Input {...form.register('serialNumber')} className="font-mono-nums rounded-xl" placeholder={t('serialNumber')} />
        </FieldInput>
        <FieldInput label={t('location')} error={form.formState.errors.location?.message}>
          <Input {...form.register('location')} className="rounded-xl" placeholder={t('location')} />
        </FieldInput>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" disabled={form.formState.isSubmitting} onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="cta" className="rounded-xl font-semibold" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function EditScreenDialogContent({
  screen,
  workspaceId,
  onSuccess,
  onCancel,
}: {
  screen: ScreenRow;
  workspaceId: string;
  onSuccess: () => Promise<void>;
  onCancel?: () => void;
}) {
  const t = useTranslations('screensClient.dialogs');
  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: screen.name,
      serialNumber: screen.serialNumber,
      location: screen.location ?? '',
      status: screen.status,
    },
  });

  const submit = async (values: z.infer<typeof editSchema>) => {
    const response = await apiUpdateScreen(workspaceId, screen.id, {
      name: values.name,
      location: values.location,
      status: values.status,
    });
    if (!response.ok) {
      toast.error(t('updateFailed'));
      return;
    }
    toast.success(t('updateSuccess'));
    await onSuccess();
  };

  return (
    <DialogContent className="rounded-2xl border-border sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('editTitle')}</DialogTitle>
        <DialogDescription>{t('editDescription')}</DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <FieldInput label={t('screenName')} error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} className="rounded-xl" />
        </FieldInput>
        <FieldInput label={t('serialNumber')}>
          <Input {...form.register('serialNumber')} disabled className="font-mono-nums rounded-xl" />
        </FieldInput>
        <FieldInput label={t('location')} error={form.formState.errors.location?.message}>
          <Input {...form.register('location')} className="rounded-xl" />
        </FieldInput>
        <FieldInput label={t('status')} error={form.formState.errors.status?.message}>
          <select
            className="h-11 w-full rounded-xl border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            {...form.register('status')}
          >
            <option value="ONLINE">{t('online')}</option>
            <option value="OFFLINE">{t('offline')}</option>
            <option value="MAINTENANCE">{t('maintenance')}</option>
          </select>
        </FieldInput>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" disabled={form.formState.isSubmitting} onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="cta" className="rounded-xl font-semibold" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
