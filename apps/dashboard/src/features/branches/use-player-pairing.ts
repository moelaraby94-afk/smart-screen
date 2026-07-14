'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/features/auth/session';
import { readApiError } from '@/features/api/api-error';
import { useApiErrorMessage } from '@/features/api/use-api-error-message';

const SUCCESS_CLOSE_DELAY_MS = 2000;

export type ClaimedScreenData = {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  location?: string | null;
  resolutionWidth?: number;
  resolutionHeight?: number;
  playerPlatform?: string | null;
  orientation?: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
  activePlaylistId?: string | null;
  activePlaylist?: { id: string; name: string } | null;
  overridePlaylistId?: string | null;
  overrideExpiresAt?: string | null;
  playerTicker?: string | null;
  lastSeenAt?: string | null;
  isOfflineCacheMode?: boolean;
};

export function usePlayerPairing(
  workspaceId: string,
  options: {
    canClaim: boolean;
    pairingActivityEpoch: number;
    onClaimed: () => Promise<void>;
    autoClose?: boolean;
  },
) {
  const errorMessage = useApiErrorMessage();
  const { canClaim, pairingActivityEpoch, onClaimed, autoClose = true } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [code, setCodeRaw] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [claimedScreen, setClaimedScreen] = useState<ClaimedScreenData | null>(null);

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
    setClaimedScreen(null);
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
        setError(errorMessage(await readApiError(res)));
        return;
      }
      const raw = (await res.json()) as { screen?: ClaimedScreenData; screenId?: string } & Partial<ClaimedScreenData>;
      const data: ClaimedScreenData = raw.screen ?? (raw as ClaimedScreenData);
      setClaimedScreen(data);
      void import('canvas-confetti').then((mod) => {
        mod.default({ particleCount: 140, spread: 72, origin: { y: 0.58 } });
      });
      setSuccess(true);
      await onClaimed();
      if (autoClose) {
        clearSuccessTimer();
        successTimerRef.current = setTimeout(() => {
          successTimerRef.current = null;
          close();
        }, SUCCESS_CLOSE_DELAY_MS);
      }
    } finally {
      setBusy(false);
    }
  }, [workspaceId, canClaim, code, name, onClaimed, autoClose, clearSuccessTimer, close, errorMessage]);

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
    claimedScreen,
    claim,
    showProgressBanner: isOpen && pairingActivityEpoch > baseEpochRef.current,
  };
}
