'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Filter, TrendingUp, Eye, Loader2, Activity, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { fetchScreenAnalytics, type ScreenAnalytics, type PerScreenAnalytics } from '@/features/screens/api/screens-api';

export function ProofOfPlayClient() {
  const t = useTranslations('proofOfPlayPage');
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [analytics, setAnalytics] = useState<ScreenAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setAnalytics(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await fetchScreenAnalytics(workspaceId);
    setAnalytics(data);
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => { void reload(); }, [reload, workspaceDataEpoch]);

  const totalScreens = analytics?.total ?? 0;
  const uptimePercent = analytics?.uptimePercent ?? 0;
  const withPlaylist = analytics?.withPlaylist ?? 0;

  const filteredScreens = (analytics?.perScreen ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = useCallback(() => {
    if (!filteredScreens.length) return;
    const headers = ['Display', 'Serial Number', 'Content', 'Last Seen', 'Status', 'Uptime (min)'];
    const rows = filteredScreens.map(s => [
      s.name,
      s.serialNumber,
      s.activePlaylist || '',
      s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : '',
      s.status,
      String(Math.round(s.uptimeSec / 60)),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-of-play-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredScreens]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalScreens}</p>
              <p className="text-xs text-muted-foreground">{t('totalPlays')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uptimePercent.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{t('totalImpressions')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{withPlaylist}</p>
              <p className="text-xs text-muted-foreground">{t('avgDuration')}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('filters')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!filteredScreens.length}
              onClick={exportCsv}
            >
              <Download className="me-1.5 h-4 w-4" />
              {t('exportCsv')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input placeholder={t('filterDisplay')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredScreens.length === 0 ? (
        <EmptyState icon={BarChart3} title={t('noData')} description={t('noDataDesc')} />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('display')}</TableHead>
                <TableHead>{t('content')}</TableHead>
                <TableHead>{t('playedAt')}</TableHead>
                <TableHead>{t('duration')}</TableHead>
                <TableHead>{t('impressions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScreens.map((screen: PerScreenAnalytics) => (
                <TableRow key={screen.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{screen.name}</span>
                      <span className="text-xs text-muted-foreground">{screen.serialNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{screen.activePlaylist || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {screen.lastSeenAt ? new Date(screen.lastSeenAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell><Badge variant={screen.status === 'ONLINE' ? 'success' : 'muted'}>{screen.status.toLowerCase()}</Badge></TableCell>
                  <TableCell className="font-medium">{Math.round(screen.uptimeSec / 60)}m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
