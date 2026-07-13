import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';

// Mock apiFetch
vi.mock('@/features/auth/session', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/features/auth/session';
import { useApiScreens, type ScreenRow } from './useApiScreens';

const mockApiFetch = vi.mocked(apiFetch);

function makeScreen(id: string, overrides: Partial<ScreenRow> = {}): ScreenRow {
  return {
    id,
    name: `Screen ${id}`,
    serialNumber: `SN-${id}`,
    status: 'ONLINE',
    activePlaylistId: null,
    activePlaylist: null,
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function mockResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

/** Render hook with an isolated SWR cache so tests don't bleed into each other. */
function renderHookWithIsolatedCache<T>(fn: () => T) {
  return renderHook(fn, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
    ),
  });
}

describe('useApiScreens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches screens on mount and returns data', async () => {
    const screens = [makeScreen('1'), makeScreen('2')];
    mockApiFetch.mockResolvedValue(mockResponse({ items: screens }));

    const { result } = renderHookWithIsolatedCache(() => useApiScreens('ws-1'));

    await waitFor(() => {
      expect(result.current.screens).toHaveLength(2);
    });
    expect(result.current.screens[0].id).toBe('1');
  });

  it('returns empty array when workspaceId is null', () => {
    const { result } = renderHookWithIsolatedCache(() => useApiScreens(null));

    expect(result.current.screens).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('handles array response (not wrapped in items)', async () => {
    const screens = [makeScreen('1')];
    mockApiFetch.mockResolvedValue(mockResponse(screens));

    const { result } = renderHookWithIsolatedCache(() => useApiScreens('ws-1'));

    await waitFor(() => {
      expect(result.current.screens).toHaveLength(1);
    });
  });

  it('returns empty array on non-ok response', async () => {
    mockApiFetch.mockResolvedValue(mockResponse({}, false));

    const { result } = renderHookWithIsolatedCache(() => useApiScreens('ws-1'));

    await waitFor(() => {
      expect(result.current.screens).toEqual([]);
    });
  });

  it('setScreens updates the cache synchronously', async () => {
    const initial = [makeScreen('1')];
    mockApiFetch.mockResolvedValue(mockResponse({ items: initial }));

    const { result } = renderHookWithIsolatedCache(() => useApiScreens('ws-1'));

    await waitFor(() => {
      expect(result.current.screens).toHaveLength(1);
    });

    act(() => {
      result.current.setScreens((prev) => [...prev, makeScreen('2')]);
    });

    expect(result.current.screens).toHaveLength(2);
    expect(result.current.screens[1].id).toBe('2');
  });

  it('setScreens accepts a direct value', async () => {
    mockApiFetch.mockResolvedValue(mockResponse({ items: [makeScreen('1')] }));

    const { result } = renderHookWithIsolatedCache(() => useApiScreens('ws-1'));

    await waitFor(() => {
      expect(result.current.screens).toHaveLength(1);
    });

    const replacement = [makeScreen('3'), makeScreen('4')];
    act(() => {
      result.current.setScreens(replacement);
    });

    expect(result.current.screens).toHaveLength(2);
    expect(result.current.screens[0].id).toBe('3');
  });

  it('reload triggers revalidation', async () => {
    mockApiFetch.mockResolvedValue(mockResponse({ items: [makeScreen('1')] }));

    const { result } = renderHookWithIsolatedCache(() => useApiScreens('ws-1'));

    await waitFor(() => {
      expect(result.current.screens).toHaveLength(1);
    });

    mockApiFetch.mockResolvedValue(mockResponse({ items: [makeScreen('1'), makeScreen('2')] }));

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.screens).toHaveLength(2);
    });
  });

  it('passes playlistGroupId in the query params', async () => {
    mockApiFetch.mockResolvedValue(mockResponse({ items: [] }));

    renderHookWithIsolatedCache(() => useApiScreens('ws-1', { playlistGroupId: 'pg-1' }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('playlistGroupId=pg-1');
  });
});
