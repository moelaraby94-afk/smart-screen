'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';

/**
 * Shared hook for URL-based branch filtering.
 * Reads `?branch=` from the URL and provides a setter that updates the URL
 * without navigation. Used by all account-level list pages.
 */
export function useBranchFilter(): {
  branchId: string | null;
  setBranchId: (id: string | null) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const branchId = searchParams.get('branch');

  const setBranchId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set('branch', id);
      else params.delete('branch');
      const q = params.toString();
      router.push((q ? `${pathname}?${q}` : pathname) as Route);
    },
    [pathname, router, searchParams],
  );

  return { branchId, setBranchId };
}
