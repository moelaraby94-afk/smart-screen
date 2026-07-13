'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Filter, TrendingUp, Eye, Loader2, Activity, Download, Clock, Monitor, AlertTriangle } from 'lucide-react';
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
  const onlineCount = analytics?.byStatus.ONLINE ?? 0;
  const offlineCount = analytics?.byStatus.OFFLINE ?? 0;
  const maintenanceCount = analytics?.byStatus.MAINTENANCE ?? 0;
  const uptimePercent = analytics?.uptimePercent ?? 0;
  const withPlaylist = analytics?.withPlaylist ?? 0;
  const playlistDist = analytics?.playlistDistribution ?? [];
  const hourlyActivity = analytics?.hourlyActivity ?? [];
  const maxHourlyCount = Math.max(...hourlyActivity.map(h => h.count), 1);

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('statusBreakdown')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('statusOnline')}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${totalScreens ? (onlineCount / totalScreens) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium w-8 text-end">{onlineCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('statusOffline')}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${totalScreens ? (offlineCount / totalScreens) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium w-8 text-end">{offlineCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('statusMaintenance')}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${totalScreens ? (maintenanceCount / totalScreens) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium w-8 text-end">{maintenanceCount}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('hourlyActivity')}</h3>
          </div>
          {hourlyActivity.length > 0 ? (
            <div className="flex items-end gap-0.5 h-32">
              {hourlyActivity.map((h) => (
                <div
                  key={h.hour}
                  className="flex-1 rounded-t bg-primary/60 hover:bg-primary transition-colors"
                  style={{ height: `${(h.count / maxHourlyCount) * 100}%` }}
                  title={`${h.hour}:00 — ${h.count}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noData')}</p>
          )}
        </Card>
      </div>

      {playlistDist.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">{t('playlistDistribution')}</h3>
          <div className="space-y-2">
            {playlistDist.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{p.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${totalScreens ? (p.count / totalScreens) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-end">{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {offlineCount > 0 && (
        <Card className="p-5 border-amber-500/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">{t('deviceAlerts')}</h3>
            <Badge variant="danger">{offlineCount}</Badge>
          </div>
          <div className="space-y-2">
            {(analytics?.perScreen ?? [])
              .filter(s => s.status !== 'ONLINE')
              .sort((a, b) => {
                const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
                const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
                return aTime - bTime;
              })
              .map(s => {
                const offlineDuration = s.lastSeenAt
                  ? Math.floor((Date.now() - new Date(s.lastSeenAt).getTime()) / 60000)
                  : null;
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${s.status === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.serialNumber}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <Badge variant={s.status === 'MAINTENANCE' ? 'muted' : 'danger'}>
                        {s.status === 'MAINTENANCE' ? t('statusMaintenance') : t('statusOffline')}
                      </Badge>
                      {offlineDuration !== null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {offlineDuration < 60
                            ? `${offlineDuration}m ${t('ago')}`
                            : `${Math.floor(offlineDuration / 60)}h ${offlineDuration % 60}m ${t('ago')}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

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
