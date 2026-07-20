'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/features/auth/session';

export type ActivityItem = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
};

export function useBranchActivity(workspaceId: string | null) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/activity`);
      if (res.ok) {
        setItems(await res.json());
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, isLoading, reload };
}
