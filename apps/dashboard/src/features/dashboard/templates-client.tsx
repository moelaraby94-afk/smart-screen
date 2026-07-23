'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Search, Eye, Trash2, Plus, Sparkles, LayoutTemplate, AlertCircle, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';
import { ErrorState } from '@/components/ui/error-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useLocale, useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { toast } from 'sonner';
import { CANVAS_TEMPLATES, type CanvasTemplate, type TemplateCategory } from '@/features/studio/canvas-templates';
import { TemplatePreview } from '@/features/studio/template-preview';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

const CATEGORY_LIST: Array<{ key: TemplateCategory | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'cat_all' },
  { key: 'business', labelKey: 'cat_business' },
  { key: 'retail', labelKey: 'cat_retail' },
  { key: 'restaurant', labelKey: 'cat_restaurant' },
  { key: 'corporate', labelKey: 'cat_corporate' },
  { key: 'education', labelKey: 'cat_education' },
  { key: 'healthcare', labelKey: 'cat_healthcare' },
  { key: 'general', labelKey: 'cat_general' },
];

export function TemplatesClient() {
  const t = useTranslations('templatesPage');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [templates, setTemplates] = useState<CanvasRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [preview, setPreview] = useState<CanvasTemplate | null>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await apiFetch(`/canvases?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        const items = await readPageItems<CanvasRow>(res);
        setTemplates(items);
      } else {
        setTemplates([]);
        setLoadError(true);
      }
    } catch {
      setTemplates([]);
      setLoadError(true);
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
  }, [workspaceId, toastResponseError, bumpWorkspaceDataEpoch, t]);

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CANVAS_TEMPLATES.filter((tpl) => {
      if (activeCategory !== 'all' && tpl.category !== activeCategory) return false;
      if (!q) return true;
      const name = locale === 'ar' ? tpl.nameAr : tpl.name;
      const desc = locale === 'ar' ? tpl.descriptionAr : tpl.description;
      const usage = locale === 'ar' ? tpl.usageAr : tpl.usage;
      return (
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        usage.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory, locale]);

  const filteredUserTemplates = useMemo(() => {
    const q = search.toLowerCase().trim();
    return templates.filter(tpl =>
      tpl.name.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const handleUseTemplate = useCallback((tpl: CanvasTemplate) => {
    const href = `/${locale}/studio?template=${tpl.id}` as Route;
    router.push(href);
  }, [locale, router]);

  const tplName = (tpl: CanvasTemplate) => locale === 'ar' ? tpl.nameAr : tpl.name;
  const tplDesc = (tpl: CanvasTemplate) => locale === 'ar' ? tpl.descriptionAr : tpl.description;
  const tplUsage = (tpl: CanvasTemplate) => locale === 'ar' ? tpl.usageAr : tpl.usage;

  return (
    <div className="space-y-6">
      {/* ── Template Gallery ── */}
      <section aria-labelledby="gallery-heading">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <h2 id="gallery-heading" className="text-lg font-semibold tracking-tight">{t('builtinTitle')}</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">{t('builtinDesc')}</p>

        {/* Search + Category Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
              aria-label={t('search')}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t('categoryFilter')}>
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat.key}
              aria-pressed={activeCategory === cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                activeCategory === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon={LayoutTemplate}
            title={t('noTemplates')}
            description={t('noTemplatesDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tpl) => (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Card
                    variant="interactive"
                    size="none"
                    className="group overflow-hidden p-0"
                  >
                    {/* Preview Thumbnail */}
                    <div
                      className="relative cursor-pointer overflow-hidden border-b border-border bg-muted/20"
                      onClick={() => setPreview(tpl)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${t('preview')} — ${tplName(tpl)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPreview(tpl);
                        }
                      }}
                    >
                      <TemplatePreview
                        layout={tpl.layout}
                        width={tpl.width}
                        height={tpl.height}
                        className="w-full"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-normal group-hover:bg-black/30 group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-md">
                          <Eye className="h-4 w-4" />
                          {t('preview')}
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">{tplName(tpl)}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{tplDesc(tpl)}</p>
                        </div>
                        <Badge variant="muted" className="shrink-0">{t(`cat_${tpl.category}`)}</Badge>
                      </div>

                      {/* Template Details */}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">{t('orientation')}:</span>
                          <span>{t(`orient_${tpl.orientation}`)}</span>
                        </span>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">{t('dimensions')}:</span>
                          <span>{tpl.width}×{tpl.height}</span>
                        </span>
                      </div>

                      {/* Usage */}
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{t('usageLabel')}:</span>{' '}
                        {tplUsage(tpl)}
                      </p>

                      {/* Create Button */}
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => handleUseTemplate(tpl)}
                        aria-label={`${t('use')} — ${tplName(tpl)}`}
                      >
                        <Plus className="me-1.5 h-4 w-4" />
                        {t('use')}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── User Templates ── */}
      <section aria-labelledby="your-templates-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="your-templates-heading" className="text-lg font-semibold tracking-tight">{t('yourTemplates')}</h2>
        </div>

        {loadError ? (
          <ErrorState
            icon={AlertCircle}
            title={t('errorTitle')}
            description={t('errorDesc')}
            retryLabel={t('retry')}
            onRetry={() => void reload()}
          />
        ) : isLoading ? (
          <CardGridSkeleton />
        ) : filteredUserTemplates.length === 0 ? (
          <EmptyState
            icon={LayoutTemplate}
            title={t('noUserTemplates')}
            description={t('noUserTemplatesDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUserTemplates.map((tpl) => (
              <Card key={tpl.id} variant="interactive" size="none" className="group overflow-hidden p-0">
                <div
                  className="relative flex items-center justify-center overflow-hidden border-b border-border bg-muted/20"
                  style={{ aspectRatio: `${tpl.width} / ${tpl.height}`, maxHeight: '10rem' }}
                >
                  {tpl.contentUrl ? (
                    <img src={tpl.contentUrl} alt={tpl.name} className="h-full w-full object-cover" />
                  ) : (
                    <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" aria-hidden />
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.width}×{tpl.height} · {tpl.durationSec}s</p>
                    </div>
                    {tpl.type && <Badge variant="muted" className="shrink-0">{tpl.type}</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/${locale}/studio?canvas=${tpl.id}` as Route}>
                        <Eye className="me-1.5 h-4 w-4" />
                        {t('edit')}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => void handleDelete(tpl.id)}
                      aria-label={`${t('delete')} — ${tpl.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Preview Modal ── */}
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{preview ? tplName(preview) : ''}</DialogTitle>
            <DialogDescription>{preview ? tplDesc(preview) : ''}</DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className="border-b border-border bg-muted/20">
                <TemplatePreview
                  layout={preview.layout}
                  width={preview.width}
                  height={preview.height}
                  className="w-full max-h-[50vh]"
                />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{tplName(preview)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tplDesc(preview)}</p>
                  </div>
                  <Badge variant="muted">{t(`cat_${preview.category}`)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('orientation')}</p>
                    <p className="text-foreground">{t(`orient_${preview.orientation}`)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('dimensions')}</p>
                    <p className="text-foreground">{preview.width}×{preview.height}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('categoryLabel')}</p>
                    <p className="text-foreground">{t(`cat_${preview.category}`)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('usageLabel')}</p>
                  <p className="mt-0.5 text-sm text-foreground">{tplUsage(preview)}</p>
                </div>
                <DialogFooter className="border-t border-border pt-4">
                  <DialogClose asChild>
                    <Button variant="ghost" size="sm">{t('close')}</Button>
                  </DialogClose>
                  <Button variant="default" size="sm" onClick={() => { handleUseTemplate(preview); setPreview(null); }}>
                    <Plus className="me-1.5 h-4 w-4" />
                    {t('use')}
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
