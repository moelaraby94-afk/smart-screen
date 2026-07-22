'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Monitor, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPlaylistDetail as apiFetchPlaylistDetail } from '@/features/branches/branches-api';
import { CreateScreenDialog } from '@/features/branches/create-screen-dialog';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ScreenQuickEditPanel } from '@/features/screens/screen-quick-edit-panel';
import { useApiScreens, type ScreenRow } from '@/features/screens/useApiScreens';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

type Props = {
  locale: string;
};

function StatusBadge({ status }: { status: ScreenRow['status'] }) {
  const t = useTranslations('screensClient');
  const live = status === 'ONLINE';
  const maintenance = status === 'MAINTENANCE';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
        live &&
          'border border-success/40 bg-success/15 text-success',
        !live &&
          maintenance &&
          'border border-warning/35 bg-warning/12 text-warning',
        !live &&
          !maintenance &&
          'border border-destructive/35 bg-destructive/12 text-destructive',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          live && 'animate-pulse bg-success',
          maintenance && 'bg-warning',
          !live && !maintenance && 'bg-destructive',
        )}
      />
      {live ? t('status.live') : maintenance ? t('status.maintenance') : t('status.offline')}
    </span>
  );
}

export function PlaylistScreensClient({ locale }: Props) {
  const t = useTranslations('playlistScreens');
  const params = useParams();
  const workspaceIdParam = typeof params.workspaceId === 'string' ? params.workspaceId : '';
  const playlistIdParam = typeof params.playlistId === 'string' ? params.playlistId : '';
  const { workspaces, setWorkspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const branch = useMemo(
    () => workspaces.find((w) => w.id === workspaceIdParam),
    [workspaces, workspaceIdParam],
  );

  const { screens, isLoading, reload } = useApiScreens(workspaceIdParam || null, {
    playlistGroupId: playlistIdParam,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editScreen, setEditScreen] = useState<ScreenRow | null>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [createScreenOpen, setCreateScreenOpen] = useState(false);

  useEffect(() => {
    if (workspaceIdParam) {
      setWorkspaceId(workspaceIdParam);
      bumpWorkspaceDataEpoch();
    }
  }, [workspaceIdParam, setWorkspaceId, bumpWorkspaceDataEpoch]);

  useEffect(() => {
    if (!workspaceIdParam || !playlistIdParam) {
      setPlaylistName(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await apiFetchPlaylistDetail(workspaceIdParam, playlistIdParam);
      if (!res.ok || cancelled) return;
      const row = (await res.json()) as { name?: string };
      if (!cancelled) setPlaylistName(typeof row.name === 'string' ? row.name : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceIdParam, playlistIdParam]);

  const openEdit = useCallback((s: ScreenRow) => {
    setEditScreen(s);
    setEditOpen(true);
  }, []);

  if (!branch) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">{t('branchNotFound')}</p>
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link href={`/${locale}/overview` as Route}>{t('backOverview')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-1">
        <p className="vc-page-kicker">{t('kicker')}</p>
        <h1 className="vc-page-title text-balance dark:text-white">
          {playlistName ? playlistName : t('title')}
        </h1>
        <p className="vc-page-desc max-w-2xl text-balance dark:text-white/65">
          {t('description', { branch: branch.name })}
        </p>
      </header>

      {isLoading ? (
        <CardGridSkeleton />
      ) : screens.length === 0 ? (
        <div className="vc-card-surface rounded-lg border border-dashed border-border p-10 text-center">
          <Monitor className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={ICON_STROKE} />
          <p className="mt-3 text-sm font-medium text-foreground">{t('empty')}</p>
          <Button
            type="button"
            variant="cta"
            className="mt-6 rounded-xl font-semibold"
            onClick={() => setCreateScreenOpen(true)}
          >
            {t('addScreen')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {screens.map((screen, i) => (
            <motion.article
              key={screen.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.3 }}
              className="vc-card-surface flex flex-col rounded-lg border border-border/60 p-5 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground dark:text-white">{screen.name}</h3>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{screen.serialNumber}</p>
                </div>
                <StatusBadge status={screen.status} />
              </div>
              {screen.location ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{screen.location}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="cta"
                  className="rounded-xl font-semibold"
                  onClick={() => openEdit(screen)}
                >
                  <PenLine className="me-2 h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  {t('edit')}
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <ScreenQuickEditPanel
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditScreen(null);
        }}
        screen={editScreen}
        workspaceId={workspaceIdParam}
        locale={locale}
        onSaved={reload}
        onEditScreen={() => {
          /* full editor not routed separately */
        }}
      />

      <CreateScreenDialog
        open={createScreenOpen}
        onOpenChange={setCreateScreenOpen}
        workspaceId={workspaceIdParam}
        onCreated={() => {
          bumpWorkspaceDataEpoch();
          void reload();
        }}
      />
    </div>
  );
}
