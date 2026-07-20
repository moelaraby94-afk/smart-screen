'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Webhook,
  Plus,
  Trash2,
  Loader2,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  fetchWebhooks,
  createWebhook,
  deleteWebhook,
  toggleWebhook,
  testWebhook,
} from '@/features/api-docs/api-management-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ICON_STROKE } from '@/lib/icon-stroke';

type WebhookRow = {
  id: string;
  url: string;
  events: string;
  enabled: boolean;
  createdAt: string;
};

const AVAILABLE_EVENTS = [
  'screen.online',
  'screen.offline',
  'media.uploaded',
  'playlist.updated',
  'schedule.created',
];

export function WebhooksManager() {
  const t = useTranslations('apiDocs');
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetchWebhooks(workspaceId);
      if (res.ok) {
        setWebhooks(await res.json());
      }
    } catch {
      toast.error(t('webhooks.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const handleCreate = useCallback(async () => {
    if (!workspaceId || !newUrl.trim() || newEvents.length === 0) return;
    setCreating(true);
    try {
      const res = await createWebhook(workspaceId, newUrl, newEvents.join(' '));
      if (!res.ok) {
        toast.error(t('webhooks.createFailed'));
        return;
      }
      const data = (await res.json()) as { secret: string; id: string };
      setCreatedSecret(data.secret);
      setNewUrl('');
      setNewEvents([]);
      await load();
    } catch {
      toast.error(t('webhooks.createFailed'));
    } finally {
      setCreating(false);
    }
  }, [workspaceId, newUrl, newEvents, t, load]);

  const handleDelete = useCallback(async (endpointId: string) => {
    if (!workspaceId) return;
    setBusyId(endpointId);
    try {
      const res = await deleteWebhook(workspaceId, endpointId);
      if (!res.ok) {
        toast.error(t('webhooks.deleteFailed'));
        return;
      }
      toast.success(t('webhooks.deleted'));
      await load();
    } catch {
      toast.error(t('webhooks.deleteFailed'));
    } finally {
      setBusyId(null);
    }
  }, [workspaceId, t, load]);

  const handleToggle = useCallback(async (endpointId: string, enabled: boolean) => {
    if (!workspaceId) return;
    setBusyId(endpointId);
    try {
      const res = await toggleWebhook(workspaceId, endpointId, enabled);
      if (!res.ok) {
        toast.error(t('webhooks.toggleFailed'));
        return;
      }
      await load();
    } catch {
      toast.error(t('webhooks.toggleFailed'));
    } finally {
      setBusyId(null);
    }
  }, [workspaceId, t, load]);

  const handleTest = useCallback(async (endpointId: string) => {
    if (!workspaceId) return;
    setBusyId(endpointId);
    try {
      const res = await testWebhook(workspaceId, endpointId);
      if (!res.ok) {
        toast.error(t('webhooks.testFailed'));
        return;
      }
      const data = (await res.json()) as { success: boolean; message: string };
      if (data.success) {
        toast.success(t('webhooks.testSuccess'));
      } else {
        toast.error(data.message || t('webhooks.testFailed'));
      }
    } catch {
      toast.error(t('webhooks.testFailed'));
    } finally {
      setBusyId(null);
    }
  }, [workspaceId, t]);

  const copySecret = useCallback(() => {
    if (createdSecret) {
      void navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [createdSecret]);

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
          <h3 className="text-sm font-semibold">{t('webhooks.title')}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="me-1.5 h-4 w-4" />
          {t('webhooks.create')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
          <Webhook className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={ICON_STROKE} />
          <p className="text-sm text-muted-foreground">{t('webhooks.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{wh.url}</p>
                    <Badge variant={wh.enabled ? 'success' : 'muted'} className="shrink-0">
                      {wh.enabled ? t('webhooks.active') : t('webhooks.disabled')}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {wh.events.split(' ').map((event) => (
                      <code key={event} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {event}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleTest(wh.id)}
                    disabled={busyId === wh.id || !wh.enabled}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-primary disabled:opacity-50"
                    aria-label={t('webhooks.test')}
                    title={t('webhooks.test')}
                  >
                    {busyId === wh.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggle(wh.id, !wh.enabled)}
                    disabled={busyId === wh.id}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                  >
                    {wh.enabled ? t('webhooks.disable') : t('webhooks.enable')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(wh.id)}
                    disabled={busyId === wh.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                    aria-label={t('webhooks.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(v) => {
        setShowCreate(v);
        if (!v) {
          setNewUrl('');
          setNewEvents([]);
          setCreatedSecret(null);
        }
      }}>
        <DialogContent>
          {createdSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('webhooks.createdTitle')}</DialogTitle>
                <DialogDescription>{t('webhooks.createdDesc')}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                <code className="flex-1 truncate font-mono text-xs text-foreground">{createdSecret}</code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreate(false);
                  setCreatedSecret(null);
                }}>
                  {t('webhooks.done')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('webhooks.createTitle')}</DialogTitle>
                <DialogDescription>{t('webhooks.createDesc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('webhooks.urlLabel')}</label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('webhooks.eventsLabel')}</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <button
                        key={event}
                        type="button"
                        onClick={() => toggleEvent(event)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          newEvents.includes(event)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  {t('webhooks.cancel')}
                </Button>
                <Button onClick={() => void handleCreate()} disabled={creating || !newUrl.trim() || newEvents.length === 0}>
                  {creating ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                  {t('webhooks.create')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('webhooks.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('webhooks.confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('webhooks.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDeleteId) void handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}>
              {t('webhooks.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
