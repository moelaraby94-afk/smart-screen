'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Monitor,
  RefreshCw,
  Power,
  Activity,
  Clock,
  Film,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchScreenById,
  fetchScreenAnalytics,
  sendRemoteCommand,
  updateScreen,
  type ScreenAnalytics,
} from '@/features/screens/api/screens-api';
import type { ScreenRow } from '@/features/screens/useApiScreens';
import {
  deriveFleetReachability,
  ScreenFleetStatusBadge,
} from '@/features/screens/screen-fleet-status';
import { useScreenActivePreview } from '@/features/screens/use-screen-active-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = {
  screenId: string;
  locale: string;
};

export function ScreenDetailClient({ screenId, locale }: Props) {
  const t = useTranslations('screensClient');
  const tDetail = useTranslations('screenDetail');
  const activeLocale = useLocale();
  const { workspaceId } = useWorkspace();
  const [screen, setScreen] = useState<ScreenRow | null>(null);
  const [analytics, setAnalytics] = useState<ScreenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState('');
  const [editingLocation, setEditingLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const isAr = locale === 'ar';

  const loadScreen = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const res = await fetchScreenById(workspaceId, screenId);
    if (res.ok) {
      const data = (await res.json()) as ScreenRow;
      setScreen(data);
      setEditingName(data.name);
      setEditingLocation(data.location ?? '');
    }
    setLoading(false);
  }, [workspaceId, screenId]);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  useEffect(() => {
    if (!workspaceId) return;
    void fetchScreenAnalytics(workspaceId).then(setAnalytics);
  }, [workspaceId]);

  const handleSave = async () => {
    if (!workspaceId || !screen) return;
    setSaving(true);
    try {
      const res = await updateScreen(workspaceId, screenId, {
        name: editingName.trim() || screen.name,
        location: editingLocation.trim() || null,
      });
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('saved'));
      await loadScreen();
    } catch {
      toast.error(tDetail('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemote = async (cmd: 'refresh_content' | 'restart') => {
    if (!workspaceId) return;
    try {
      await sendRemoteCommand(workspaceId, screenId, cmd);
      toast.success(tDetail('commandSent'));
    } catch {
      toast.error(tDetail('commandFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">{tDetail('notFound')}</p>
        <Link
          href={`/${locale}/screens` as Route}
          className="text-sm text-primary hover:underline"
        >
          {tDetail('backToScreens')}
        </Link>
      </div>
    );
  }

  const reach = deriveFleetReachability(screen.status, screen.lastSeenAt);
  const lastSeen = screen.lastSeenAt
    ? new Intl.DateTimeFormat(activeLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(screen.lastSeenAt))
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/screens` as Route}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted',
            isAr && 'rotate-180',
          )}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{screen.name}</h1>
          <p className="font-mono text-xs text-muted-foreground">{screen.serialNumber}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative aspect-video w-full bg-muted">
              <ScreenPreview screenId={screenId} workspaceId={workspaceId} />
              <div className="absolute start-3 top-3">
                <ScreenFleetStatusBadge
                  status={screen.status}
                  lastSeenAt={screen.lastSeenAt}
                  locale={locale}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold tracking-tight">{tDetail('editSettings')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tDetail('name')}
                </Label>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tDetail('location')}
                </Label>
                <Input
                  value={editingLocation}
                  onChange={(e) => setEditingLocation(e.target.value)}
                  placeholder={tDetail('locationPlaceholder')}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? tDetail('saving') : tDetail('save')}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => void handleRemote('refresh_content')}
              className="rounded-xl"
            >
              <RefreshCw className="me-2 h-4 w-4" />
              {t('refresh')}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleRemote('restart')}
              className="rounded-xl border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
            >
              <Power className="me-2 h-4 w-4" />
              {t('powerOff')}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold tracking-tight">{tDetail('info')}</h2>
            <dl className="space-y-3 text-sm">
              <InfoRow icon={Monitor} label={tDetail('resolution')} value={
                screen.resolutionWidth && screen.resolutionHeight
                  ? `${screen.resolutionWidth}×${screen.resolutionHeight}`
                  : '1920×1080'
              } />
              <InfoRow icon={MapPin} label={tDetail('locationLabel')} value={screen.location || '—'} />
              <InfoRow icon={Clock} label={tDetail('lastSeen')} value={lastSeen} />
              <InfoRow icon={Activity} label={tDetail('status')} value={reach} />
              <InfoRow icon={Film} label={tDetail('activePlaylist')} value={screen.activePlaylist?.name ?? '—'} />
            </dl>
          </div>

          {analytics && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold tracking-tight">{tDetail('analytics')}</h2>
              <dl className="space-y-3 text-sm">
                <InfoRow icon={Activity} label={tDetail('uptime')} value={`${analytics.uptimePercent.toFixed(1)}%`} />
                <InfoRow icon={Film} label={tDetail('withPlaylist')} value={`${analytics.withPlaylist}/${analytics.total}`} />
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
        {label}
      </dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ScreenPreview({ screenId, workspaceId }: { screenId: string; workspaceId: string | null }) {
  const { previewUrl, loading } = useScreenActivePreview(screenId, workspaceId ?? '');
  if (previewUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={previewUrl} alt="Screen preview" className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Monitor className="h-16 w-16 text-muted-foreground/30" strokeWidth={1.25} />
    </div>
  );
}
