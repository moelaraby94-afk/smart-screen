'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { consumePendingWorkspaceCreate } from '@/features/auth/session';
import { WorkspaceCreateDialog } from '@/features/workspace/workspace-create-dialog';

export function WorkspaceWelcome() {
  const t = useTranslations('workspaceWelcome');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (consumePendingWorkspaceCreate()) {
      setCreateOpen(true);
      toast.info(t('sessionRestored'));
    }
  }, [t]);

  return (
    <>
      <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="vc-card-surface relative max-w-lg overflow-hidden rounded-2xl border border-border p-10 text-center shadow-sm"
        >
          <div className="pointer-events-none absolute -start-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -end-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
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
          </div>
        </motion.div>
      </div>

      <WorkspaceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
