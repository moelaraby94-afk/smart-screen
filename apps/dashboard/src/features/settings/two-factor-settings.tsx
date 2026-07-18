'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ShieldCheck, ShieldOff, Loader2, QrCode, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/features/auth/session';

type SetupResponse = {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
};

type EnableResponse = {
  backupCodes: string[];
};

export function TwoFactorSettings() {
  const t = useTranslations('twoFactor');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableToken, setDisableToken] = useState('');

  const loadStatus = useCallback(async () => {
    const res = await apiFetch('/auth/2fa/status');
    if (res.ok) {
      const data = (await res.json()) as { enabled: boolean };
      setEnabled(data.enabled);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await apiFetch('/auth/2fa/setup', { method: 'POST' });
      if (!res.ok) {
        toast.error(t('setupFailed'));
        return;
      }
      const data = (await res.json()) as SetupResponse;
      setSetupData(data);
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!setupData || !token.trim()) return;
    setBusy(true);
    try {
      const res = await apiFetch('/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), secret: setupData.secret }),
      });
      if (!res.ok) {
        toast.error(t('enableFailed'));
        return;
      }
      const data = (await res.json()) as EnableResponse;
      setEnabled(true);
      setSetupData(null);
      setToken('');
      setBackupCodes(data.backupCodes);
      toast.success(t('enabled'));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const res = await apiFetch('/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableToken.trim() }),
      });
      if (!res.ok) {
        toast.error(t('disableFailed'));
        return;
      }
      setEnabled(false);
      setBackupCodes(null);
      setDisabling(false);
      setDisableToken('');
      toast.success(t('disabled'));
    } finally {
      setBusy(false);
    }
  };

  const copyCodes = () => {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-3">
        {enabled ? (
          <ShieldCheck className="h-6 w-6 text-success" />
        ) : (
          <ShieldOff className="h-6 w-6 text-muted-foreground" />
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <div className="mt-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            enabled
              ? 'bg-success/15 text-success'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {enabled ? t('statusEnabled') : t('statusDisabled')}
        </span>
      </div>

      {/* Setup flow */}
      {!enabled && !setupData && (
        <Button
          type="button"
          variant="cta"
          className="mt-6 rounded-xl font-semibold"
          disabled={busy}
          onClick={() => void startSetup()}
        >
          {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <QrCode className="me-2 h-4 w-4" />}
          {t('enable')}
        </Button>
      )}

      {setupData && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <img
              src={setupData.qrCodeDataUrl}
              alt={t('manualEntry')}
              className="h-48 w-48 rounded-xl border border-border"
            />
            <div className="space-y-2">
              <Label>{t('manualEntry')}</Label>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {setupData.secret}
              </p>
              <p className="text-sm text-muted-foreground">{t('scanHint')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('enterCode')}</Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
              aria-label={t('enterCode')}
              className="max-w-[200px] rounded-xl font-mono text-center text-lg tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="cta"
              className="rounded-xl font-semibold"
              disabled={busy || token.trim().length !== 6}
              onClick={() => void confirmEnable()}
            >
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="me-2 h-4 w-4" />}
              {t('confirm')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setSetupData(null);
                setToken('');
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Backup codes display */}
      {backupCodes && (
        <div className="mt-6 space-y-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-warning">{t('backupCodes')}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={copyCodes}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1 font-mono text-sm sm:grid-cols-4">
            {backupCodes.map((code) => (
              <span key={code} className="rounded bg-warning/10 px-2 py-1 text-center">
                {code}
              </span>
            ))}
          </div>
          <p className="text-xs text-warning">{t('backupCodesHint')}</p>
        </div>
      )}

      {/* Disable flow */}
      {enabled && !backupCodes && !disabling && (
        <Button
          type="button"
          variant="outline"
          className="mt-6 rounded-xl font-semibold text-destructive"
          disabled={busy}
          onClick={() => setDisabling(true)}
        >
          <ShieldOff className="me-2 h-4 w-4" />
          {t('disable')}
        </Button>
      )}

      {enabled && disabling && (
        <div className="mt-6 space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t('disablePrompt')}</p>
          <div className="space-y-2">
            <Label>{t('enterCode')}</Label>
            <Input
              value={disableToken}
              onChange={(e) => setDisableToken(e.target.value)}
              placeholder="000000"
              maxLength={8}
              autoComplete="one-time-code"
              className="max-w-[200px] rounded-xl font-mono text-center text-lg tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold text-destructive"
              disabled={busy || disableToken.trim().length < 6}
              onClick={() => void disable()}
            >
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <ShieldOff className="me-2 h-4 w-4" />}
              {t('disable')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                setDisabling(false);
                setDisableToken('');
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
