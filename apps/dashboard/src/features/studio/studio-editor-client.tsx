'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Circle as CircleIcon,
  Clapperboard,
  Copy,
  Clipboard,
  History,
  LayoutTemplate,
  Loader2,
  Maximize,
  Minus,
  MonitorOff,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Save,
  Shapes,
  SquareStack,
  Trash2,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveStaticBrandingLogoPath } from '@/components/branding-context';
import {
  fetchCanvases as apiFetchCanvases,
  fetchCanvas as apiFetchCanvas,
  updateCanvas as apiUpdateCanvas,
  createCanvas as apiCreateCanvas,
  deleteCanvas as apiDeleteCanvas,
  fetchCanvasVersions as apiFetchCanvasVersions,
  restoreCanvasVersion as apiRestoreCanvasVersion,
} from '@/features/studio/studio-api';
import {
  fetchPlaylists as apiFetchPlaylists,
  createPlaylist as apiCreatePlaylist,
  updatePlaylistItems as apiUpdatePlaylistItems,
} from '@/features/playlists/api/playlists-api';
import { fetchMedia, uploadMedia } from '@/features/media/api/media-api';
import { readPageItems } from '@/features/api/page';
import { useWorkspace } from '@/features/workspace/workspace-context';
import type { MediaItem } from '@/features/media/media-library-client';
import {
  type CanvasLayoutV1,
  type CanvasObjectJson,
  type ZonePreset,
  emptyLayout,
  makeZonePresets,
} from '@/features/studio/canvas-layout';
import { CanvasStageView } from '@/features/studio/studio-canvas-shapes';
import { StudioPropertiesPanel, StudioMediaPanel, StudioLayersPanel } from '@/features/studio/studio-panels';
import { CANVAS_TEMPLATES, type CanvasTemplate } from '@/features/studio/canvas-templates';

type VersionSnapshot = {
  id: string;
  timestamp: number;
  name: string;
  layout: CanvasLayoutV1;
  dw: number;
  dh: number;
};

type ServerVersion = {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: string;
  savedBy: { id: string; fullName: string } | null;
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
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const prefersReduced = useReducedMotion();
  const { workspaceId, workspaces } = useWorkspace();
  const searchParams = useSearchParams();
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
  const [serverVersions, setServerVersions] = useState<ServerVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [studioPlaylists, setStudioPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 540 });
  const [splashVisible, setSplashVisible] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [durationSec, setDurationSec] = useState(15);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<CanvasObjectJson | null>(null);
  const undoStack = useRef<CanvasLayoutV1[]>([]);
  const redoStack = useRef<CanvasLayoutV1[]>([]);

  const viewerBlocked = (() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return Boolean(ws && ws.role === 'VIEWER');
  })();

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

  // Splash screen timer — hides after 2s
  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Viewport width tracking for responsive guards
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadLibrary = useCallback(async () => {
    if (!workspaceId) return;
    const items = await fetchMedia(workspaceId);
    setLibrary(items);
  }, [workspaceId]);

  const loadCanvases = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await apiFetchCanvases(workspaceId);
      if (res.ok) setCanvases(await readPageItems<CanvasDto>(res));
      else setLoadError(true);
    } catch {
      setLoadError(true);
    }
  }, [workspaceId]);

  const loadCanvas = useCallback(
    async (id: string) => {
      if (!workspaceId || !id) return;
      try {
        const res = await apiFetchCanvas(workspaceId, id);
        if (!res.ok) { setLoadError(true); return; }
        const c = (await res.json()) as CanvasDto;
        setName(c.name);
        setDw(c.width);
        setDh(c.height);
        setDurationSec(c.durationSec ?? 15);
        setLayout(parseLayout(c.layoutData));
        setSelectedId(null);
      } catch {
        setLoadError(true);
      }
    },
    [workspaceId],
  );

  const loadPlaylists = useCallback(async () => {
    if (!workspaceId) return;
    const res = await apiFetchPlaylists(workspaceId);
    if (res.ok) {
      const items = await readPageItems<{ id: string; name: string }>(res);
      setStudioPlaylists(items);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadLibrary();
    void loadCanvases();
    void loadPlaylists();
  }, [loadLibrary, loadCanvases, loadPlaylists]);

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

  // Read URL params: ?template={id} or ?canvas={id}
  const templateParam = searchParams.get('template');
  const canvasParam = searchParams.get('canvas');
  const urlHandledRef = useRef(false);
  useEffect(() => {
    if (!workspaceId || urlHandledRef.current) return;
    if (canvasParam) {
      urlHandledRef.current = true;
      setCanvasId(canvasParam);
    } else if (templateParam) {
      urlHandledRef.current = true;
      const tpl = CANVAS_TEMPLATES.find((tp) => tp.id === templateParam);
      if (tpl) {
        void (async () => {
          const res = await apiCreateCanvas(workspaceId, {
            name: locale === 'ar' ? tpl.nameAr : tpl.name,
            width: tpl.width,
            height: tpl.height,
            layoutData: tpl.layout,
          });
          if (res.ok) {
            const created = (await res.json()) as { id: string };
            toast.success(t('templateApplied'));
            await loadCanvases();
            setCanvasId(created.id);
          } else {
            toast.error(t('createFailed'));
          }
        })();
      }
    }
  }, [workspaceId, templateParam, canvasParam, locale, t, loadCanvases]);

  const fitScale = useMemo(() => Math.min(size.w / dw, size.h / dh, 2), [size, dw, dh]);
  const scale = useMemo(() => fitScale * zoomLevel, [fitScale, zoomLevel]);
  const ox = (size.w - dw * scale) / 2 + panOffset.x;
  const oy = (size.h - dh * scale) / 2 + panOffset.y;

  const zoomIn = () => setZoomLevel((z) => Math.min(z * 1.25, 5));
  const zoomOut = () => setZoomLevel((z) => Math.max(z / 1.25, 0.2));
  const zoomReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const zoomFit = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const selected = useMemo(
    () => layout.objects.find((o) => o.id === selectedId) ?? null,
    [layout.objects, selectedId],
  );

  const pushUndo = useCallback((prev: CanvasLayoutV1) => {
    undoStack.current.push(JSON.parse(JSON.stringify(prev)));
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const updateObject = (id: string, patch: Partial<CanvasObjectJson>) => {
    setLayout((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        objects: prev.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      };
    });
  };

  const removeObject = (id: string) => {
    setLayout((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        objects: prev.objects.filter((o) => o.id !== id),
      };
    });
    setSelectedId(null);
  };

  const reorderObject = (fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      pushUndo(prev);
      const objs = [...prev.objects];
      const [moved] = objs.splice(fromIndex, 1);
      objs.splice(toIndex, 0, moved);
      return { ...prev, objects: objs };
    });
  };

  const toggleVisibility = (id: string, visible: boolean) => {
    updateObject(id, { opacity: visible ? 1 : 0 });
  };

  const toggleLock = (id: string, locked: boolean) => {
    updateObject(id, { locked });
  };

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(JSON.parse(JSON.stringify(layout)));
    setLayout(prev);
  }, [layout]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(JSON.parse(JSON.stringify(layout)));
    setLayout(next);
  }, [layout]);

  const duplicateObject = useCallback((id: string) => {
    const obj = layout.objects.find((o) => o.id === id);
    if (!obj) return;
    const copy: CanvasObjectJson = {
      ...JSON.parse(JSON.stringify(obj)),
      id: crypto.randomUUID(),
      x: obj.x + 20,
      y: obj.y + 20,
    };
    setLayout((prev) => {
      pushUndo(prev);
      return { ...prev, objects: [...prev.objects, copy] };
    });
    setSelectedId(copy.id);
  }, [layout, pushUndo]);

  const copyObject = useCallback((id: string) => {
    const obj = layout.objects.find((o) => o.id === id);
    if (obj) setClipboard(JSON.parse(JSON.stringify(obj)));
  }, [layout]);

  const pasteObject = useCallback(() => {
    if (!clipboard) return;
    const copy: CanvasObjectJson = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id: crypto.randomUUID(),
      x: clipboard.x + 20,
      y: clipboard.y + 20,
    };
    setLayout((prev) => {
      pushUndo(prev);
      return { ...prev, objects: [...prev.objects, copy] };
    });
    setSelectedId(copy.id);
  }, [clipboard, pushUndo]);

  const deleteCanvas = async () => {
    if (!workspaceId || !canvasId) return;
    try {
      const res = await apiDeleteCanvas(workspaceId, canvasId);
      if (res.ok) {
        toast.success(t('canvasDeleted'));
        setCanvasId('');
        setName('Untitled');
        setLayout(emptyLayout());
        setSelectedId(null);
        await loadCanvases();
      } else {
        toast.error(t('deleteFailed'));
      }
    } catch {
      toast.error(t('deleteFailed'));
    }
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
        durationSec,
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

  const createPlaylistFromCanvas = async () => {
    if (!workspaceId || !canvasId) {
      toast.error(t('saveNeedCanvas'));
      return;
    }
    // Save the canvas first to ensure latest changes are persisted
    await save(true);
    try {
      const playlistName = name.trim() || 'Untitled';
      const res = await apiCreatePlaylist(workspaceId, `${playlistName} — ${t('playlistSuffix')}`);
      if (!res.ok) throw new Error('fail');
      const created = (await res.json()) as { id: string };
      // Add the canvas as the first item in the playlist
      const itemsRes = await apiUpdatePlaylistItems(workspaceId, created.id, {
        items: [{ type: 'CANVAS', canvasId, durationSec }],
      });
      if (!itemsRes.ok) throw new Error('fail-items');
      toast.success(t('playlistCreated'));
      router.push(`/${locale}/playlists/${created.id}/studio` as Route);
    } catch {
      toast.error(t('playlistCreateFailed'));
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
    setLayout((prev) => {
      pushUndo(prev);
      return JSON.parse(JSON.stringify(snap.layout));
    });
    setDw(snap.dw);
    setDh(snap.dh);
    setName(snap.name);
    setSelectedId(null);
    setShowHistory(false);
    toast.success(t('restored'));
  };

  const loadServerVersions = useCallback(async () => {
    if (!workspaceId || !canvasId) return;
    setVersionsLoading(true);
    try {
      const res = await apiFetchCanvasVersions(workspaceId, canvasId);
      if (res.ok) {
        const data = await res.json();
        setServerVersions(Array.isArray(data) ? data : (data.items ?? []));
      }
    } catch {
      // silent — server versions are supplementary
    }
    setVersionsLoading(false);
  }, [workspaceId, canvasId]);

  const restoreServerVersion = async (version: ServerVersion) => {
    if (!workspaceId || !canvasId) return;
    setRestoringVersion(true);
    try {
      const res = await apiRestoreCanvasVersion(workspaceId, canvasId, version.id);
      if (!res.ok) {
        toast.error(t('restoreFailed'));
        setRestoringVersion(false);
        return;
      }
      const restored = await res.json();
      setLayout((prev) => {
        pushUndo(prev);
        return restored.layoutData ?? emptyLayout();
      });
      setDw(restored.width ?? 1920);
      setDh(restored.height ?? 1080);
      setName(restored.name ?? 'Untitled');
      setSelectedId(null);
      setShowHistory(false);
      toast.success(t('restored'));
      void loadServerVersions();
    } catch {
      toast.error(t('restoreFailed'));
    }
    setRestoringVersion(false);
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

  useEffect(() => {
    if (showHistory && canvasId && workspaceId) {
      void loadServerVersions();
    }
  }, [showHistory, canvasId, workspaceId, loadServerVersions]);

  const addZone = (preset: ZonePreset) => {
    const newObjects: CanvasObjectJson[] = preset.zones.map((z) => ({
      id: crypto.randomUUID(),
      type: 'zone' as const,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      fill: 'rgba(99, 102, 241, 0.08)',
      stroke: 'rgba(99, 102, 241, 0.6)',
      strokeWidth: 2,
      opacity: 1,
      zoneName: z.name,
      zonePlaylistId: null,
      zoneMediaId: null,
    }));
    setLayout((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        objects: [...prev.objects, ...newObjects],
      };
    });
    setShowZones(false);
    toast.success(t('zonesAdded'));
  };

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
    setLayout((prev) => {
      pushUndo(prev);
      return {
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
      };
    });
    setSelectedId(id);
  };

  const addRect = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => {
      pushUndo(prev);
      return {
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
      };
    });
    setSelectedId(id);
  };

  const addEllipse = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => {
      pushUndo(prev);
      return {
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
      };
    });
    setSelectedId(id);
  };

  const addLine = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        objects: [
          ...prev.objects,
          {
            id,
            type: 'line',
            x: 200,
            y: 300,
            points: [0, 0, 300, 0],
            stroke: 'hsl(var(--primary))',
            strokeWidth: 4,
            opacity: 1,
          },
        ],
      };
    });
    setSelectedId(id);
  };

  const addArrow = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        objects: [
          ...prev.objects,
          {
            id,
            type: 'arrow',
            x: 200,
            y: 300,
            points: [0, 0, 300, 0],
            stroke: 'hsl(var(--primary))',
            strokeWidth: 4,
            opacity: 1,
          },
        ],
      };
    });
    setSelectedId(id);
  };

  const addQrCode = () => {
    const id = crypto.randomUUID();
    setLayout((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        objects: [
          ...prev.objects,
          {
            id,
            type: 'qrcode',
            x: 350,
            y: 250,
            width: 200,
            height: 200,
            qrData: 'https://smartscreen.app',
            opacity: 1,
          },
        ],
      };
    });
    setSelectedId(id);
  };

  const handleStudioUpload = async (files: FileList) => {
    if (!workspaceId) return;
    setUploading(true);
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const res = await uploadMedia(workspaceId, file);
        if (!res.ok) {
          toast.error(t('uploadFailed'));
        }
      }
      toast.success(t('uploadSuccess'));
      await loadLibrary();
    } catch {
      toast.error(t('uploadFailed'));
    }
    setUploading(false);
  };

  const addMediaItem = (publicUrl: string, mediaId: string) => {
    const id = crypto.randomUUID();
    setLayout((prev) => {
      pushUndo(prev);
      return {
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
      };
    });
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
    addMediaItem(publicUrl, mediaId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        void save();
        takeSnapshot();
      } else if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key === 'c' && selectedId) {
        e.preventDefault();
        copyObject(selectedId);
      } else if (mod && e.key === 'v' && clipboard) {
        e.preventDefault();
        pasteObject();
      } else if (mod && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateObject(selectedId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        removeObject(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingTextId(null);
      } else if (selectedId && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const obj = layout.objects.find((o) => o.id === selectedId);
        if (!obj) return;
        if (e.key === 'ArrowUp') updateObject(selectedId, { y: obj.y - step });
        else if (e.key === 'ArrowDown') updateObject(selectedId, { y: obj.y + step });
        else if (e.key === 'ArrowLeft') updateObject(selectedId, { x: obj.x - step });
        else if (e.key === 'ArrowRight') updateObject(selectedId, { x: obj.x + step });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, canvasId, layout, name, dw, dh, clipboard, undo, redo, copyObject, pasteObject, duplicateObject]);

  if (!workspaceId) {
    return <p className="text-muted-foreground">{t('needWorkspace')}</p>;
  }

  // Viewer permission guard — Studio is Owner/Editor only
  if (viewerBlocked) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-border p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-base font-semibold">{t('viewerNoAccess')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('viewerNoAccessDesc')}</p>
        </div>
      </div>
    );
  }

  // Mobile guard — Studio is desktop-only
  if (viewportWidth < 768) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-border p-8 text-center">
        <MonitorOff className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-base font-semibold">{t('mobileNotSupported')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('mobileNotSupportedDesc')}</p>
        </div>
      </div>
    );
  }

  // Load error state
  if (loadError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-border p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-1">
          <p className="text-base font-semibold">{t('loadErrorTitle')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('loadErrorDesc')}</p>
        </div>
        <Button variant="outline" onClick={() => { setLoadError(false); void loadCanvases(); }}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  // Splash screen during initial load
  if (splashVisible) {
    const isDark = resolvedTheme !== 'light';
    const logoSrc = resolveStaticBrandingLogoPath(locale as 'ar' | 'en', isDark);
    return (
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: [0, 0, 0.2, 1] }}
        role="status"
        aria-live="polite"
        className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg bg-neutral-900 p-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Smart Screen" className="max-h-12 w-auto object-contain" />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('loadingStudio')}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label={t('title')}>
      {/* Tablet warning */}
      {viewportWidth >= 768 && viewportWidth < 1024 && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{t('tabletWarning')}</p>
        </div>
      )}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-card-surface rounded-lg border border-border p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Label htmlFor="canvas-select">{t('canvasSelect')}</Label>
            <select
              id="canvas-select"
              className="h-11 w-full max-w-md rounded-lg border border-border bg-card px-4 text-[15px] outline-none focus:ring-4 focus:ring-primary/15"
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
              <Plus className="me-2 h-4 w-4" />
              {t('newCanvas')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={undo}
              title={t('undo')}
              aria-label={t('undo')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={redo}
              title={t('redo')}
              aria-label={t('redo')}
            >
              <RotateCcw className="h-4 w-4 scale-x-[-1]" />
            </Button>
            {selectedId && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => duplicateObject(selectedId)}
                  title={t('duplicate')}
                  aria-label={t('duplicate')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => copyObject(selectedId)}
                  title={t('copy')}
                  aria-label={t('copy')}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </>
            )}
            {clipboard && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={pasteObject}
                title={t('paste')}
                aria-label={t('paste')}
              >
                <Clipboard className="h-4 w-4 text-primary" />
              </Button>
            )}
            {canvasId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                title={t('deleteCanvas')}
                aria-label={t('deleteCanvas')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowZones((v) => !v)}
            >
              <SquareStack className="me-2 h-4 w-4" />
              {t('zones')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplates((v) => !v)}
            >
              <LayoutTemplate className="me-2 h-4 w-4" />
              {t('templates')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canvasId || snapshots.length === 0}
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="me-2 h-4 w-4" />
              {t('history')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canvasId}
              onClick={() => setShowPreview(true)}
            >
              <Play className="me-2 h-4 w-4" />
              {t('preview')}
            </Button>
            <Button type="button" variant="cta" disabled={!canvasId || saving} aria-busy={saving} onClick={() => { void save(); takeSnapshot(); }}>
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
              {saving ? t('saving') : t('save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canvasId || viewerBlocked}
              onClick={() => void createPlaylistFromCanvas()}
            >
              <Clapperboard className="me-2 h-4 w-4" />
              {t('createPlaylist')}
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
            <Label className="text-xs text-muted-foreground">{t('duration')}</Label>
            <Input
              type="number"
              className="h-10 w-24"
              value={durationSec}
              min={5}
              max={3600}
              onChange={(e) => setDurationSec(Number(e.target.value) || 15)}
            />
            <span className="text-xs text-muted-foreground">s</span>
          </div>
        </div>
      </motion.div>

      {autoSavedAt && (
        <p className="text-xs text-muted-foreground">
          {t('autoSavedAt')}{' '}
          {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(autoSavedAt)}
        </p>
      )}

      {showZones && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vc-card-surface rounded-lg border border-border p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">{t('zonePresets')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {makeZonePresets(dw, dh).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => addZone(preset)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 text-center transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="relative h-16 w-24 overflow-hidden rounded border border-border/40 bg-background">
                  {preset.zones.map((z, i) => (
                    <div
                      key={i}
                      className="absolute border border-primary/50 bg-primary/10"
                      style={{
                        left: `${(z.x / dw) * 100}%`,
                        top: `${(z.y / dh) * 100}%`,
                        width: `${(z.width / dw) * 100}%`,
                        height: `${(z.height / dh) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-foreground">
                  {locale === 'ar' ? preset.nameAr : preset.name}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {showTemplates && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vc-card-surface rounded-lg border border-border p-5 shadow-sm"
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
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vc-card-surface rounded-lg border border-border p-5 shadow-sm"
          role="region"
          aria-label={t('versionHistory')}
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

          {/* Server versions (saved on each canvas update) */}
          {serverVersions.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('savedVersions')}</p>
              <ul className="space-y-2" role="list">
                {serverVersions.map((ver) => (
                  <li
                    key={ver.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">{ver.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(ver.createdAt))}
                        {ver.savedBy?.fullName ? ` · ${ver.savedBy.fullName}` : ''}
                        {' · '}
                        {ver.width}×{ver.height}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      disabled={restoringVersion}
                      onClick={() => void restoreServerVersion(ver)}
                    >
                      <RotateCcw className="me-1 h-3.5 w-3.5" />
                      {restoringVersion ? t('restoring') : t('restore')}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {versionsLoading && (
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('loadingVersions')}
            </div>
          )}

          {/* Local snapshots (browser localStorage) */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('localSnapshots')}</p>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noSnapshots')}</p>
          ) : (
            <ul className="space-y-2" role="list">
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
                      <RotateCcw className="me-1 h-3.5 w-3.5" />
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

      <div className="grid gap-4 md:gap-6 md:grid-cols-[240px_minmax(0,1fr)_260px] lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* Left: Media Panel */}
        <StudioMediaPanel library={library} onAddMedia={addMediaItem} onUpload={handleStudioUpload} uploading={uploading} />

        {/* Center: Canvas + Tools */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-2" role="toolbar" aria-label={t('insertTools')}>
            <Button type="button" size="sm" variant="ghost" onClick={addText}>
              <Type className="me-1 h-4 w-4 text-primary" />
              {t('toolText')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addRect}>
              <Shapes className="me-1 h-4 w-4 text-primary" />
              {t('toolRect')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addEllipse}>
              <CircleIcon className="me-1 h-4 w-4 text-primary" />
              {t('toolEllipse')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addLine}>
              <Minus className="me-1 h-4 w-4 text-primary" />
              {t('toolLine')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addArrow}>
              <ArrowRight className="me-1 h-4 w-4 text-primary" />
              {t('toolArrow')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={addQrCode}>
              <QrCode className="me-1 h-4 w-4 text-primary" />
              {t('toolQrCode')}
            </Button>
          </div>

          <motion.div
            layout
            role="application"
            aria-label={t('canvasArea')}
            className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-primary/15 bg-neutral-900 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{ minHeight: 420, cursor: isPanning ? 'grabbing' : 'default' }}
            onMouseDown={(e) => {
              if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                e.preventDefault();
                setIsPanning(true);
                panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setPanOffset({
                  x: panStartRef.current.ox + (e.clientX - panStartRef.current.x),
                  y: panStartRef.current.oy + (e.clientY - panStartRef.current.y),
                });
              }
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                setZoomLevel((z) => Math.max(0.2, Math.min(z * delta, 5)));
              }
            }}
          >
            <CanvasStageView
              size={size}
              ox={ox}
              oy={oy}
              scale={scale}
              dw={dw}
              dh={dh}
              layout={layout}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateObject={updateObject}
              onStageClick={() => setSelectedId(null)}
              onTextDblClick={(id) => setEditingTextId(id)}
              onDrop={onDropMedia}
              onDragOver={onDragOver}
              containerRef={containerRef}
              dropHint={t('dropHint')}
            />
            {editingTextId && selected && selected.type === 'text' && (
              <textarea
                autoFocus
                className="absolute z-50 rounded-md border-2 border-primary bg-background px-2 py-1 text-foreground shadow-lg outline-none"
                style={{
                  left: ox + selected.x * scale + 32,
                  top: oy + selected.y * scale + 32,
                  width: Math.max((selected.width ?? 200) * scale, 120),
                  height: Math.max((selected.height ?? 60) * scale, 40),
                  fontSize: (selected.fontSize ?? 48) * scale,
                  fontFamily: selected.fontFamily ?? 'inherit',
                  fontStyle: selected.fontStyle ?? 'normal',
                  textAlign: selected.align ?? 'left',
                  color: selected.fill ?? 'inherit',
                  lineHeight: 1.2,
                  resize: 'none',
                  overflow: 'hidden',
                }}
                value={selected.text ?? ''}
                onChange={(e) => updateObject(editingTextId, { text: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingTextId(null);
                  }
                  e.stopPropagation();
                }}
              />
            )}
            {layout.objects.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
                <p className="text-sm font-medium">{t('emptyCanvasHint')}</p>
              </div>
            )}
            <p className="pointer-events-none absolute bottom-3 start-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
              {t('dropHint')}
            </p>
            <div className="absolute end-3 top-3 flex flex-col gap-1 rounded-xl border border-white/10 bg-black/60 p-1 backdrop-blur-sm">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                onClick={zoomIn}
                title={t('zoomIn')}
                aria-label={t('zoomIn')}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="text-center text-[10px] font-medium text-white/50">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                onClick={zoomOut}
                title={t('zoomOut')}
                aria-label={t('zoomOut')}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                onClick={zoomFit}
                title={t('zoomFit')}
                aria-label={t('zoomFit')}
              >
                <Maximize className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                onClick={zoomReset}
                title={t('zoomReset')}
                aria-label={t('zoomReset')}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right: Layers + Properties Panel */}
        <div className="flex min-h-0 flex-col gap-4" role="region" aria-label={t('properties')}>
          <StudioLayersPanel
            objects={layout.objects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorderObject}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
          />
          <StudioPropertiesPanel
            selected={selected}
            onUpdateObject={updateObject}
            onRemoveObject={removeObject}
            playlists={studioPlaylists}
          />
        </div>
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-neutral-900"
          role="dialog"
          aria-label={t('preview')}
          onClick={() => setShowPreview(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowPreview(false); }}
          tabIndex={-1}
        >
          <button
            type="button"
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            aria-label={t('exitPreview')}
            onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}
          >
            <X className="h-5 w-5" />
          </button>
          <CanvasStageView
            size={{ w: window.innerWidth, h: window.innerHeight }}
            ox={(window.innerWidth - dw * Math.min(window.innerWidth / dw, window.innerHeight / dh)) / 2}
            oy={(window.innerHeight - dh * Math.min(window.innerWidth / dw, window.innerHeight / dh)) / 2}
            scale={Math.min(window.innerWidth / dw, window.innerHeight / dh)}
            dw={dw}
            dh={dh}
            layout={layout}
            selectedId={null}
            onSelect={() => {}}
            onUpdateObject={() => {}}
            onStageClick={() => {}}
            onDrop={() => {}}
            onDragOver={() => {}}
            containerRef={containerRef}
            dropHint=""
            readOnly
          />
        </div>
      )}

      {/* Delete canvas confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { void deleteCanvas(); setShowDeleteDialog(false); }}
            >
              {t('deleteCanvas')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unsavedChangesTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('unsavedChangesDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { void save().then(() => { setShowUnsavedDialog(false); }); }}>
              {t('save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
