'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ICON_STROKE } from '@/lib/icon-stroke';

type PairingState = {
  isOpen: boolean;
  code: string;
  name: string;
  busy: boolean;
  error: string | null;
  success: boolean;
  showProgressBanner: boolean;
  setCode: (v: string) => void;
  setName: (v: string) => void;
  claim: () => Promise<void>;
  close: () => void;
};

type Props = {
  pairing: PairingState;
  branchName: string;
  canClaim: boolean;
};

export function BranchPairingDialog({ pairing, branchName, canClaim }: Props) {
  const t = useTranslations('branchDetail');
  const tToolbar = useTranslations('branchToolbar');

  return (
    <Dialog
      open={pairing.isOpen}
      onOpenChange={(open) => {
        if (!open) pairing.close();
      }}
    >
      <DialogContent className="max-h-[min(90vh,560px)] overflow-y-auto sm:max-w-md">
        <DialogHeader className="space-y-1 text-center sm:text-center">
          <DialogTitle className="text-xl font-semibold">{t('pairingModalTitle')}</DialogTitle>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {tToolbar('branchLabel')} · {branchName}
          </p>
        </DialogHeader>
        {pairing.showProgressBanner ? (
          <p
            role="status"
            className="rounded-xl border border-primary/40 bg-primary/12 px-3 py-2 text-center text-xs font-medium leading-relaxed text-foreground"
          >
            {t('pairingProgressBanner')}
          </p>
        ) : null}
        <div className="space-y-5 py-2">
          {pairing.success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2
                className="h-14 w-14 text-emerald-500"
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
              <p className="text-base font-semibold text-foreground dark:text-white">
                {t('pairingSuccessMessage')}
              </p>
            </div>
          ) : !canClaim ? (
            <p className="text-center text-sm text-muted-foreground">{t('pairingViewOnly')}</p>
          ) : (
            <>
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {t('pairingModalDescription')}
              </p>
              {pairing.error ? (
                <p
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                  role="alert"
                >
                  {pairing.error}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="player-pair-code" className="sr-only">
                  {t('pairingCodeFieldLabel')}
                </Label>
                <p className="text-center text-xs font-medium text-muted-foreground">
                  {t('pairingCodeFieldLabel')}
                </p>
                <Input
                  id="player-pair-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder={t('pairingCodePlaceholder')}
                  value={pairing.code}
                  onChange={(e) => pairing.setCode(e.target.value)}
                  className="h-14 rounded-xl text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground"
                  aria-invalid={Boolean(pairing.error)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-pair-name">{t('pairingNameFieldLabel')}</Label>
                <Input
                  id="player-pair-name"
                  value={pairing.name}
                  onChange={(e) => pairing.setName(e.target.value)}
                  placeholder={t('pairingNamePlaceholder')}
                  className="rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void pairing.claim();
                  }}
                />
              </div>
              <Button
                type="button"
                className="h-11 w-full rounded-xl font-semibold"
                variant="cta"
                disabled={pairing.busy || pairing.code.length !== 6}
                onClick={() => void pairing.claim()}
              >
                {pairing.busy ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={ICON_STROKE} />
                  </span>
                ) : (
                  t('pairingCompleteButton')
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
