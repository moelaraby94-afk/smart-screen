'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle as CircleIcon,
  History,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Shapes,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchCanvases as apiFetchCanvases,
  fetchCanvas as apiFetchCanvas,
  updateCanvas as apiUpdateCanvas,
  createCanvas as apiCreateCanvas,
} from '@/features/studio/studio-api';
import { fetchMedia } from '@/features/media/api/media-api';
import { readPageItems } from '@/features/api/page';
import { useWorkspace } from '@/features/workspace/workspace-context';
import type { MediaItem } from '@/features/media/media-library-client';
import {
  type CanvasLayoutV1,
  type CanvasObjectJson,
  emptyLayout,
} from '@/features/studio/canvas-layout';
import { CanvasStageView } from '@/features/studio/studio-canvas-shapes';
import { StudioPropertiesPanel, StudioMediaStrip } from '@/features/studio/studio-panels';
import { CANVAS_TEMPLATES, type CanvasTemplate } from '@/features/studio/canvas-templates';

type VersionSnapshot = {
  id: string;
  timestamp: number;
  name: string;
  layout: CanvasLayoutV1;
  dw: number;
  dh: number;
};

const MAX_SNAPSHOTS = 20;
const AUTOSAVE_DELAY = 3000;

function loadSnapshots(canvasId: string): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(`canvas-versions:${canvasId}`);
    if (!raw) return [];
    return JSON.parse(raw) as VersionSnapshot[];
  } catch {
    return [];
  }
}

function saveSnapshots(canvasId: string, snapshots: VersionSnapshot[]): void {
  try {
    localStorage.setItem(
      `canvas-versions:${canvasId}`,
      JSON.stringify(snapshots.slice(0, MAX_SNAPSHOTS)),
    );
  } catch {
    /* quota exceeded — silently drop */
  }
}

type CanvasDto = {
  id: string;
  name: string;
  width: number;
  height: number;
  durationSec: number;
  layoutData: unknown;
};

function parseLayout(raw: unknown): CanvasLayoutV1 {
  if (typeof raw !== 'object' || raw === null) return emptyLayout();
  const o = raw as Record<string, unknown>;
  if (o.version === 1 && Array.isArray(o.objects)) {
    return { version: 1, objects: o.objects as CanvasObjectJson[] };
  }
  return emptyLayout();
}

export function StudioEditorClient() {
  const t = useTranslations('studio');
  const locale = useLocale();
  const { workspaceId } = useWorkspace();
  const [canvases, setCanvases] = useState<CanvasDto[]>([]);
  const [canvasId, setCanvasId] = useState('');
  const [name, setName] = useState('Untitled');
  const [dw, setDw] = useState(1920);
  const [dh, setDh] = useState(1080);
  const [layout, setLayout] = useState<CanvasLayoutV1>(emptyLayout());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 540 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const loadLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const items = await fetchMedia(workspaceId);
    setLibrary(items);
  }, [workspaceId]);

  const loadCanvases = useCallback(async () => {
    if (!workspaceId) return;
    const res = await apiFetchCanvases(workspaceId);
    if (res.ok) setCanvases(await readPageItems<CanvasDto>(res));
  }, [workspaceId]);

  const loadCanvas = useCallback(
    async (id: string) => {
      if (!workspaceId || !id) return;
      const res = await apiFetchCanvas(workspaceId, id);
      if (!res.ok) return;
      const c = (await res.json()) as CanvasDto;
      setName(c.name);
      setDw(c.width);
      setDh(c.height);
      setLayout(parseLayout(c.layoutData));
      setSelectedId(null);
    },
    [workspaceId],
  );

  useEffect(() => {
    void loadLibrary();
    void loadCanvases();
  }, [loadLibrary, loadCanvases]);

  useEffect(() => {
    if (canvasId) {
      setSnapshots(loadSnapshots(canvasId));
    } else {
      setSnapshots([]);
    }
  }, [canvasId]);

  useEffect(() => {
    if (canvasId) void loadCanvas(canvasId);
  }, [canvasId, loadCanvas]);

  const scale = useMemo(() => Math.min(size.w / dw, size.h / dh, 2), [size, dw, dh]);
  const ox = (size.w - dw * scale) / 2;
  const oy = (size.h - dh * scale) / 2;

  const selected = useMemo(
    () => layout.objects.find((o) => o.id === selectedId) ?? null,
    [layout.objects, selectedId],
  );

  const updateObject = (id: string, patch: Partial<CanvasObjectJson>) => {
    setLayout((prev) => ({
      ...prev,
      objects: prev.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  const removeObject = (id: string) => {
    setLayout((prev) => ({
      ...prev,
      objects: prev.objects.filter((o) => o.id !== id),
    }));
    setSelectedId(null);
  };

  const save = async (silent = false) => {
    if (!workspaceId || !canvasId) {
      if (!silent) toast.error(t('saveNeedCanvas'));
      return;
    }
    setSaving(true);
    try {
      const res = await apiUpdateCanvas(workspaceId, canvasId, {
        name: name.trim() || 'Untitled',
        width: dw,
        height: dh,
        layoutData: layout,
        durationSec: 15,
      });
      if (!res.ok) throw new Error('fail');
      if (!silent) toast.success(t('saved'));
      setAutoSavedAt(Date.now());
      await loadCanvases();
    } catch {
      if (!silent) toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const takeSnapshot = useCallback(() => {
    if (!canvasId) return;
    const snap: VersionSnapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      name: name.trim() || 'Untitled',
      layout: JSON.parse(JSON.stringify(layout)),
      dw,
      dh,
    };
    setSnapshots((prev) => {
      const next = [snap, ...prev].slice(0, MAX_SNAPSHOTS);
      saveSnapshots(canvasId, next);
      return next;
    });
  }, [canvasId, name, layout, dw, dh]);

  const restoreSnapshot = (snap: VersionSnapshot) => {
    setLayout(JSON.parse(JSON.stringify(snap.layout)));
    setDw(snap.dw);
    setDh(snap.dh);
    setName(snap.name);
    setSelectedId(null);
    setShowHistory(false);
    toast.success(t('restored'));
  };

  const deleteSnapshot = (id: string) => {
    if (!canvasId) return;
    setSnapshots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSnapshots(canvasId, next);
      return next;
    });
  };

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedLayout = useRef<string>('');

  useEffect(() => {
    if (!canvasId || !workspaceId) return;
    const layoutJson = JSON.stringify(layout);
    if (layoutJson === lastSavedLayout.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      lastSavedLayout.current = layoutJson;
      void save(true);
    }, AUTOSAVE_DELAY);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, canvasId, workspaceId, name, dw, dh]);

  const applyTemplate = async (tpl: CanvasTemplate) => {
    if (!workspaceId) return;
    const res = await apiCreateCanvas(workspaceId, {
      name: tpl.name,
      width: tpl.width,
      height: tpl.height,
      layoutData: tpl.layout,
    });
    if (!res.ok) {
      toast.error(t('createFailed'));
      return;
    }
    const created = (await res.json()) as { id: string };
    toast.success(t('templateApplied'));
    await loadCanvases();
    setCanvasId(created.id);
    setShowTemplates(false);
  };

  const createCanvas = async () => {
    if (!workspaceId) return;
    const res = await apiCreateCanvas(workspaceId, {
      name: `Design ${canvases.length + 1}`,
      width: 1920,
      height: 1080,
      layoutData: emptyLayout(),
    });
    if (!res.ok) {
      toast.error(t('createFailed'));
      return;
    }
    const created = (await res.json()) as { id: string };
    toast.success(t('created'));
    await loadCanvases();
    setCanvasId(created.id);
  };

  const addText = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => ({
      ...prev,
      objects: [
        ...prev.objects,
        {
          id,
          type: 'text',
          x: 120,
          y: 120,
          text: 'Headline',
          fontSize: 72,
          fill: 'hsl(var(--primary))',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
          opacity: 1,
        },
      ],
    }));
    setSelectedId(id);
  };

  const addRect = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => ({
      ...prev,
      objects: [
        ...prev.objects,
        {
          id,
          type: 'rect',
          x: 200,
          y: 200,
          width: 400,
          height: 220,
          fill: 'hsl(var(--primary))',
          opacity: 0.95,
          cornerRadius: 12,
        },
      ],
    }));
    setSelectedId(id);
  };

  const addEllipse = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => ({
      ...prev,
      objects: [
        ...prev.objects,
        {
          id,
          type: 'ellipse',
          x: 300,
          y: 300,
          width: 280,
          height: 180,
          fill: 'hsl(var(--primary))',
          opacity: 0.9,
        },
      ],
    }));
    setSelectedId(id);
  };

  const onDropMedia = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/canvas-media');
    if (!raw) return;
    const { publicUrl, mediaId } = JSON.parse(raw) as {
      publicUrl: string;
      mediaId: string;
    };
    const id = crypto.randomUUID();
    setLayout((prev) => ({
      ...prev,
      objects: [
        ...prev.objects,
        {
          id,
          type: 'image',
          x: 160,
          y: 160,
          width: 640,
          height: 360,
          imageUrl: publicUrl,
          mediaId,
          opacity: 1,
        },
      ],
    }));
    setSelectedId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void save();
        takeSnapshot();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        removeObject(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, canvasId, layout, name, dw, dh]);

  if (!workspaceId) {
    return <p className="text-muted-foreground">{t('needWorkspace')}</p>;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-card-surface rounded-2xl border border-border p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Label htmlFor="canvas-select">{t('canvasSelect')}</Label>
            <select
              id="canvas-select"
              className="h-11 w-full max-w-md rounded-2xl border border-border bg-card px-4 text-[15px] outline-none focus:ring-4 focus:ring-primary/15"
              value={canvasId}
              onChange={(e) => setCanvasId(e.target.value)}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {canvases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void createCanvas()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newCanvas')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplates((v) => !v)}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              {t('templates')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canvasId || snapshots.length === 0}
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="mr-2 h-4 w-4" />
              {t('history')}
            </Button>
            <Button type="button" variant="cta" disabled={!canvasId || saving} onClick={() => { void save(); takeSnapshot(); }}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Label className="sr-only">{t('designName')}</Label>
          <Input
            className="max-w-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('designName')}
          />
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{t('widthShort')}</Label>
            <Input
              type="number"
              className="h-10 w-24"
              value={dw}
              min={640}
              onChange={(e) => setDw(Number(e.target.value) || 1920)}
            />
            <Label className="text-xs text-muted-foreground">{t('heightShort')}</Label>
            <Input
              type="number"
              className="h-10 w-24"
              value={dh}
              min={480}
              onChange={(e) => setDh(Number(e.target.value) || 1080)}
            />
          </div>
        </div>
      </motion.div>

      {autoSavedAt && (
        <p className="text-xs text-muted-foreground">
          {t('autoSavedAt')}{' '}
          {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(autoSavedAt)}
        </p>
      )}

      {showTemplates && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vc-card-surface rounded-2xl border border-border p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">{t('templateGallery')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CANVAS_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => void applyTemplate(tpl)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/20 p-4 text-center transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div
                  className="flex items-center justify-center rounded-lg border border-border/40 bg-background"
                  style={{
                    aspectRatio: `${tpl.width} / ${tpl.height}`,
                    width: '100%',
                    maxHeight: 100,
                  }}
                >
                  <LayoutTemplate className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {locale === 'ar' ? tpl.nameAr : tpl.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {tpl.width}×{tpl.height}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {showHistory && canvasId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vc-card-surface rounded-2xl border border-border p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">{t('versionHistory')}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => { void save(); takeSnapshot(); }}
            >
              {t('saveSnapshot')}
            </Button>
          </div>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noSnapshots')}</p>
          ) : (
            <ul className="space-y-2">
              {snapshots.map((snap) => (
                <li
                  key={snap.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{snap.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(snap.timestamp)}
                      {' · '}
                      {snap.layout.objects.length} {t('objects')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => restoreSnapshot(snap)}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      {t('restore')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteSnapshot(snap.id)}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/30 p-2">
            <Button type="button" size="sm" variant="ghost" onClick={addText}>
              <Type className="mr-1 h-4 w-4 text-primary" />
              {t('toolText')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addRect}>
              <Shapes className="mr-1 h-4 w-4 text-primary" />
              {t('toolRect')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addEllipse}>
              <CircleIcon className="mr-1 h-4 w-4 text-primary" />
              {t('toolEllipse')}
            </Button>
          </div>

          <motion.div
            layout
            className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-b from-zinc-950/90 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{ minHeight: 420 }}
          >
            <CanvasStageView
              size={size}
              ox={ox}
              oy={oy}
              scale={scale}
              dw={dw}
              dh={dh}
              layout={layout}
              onSelect={setSelectedId}
              onUpdateObject={updateObject}
              onStageClick={() => setSelectedId(null)}
              onDrop={onDropMedia}
              onDragOver={onDragOver}
              containerRef={containerRef}
              dropHint={t('dropHint')}
            />
            <p className="pointer-events-none absolute bottom-3 start-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
              {t('dropHint')}
            </p>
          </motion.div>

          <StudioMediaStrip library={library} />
        </div>

        <StudioPropertiesPanel
          selected={selected}
          onUpdateObject={updateObject}
          onRemoveObject={removeObject}
        />
      </div>
    </div>
  );
}
