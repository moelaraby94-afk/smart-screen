'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWorkspace as apiCreateWorkspace } from '@/features/workspace/workspace-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { OnboardingWizard } from '@/features/workspace/onboarding-wizard';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

async function readApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* plain text */
  }
  return text || `Request failed (${res.status})`;
}

export function WorkspaceCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations('workspaceCreateDialog');
  const locale = useLocale();
  const router = useRouter();
  const { refreshWorkspaces, setWorkspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [createdWs, setCreatedWs] = useState<{ id: string; name: string } | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error(t('nameMin'));
      return;
    }
    setSaving(true);
    try {
      const res = await apiCreateWorkspace(trimmed);
      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }
      const created = (await res.json()) as { id: string; name: string };

      await refreshWorkspaces(created.id);
      setWorkspaceId(created.id);
      bumpWorkspaceDataEpoch();

      setName('');
      onOpenChange(false);
      setCreatedWs(created);
      setOnboardingOpen(true);

      toast.success(t('workspaceReady', { name: created.name }));

      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/80 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="ws-name">{t('nameLabel')}</Label>
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="rounded-xl"
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !saving) void submit();
            }}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            disabled={saving}
            className="rounded-xl font-semibold" variant="cta"
            onClick={() => void submit()}
          >
            {saving ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {createdWs && (
        <OnboardingWizard
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
          workspaceId={createdWs.id}
          workspaceName={createdWs.name}
        />
      )}
    </>
  );
}
