'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Italic,
  Layers,
  Lock,
  Minus,
  Circle as CircleIcon,
  Search,
  Square,
  SquareStack,
  Type as TypeIcon,
  Unlock,
  Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CanvasObjectJson } from '@/features/studio/canvas-layout';

type PropertiesPanelProps = {
  selected: CanvasObjectJson | null;
  onUpdateObject: (id: string, patch: Partial<CanvasObjectJson>) => void;
  onRemoveObject: (id: string) => void;
  playlists?: Array<{ id: string; name: string }>;
};

type LayersPanelProps = {
  objects: CanvasObjectJson[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onToggleLock: (id: string, locked: boolean) => void;
};

function objectIcon(type: CanvasObjectJson['type']) {
  switch (type) {
    case 'text': return TypeIcon;
    case 'image': return ImageIcon;
    case 'rect': return Square;
    case 'ellipse': return CircleIcon;
    case 'zone': return SquareStack;
    default: return Minus;
  }
}

function objectLabel(obj: CanvasObjectJson): string {
  if (obj.type === 'text') return obj.text?.slice(0, 20) || 'Text';
  if (obj.type === 'image') return 'Image';
  if (obj.type === 'rect') return 'Rectangle';
  if (obj.type === 'ellipse') return 'Ellipse';
  if (obj.type === 'zone') return obj.zoneName || 'Zone';
  return 'Object';
}

export function StudioLayersPanel({ objects, selectedId, onSelect, onReorder, onToggleVisibility, onToggleLock }: LayersPanelProps) {
  const t = useTranslations('studio');
  const dir = useLocale() === 'ar' ? -1 : 1;
  const prefersReduced = useReducedMotion();
  const reversed = [...objects].reverse();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (fromIndex === index) return;
    const actualFrom = objects.length - 1 - fromIndex;
    const actualTo = objects.length - 1 - index;
    onReorder(actualFrom, actualTo);
  };

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, x: 20 * dir }}
      animate={{ opacity: 1, x: 0 }}
      className="vc-card-surface flex min-h-0 flex-col overflow-hidden rounded-lg border border-border p-3"
      role="listbox"
      aria-label={t('layers')}
    >
      <p className="mb-2 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Layers className="h-4 w-4 text-primary" />
        {t('layers')}
      </p>
      {objects.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{t('noLayers')}</p>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {reversed.map((obj, i) => {
            const Icon = objectIcon(obj.type);
            const isSelected = obj.id === selectedId;
            const visible = obj.opacity !== 0;
            const locked = obj.locked ?? false;
            return (
              <div
                key={obj.id}
                role="option"
                aria-selected={isSelected}
                draggable={!locked}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, i)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${
                  isSelected ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
                onClick={() => onSelect(obj.id)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{objectLabel(obj)}</span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
                  aria-label={visible ? t('hideLayer') : t('showLayer')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(obj.id, !visible);
                  }}
                >
                  {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
                  aria-label={locked ? t('unlockLayer') : t('lockLayer')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(obj.id, !locked);
                  }}
                >
                  {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

type MediaPanelProps = {
  library: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    publicUrl: string;
  }>;
  onUpload?: (files: FileList) => void;
  uploading?: boolean;
  onAddMedia?: (publicUrl: string, mediaId: string) => void;
};

export function StudioMediaPanel({ library, onUpload, uploading, onAddMedia }: MediaPanelProps) {
  const t = useTranslations('studio');
  const dir = useLocale() === 'ar' ? -1 : 1;
  const prefersReduced = useReducedMotion();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return library;
    const q = search.toLowerCase();
    return library.filter((m) => m.originalName.toLowerCase().includes(q));
  }, [library, search]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <motion.aside
      initial={prefersReduced ? false : { opacity: 0, x: -20 * dir }}
      animate={{ opacity: 1, x: 0 }}
      className="vc-card-surface flex h-full flex-col rounded-lg border border-border p-3"
      role="region"
      aria-label={t('mediaPanel')}
    >
      <p className="mb-2 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <ImageIcon className="h-4 w-4 text-primary" />
        {t('mediaPanel')}
      </p>
      <Tabs defaultValue="library" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0">
          <TabsTrigger value="library">{t('tabLibrary')}</TabsTrigger>
          <TabsTrigger value="upload">{t('tabUpload')}</TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchMedia')}
              className="h-9 ps-9"
              aria-label={t('searchMedia')}
            />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pe-1">
            {filtered.length === 0 ? (
              <p className="col-span-2 py-4 text-center text-xs text-muted-foreground">{t('noMediaInLibrary')}</p>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/canvas-media',
                      JSON.stringify({ publicUrl: m.publicUrl, mediaId: m.id }),
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAddMedia?.(m.publicUrl, m.id)}
                  className="cursor-grab overflow-hidden rounded-lg border border-border/80 bg-muted/50 transition hover:border-primary/40 hover:bg-primary/5 active:cursor-grabbing"
                >
                  {m.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.publicUrl} alt={m.originalName} className="h-20 w-full object-cover" />
                  ) : (
                    <video src={m.publicUrl} className="h-20 w-full object-cover" muted playsInline />
                  )}
                  <p className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">{m.originalName}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="upload" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          <label
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center transition hover:border-primary/40 hover:bg-primary/5"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t('dropFilesHere')}</p>
              <p className="text-xs text-muted-foreground">{t('browseFiles')}</p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
          </label>
          {uploading && (
            <p className="text-xs text-muted-foreground">{t('uploadingMedia')}</p>
          )}
        </TabsContent>
      </Tabs>
    </motion.aside>
  );
}

export function StudioPropertiesPanel({ selected, onUpdateObject, onRemoveObject, playlists }: PropertiesPanelProps) {
  const t = useTranslations('studio');
  const dir = useLocale() === 'ar' ? -1 : 1;
  const prefersReduced = useReducedMotion();

  return (
    <motion.aside
      initial={prefersReduced ? false : { opacity: 0, x: 20 * dir }}
      animate={{ opacity: 1, x: 0 }}
      className="vc-card-surface h-fit rounded-lg border border-border p-3"
    >
      <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Layers className="h-4 w-4 text-primary" />
        {t('properties')}
      </p>
      {selected ? (
        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-1">
            <Label className="text-xs">{t('position')}</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="prop-x" className="sr-only">{t('positionX')}</Label>
                <Input
                  id="prop-x"
                  type="number"
                  className="h-9"
                  value={Math.round(selected.x)}
                  onChange={(e) => onUpdateObject(selected.id, { x: Number(e.target.value) || 0 })}
                  aria-label={t('positionX')}
                />
                <span className="text-[10px] text-muted-foreground">X</span>
              </div>
              <div className="flex-1">
                <Label htmlFor="prop-y" className="sr-only">{t('positionY')}</Label>
                <Input
                  id="prop-y"
                  type="number"
                  className="h-9"
                  value={Math.round(selected.y)}
                  onChange={(e) => onUpdateObject(selected.id, { y: Number(e.target.value) || 0 })}
                  aria-label={t('positionY')}
                />
                <span className="text-[10px] text-muted-foreground">Y</span>
              </div>
            </div>
          </div>

          {/* Size (for objects with width/height) */}
          {selected.type !== 'line' && selected.type !== 'arrow' && (
            <div className="space-y-1">
              <Label className="text-xs">{t('size')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="prop-w" className="sr-only">{t('widthShort')}</Label>
                  <Input
                    id="prop-w"
                    type="number"
                    className="h-9"
                    value={Math.round(selected.width ?? 0)}
                    onChange={(e) => onUpdateObject(selected.id, { width: Number(e.target.value) || 0 })}
                    aria-label={t('widthShort')}
                  />
                  <span className="text-[10px] text-muted-foreground">W</span>
                </div>
                <div className="flex-1">
                  <Label htmlFor="prop-h" className="sr-only">{t('heightShort')}</Label>
                  <Input
                    id="prop-h"
                    type="number"
                    className="h-9"
                    value={Math.round(selected.height ?? 0)}
                    onChange={(e) => onUpdateObject(selected.id, { height: Number(e.target.value) || 0 })}
                    aria-label={t('heightShort')}
                  />
                  <span className="text-[10px] text-muted-foreground">H</span>
                </div>
              </div>
            </div>
          )}

          {/* Rotation */}
          <div className="space-y-1">
            <Label className="text-xs">{t('rotation')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={selected.rotation ?? 0}
                onChange={(e) => onUpdateObject(selected.id, { rotation: Number(e.target.value) })}
                aria-label={t('rotation')}
                className="flex-1 accent-primary"
              />
              <span className="font-mono-nums text-xs text-muted-foreground">{Math.round(selected.rotation ?? 0)}°</span>
            </div>
          </div>

          {/* Text content for text layers */}
          {selected.type === 'text' && (
            <div className="space-y-1">
              <Label htmlFor="prop-text" className="text-xs">{t('textContent')}</Label>
              <textarea
                id="prop-text"
                className="h-20 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/40"
                value={selected.text ?? ''}
                onChange={(e) => onUpdateObject(selected.id, { text: e.target.value })}
                aria-label={t('textContent')}
              />
            </div>
          )}

          {/* Fit mode for image layers */}
          {selected.type === 'image' && (
            <div className="space-y-1">
              <Label htmlFor="prop-fit" className="text-xs">{t('fitMode')}</Label>
              <select
                id="prop-fit"
                className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm"
                value={selected.fitMode ?? 'contain'}
                onChange={(e) => onUpdateObject(selected.id, { fitMode: e.target.value as 'contain' | 'cover' | 'fill' })}
                aria-label={t('fitMode')}
              >
                <option value="contain">{t('fitContain')}</option>
                <option value="cover">{t('fitCover')}</option>
                <option value="fill">{t('fitFill')}</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">{t('fill')}</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                className="h-10 w-14 cursor-pointer p-1"
                value={
                  selected.fill?.startsWith('#') ? selected.fill : 'hsl(var(--primary))'
                }
                onChange={(e) => onUpdateObject(selected.id, { fill: e.target.value })}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-primary/50 text-primary"
                onClick={() => onUpdateObject(selected.id, { fill: 'hsl(var(--primary))' })}
              >
                {t('fillNavy')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-accent/50 text-accent"
                onClick={() => onUpdateObject(selected.id, { fill: 'hsl(var(--accent))' })}
              >
                {t('fillOrange')}
              </Button>
            </div>
          </div>

          {/* Stroke (for rect, ellipse, zone, line, arrow) */}
          {(selected.type === 'rect' || selected.type === 'ellipse' || selected.type === 'zone' || selected.type === 'line' || selected.type === 'arrow') && (
            <div className="space-y-1">
              <Label className="text-xs">{t('stroke')}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  className="h-10 w-14 cursor-pointer p-1"
                  value={
                    selected.stroke?.startsWith('#') ? selected.stroke : '#000000'
                  }
                  onChange={(e) => onUpdateObject(selected.id, { stroke: e.target.value })}
                />
                <Input
                  type="number"
                  className="h-10 w-20"
                  min={0}
                  max={50}
                  value={selected.strokeWidth ?? 0}
                  onChange={(e) => onUpdateObject(selected.id, { strokeWidth: Number(e.target.value) || 0 })}
                  aria-label={t('strokeWidth')}
                />
                <span className="self-center text-xs text-muted-foreground">px</span>
              </div>
            </div>
          )}

          {/* Corner radius (for rect only) */}
          {selected.type === 'rect' && (
            <div className="space-y-1">
              <Label htmlFor="prop-radius" className="text-xs">{t('cornerRadius')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="prop-radius"
                  type="number"
                  className="h-9 w-20"
                  min={0}
                  max={200}
                  value={selected.cornerRadius ?? 0}
                  onChange={(e) => onUpdateObject(selected.id, { cornerRadius: Number(e.target.value) || 0 })}
                  aria-label={t('cornerRadius')}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">{t('opacity')}</Label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selected.opacity ?? 1}
              onChange={(e) =>
                onUpdateObject(selected.id, { opacity: Number(e.target.value) })
              }
              aria-label={t('opacity')}
              className="w-full accent-primary"
            />
          </div>
          {/* Duration (seconds) */}
          <div className="space-y-1">
            <Label htmlFor="prop-duration" className="text-xs">{t('duration')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="prop-duration"
                type="number"
                min={1}
                max={3600}
                step={1}
                value={selected.duration ?? 10}
                onChange={(e) => onUpdateObject(selected.id, { duration: Number(e.target.value) || 10 })}
                aria-label={t('duration')}
                className="h-9 w-20"
              />
              <span className="text-xs text-muted-foreground">{t('seconds')}</span>
            </div>
          </div>
          {selected.type === 'text' ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs">{t('fontSize')}</Label>
                <Input
                  type="number"
                  min={8}
                  max={400}
                  value={selected.fontSize ?? 48}
                  onChange={(e) =>
                    onUpdateObject(selected.id, { fontSize: Number(e.target.value) || 48 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('fontFamily')}</Label>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  value={selected.fontFamily ?? ''}
                  onChange={(e) => onUpdateObject(selected.id, { fontFamily: e.target.value })}
                  aria-label={t('fontFamily')}
                >
                  <option value="">{t('fontDefault')}</option>
                  <option value='Arial, sans-serif'>Arial</option>
                  <option value='Georgia, serif'>Georgia</option>
                  <option value='"Times New Roman", serif'>Times New Roman</option>
                  <option value='"Courier New", monospace'>Courier New</option>
                  <option value='Helvetica, sans-serif'>Helvetica</option>
                  <option value='"Trebuchet MS", sans-serif'>Trebuchet MS</option>
                  <option value='Verdana, sans-serif'>Verdana</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('textAlign')}</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={(selected.align ?? 'left') === 'left' ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => onUpdateObject(selected.id, { align: 'left' })}
                    aria-label={t('alignLeft')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected.align === 'center' ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => onUpdateObject(selected.id, { align: 'center' })}
                    aria-label={t('alignCenter')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected.align === 'right' ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => onUpdateObject(selected.id, { align: 'right' })}
                    aria-label={t('alignRight')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('textStyle')}</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={selected.fontStyle?.includes('bold') ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => {
                      const current = selected.fontStyle ?? 'normal';
                      const hasBold = current.includes('bold');
                      const hasItalic = current.includes('italic');
                      const next = `${hasBold ? '' : 'bold '}${hasItalic ? 'italic' : ''}`.trim() || 'normal';
                      onUpdateObject(selected.id, { fontStyle: next });
                    }}
                    aria-label={t('bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected.fontStyle?.includes('italic') ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => {
                      const current = selected.fontStyle ?? 'normal';
                      const hasBold = current.includes('bold');
                      const hasItalic = current.includes('italic');
                      const next = `${hasBold ? 'bold ' : ''}${hasItalic ? '' : 'italic'}`.trim() || 'normal';
                      onUpdateObject(selected.id, { fontStyle: next });
                    }}
                    aria-label={t('italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemoveObject(selected.id)}
          >
            {t('removeObject')}
          </Button>
          {selected.type === 'zone' && (
            <div className="space-y-3 border-t border-border/60 pt-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('zoneName')}</Label>
                <Input
                  value={selected.zoneName ?? ''}
                  onChange={(e) => onUpdateObject(selected.id, { zoneName: e.target.value })}
                  className="h-9"
                />
              </div>
              {playlists && playlists.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">{t('zonePlaylist')}</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm"
                    value={selected.zonePlaylistId ?? ''}
                    aria-label={t('zonePlaylist')}
                    onChange={(e) =>
                      onUpdateObject(selected.id, {
                        zonePlaylistId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">{t('zoneNoPlaylist')}</option>
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {selected.type === 'qrcode' && (
            <div className="space-y-3 border-t border-border/60 pt-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('qrData')}</Label>
                <Input
                  value={selected.qrData ?? ''}
                  onChange={(e) => onUpdateObject(selected.id, { qrData: e.target.value })}
                  className="h-9"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('selectLayerHint')}</p>
      )}
    </motion.aside>
  );
}
