'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderOpen, Upload, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchMedia,
  uploadMedia,
  deleteMedia,
  type MediaItem,
} from '@/features/media/api/media-api';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { toast } from 'sonner';

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string, t: (k: string) => string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return `${diffMin} ${t('minAgo')}`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ${t('hoursAgo')}`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} ${t('daysAgo')}`;
}

const typeColors: Record<string, string> = {
  image: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  audio: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  file: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function ContentClient() {
  const t = useTranslations('contentPage');
  const { workspaceId, workspaceDataEpoch, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const [assets, setAssets] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setAssets([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const items = await fetchMedia(workspaceId);
    setAssets(items);
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => { void reload(); }, [reload, workspaceDataEpoch]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;
    setUploading(true);
    const res = await uploadMedia(workspaceId, file);
    if (res.ok) {
      toast.success(t('uploadComplete'));
      await reload();
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [workspaceId, reload, toastResponseError, bumpWorkspaceDataEpoch]);

  const handleDelete = useCallback(async (mediaId: string) => {
    if (!workspaceId) return;
    const res = await deleteMedia(workspaceId, mediaId);
    if (res.ok) {
      setAssets(prev => prev.filter(a => a.id !== mediaId));
      toast.success(t('deletedToast'));
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
  }, [workspaceId, toastResponseError, bumpWorkspaceDataEpoch]);

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={handleUpload} />

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{assets.length} {t('assetsCount')}</p>
            <p className="text-xs text-muted-foreground">{assets.filter(a => a.mimeType.startsWith('image/')).length} {t('images')} · {assets.filter(a => a.mimeType.startsWith('video/')).length} {t('videos')}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
          {uploading ? t('uploading') : t('upload')}
        </Button>
      </div>

      {showExpiry && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('autoExpiry')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('autoExpiryDesc')}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectContent')} />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.originalName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" />
              <Button size="sm">{t('setExpiry')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t('noAssets')}
          description={t('noAssetsDesc')}
          actionLabel={t('upload')}
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {assets.map((asset) => {
              const mediaType = getMediaType(asset.mimeType);
              return (
                <Card key={asset.id} className="p-4">
                  <div className={`mb-3 flex h-24 items-center justify-center rounded-lg ${typeColors[mediaType] || 'bg-muted'}`}>
                    {asset.mimeType.startsWith('image/') ? (
                      <img src={asset.publicUrl} alt={asset.originalName} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs font-medium uppercase">{mediaType}</span>
                    )}
                  </div>
                  <p className="truncate text-sm font-medium">{asset.originalName}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatSize(asset.sizeBytes)}</span>
                    <span>{formatDate(asset.createdAt, t)}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('size')}</TableHead>
                  <TableHead>{t('uploaded')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.originalName}</TableCell>
                    <TableCell><Badge variant="muted">{getMediaType(asset.mimeType)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatSize(asset.sizeBytes)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(asset.createdAt, t)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(asset.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
