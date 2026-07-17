'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Layout as LayoutIcon,
  Monitor,
  Smartphone,
  Square,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  type PlaylistOrientation,
  type PlaylistLayoutType,
  type TransitionType,
} from '@/features/playlists/playlist-transitions';
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from '@/features/studio/canvas-templates';
import { makeZonePresets, type ZonePreset } from '@/features/studio/canvas-layout';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    orientation: PlaylistOrientation;
    layoutType: PlaylistLayoutType;
    templateId?: string;
    zonePresetId?: string;
    defaultTransition: TransitionType;
  }) => void;
};

const STEPS = ['name', 'layout', 'template', 'transition'] as const;
type Step = (typeof STEPS)[number];

export function PlaylistCreateWizard({ open, onClose, onCreate }: Props) {
  const t = useTranslations('playlistWizard');
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [orientation, setOrientation] = useState<PlaylistOrientation>('landscape');
  const [layoutType, setLayoutType] = useState<PlaylistLayoutType>('single');
  const [selectedTemplate, setSelectedTemplate] = useState<CanvasTemplate | null>(null);
  const [selectedZonePreset, setSelectedZonePreset] = useState<ZonePreset | null>(null);
  const [defaultTransition, setDefaultTransition] = useState<TransitionType>('fade');

  const reset = () => {
    setStep('name');
    setName('');
    setOrientation('landscape');
    setLayoutType('single');
    setSelectedTemplate(null);
    setSelectedZonePreset(null);
    setDefaultTransition('fade');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    await onCreate({
      name: name.trim() || 'Untitled Playlist',
      orientation,
      layoutType,
      templateId: selectedTemplate?.id,
      zonePresetId: layoutType === 'multi_zone' ? selectedZonePreset?.id : undefined,
      defaultTransition,
    });
    reset();
    onClose();
  };

  const stepIndex = STEPS.indexOf(step);
  const canProceed = step === 'name' ? name.trim().length > 0 : true;

  const orientationOptions: Array<{
    id: PlaylistOrientation;
    icon: typeof Monitor;
    label: string;
    labelAr: string;
  }> = [
    { id: 'landscape', icon: Monitor, label: 'Landscape', labelAr: 'أفقي' },
    { id: 'portrait', icon: Smartphone, label: 'Portrait', labelAr: 'عمودي' },
    { id: 'square', icon: Square, label: 'Square', labelAr: 'مربع' },
  ];

  const presetW = orientation === 'portrait' ? 1080 : orientation === 'square' ? 1080 : 1920;
  const presetH = orientation === 'portrait' ? 1920 : orientation === 'square' ? 1080 : 1080;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-overlay flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{t('createPlaylist')}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t('step')} {stepIndex + 1} / {STEPS.length} — {t(`${step}Title`)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 px-6 py-3">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    i <= stepIndex ? 'bg-primary' : 'bg-muted',
                  )}
                />
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence mode="wait">
                {step === 'name' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="wizard-name">{t('playlistName')}</Label>
                      <Input
                        id="wizard-name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('namePlaceholder')}
                        className="h-12 rounded-2xl text-base"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && name.trim()) setStep('layout');
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>{t('orientation')}</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {orientationOptions.map((opt) => {
                          const Icon = opt.icon;
                          const active = orientation === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setOrientation(opt.id)}
                              className={cn(
                                'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200',
                                active
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border hover:border-primary/30 hover:bg-muted/40',
                              )}
                            >
                              <Icon
                                className={cn('h-7 w-7 transition-colors', active ? 'text-primary' : 'text-muted-foreground')}
                                strokeWidth={1.5}
                              />
                              <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-muted-foreground')}>
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'layout' && (
                  <motion.div
                    key="layout"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label>{t('layoutType')}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setLayoutType('single')}
                          className={cn(
                            'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-200',
                            layoutType === 'single'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/30 hover:bg-muted/40',
                          )}
                        >
                          <div className="flex h-16 w-24 items-center justify-center rounded-lg border-2 border-current/20 bg-muted/30">
                            <LayoutIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className={cn('text-sm font-bold', layoutType === 'single' ? 'text-primary' : 'text-foreground')}>
                              {t('singleZone')}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{t('singleZoneDesc')}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLayoutType('multi_zone')}
                          className={cn(
                            'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-200',
                            layoutType === 'multi_zone'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/30 hover:bg-muted/40',
                          )}
                        >
                          <div className="relative h-16 w-24 overflow-hidden rounded-lg border-2 border-current/20 bg-muted/30">
                            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-1">
                              <div className="rounded bg-primary/20" />
                              <div className="rounded bg-primary/10" />
                              <div className="col-span-2 rounded bg-primary/15" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className={cn('text-sm font-bold', layoutType === 'multi_zone' ? 'text-primary' : 'text-foreground')}>
                              {t('multiZone')}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{t('multiZoneDesc')}</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {layoutType === 'multi_zone' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <Label>{t('zonePreset')}</Label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {makeZonePresets(presetW, presetH).map((preset) => {
                            const active = selectedZonePreset?.id === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setSelectedZonePreset(preset)}
                                className={cn(
                                  'group flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200',
                                  active
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-primary/30 hover:bg-muted/40',
                                )}
                              >
                                <div className="relative h-14 w-20 overflow-hidden rounded border border-border/40 bg-background">
                                  {preset.zones.map((z, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        'absolute border',
                                        active ? 'border-primary/50 bg-primary/15' : 'border-indigo-400/40 bg-indigo-400/10',
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
                                <span className={cn('text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                                  {preset.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 'template' && (
                  <motion.div
                    key="template"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <Label>{t('chooseTemplate')}</Label>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        className={cn(
                          'text-xs font-medium transition',
                          selectedTemplate === null ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t('skipTemplate')}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {CANVAS_TEMPLATES.filter(
                        (tpl) =>
                          orientation === 'portrait'
                            ? tpl.width < tpl.height
                            : orientation === 'square'
                              ? tpl.width === tpl.height
                              : tpl.width > tpl.height,
                      ).map((tpl) => {
                        const active = selectedTemplate?.id === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSelectedTemplate(tpl)}
                            className={cn(
                              'group flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200',
                              active
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30 hover:bg-muted/40',
                            )}
                          >
                            <div
                              className="flex items-center justify-center rounded-lg border border-border/40 bg-gradient-to-br from-muted/40 to-muted/10"
                              style={{
                                aspectRatio: `${tpl.width} / ${tpl.height}`,
                                width: '100%',
                                maxHeight: 80,
                              }}
                            >
                              <LayoutIcon
                                className={cn('h-6 w-6 transition-colors', active ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-primary/60')}
                              />
                            </div>
                            <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>
                              {tpl.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 'transition' && (
                  <motion.div
                    key="transition"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <Label>{t('defaultTransition')}</Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {(['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoomIn', 'zoomOut', 'flip', 'cube', 'dissolve', 'blur', 'rotate'] as TransitionType[]).map((tr) => {
                        const active = defaultTransition === tr;
                        return (
                          <button
                            key={tr}
                            type="button"
                            onClick={() => setDefaultTransition(tr)}
                            className={cn(
                              'rounded-xl border-2 px-3 py-2.5 text-center transition-all duration-200',
                              active
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30 hover:bg-muted/40',
                            )}
                          >
                            <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-muted-foreground')}>
                              {t(`tr_${tr}`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (stepIndex > 0) setStep(STEPS[stepIndex - 1]!);
                  else handleClose();
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {stepIndex > 0 ? t('back') : t('cancel')}
              </Button>
              {stepIndex < STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="cta"
                  disabled={!canProceed}
                  onClick={() => setStep(STEPS[stepIndex + 1]!)}
                  className="gap-2"
                >
                  {t('next')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="cta"
                  onClick={() => void handleCreate()}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t('create')}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
