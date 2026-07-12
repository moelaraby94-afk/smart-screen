'use client';

import { motion } from 'framer-motion';
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
  Minus,
  Circle as CircleIcon,
  Square,
  SquareStack,
  Type as TypeIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function StudioLayersPanel({ objects, selectedId, onSelect, onReorder, onToggleVisibility }: LayersPanelProps) {
  const t = useTranslations('studio');
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
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="vc-card-surface h-fit rounded-2xl border border-border p-5"
    >
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Layers className="h-4 w-4 text-primary" />
        {t('layers')}
      </p>
      {objects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noLayers')}</p>
      ) : (
        <ul className="space-y-1">
          {reversed.map((obj, i) => {
            const Icon = objectIcon(obj.type);
            const isSelected = obj.id === selectedId;
            const visible = obj.opacity !== 0;
            return (
              <li
                key={obj.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, i)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                  isSelected ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
                onClick={() => onSelect(obj.id)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{objectLabel(obj)}</span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(obj.id, !visible);
                  }}
                >
                  {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.aside>
  );
}

export function StudioPropertiesPanel({ selected, onUpdateObject, onRemoveObject, playlists }: PropertiesPanelProps) {
  const t = useTranslations('studio');

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="vc-card-surface h-fit rounded-2xl border border-border p-5"
    >
      <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Layers className="h-4 w-4 text-primary" />
        {t('properties')}
      </p>
      {selected ? (
        <div className="space-y-4">
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
              className="w-full accent-primary"
            />
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
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected.align === 'center' ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => onUpdateObject(selected.id, { align: 'center' })}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected.align === 'right' ? 'default' : 'outline'}
                    className="h-9 w-9 p-0"
                    onClick={() => onUpdateObject(selected.id, { align: 'right' })}
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
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('selectObject')}</p>
      )}
    </motion.aside>
  );
}

type MediaStripProps = {
  library: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    publicUrl: string;
  }>;
};

export function StudioMediaStrip({ library }: MediaStripProps) {
  const t = useTranslations('studio');

  return (
    <div className="rounded-3xl border border-border/60 bg-card/40 p-4 backdrop-blur-xl">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.5-3.5L11 18" />
        </svg>
        {t('mediaStrip')}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {library.map((m) => (
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
            className="w-28 shrink-0 cursor-grab overflow-hidden rounded-2xl border border-border/80 bg-muted/50 active:cursor-grabbing"
          >
            {m.mimeType.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.publicUrl} alt={m.originalName} className="h-20 w-full object-cover" />
            ) : (
              <video src={m.publicUrl} className="h-20 w-full object-cover" muted playsInline />
            )}
            <p className="truncate px-2 py-1 text-[10px] text-muted-foreground">{m.originalName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
