'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranchFilter } from '@/lib/use-branch-filter';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { Monitor, Search, Trash2, CheckSquare, Radio, Download, LayoutGrid, Table as TableIcon, RefreshCw, MoreHorizontal, BadgeAlert, PenLine, Zap, AlertTriangle, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenActions } from '@/features/screens/hooks/use-screen-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';
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
import { UsageIndicator } from '@/components/usage-indicator';
import {
  fetchPlaylistOptions,
  updateScreen as apiUpdateScreen,
  deleteScreen as apiDeleteScreen,
  sendRemoteCommand as apiSendRemoteCommand,
  type PlaylistOption as ApiPlaylistOption,
} from '@/features/screens/api/screens-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { BranchFilterDropdown } from '@/components/branch-filter-dropdown';
import { usePlayerPairing } from '@/features/branches/use-player-pairing';
import { ScreenSetupModal } from '@/features/screens/screen-setup-modal';
import { useApiScreens, type ScreenRow } from './useApiScreens';
import { useScreenRealtime } from './useScreenRealtime';
import { ScreenVisualCard } from '@/features/screens/screen-visual-card';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import { ScreenAnalyticsPanel } from '@/features/screens/screen-analytics-panel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

type Props = {
  locale: string;
};

type PlaylistOption = ApiPlaylistOption;

export function ScreensClient({ locale }: Props) {
  const t = useTranslations('screensClient');
  const activeLocale = useLocale();
  const router = useRouter();
  const { branchId: urlBranchFilter, setBranchId: setUrlBranchFilter } = useBranchFilter();
  const { workspaces, workspaceDataEpoch, bumpWorkspaceDataEpoch, pairingActivityEpoch } =
    useWorkspace();
  const { screens, setScreens, isLoading, isError, reload } = useApiScreens(urlBranchFilter);
  useScreenRealtime(urlBranchFilter, setScreens);

  const canAssignPlayback = useMemo(() => {
    if (!urlBranchFilter) return false;
    const r = workspaces.find((w) => w.id === urlBranchFilter)?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'EDITOR';
  }, [workspaces, urlBranchFilter]);

  const canClaimPairing = useMemo(() => {
    if (!urlBranchFilter) return false;
    const r = workspaces.find((w) => w.id === urlBranchFilter)?.role;
    return r === 'OWNER' || r === 'EDITOR';
  }, [workspaces, urlBranchFilter]);

  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [assignPlaylistScreenId, setAssignPlaylistScreenId] = useState<string | null>(null);

  useEffect(() => {
    if (!urlBranchFilter) {
      setPlaylists([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const items = await fetchPlaylistOptions(urlBranchFilter);
      if (!cancelled) setPlaylists(items);
    })();
    return () => {
      cancelled = true;
    };
  }, [urlBranchFilter, workspaceDataEpoch]);

  const reloadScreensAndBump = useCallback(async () => {
    await reload();
    bumpWorkspaceDataEpoch();
  }, [reload, bumpWorkspaceDataEpoch]);

  const pairing = usePlayerPairing(urlBranchFilter ?? '', {
    canClaim: canClaimPairing,
    pairingActivityEpoch,
    onClaimed: reloadScreensAndBump,
    autoClose: false,
  });

  const { onDelete, sendRemoteCommand } = useScreenActions({
    workspaceId: urlBranchFilter,
    setScreens,
    reload,
    bumpWorkspaceDataEpoch,
  });

  const assignPlaybackPlaylist = useCallback(
    async (screenId: string, playlistId: string | null) => {
      if (!urlBranchFilter) return;
      setAssignPlaylistScreenId(screenId);
      try {
        const playlistName =
          playlistId === null
            ? null
            : (playlists.find((p) => p.id === playlistId)?.name ?? null);
        const res = await apiUpdateScreen(urlBranchFilter, screenId, { activePlaylistId: playlistId });
        if (!res.ok) {
          toast.error(t('playlistAssignFailed'));
          return;
        }
        setScreens((prev) =>
          prev.map((s) =>
            s.id === screenId
              ? {
                  ...s,
                  activePlaylistId: playlistId,
                  activePlaylist:
                    playlistId && playlistName ? { id: playlistId, name: playlistName } : null,
                }
              : s,
          ),
        );
        toast.success(t('playlistAssignedToast'));
        bumpWorkspaceDataEpoch();
      } finally {
        setAssignPlaylistScreenId(null);
      }
    },
    [urlBranchFilter, playlists, setScreens, bumpWorkspaceDataEpoch, t],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalScreen, setModalScreen] = useState<ScreenRow | null>(null);
  const [isPairingMode, setIsPairingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [contentFilter, setContentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedAnchor = useRef<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkPlaylistId, setBulkPlaylistId] = useState<string>('');
  const [bulkSyncBusy, setBulkSyncBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; screenId?: string; screenName?: string } | null>(null);

  const groupOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of screens) {
      if (s.playlistGroupId && s.playlistGroup && !seen.has(s.playlistGroupId)) {
        seen.set(s.playlistGroupId, s.playlistGroup.name);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [screens]);

  const filteredScreens = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const filtered = screens.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (groupFilter !== 'all' && s.playlistGroupId !== groupFilter) return false;
      if (contentFilter === 'has_content' && !s.activePlaylistId) return false;
      if (contentFilter === 'no_content' && s.activePlaylistId) return false;
      if (q) {
        return (
          s.name.toLowerCase().includes(q) ||
          (s.location?.toLowerCase().includes(q) ?? false) ||
          s.serialNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder: Record<string, number> = { OFFLINE: 0, MAINTENANCE: 1, ONLINE: 2 };
          return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3) || a.name.localeCompare(b.name);
        case 'serial':
          return a.serialNumber.localeCompare(b.serialNumber);
        case 'lastSeen':
          return (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? '');
        default:
          return 0;
      }
    });
    return sorted;
  }, [screens, deferredSearch, statusFilter, groupFilter, contentFilter, sortBy]);

  const toggleSelect = useCallback((id: string, shiftKey = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastSelectedAnchor.current) {
        const anchorId = lastSelectedAnchor.current;
        const ids = filteredScreens.map((s) => s.id);
        const anchorIdx = ids.indexOf(anchorId);
        const currentIdx = ids.indexOf(id);
        if (anchorIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(anchorIdx, currentIdx);
          const end = Math.max(anchorIdx, currentIdx);
          for (let i = start; i <= end; i++) {
            next.add(ids[i]);
          }
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      lastSelectedAnchor.current = id;
      return next;
    });
  }, [filteredScreens]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredScreens.map((s) => s.id)));
  }, [filteredScreens]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedAnchor.current = null;
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setGroupFilter('all');
    setContentFilter('all');
    setSortBy('name');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size, clearSelection]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || groupFilter !== 'all' || contentFilter !== 'all' || sortBy !== 'name';

  const totalPages = Math.ceil(filteredScreens.length / pageSize);
  const paginatedScreens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredScreens.slice(start, start + pageSize);
  }, [filteredScreens, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, groupFilter, contentFilter, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map((id) => {
          const screen = screens.find((s) => s.id === id);
          const ws = urlBranchFilter ?? screen?.workspaceId;
          if (!ws) return Promise.resolve({ ok: false } as Response);
          return apiDeleteScreen(ws, id);
        }),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(t('bulkDeletePartial', { failed }));
      } else {
        toast.success(t('bulkDeleteOk', { count: ids.length }));
      }
      setSelectedIds(new Set());
      await reload();
      bumpWorkspaceDataEpoch();
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkSyncContent = async () => {
    if (selectedIds.size === 0) return;
    setBulkSyncBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map((id) => {
          const screen = screens.find((s) => s.id === id);
          const ws = urlBranchFilter ?? screen?.workspaceId;
          if (!ws) return Promise.resolve({ ok: false } as Response);
          return apiSendRemoteCommand(ws, id, 'refresh_content');
        }),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(t('bulkSyncPartial', { failed }));
      } else {
        toast.success(t('bulkSyncOk', { count: ids.length }));
      }
      setSelectedIds(new Set());
      bumpWorkspaceDataEpoch();
    } finally {
      setBulkSyncBusy(false);
    }
  };

  const bulkAssignPlaylist = async () => {
    if (selectedIds.size === 0 || !bulkPlaylistId) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const playlistName = playlists.find((p) => p.id === bulkPlaylistId)?.name ?? null;
      const results = await Promise.all(
        ids.map((id) => {
          const screen = screens.find((s) => s.id === id);
          const ws = urlBranchFilter ?? screen?.workspaceId;
          if (!ws) return Promise.resolve({ ok: false } as Response);
          return apiUpdateScreen(ws, id, { activePlaylistId: bulkPlaylistId });
        }),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(t('bulkAssignPartial', { failed }));
      } else {
        toast.success(t('bulkAssignOk', { count: ids.length, name: playlistName ?? '' }));
      }
      setScreens((prev) =>
        prev.map((s) =>
          selectedIds.has(s.id)
            ? { ...s, activePlaylistId: bulkPlaylistId, activePlaylist: playlistName ? { id: bulkPlaylistId, name: playlistName } : null }
            : s,
        ),
      );
      setSelectedIds(new Set());
      setBulkPlaylistId('');
      bumpWorkspaceDataEpoch();
    } finally {
      setBulkBusy(false);
    }
  };

  const navigateToDetail = (s: ScreenRow) => {
    router.push(`/${activeLocale}/screens/${s.id}` as Route);
  };

  const openQuick = (s: ScreenRow) => {
    setModalScreen(s);
    setIsPairingMode(false);
    setModalOpen(true);
  };

  const openPairing = () => {
    router.push(`/${activeLocale}/screens/pair` as Route);
  };

  const exportCsv = useCallback(() => {
    if (!filteredScreens.length) return;
    const headers = [t('colName'), t('colSerial'), t('colStatus'), t('colLocation'), t('colPlaylist'), t('colLastSeen')];
    const rows = filteredScreens.map((s) => [
      s.name,
      s.serialNumber,
      s.status,
      s.location ?? '',
      s.activePlaylist?.name ?? '',
      s.lastSeenAt ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screens-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredScreens, t]);

  if (workspaces.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('selectWorkspace')}</p>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 space-y-6" role="region" aria-label={t('pageTitle')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="sr-only">{t('pageTitle')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono-nums text-xs text-muted-foreground">
            <span className="text-foreground">{new Intl.NumberFormat(locale).format(screens.length)}</span> {t('screensCount')}
          </p>
          <Button variant="outline" className="rounded-lg" onClick={() => void reload()}>
            {t('refresh')}
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => router.push(`/${activeLocale}/emergency` as Route)}
          >
            <AlertTriangle className="me-2 h-4 w-4 text-warning" />
            {t('emergencyAction')}
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => router.push(`/${activeLocale}/ai` as Route)}
          >
            <Sparkles className="me-2 h-4 w-4 text-primary" />
            {t('aiAction')}
          </Button>
          {canClaimPairing && (
            <Button
              variant="cta"
              className="rounded-lg font-semibold"
              onClick={openPairing}
            >
              <Radio className="me-2 h-4 w-4" />
              {t('pairScreenPrimary')}
            </Button>
          )}
        </div>
      </div>

      {screens.length > 0 && <ScreenAnalyticsPanel />}

      {(screens.length > 0 || isError) && (
        <div className="flex flex-wrap items-center gap-3">
          {screens.length > 0 && <UsageIndicator screenCount={screens.length} />}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg ps-9 pe-9"
              role="searchbox"
              aria-label={t('searchPlaceholder')}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
                aria-label={t('clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t('filterByStatus')}
          >
            <option value="all">{t('filterAll')}</option>
            <option value="ONLINE">{t('filterOnline')}</option>
            <option value="OFFLINE">{t('filterOffline')}</option>
            <option value="MAINTENANCE">{t('filterMaintenance')}</option>
          </select>
          {workspaces.length > 1 && (
          <BranchFilterDropdown value={urlBranchFilter} onChange={setUrlBranchFilter} />
        )}
        <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            aria-label={t('filterByBranch')}
          >
            <option value="all">{t('branchAll')}</option>
            {groupOptions.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={contentFilter}
            onChange={(e) => setContentFilter(e.target.value)}
            aria-label={t('filterByContent')}
          >
            <option value="all">{t('contentAll')}</option>
            <option value="has_content">{t('contentHasContent')}</option>
            <option value="no_content">{t('contentNoContent')}</option>
          </select>
          <select
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label={t('sortBy')}
          >
            <option value="name">{t('sortName')}</option>
            <option value="status">{t('sortStatus')}</option>
            <option value="serial">{t('sortSerial')}</option>
            <option value="lastSeen">{t('sortLastSeen')}</option>
          </select>
          {canAssignPlayback && (
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={selectAll}
              disabled={filteredScreens.length === 0}
            >
              <CheckSquare className="me-2 h-4 w-4" />
              {t('selectAll')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={!filteredScreens.length}
            onClick={exportCsv}
          >
            <Download className="me-1.5 h-4 w-4" />
            {t('exportCsv')}
          </Button>
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition',
                viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label={t('viewCards')}
              aria-pressed={viewMode === 'cards'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition',
                viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label={t('viewTable')}
              aria-pressed={viewMode === 'table'}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-sm text-primary hover:underline"
              onClick={clearAllFilters}
            >
              {t('clearAllFilters')}
            </Button>
          )}
        </div>
      )}

      {(statusFilter !== 'all' || groupFilter !== 'all' || contentFilter !== 'all' || searchQuery !== '') && screens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" role="region" aria-label={t('filterByStatus')}>
          {searchQuery !== '' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              {t('filterChipSearch', { value: searchQuery })}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
                aria-label={t('removeFilter')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              {t('filterChipStatus', { value: statusFilter === 'ONLINE' ? t('filterOnline') : statusFilter === 'OFFLINE' ? t('filterOffline') : t('filterMaintenance') })}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setStatusFilter('all')}
                aria-label={t('removeFilter')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {groupFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              {t('filterChipBranch', { value: groupOptions.find((b) => b.id === groupFilter)?.name ?? groupFilter })}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setGroupFilter('all')}
                aria-label={t('removeFilter')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {contentFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              {contentFilter === 'has_content' ? t('contentHasContent') : t('contentNoContent')}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setContentFilter('all')}
                aria-label={t('removeFilter')}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-sm" role="toolbar" aria-label={t('bulkActions')}>
          <span className="text-sm font-semibold text-foreground" aria-live="polite">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
          {canAssignPlayback && (
            <select
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
              value={bulkPlaylistId}
              onChange={(e) => setBulkPlaylistId(e.target.value)}
              disabled={bulkBusy}
            >
              <option value="">{t('bulkAssignPlaceholder')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {canAssignPlayback && bulkPlaylistId && (
            <Button
              variant="cta"
              className="rounded-lg text-sm"
              disabled={bulkBusy}
              onClick={() => void bulkAssignPlaylist()}
            >
              {t('bulkAssign')}
            </Button>
          )}
          {canAssignPlayback && (
            <Button
              variant="outline"
              className="rounded-lg text-sm"
              disabled={bulkSyncBusy}
              onClick={() => void bulkSyncContent()}
            >
              <RefreshCw className="me-2 h-4 w-4" />
              {t('bulkSyncContent')}
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-lg text-sm hover:text-destructive"
            disabled={bulkBusy}
            onClick={() => setDeleteTarget({ type: 'bulk' })}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t('bulkDelete')}
          </Button>
          <Button
            variant="ghost"
            className="rounded-lg text-sm"
            disabled={bulkBusy || bulkSyncBusy}
            onClick={clearSelection}
          >
            {t('clearSelection')}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div aria-busy="true" aria-live="polite">
          <CardGridSkeleton />
        </div>
      ) : isError ? (
        <ErrorState
          icon={AlertTriangle}
          title={t('errorLoadFailed')}
          retryLabel={t('errorRetry')}
          onRetry={() => void reload()}
        />
      ) : screens.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          actionLabel={canClaimPairing ? t('pairScreenPrimary') : undefined}
          onAction={canClaimPairing ? openPairing : undefined}
        />
      ) : filteredScreens.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title={t('noResults')}
          description={t('noResultsDesc')}
          actionLabel={hasActiveFilters ? t('noResultsClear') : undefined}
          onAction={hasActiveFilters ? clearAllFilters : undefined}
        />
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="vc-table-head-surface">
              <tr className="text-start">
                {canAssignPlayback && <th scope="col" className="w-10 px-4 py-3" />}
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colName')}</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colSerial')}</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colStatus')}</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colLocation')}</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colPlaylist')}</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colLastSeen')}</th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-foreground">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedScreens.map((screen) => (
                <tr key={screen.id} className="vc-table-row border-t">
                  {canAssignPlayback && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(screen.id, e.shiftKey)}
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded border-2 transition',
                          selectedIds.has(screen.id)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-transparent hover:border-primary',
                        )}
                        aria-label={t('selectScreenAria', { name: screen.name })}
                      >
                        <CheckSquare className="h-3 w-3" />
                      </button>
                    </td>
                  )}
                  <td className="cursor-pointer px-4 py-3 font-medium text-foreground" onClick={() => navigateToDetail(screen)}>{screen.name}</td>
                  <td className="px-4 py-3 font-mono-nums text-muted-foreground">{screen.serialNumber}</td>
                  <td className="px-4 py-3">
                    <ScreenFleetStatusBadge status={screen.status} lastSeenAt={screen.lastSeenAt} locale={locale} tone="card" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{screen.location ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{screen.activePlaylist?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground">{screen.lastSeenAt ? new Date(screen.lastSeenAt).toLocaleString(locale) : '—'}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={t('screenActionsAria')}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[11rem] rounded-lg">
                        <DropdownMenuItem onClick={() => navigateToDetail(screen)}>
                          <Monitor className="me-2 h-4 w-4" />
                          {t('viewDetail')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openQuick(screen)}>
                          <PenLine className="me-2 h-4 w-4" />
                          {t('renameScreen')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void sendRemoteCommand(screen.id, 'refresh_content', screen.workspaceId)}>
                          <RefreshCw className="me-2 h-4 w-4" />
                          {t('syncContent')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void sendRemoteCommand(screen.id, 'identify', screen.workspaceId)}>
                          <BadgeAlert className="me-2 h-4 w-4" />
                          {t('identify')}
                        </DropdownMenuItem>
                        {screen.overridePlaylistId && (
                          <DropdownMenuItem disabled>
                            <Zap className="me-2 h-4 w-4 text-warning" />
                            {t('overrideBadge')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget({ type: 'single', screenId: screen.id, screenName: screen.name })}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('deleteScreen')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {paginatedScreens.map((screen, i) => (
            <ScreenVisualCard
              key={screen.id}
              screen={screen}
              locale={locale}
              workspaceId={urlBranchFilter ?? screen.workspaceId}
              index={i}
              onCardClick={navigateToDetail}
              onEdit={(s) => openQuick(s)}
              onDelete={(id) => {
                const s = screens.find((sc) => sc.id === id);
                setDeleteTarget({ type: 'single', screenId: id, screenName: s?.name });
              }}
              onRemote={(id, cmd) => {
                const screen = screens.find((s) => s.id === id);
                void sendRemoteCommand(id, cmd, screen?.workspaceId);
              }}
              onAssignContent={(s) => openQuick(s)}
              playlists={playlists}
              canAssignPlayback={canAssignPlayback}
              assignPlaylistBusy={assignPlaylistScreenId === screen.id}
              onAssignPlaybackPlaylist={assignPlaybackPlaylist}
              selected={selectedIds.has(screen.id)}
              onToggleSelect={canAssignPlayback ? toggleSelect : undefined}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label={t('pagination')} className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label={t('prevPage')}
          >
            {t('prevPage')}
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {t('pageRange', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, filteredScreens.length), total: filteredScreens.length })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label={t('nextPage')}
          >
            {t('nextPage')}
          </Button>
          <select
            className="h-8 rounded-lg border border-border bg-background/80 px-2 text-xs"
            value={String(pageSize)}
            onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
            aria-label={t('pageSize')}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </nav>
      )}

      <ScreenSetupModal
        open={modalOpen}
        onOpenChange={(v: boolean) => {
          setModalOpen(v);
          if (!v) pairing.close();
        }}
        screen={modalScreen}
        workspaceId={urlBranchFilter ?? modalScreen?.workspaceId ?? ''}
        locale={locale}
        onSaved={reloadScreensAndBump}
        pairing={pairing}
        isPairingMode={isPairingMode}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {deleteTarget?.type === 'bulk'
                ? t('bulkDeleteConfirmTitle')
                : t('deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'bulk'
                ? t('bulkDeleteConfirm', { count: selectedIds.size })
                : t('deleteConfirm', { name: deleteTarget?.screenName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteNo')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget?.type === 'bulk') {
                  await bulkDelete();
                } else if (deleteTarget?.screenId) {
                  const screen = screens.find((s) => s.id === deleteTarget.screenId);
                  await onDelete(deleteTarget.screenId, screen?.workspaceId);
                }
                setDeleteTarget(null);
              }}
            >
              {t('deleteYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
