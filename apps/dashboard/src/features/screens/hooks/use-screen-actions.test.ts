import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the screens-api module
vi.mock('@/features/screens/api/screens-api', () => ({
  deleteScreen: vi.fn(),
  sendRemoteCommand: vi.fn(),
  updateScreen: vi.fn(),
  createScreen: vi.fn(),
  fetchScreens: vi.fn(),
  fetchPlaylistOptions: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import { useScreenActions } from '@/features/screens/hooks/use-screen-actions';
import {
  deleteScreen as apiDeleteScreen,
  sendRemoteCommand as apiSendRemoteCommand,
  updateScreen as apiUpdateScreen,
} from '@/features/screens/api/screens-api';
import { toast } from 'sonner';

const mockApiDeleteScreen = vi.mocked(apiDeleteScreen);
const mockApiSendRemoteCommand = vi.mocked(apiSendRemoteCommand);
const mockApiUpdateScreen = vi.mocked(apiUpdateScreen);

function makeResponse(ok: boolean): Response {
  return { ok } as Response;
}

describe('useScreenActions', () => {
  const workspaceId = 'ws-1';
  const setScreens = vi.fn();
  const reload = vi.fn().mockResolvedValue(undefined);
  const bumpWorkspaceDataEpoch = vi.fn();

  function render() {
    return renderHook(() =>
      useScreenActions({
        workspaceId,
        setScreens,
        reload,
        bumpWorkspaceDataEpoch,
      }),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Test 1: onDelete success ───────────────────────────────────────
  it('calls deleteScreen API and reloads on success', async () => {
    mockApiDeleteScreen.mockResolvedValue(makeResponse(true));
    const { result } = render();

    await act(async () => {
      await result.current.onDelete('screen-1');
    });

    expect(mockApiDeleteScreen).toHaveBeenCalledWith('ws-1', 'screen-1');
    expect(reload).toHaveBeenCalled();
    expect(bumpWorkspaceDataEpoch).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  // ─── Test 2: onDelete failure → error toast, no reload ──────────────
  it('shows error toast and does not reload on delete failure', async () => {
    mockApiDeleteScreen.mockResolvedValue(makeResponse(false));
    const { result } = render();

    await act(async () => {
      await result.current.onDelete('screen-1');
    });

    expect(toast.error).toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  // ─── Test 3: sendRemoteCommand success ──────────────────────────────
  it('calls sendRemoteCommand API on success', async () => {
    mockApiSendRemoteCommand.mockResolvedValue(makeResponse(true));
    const { result } = render();

    await act(async () => {
      await result.current.sendRemoteCommand('screen-1', 'refresh_content');
    });

    expect(mockApiSendRemoteCommand).toHaveBeenCalledWith('ws-1', 'screen-1', 'refresh_content');
    expect(toast.success).toHaveBeenCalled();
    expect(bumpWorkspaceDataEpoch).toHaveBeenCalled();
  });

  // ─── Test 4: sendRemoteCommand failure → error toast ────────────────
  it('shows error toast on remote command failure', async () => {
    mockApiSendRemoteCommand.mockResolvedValue(makeResponse(false));
    const { result } = render();

    await act(async () => {
      await result.current.sendRemoteCommand('screen-1', 'restart');
    });

    expect(toast.error).toHaveBeenCalled();
    expect(bumpWorkspaceDataEpoch).not.toHaveBeenCalled();
  });

  // ─── Test 5: updateScreenInline success → returns true ──────────────
  it('returns true and reloads on update success', async () => {
    mockApiUpdateScreen.mockResolvedValue(makeResponse(true));
    const { result } = render();

    let success = false;
    await act(async () => {
      success = await result.current.updateScreenInline('screen-1', { name: 'New Name' });
    });

    expect(success).toBe(true);
    expect(mockApiUpdateScreen).toHaveBeenCalledWith('ws-1', 'screen-1', { name: 'New Name' });
    expect(reload).toHaveBeenCalled();
    expect(bumpWorkspaceDataEpoch).toHaveBeenCalled();
  });

  // ─── Test 6: updateScreenInline failure → returns false ─────────────
  it('returns false on update failure', async () => {
    mockApiUpdateScreen.mockResolvedValue(makeResponse(false));
    const { result } = render();

    let success = true;
    await act(async () => {
      success = await result.current.updateScreenInline('screen-1', { name: 'Bad' });
    });

    expect(success).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  // ─── Test 7: assignPlaybackPlaylist success ─────────────────────────
  it('updates screens state on assign success', async () => {
    mockApiUpdateScreen.mockResolvedValue(makeResponse(true));
    const { result } = render();

    await act(async () => {
      await result.current.assignPlaybackPlaylist('screen-1', 'pl-1', 'My Playlist');
    });

    expect(mockApiUpdateScreen).toHaveBeenCalledWith('ws-1', 'screen-1', { activePlaylistId: 'pl-1' });
    expect(setScreens).toHaveBeenCalled();
    expect(bumpWorkspaceDataEpoch).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  // ─── Test 8: assignPlaybackPlaylist with null → clears playlist ─────
  it('clears playlist when null is passed', async () => {
    mockApiUpdateScreen.mockResolvedValue(makeResponse(true));
    const { result } = render();

    await act(async () => {
      await result.current.assignPlaybackPlaylist('screen-1', null);
    });

    expect(mockApiUpdateScreen).toHaveBeenCalledWith('ws-1', 'screen-1', { activePlaylistId: null });
    expect(setScreens).toHaveBeenCalled();
  });

  // ─── Test 9: assignPlaybackPlaylist failure → error toast ───────────
  it('shows error toast on assign failure', async () => {
    mockApiUpdateScreen.mockResolvedValue(makeResponse(false));
    const { result } = render();

    await act(async () => {
      await result.current.assignPlaybackPlaylist('screen-1', 'pl-1', 'Test');
    });

    expect(toast.error).toHaveBeenCalled();
    expect(setScreens).not.toHaveBeenCalled();
  });
});
