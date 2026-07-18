'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Radio, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { usePlayerPairing } from '@/features/branches/use-player-pairing';
import { fetchPlaylistOptions, type PlaylistOption } from '@/features/screens/api/screens-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = { locale: string };

export function PairingWizardClient({ locale }: Props) {
  const t = useTranslations('pairingWizard');
  const tScreens = useTranslations('screensClient');
  const activeLocale = useLocale();
  const router = useRouter();
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch, pairingActivityEpoch } = useWorkspace();

  const canClaimPairing = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'EDITOR';
  }, [workspaces, workspaceId]);

  const [step, setStep] = useState(1);
  const [screenName, setScreenName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<PlaylistOption[]>([]);
  const autoAdvanceRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const pairing = usePlayerPairing(workspaceId ?? '', {
    canClaim: canClaimPairing,
    pairingActivityEpoch,
    onClaimed: async () => { await bumpWorkspaceDataEpoch(); },
    autoClose: false,
  });

  useEffect(() => {
    pairing.open();
    return () => pairing.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const items = await fetchPlaylistOptions(workspaceId);
      if (!cancelled) setBranches(items);
    })();
    return () => { cancelled = true; };
  }, [workspaceId]);

  useEffect(() => {
    if (step === 1 && pairing.code.length === 6 && !autoAdvanceRef.current) {
      autoAdvanceRef.current = true;
      setStep(2);
    }
    if (pairing.code.length < 6) {
      autoAdvanceRef.current = false;
    }
  }, [pairing.code.length, step]);

  const isAr = locale === 'ar';

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (pairing.code.length !== 6) return;
      setStep(2);
    } else if (step === 2) {
      const trimmed = screenName.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        setNameError(t('nameError'));
        return;
      }
      setNameError(null);
      pairing.setName(trimmed);
      setStep(3);
    }
  }, [step, pairing, screenName, t]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const handlePair = useCallback(async () => {
    await pairing.claim(branchId || undefined);
  }, [pairing, branchId]);

  const handleSkip = useCallback(async () => {
    setBranchId('');
    await pairing.claim(undefined);
  }, [pairing]);

  const handleCancel = useCallback(() => {
    pairing.close();
    router.push(`/${activeLocale}/screens` as Route);
  }, [pairing, router, activeLocale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pairing.success) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancel, pairing.success]);

  useEffect(() => {
    if (pairing.success) {
      toast.success(t('successTitle'));
    }
  }, [pairing.success, t]);

  const canProceed = step === 1 ? pairing.code.length === 6 : step === 2 ? screenName.trim().length >= 2 : true;

  useEffect(() => {
    if (step === 2 && screenName === '') {
      setScreenName(t('nameSuggestionDefault'));
    }
  }, [step, screenName, t]);

  if (!canClaimPairing) {
    return (
      <div className="mx-auto max-w-[600px] px-6 py-6">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold">{t('permissionDenied')}</p>
          <p className="text-sm text-muted-foreground">{t('permissionDeniedDesc')}</p>
          <Button variant="outline" onClick={handleCancel}>
            {t('backToScreens')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] px-6 py-6" role="region" aria-label={t('pageTitle')}>
      {/* Breadcrumbs */}
      <nav aria-label={t('breadcrumbAria')} className="mb-6 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={handleCancel}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {tScreens('fleet')}
        </button>
        <ChevronRight className={cn('h-4 w-4 text-muted-foreground/50', isAr && 'rotate-180')} />
        <span className="font-medium text-foreground" aria-current="page">
          {t('pairScreen')}
        </span>
      </nav>

      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        {pairing.success && pairing.claimedScreen ? (
          /* Success State */
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <motion.div
                initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-16 w-16 text-success" strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-lg font-semibold text-foreground">{t('successTitle')}</h2>
              <p className="max-w-sm text-sm text-muted-foreground">{t('successDesc')}</p>
            </div>

            <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground sm:grid-cols-2">
              <span>
                <span className="font-medium text-foreground">{t('screenName')}: </span>
                {pairing.claimedScreen.name}
              </span>
              <span>
                <span className="font-medium text-foreground">{t('serialNumber')}: </span>
                <span className="font-mono">{pairing.claimedScreen.serialNumber}</span>
              </span>
              {pairing.claimedScreen.resolutionWidth && pairing.claimedScreen.resolutionHeight && (
                <span>
                  <span className="font-medium text-foreground">{t('resolution')}: </span>
                  {pairing.claimedScreen.resolutionWidth}×{pairing.claimedScreen.resolutionHeight}
                </span>
              )}
              {pairing.claimedScreen.playerPlatform && (
                <span>
                  <span className="font-medium text-foreground">{t('playerPlatform')}: </span>
                  {pairing.claimedScreen.playerPlatform}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="cta"
                className="rounded-lg font-semibold"
                onClick={() => router.push(`/${activeLocale}/content` as Route)}
              >
                {t('assignContent')}
              </Button>
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => router.push(`/${activeLocale}/screens` as Route)}
              >
                {t('backToScreens')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div
              className="mb-8 flex items-center justify-center gap-2"
              role="list"
              aria-label={t('stepIndicator', { current: step, total: 3 })}
            >
              {[1, 2, 3].map((s) => {
                const labels = [t('stepCode'), t('stepName'), t('stepBranch')];
                return (
                  <div key={s} className="flex flex-col items-center gap-1" role="listitem">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                          s === step && 'bg-primary text-primary-foreground',
                          s < step && 'bg-success text-success-foreground',
                          s > step && 'bg-muted text-muted-foreground',
                        )}
                        aria-current={s === step ? 'step' : undefined}
                        aria-label={t('stepLabel', { current: s, total: 3 })}
                      >
                        {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                      </div>
                      {s < 3 && (
                        <div className={cn('h-0.5 w-8 rounded-full', s < step ? 'bg-success' : 'bg-border')} />
                      )}
                    </div>
                    <span className={cn('text-xs font-medium', s === step ? 'text-foreground' : 'text-muted-foreground')}>
                      {labels[s - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mb-6 text-center text-xs font-medium text-muted-foreground" aria-live="polite">
              {t('stepIndicator', { current: step, total: 3 })}
            </p>

            {/* Step 1: Pairing Code */}
            {step === 1 && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                  {t('codeHelp')}
                </p>
                {pairing.showProgressBanner && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="space-y-2 rounded-lg border border-primary/40 bg-primary/12 px-3 py-3"
                  >
                    <p className="text-center text-xs font-medium leading-relaxed text-foreground">
                      {t('pairingProgress')}
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('wizardTroubleshootingTitle')}
                      </p>
                      <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                          {t('wizardTip1')}
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                          {t('wizardTip2')}
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                          {t('wizardTip3')}
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                          {t('wizardTip4')}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
                {pairing.error && (
                  <p
                    id="pair-code-error"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                    role="alert"
                    aria-live="assertive"
                  >
                    {pairing.error}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <Label htmlFor="pair-code" className="text-center text-xs font-medium text-muted-foreground">
                      {t('codeLabel')}
                    </Label>
                    <span className="group relative inline-flex">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" tabIndex={0} aria-label={t('codeHelp')} />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-popover mb-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        {t('codeHelp')}
                      </span>
                    </span>
                  </div>
                  <Input
                    id="pair-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={t('codePlaceholder')}
                    value={pairing.code}
                    onChange={(e) => pairing.setCode(e.target.value)}
                    className={cn(
                      'h-16 rounded-lg text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground',
                      pairing.error && 'border-destructive ring-2 ring-destructive/20',
                    )}
                    aria-invalid={Boolean(pairing.error)}
                    aria-describedby={pairing.error ? 'pair-code-error' : undefined}
                    aria-label={t('codeLabel')}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && pairing.code.length === 6) {
                        handleNext();
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Screen Name */}
            {step === 2 && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                  {t('nameHelp')}
                </p>
                {nameError && (
                  <p
                    id="screen-name-error"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                    role="alert"
                    aria-live="assertive"
                  >
                    {nameError}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="screen-name" className="text-xs font-medium text-muted-foreground">
                    {t('nameLabel')}
                  </Label>
                  <Input
                    id="screen-name"
                    value={screenName}
                    onChange={(e) => {
                      setScreenName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder={t('namePlaceholder')}
                    maxLength={50}
                    className={cn(
                      'h-12 rounded-lg text-base font-medium',
                      nameError && 'border-destructive ring-2 ring-destructive/20',
                    )}
                    aria-label={t('nameLabel')}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? 'screen-name-error' : undefined}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNext();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{t('nameSuggestion')}</p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Branch (Optional) */}
            {step === 3 && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                  {t('branchHelp')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="branch-select" className="text-xs font-medium text-muted-foreground">
                    {t('branchLabel')}
                  </Label>
                  <select
                    id="branch-select"
                    className="h-12 w-full rounded-lg border border-border bg-background px-3 text-base font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    aria-label={t('branchLabel')}
                    autoFocus
                  >
                    <option value="">{t('branchNone')}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* Wizard Footer */}
            <div className="mt-8 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={handleCancel} className="rounded-lg">
                {t('cancel')}
              </Button>
              <div className="flex items-center gap-2">
                {step > 1 && !pairing.success && (
                  <Button variant="outline" onClick={handleBack} className="rounded-lg">
                    {t('back')}
                  </Button>
                )}
                {step < 3 && !pairing.success && (
                  <Button
                    variant="default"
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="rounded-lg"
                  >
                    {t('next')}
                  </Button>
                )}
                {step === 3 && !pairing.success && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => void handleSkip()}
                      disabled={pairing.busy}
                      className="rounded-lg"
                    >
                      {t('skip')}
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => void handlePair()}
                      disabled={pairing.busy}
                      className="rounded-lg font-semibold"
                    >
                      {pairing.busy ? (
                        <>
                          <Radio className="me-2 h-4 w-4 animate-pulse" />
                          {t('pairing')}
                        </>
                      ) : (
                        <>
                          <Radio className="me-2 h-4 w-4" />
                          {t('pairScreen')}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
