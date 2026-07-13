'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { LayoutTemplate, Search, Eye, Loader2, Trash2, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useLocale, useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { toast } from 'sonner';

type CanvasRow = {
  id: string;
  name: string;
  width: number;
  height: number;
  durationSec: number;
  type: string | null;
  contentUrl: string | null;
  layoutData: unknown;
  createdAt: string;
  updatedAt: string;
};

export function TemplatesClient() {
  const t = useTranslations('templatesPage');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const [templates, setTemplates] = useState<CanvasRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<CanvasRow | null>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await apiFetch(`/canvases?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const items = await readPageItems<CanvasRow>(res);
      setTemplates(items);
    } else {
      setTemplates([]);
    }
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => { void reload(); }, [reload, workspaceDataEpoch]);

  const handleDelete = useCallback(async (id: string) => {
    if (!workspaceId) return;
    const res = await apiFetch(`/canvases/${encodeURIComponent(id)}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setTemplates(prev => prev.filter(item => item.id !== id));
      toast.success(t('deleted'));
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
  }, [workspaceId, toastResponseError, bumpWorkspaceDataEpoch]);

  const filtered = templates.filter(tpl =>
    tpl.name.toLowerCase().includes(search.toLowerCase())
  );

  const builtinTemplates = [
    { id: 'tpl-single', name: t('tplSingleName'), desc: t('tplSingleDesc'), category: 'single', width: 1920, height: 1080 },
    { id: 'tpl-split', name: t('tplSplitName'), desc: t('tplSplitDesc'), category: 'split', width: 1920, height: 1080 },
    { id: 'tpl-header-footer', name: t('tplHeaderFooterName'), desc: t('tplHeaderFooterDesc'), category: 'header-footer', width: 1920, height: 1080 },
    { id: 'tpl-sidebar', name: t('tplSidebarName'), desc: t('tplSidebarDesc'), category: 'sidebar', width: 1920, height: 1080 },
    { id: 'tpl-grid', name: t('tplGridName'), desc: t('tplGridDesc'), category: 'grid', width: 1920, height: 1080 },
    { id: 'tpl-ticker', name: t('tplTickerName'), desc: t('tplTickerDesc'), category: 'ticker', width: 1920, height: 1080 },
  ];

  const renderThumbnail = (canvas: CanvasRow) => {
    const ratio = canvas.width / canvas.height;
    const isPortrait = ratio < 1;
    return (
      <div
        className="flex h-32 items-center justify-center rounded-lg bg-muted/50 p-2"
        style={{ aspectRatio: isPortrait ? '9/16' : '16/9', maxHeight: '8rem' }}
      >
        {canvas.contentUrl ? (
          <img src={canvas.contentUrl} alt={canvas.name} className="h-full w-full rounded object-cover" />
        ) : (
          <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-muted/20 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <h2 className="text-lg font-semibold tracking-tight">{t('builtinTitle')}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{t('builtinDesc')}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builtinTemplates.map((tpl) => (
            <div key={tpl.id} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
              <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-muted/40">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground">{tpl.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tpl.desc}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{tpl.width}×{tpl.height}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-xl"
                asChild
              >
                <Link href={`/${locale}/studio?template=${tpl.category}` as Route}>
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('use')}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t('yourTemplates')}</h2>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title={t('noTemplates')} description={t('noTemplatesDesc')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => (
            <Card key={tpl.id} className="p-5">
              {renderThumbnail(tpl)}
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tpl.width}×{tpl.height} · {tpl.durationSec}s</p>
                </div>
                {tpl.type && <Badge variant="muted">{tpl.type}</Badge>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview(tpl)}>
                  <Eye className="me-1.5 h-4 w-4" />
                  {t('preview')}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(tpl.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreview(null)}>
          <Card className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">{preview.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                {preview.contentUrl ? (
                  <img src={preview.contentUrl} alt={preview.name} className="max-h-full max-w-full rounded-lg object-contain" />
                ) : (
                  <LayoutTemplate className="h-12 w-12 text-muted-foreground/50" />
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>{t('close')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
