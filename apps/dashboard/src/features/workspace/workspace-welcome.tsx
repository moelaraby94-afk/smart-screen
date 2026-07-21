'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { consumePendingWorkspaceCreate } from '@/features/auth/session';
import { WorkspaceCreateDialog } from '@/features/workspace/workspace-create-dialog';
import { bootstrapDemoWorkspace } from '@/features/workspace/workspace-api';
import { useWorkspace } from '@/features/workspace/workspace-context';

export function WorkspaceWelcome() {
  const t = useTranslations('workspaceWelcome');
  const locale = useLocale();
  const router = useRouter();
  const { refreshWorkspaces, setWorkspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (consumePendingWorkspaceCreate()) {
      setCreateOpen(true);
      toast.info(t('sessionRestored'));
    }
  }, [t]);

  const handleBootstrapDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await bootstrapDemoWorkspace();
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message ?? t('demoFailed'));
        return;
      }
      const data = (await res.json()) as { workspace: { id: string; name: string } };
      await refreshWorkspaces(data.workspace.id);
      setWorkspaceId(data.workspace.id);
      bumpWorkspaceDataEpoch();
      toast.success(t('demoLoaded'));
      router.push(`/${locale}/overview` as Route);
      router.refresh();
    } catch {
      toast.error(t('demoFailed'));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="vc-card-surface relative max-w-lg overflow-hidden rounded-lg border border-border p-10 text-center shadow-sm"
        >
          <div className="pointer-events-none absolute -start-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -end-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="h-11 w-11 text-primary" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {t('description')}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-xl px-8 text-base font-semibold" variant="cta"
              onClick={() => setCreateOpen(true)}
            >
              <Building2 className="me-2 h-5 w-5" />
              {t('createFirstWorkspace')}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-8 text-base font-semibold"
              disabled={demoLoading}
              onClick={() => void handleBootstrapDemo()}
            >
              {demoLoading ? (
                <Loader2 className="me-2 h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="me-2 h-5 w-5" />
              )}
              {t('createWithDemo')}
            </Button>
          </div>
        </motion.div>
      </div>

      <WorkspaceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
