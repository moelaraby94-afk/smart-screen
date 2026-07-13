'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Shield, Clock, Send, X, Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useApiScreens, type ScreenRow } from '@/features/screens/useApiScreens';
import { setScreenOverride } from '@/features/screens/api/screens-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { toast } from 'sonner';

const templateIds = ['fire', 'weather', 'maintenance', 'lockdown'] as const;

export function EmergencyClient() {
  const t = useTranslations('emergencyPage');
  const { workspaceId, workspaces } = useWorkspace();
  const { screens, isLoading } = useApiScreens(workspaceId);
  const { toastResponseError } = useApiErrorToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [durationPreset, setDurationPreset] = useState('30');
  const [durationCustom, setDurationCustom] = useState('30');
  const [activating, setActivating] = useState(false);

  const durationPresets = useMemo(
    () => [
      { value: '30', label: t('duration30m') },
      { value: '60', label: t('duration1h') },
      { value: '240', label: t('duration4h') },
      { value: '480', label: t('duration8h') },
      { value: '1440', label: t('duration24h') },
      { value: 'custom', label: t('durationCustom') },
    ],
    [t],
  );

  const effectiveDuration = durationPreset === 'custom' ? durationCustom : durationPreset;

  const canEdit = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'EDITOR';
  }, [workspaces, workspaceId]);

  const overriddenScreens = screens.filter(s => s.overridePlaylistId);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    setMessage(t(`templates.${id}.message`));
  };

  const handleActivate = useCallback(async () => {
    if (!workspaceId || !selectedScreenId || !message.trim()) return;
    setActivating(true);
    const res = await setScreenOverride(workspaceId, selectedScreenId, {
      playlistId: null,
      durationMinutes: parseInt(effectiveDuration) || 30,
    });
    if (res.ok) {
      toast.success(t('activated'));
      setMessage('');
      setSelectedScreenId('');
      setSelectedTemplate(null);
    } else {
      await toastResponseError(res);
    }
    setActivating(false);
  }, [workspaceId, selectedScreenId, message, effectiveDuration, toastResponseError]);

  const handleCancelOverride = useCallback(async (screenId: string) => {
    if (!workspaceId) return;
    const res = await setScreenOverride(workspaceId, screenId, {
      playlistId: null,
      durationMinutes: 0,
    });
    if (res.ok) {
      toast.success(t('cancelled'));
    } else {
      await toastResponseError(res);
    }
  }, [workspaceId, toastResponseError]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t('warningTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('warningDesc')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t('activate')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">{t('templatesLabel')}</p>
              <div className="grid grid-cols-2 gap-2">
                {templateIds.map((id) => (
                  <Button
                    key={id}
                    variant={selectedTemplate === id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectTemplate(id)}
                  >
                    {t(`templates.${id}.label`)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{t('customMessage')}</p>
              <textarea
                placeholder={t('messagePlaceholder')}
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                aria-label={t('customMessage')}
                className="flex min-h-[80px] w-full rounded-2xl border border-border bg-card px-4 py-2 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{t('scope')}</p>
              <select
                className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 py-2 text-[15px] outline-none"
                value={selectedScreenId}
                onChange={(e) => setSelectedScreenId(e.target.value)}
                aria-label={t('scope')}
              >
                <option value="">{t('scopeAll')}</option>
                {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{t('duration')}</p>
              <select
                className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 py-2 text-[15px] outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                value={durationPreset}
                onChange={(e) => setDurationPreset(e.target.value)}
                aria-label={t('duration')}
              >
                {durationPresets.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {durationPreset === 'custom' && (
                <Input
                  type="number"
                  className="mt-2"
                  min={1}
                  value={durationCustom}
                  onChange={(e) => setDurationCustom(e.target.value)}
                  placeholder={t('durationPlaceholder')}
                  aria-label={t('durationCustom')}
                />
              )}
            </div>

            <Button variant="destructive" className="w-full" disabled={!message.trim() || !selectedScreenId || activating || !canEdit} onClick={handleActivate}>
              {activating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('activateBtn')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t('activeAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : overriddenScreens.length === 0 ? (
              <div className="py-8 text-center">
                <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{t('noAlerts')}</p>
              </div>
            ) : (
              overriddenScreens.map((screen: ScreenRow) => (
                <div key={screen.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{screen.name}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {screen.overrideExpiresAt ? new Date(screen.overrideExpiresAt).toLocaleString() : '—'}</span>
                        <Badge variant="danger">{t('activeBadge')}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleCancelOverride(screen.id)} disabled={!canEdit} aria-label={t('cancelOverride')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
