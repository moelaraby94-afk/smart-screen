'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Monitor,
  Upload,
  ListVideo,
  CalendarClock,
  UserPlus,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchOnboardingProgress,
  completeOnboardingStep,
  dismissOnboarding,
} from '@/features/onboarding/onboarding-api';
import { ICON_STROKE } from '@/lib/icon-stroke';

type ProgressData = {
  completedSteps: string[];
  dismissed: boolean;
  totalSteps: number;
  doneCount: number;
  percentage: number;
  isComplete: boolean;
  remainingSteps: string[];
};

const STEP_META: Record<
  string,
  { icon: typeof Monitor; href: string; key: string }
> = {
  create_screen: { icon: Monitor, href: '/screens', key: 'stepCreateScreen' },
  upload_media: { icon: Upload, href: '/media', key: 'stepUploadMedia' },
  create_playlist: { icon: ListVideo, href: '/playlists', key: 'stepCreatePlaylist' },
  schedule_content: { icon: CalendarClock, href: '/scheduling', key: 'stepScheduleContent' },
  invite_team: { icon: UserPlus, href: '/team', key: 'stepInviteTeam' },
};

const STEP_ORDER = [
  'create_screen',
  'upload_media',
  'create_playlist',
  'schedule_content',
  'invite_team',
];

export function OnboardingProgressWidget() {
  const t = useTranslations('onboardingWidget');
  const locale = useLocale();
  const router = useRouter();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetchOnboardingProgress(workspaceId);
      if (res.ok) {
        setProgress(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const handleStepClick = useCallback(
    async (step: string) => {
      if (!workspaceId || !progress) return;
      const meta = STEP_META[step];
      if (!meta) return;

      // Mark step as complete
      try {
        const res = await completeOnboardingStep(workspaceId, step);
        if (res.ok) {
          setProgress(await res.json());
        }
      } catch {
        /* ignore */
      }

      // Navigate to the step page
      router.push(`/${locale}${meta.href}` as Route);
    },
    [workspaceId, progress, router, locale],
  );

  const handleDismiss = useCallback(async () => {
    if (!workspaceId) return;
    setDismissing(true);
    try {
      const res = await dismissOnboarding(workspaceId);
      if (res.ok) {
        setProgress(null);
        toast.success(t('dismissed'));
      }
    } catch {
      toast.error(t('dismissFailed'));
    } finally {
      setDismissing(false);
    }
  }, [workspaceId, t]);

  if (loading || !progress || progress.dismissed || progress.isComplete) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm"
    >
      <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-ring/20">
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('subtitle', { done: progress.doneCount, total: progress.totalSteps })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleDismiss()}
          disabled={dismissing}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          aria-label={t('dismiss')}
        >
          {dismissing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
        />
      </div>

      {/* Steps */}
      <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
        {STEP_ORDER.map((step) => {
          const isDone = progress.completedSteps.includes(step);
          const meta = STEP_META[step];
          const Icon = meta.icon;
          return (
            <button
              key={step}
              type="button"
              onClick={() => void handleStepClick(step)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-start transition ${
                isDone
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isDone ? 'bg-success/10' : 'bg-primary/10'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={ICON_STROKE} />
                ) : (
                  <Icon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {t(meta.key)}
                </p>
              </div>
              {!isDone && (
                <span className="text-xs text-muted-foreground">
                  {t('go')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
