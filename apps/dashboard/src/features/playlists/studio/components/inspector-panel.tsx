'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  Monitor, Smartphone, Square, Layout as LayoutIcon, MonitorPlay, Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  type TransitionType,
  type PlaylistLocalMeta,
  TRANSITIONS,
} from '@/features/playlists/playlist-transitions';
import type { ZonePreset, SelectionContext, Row } from '../types';

type InspectorPanelProps = {
  selectionContext: SelectionContext;
  playlistMeta: PlaylistLocalMeta;
  updatePlaylistMeta: (patch: Partial<PlaylistLocalMeta>) => void;
  selectedZonePreset: ZonePreset | null;
  setSelectedZonePreset: (preset: ZonePreset | null) => void;
  zonePresets: ZonePreset[];
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string) => void;
  presetW: number;
  presetH: number;
  selectedRow: Row | null;
  onUpdateRowTransition?: (clientId: string, transition: TransitionType) => void;
  onUpdateRowDuration?: (clientId: string, value: number) => void;
};

export function InspectorPanel({
  selectionContext,
  playlistMeta,
  updatePlaylistMeta,
  selectedZonePreset,
  setSelectedZonePreset,
  zonePresets,
  selectedZoneId,
  setSelectedZoneId,
  presetW,
  presetH,
  selectedRow,
  onUpdateRowTransition,
  onUpdateRowDuration,
}: InspectorPanelProps) {
  const t = useTranslations('playlistStudioClient');
  const locale = useLocale();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {t('inspector')}
        </h3>
      </div>

      {/* Playlist-level settings */}
      {(selectionContext === 'playlist' || selectionContext === 'zone') && (
        <>
          <div className="space-y-2 border-b border-border/40 pb-4">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('orientation')}</Label>
            <div className="flex items-center gap-1">
              {([
                { id: 'landscape' as const, icon: Monitor },
                { id: 'portrait' as const, icon: Smartphone },
                { id: 'square' as const, icon: Square },
              ]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePlaylistMeta({ orientation: opt.id })}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                      playlistMeta.orientation === opt.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    )}
                    title={opt.id}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 border-b border-border/40 pb-4">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('layoutType')}</Label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updatePlaylistMeta({ layoutType: 'single' })}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all',
                  playlistMeta.layoutType === 'single'
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <LayoutIcon className="h-3.5 w-3.5" />
                {t('singleZone')}
              </button>
              <button
                type="button"
                onClick={() => updatePlaylistMeta({ layoutType: 'multi_zone' })}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all',
                  playlistMeta.layoutType === 'multi_zone'
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <MonitorPlay className="h-3.5 w-3.5" />
                {t('multiZone')}
              </button>
            </div>
          </div>

          {playlistMeta.layoutType === 'multi_zone' && (
            <div className="space-y-2 border-b border-border/40 pb-4">
              <Label className="text-[11px] font-medium text-muted-foreground">{t('zonePreset')}</Label>
              <select
                className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-primary/40"
                value={selectedZonePreset?.id ?? ''}
                onChange={(e) => {
                  const preset = zonePresets.find((z) => z.id === e.target.value) ?? null;
                  setSelectedZonePreset(preset);
                  if (preset) setSelectedZoneId(preset.zones[0]?.name ?? '');
                }}
              >
                <option value="">{t('choosePreset')}</option>
                {zonePresets.map((z) => (
                  <option key={z.id} value={z.id}>{locale === 'ar' ? z.nameAr : z.name}</option>
                ))}
              </select>

              {selectedZonePreset && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <div className="relative h-10 w-16 overflow-hidden rounded-md border border-border/40 bg-background">
                    {selectedZonePreset.zones.map((z, i) => (
                      <div
                        key={i}
                        className={cn(
                          'absolute border',
                          selectedZoneId === z.name ? 'border-primary bg-primary/30' : 'border-emerald-500/50 bg-emerald-500/15',
                        )}
                        style={{
                          left: `${(z.x / presetW) * 100}%`,
                          top: `${(z.y / presetH) * 100}%`,
                          width: `${(z.width / presetW) * 100}%`,
                          height: `${(z.height / presetH) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedZonePreset.zones.map((z, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedZoneId(z.name)}
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[11px] font-medium transition',
                          selectedZoneId === z.name ? 'bg-primary text-white' : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400',
                        )}
                      >
                        {z.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 border-b border-border/40 pb-4">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('transitionLabel')}</Label>
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <select
                className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-primary/40"
                value={playlistMeta.defaultTransition}
                onChange={(e) => updatePlaylistMeta({ defaultTransition: e.target.value as TransitionType })}
              >
                {TRANSITIONS.map((tr) => (
                  <option key={tr.id} value={tr.id}>{locale === 'ar' ? tr.nameAr : tr.nameEn}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0.2} max={2} step={0.1}
                value={playlistMeta.transitionDuration}
                onChange={(e) => updatePlaylistMeta({ transitionDuration: Number(e.target.value) })}
                className="h-1.5 flex-1 cursor-pointer accent-primary"
              />
              <span className="font-mono-nums text-[11px] text-muted-foreground">{playlistMeta.transitionDuration.toFixed(1)}s</span>
            </div>
          </div>
        </>
      )}

      {/* Item-level settings */}
      {selectionContext === 'item' && selectedRow && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedRow.kind === 'media' ? selectedRow.media.originalName : selectedRow.canvas.name}
            </p>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {selectedRow.kind === 'media' ? t('media') : t('canvas')}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('durationSec')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm font-mono-nums outline-none focus:border-primary/40"
                value={selectedRow.durationSec}
                onChange={(e) => onUpdateRowDuration?.(selectedRow.clientId, Number(e.target.value) || 1)}
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground">{t('transitionLabel')}</Label>
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <select
                className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium outline-none focus:border-primary/40"
                value={selectedRow.transition ?? playlistMeta.defaultTransition}
                onChange={(e) => onUpdateRowTransition?.(selectedRow.clientId, e.target.value as TransitionType)}
              >
                {TRANSITIONS.map((tr) => (
                  <option key={tr.id} value={tr.id}>{locale === 'ar' ? tr.nameAr : tr.nameEn}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {selectionContext === 'item' && !selectedRow && (
        <p className="py-4 text-center text-xs text-muted-foreground">{t('noItemSelected')}</p>
      )}
    </div>
  );
}
