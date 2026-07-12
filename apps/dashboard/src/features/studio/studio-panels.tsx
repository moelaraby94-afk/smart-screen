'use client';

import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
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
