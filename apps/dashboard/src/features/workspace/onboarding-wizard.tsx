'use client';

import { useState, useCallback } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  Monitor,
  Upload,
  UserPlus,
  Wand2,
  Rocket,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { seedDemoContent } from '@/features/workspace/workspace-api';
import { useWorkspace } from '@/features/workspace/workspace-context';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
};

type Step = 'content' | 'nextSteps';

export function OnboardingWizard({ open, onOpenChange, workspaceId, workspaceName }: Props) {
  const t = useTranslations('onboardingWizard');
  const locale = useLocale();
  const dir = locale === 'ar' ? -1 : 1;
  const router = useRouter();
  const { bumpWorkspaceDataEpoch } = useWorkspace();
  const [step, setStep] = useState<Step>('content');
  const [seeding, setSeeding] = useState(false);
  const [seededDone, setSeededDone] = useState(false);

  const handleSeedDemo = useCallback(async () => {
    setSeeding(true);
    try {
      const res = await seedDemoContent(workspaceId);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message ?? t('seedFailed'));
        return;
      }
      setSeededDone(true);
      bumpWorkspaceDataEpoch();
      toast.success(t('seedSuccess'));
      setStep('nextSteps');
    } catch {
      toast.error(t('seedFailed'));
    } finally {
      setSeeding(false);
    }
  }, [workspaceId, t, bumpWorkspaceDataEpoch]);

  const handleSkip = useCallback(() => {
    setStep('nextSteps');
  }, []);

  const handleFinish = useCallback(() => {
    onOpenChange(false);
    router.push(`/${locale}/overview` as never as Route);
    router.refresh();
  }, [onOpenChange, router, locale]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    router.push(`/${locale}/overview` as never as Route);
    router.refresh();
  }, [onOpenChange, router, locale]);

  const quickLinks = [
    {
      icon: Monitor,
      label: t('addScreen'),
      description: t('addScreenDesc'),
      href: `/${locale}/screens`,
    },
    {
      icon: Upload,
      label: t('uploadMedia'),
      description: t('uploadMediaDesc'),
      href: `/${locale}/media`,
    },
    {
      icon: UserPlus,
      label: t('inviteTeam'),
      description: t('inviteTeamDesc'),
      href: `/${locale}/team`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="rounded-3xl border-border/80 sm:max-w-lg">
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 px-6 pt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {step === 'content' ? '1' : <CheckCircle2 className="h-4 w-4" />}
            </span>
            <span className="text-xs font-medium text-foreground">{t('stepContent')}</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === 'nextSteps' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </span>
            <span className={`text-xs font-medium ${step === 'nextSteps' ? 'text-foreground' : 'text-muted-foreground'}`}>{t('stepNextSteps')}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 * dir }}
              className="px-6 pb-6 pt-4"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {t('workspaceReady', { name: workspaceName })}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('contentChoice')}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void handleSeedDemo()}
                  disabled={seeding}
                  className="vc-card-surface flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-start transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    {seeding ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Wand2 className="h-6 w-6 text-primary" />}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{t('seedDemoTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('seedDemoDesc')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={seeding}
                  className="vc-card-surface flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-start transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Rocket className="h-6 w-6 text-muted-foreground" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{t('startFreshTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('startFreshDesc')}</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'nextSteps' && (
            <motion.div
              key="nextSteps"
              initial={{ opacity: 0, x: 20 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 * dir }}
              className="px-6 pb-6 pt-4"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Rocket className="h-8 w-8 text-primary" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {seededDone ? t('seededReady') : t('freshReady')}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('nextStepsDesc')}
                </p>
              </div>

              <div className="space-y-2">
                {quickLinks.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(link.href as never as Route);
                      router.refresh();
                    }}
                    className="vc-card-surface flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-start transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{link.label}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setStep('content')}
                >
                  <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
                  {t('back')}
                </Button>
                <Button
                  type="button"
                  variant="cta"
                  className="rounded-xl font-semibold"
                  onClick={handleFinish}
                >
                  {t('goToDashboard')}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
