'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
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
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
} from '@/features/api-docs/api-management-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ICON_STROKE } from '@/lib/icon-stroke';

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysManager() {
  const t = useTranslations('apiDocs');
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetchApiKeys(workspaceId);
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch {
      toast.error(t('keys.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const handleCreate = useCallback(async () => {
    if (!workspaceId || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await createApiKey(workspaceId, newName, newScopes);
      if (!res.ok) {
        toast.error(t('keys.createFailed'));
        return;
      }
      const data = (await res.json()) as { rawKey: string; id: string };
      setCreatedKey(data.rawKey);
      setNewName('');
      setNewScopes('');
      await load();
    } catch {
      toast.error(t('keys.createFailed'));
    } finally {
      setCreating(false);
    }
  }, [workspaceId, newName, newScopes, t, load]);

  const handleRevoke = useCallback(async (keyId: string) => {
    if (!workspaceId) return;
    setRevokingId(keyId);
    try {
      const res = await revokeApiKey(workspaceId, keyId);
      if (!res.ok) {
        toast.error(t('keys.revokeFailed'));
        return;
      }
      toast.success(t('keys.revoked'));
      await load();
    } catch {
      toast.error(t('keys.revokeFailed'));
    } finally {
      setRevokingId(null);
    }
  }, [workspaceId, t, load]);

  const copyKey = useCallback(() => {
    if (createdKey) {
      void navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [createdKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
          <h3 className="text-sm font-semibold">{t('keys.title')}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="me-1.5 h-4 w-4" />
          {t('keys.create')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
          <Key className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={ICON_STROKE} />
          <p className="text-sm text-muted-foreground">{t('keys.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{key.name}</p>
                  {key.scopes && (
                    <Badge variant="muted" className="shrink-0">
                      {key.scopes.split(' ').length} {t('keys.scopes')}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="font-mono text-xs text-muted-foreground">{key.keyPrefix}…</code>
                  {key.lastUsedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {t('keys.lastUsed')}: {new Date(key.lastUsedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('keys.neverUsed')}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRevokeId(key.id)}
                disabled={revokingId === key.id}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                aria-label={t('keys.revokeAria', { name: key.name })}
              >
                {revokingId === key.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(v) => {
        setShowCreate(v);
        if (!v) {
          setNewName('');
          setNewScopes('');
          setCreatedKey(null);
        }
      }}>
        <DialogContent>
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('keys.createdTitle')}</DialogTitle>
                <DialogDescription>{t('keys.createdDesc')}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <code className="flex-1 truncate font-mono text-xs text-foreground">{createdKey}</code>
                <button
                  type="button"
                  onClick={copyKey}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-warning">{t('keys.warning')}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreate(false);
                  setCreatedKey(null);
                }}>
                  {t('keys.done')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('keys.createTitle')}</DialogTitle>
                <DialogDescription>{t('keys.createDesc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('keys.nameLabel')}</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('keys.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t('keys.scopesLabel')}</label>
                  <Input
                    value={newScopes}
                    onChange={(e) => setNewScopes(e.target.value)}
                    placeholder={t('keys.scopesPlaceholder')}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t('keys.scopesHint')}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  {t('keys.cancel')}
                </Button>
                <Button onClick={() => void handleCreate()} disabled={creating || !newName.trim()}>
                  {creating ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                  {t('keys.create')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmRevokeId} onOpenChange={(v) => { if (!v) setConfirmRevokeId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('keys.confirmRevokeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('keys.confirmRevokeDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('keys.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmRevokeId) void handleRevoke(confirmRevokeId); setConfirmRevokeId(null); }}>
              {t('keys.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
