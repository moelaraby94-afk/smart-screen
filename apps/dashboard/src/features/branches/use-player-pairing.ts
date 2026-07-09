'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch, parseScreenLimitFromApiMessage, readApiErrorMessage } from '@/features/auth/session';

const SUCCESS_CLOSE_DELAY_MS = 2000;

export function usePlayerPairing(
  workspaceId: string,
  options: {
    canClaim: boolean;
    pairingActivityEpoch: number;
    onClaimed: () => Promise<void>;
  },
) {
  const t = useTranslations('branchDetail');
  const { canClaim, pairingActivityEpoch, onClaimed } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [code, setCodeRaw] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const baseEpochRef = useRef(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const setCode = useCallback((raw: string) => setCodeRaw(raw.replace(/\D/g, '').slice(0, 6)), []);

  const resetFields = useCallback(() => {
    setCodeRaw('');
    setName('');
    setError(null);
    setSuccess(false);
  }, []);

  const open = useCallback(() => {
    clearSuccessTimer();
    resetFields();
    setIsOpen(true);
  }, [clearSuccessTimer, resetFields]);

  const close = useCallback(() => {
    clearSuccessTimer();
    resetFields();
    setIsOpen(false);
  }, [clearSuccessTimer, resetFields]);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    baseEpochRef.current = pairingActivityEpoch;
    void apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/pairing-started`, {
      method: 'POST',
      body: '{}',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot epoch only when modal opens; avoid re-POST on each pairing signal
  }, [isOpen, workspaceId]);

  useEffect(() => clearSuccessTimer, [clearSuccessTimer]);

  const claim = useCallback(async () => {
    if (!workspaceId || !canClaim) return;
    const cleanCode = code.replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      const body: { code: string; name?: string } = { code: cleanCode };
      const trimmedName = name.trim();
      if (trimmedName) body.name = trimmedName;
      const res = await apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/pairing-sessions/claim`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await readApiErrorMessage(res);
        if (msg.includes('LIMIT_REACHED') || parseScreenLimitFromApiMessage(msg) !== null) {
          setError(t('pairingErrorLimit'));
        } else if (msg.includes('INVALID_OR_EXPIRED_PAIRING_CODE')) {
          setError(t('pairingErrorInvalid'));
        } else {
          setError(msg);
        }
        return;
      }
      void import('canvas-confetti').then((mod) => {
        mod.default({ particleCount: 140, spread: 72, origin: { y: 0.58 } });
      });
      setSuccess(true);
      await onClaimed();
      clearSuccessTimer();
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        close();
      }, SUCCESS_CLOSE_DELAY_MS);
    } finally {
      setBusy(false);
    }
  }, [workspaceId, canClaim, code, name, t, onClaimed, clearSuccessTimer, close]);

  return {
    isOpen,
    open,
    close,
    code,
    setCode,
    name,
    setName,
    busy,
    error,
    success,
    claim,
    showProgressBanner: isOpen && pairingActivityEpoch > baseEpochRef.current,
  };
}
