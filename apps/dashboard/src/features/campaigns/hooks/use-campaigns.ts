'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import {
  fetchCampaigns as apiFetchCampaigns,
  fetchCampaign as apiFetchCampaign,
  createCampaign as apiCreateCampaign,
  updateCampaign as apiUpdateCampaign,
  deleteCampaign as apiDeleteCampaign,
  submitCampaign as apiSubmitCampaign,
  approveCampaign as apiApproveCampaign,
  rejectCampaign as apiRejectCampaign,
  publishCampaign as apiPublishCampaign,
  pauseCampaign as apiPauseCampaign,
  resumeCampaign as apiResumeCampaign,
  endCampaign as apiEndCampaign,
} from '../campaigns-api';
import { readPageItems } from '@/features/api/page';
import type { Campaign, CampaignFormData } from '../types';

type UseCampaignsReturn = {
  campaigns: Campaign[];
  loading: boolean;
  error: boolean;
  loadCampaigns: () => Promise<void>;
  createCampaign: (data: CampaignFormData) => Promise<Campaign | null>;
  updateCampaign: (id: string, data: CampaignFormData) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
  submitCampaign: (id: string) => Promise<Campaign | null>;
  approveCampaign: (id: string, comment?: string) => Promise<Campaign | null>;
  rejectCampaign: (id: string, comment?: string) => Promise<Campaign | null>;
  publishCampaign: (id: string) => Promise<Campaign | null>;
  pauseCampaign: (id: string) => Promise<Campaign | null>;
  resumeCampaign: (id: string) => Promise<Campaign | null>;
  endCampaign: (id: string) => Promise<Campaign | null>;
  fetchCampaignDetail: (id: string) => Promise<Campaign | null>;
  mutatingId: string | null;
};

export function useCampaigns(workspaceId: string | null): UseCampaignsReturn {
  const t = useTranslations('campaigns');
  const { toastResponseError } = useApiErrorToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetchCampaigns(workspaceId);
      if (!res.ok) {
        setError(true);
        return;
      }
      const items = await readPageItems<Campaign>(res);
      setCampaigns(items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchCampaignDetail = useCallback(
    async (id: string): Promise<Campaign | null> => {
      if (!workspaceId) return null;
      const res = await apiFetchCampaign(workspaceId, id);
      if (!res.ok) {
        await toastResponseError(res);
        return null;
      }
      return (await res.json()) as Campaign;
    },
    [workspaceId, toastResponseError],
  );

  const createCampaign = useCallback(
    async (data: CampaignFormData): Promise<Campaign | null> => {
      if (!workspaceId) return null;
      const res = await apiCreateCampaign({
        workspaceId,
        name: data.name,
        description: data.description,
        playlistId: data.playlistId,
        screenId: data.screenId,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      if (!res.ok) {
        await toastResponseError(res);
        return null;
      }
      const created = (await res.json()) as Campaign;
      toast.success(t('created'));
      await loadCampaigns();
      return created;
    },
    [workspaceId, loadCampaigns, toastResponseError, t],
  );

  const updateCampaign = useCallback(
    async (id: string, data: CampaignFormData): Promise<Campaign | null> => {
      if (!workspaceId) return null;
      setMutatingId(id);
      try {
        const res = await apiUpdateCampaign(workspaceId, id, {
          name: data.name,
          description: data.description,
          playlistId: data.playlistId ?? null,
          screenId: data.screenId ?? null,
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
        });
        if (!res.ok) {
          await toastResponseError(res);
          return null;
        }
        const updated = (await res.json()) as Campaign;
        toast.success(t('updated'));
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? updated : c)),
        );
        return updated;
      } finally {
        setMutatingId(null);
      }
    },
    [workspaceId, toastResponseError, t],
  );

  const deleteCampaign = useCallback(
    async (id: string): Promise<boolean> => {
      if (!workspaceId) return false;
      setMutatingId(id);
      try {
        const res = await apiDeleteCampaign(workspaceId, id);
        if (!res.ok) {
          await toastResponseError(res);
          return false;
        }
        toast.success(t('deleted'));
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        return true;
      } finally {
        setMutatingId(null);
      }
    },
    [workspaceId, toastResponseError, t],
  );

  const transition = useCallback(
    async (
      id: string,
      fn: (ws: string, cid: string) => Promise<Response>,
      successKey: string,
    ): Promise<Campaign | null> => {
      if (!workspaceId) return null;
      setMutatingId(id);
      try {
        const res = await fn(workspaceId, id);
        if (!res.ok) {
          await toastResponseError(res);
          return null;
        }
        const updated = (await res.json()) as Campaign;
        toast.success(t(successKey));
        setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      } finally {
        setMutatingId(null);
      }
    },
    [workspaceId, toastResponseError, t],
  );

  const submitCampaign = useCallback(
    (id: string) => transition(id, (ws, cid) => apiSubmitCampaign(ws, cid), 'submitted'),
    [transition],
  );

  const approveCampaign = useCallback(
    (id: string, comment?: string) =>
      transition(id, (ws, cid) => apiApproveCampaign(ws, cid, comment), 'approved'),
    [transition],
  );

  const rejectCampaign = useCallback(
    (id: string, comment?: string) =>
      transition(id, (ws, cid) => apiRejectCampaign(ws, cid, comment), 'rejected'),
    [transition],
  );

  const publishCampaign = useCallback(
    (id: string) => transition(id, (ws, cid) => apiPublishCampaign(ws, cid), 'published'),
    [transition],
  );

  const pauseCampaign = useCallback(
    (id: string) => transition(id, (ws, cid) => apiPauseCampaign(ws, cid), 'paused'),
    [transition],
  );

  const resumeCampaign = useCallback(
    (id: string) => transition(id, (ws, cid) => apiResumeCampaign(ws, cid), 'resumed'),
    [transition],
  );

  const endCampaign = useCallback(
    (id: string) => transition(id, (ws, cid) => apiEndCampaign(ws, cid), 'ended'),
    [transition],
  );

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    submitCampaign,
    approveCampaign,
    rejectCampaign,
    publishCampaign,
    pauseCampaign,
    resumeCampaign,
    endCampaign,
    fetchCampaignDetail,
    mutatingId,
  };
}
