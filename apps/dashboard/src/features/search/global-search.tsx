'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Image as ImageIcon,
  Monitor,
  Clapperboard,
  Search,
  X,
  LayoutDashboard,
  AlertTriangle,
  FolderOpen,
  LayoutTemplate,
  CalendarClock,
  Activity,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fetchScreens } from '@/features/screens/api/screens-api';
import type { ScreenRow } from '@/features/screens/useApiScreens';
import { fetchMedia, type MediaItem } from '@/features/media/api/media-api';
import { fetchPlaylists } from '@/features/studio/studio-api';
import { readPageItems } from '@/features/api/page';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ICON_STROKE } from '@/lib/icon-stroke';

type SearchResult = {
  id: string;
  label: string;
  sublabel: string;
  type: 'screen' | 'playlist' | 'media' | 'command';
  href: string;
};

type NavCommand = {
  id: string;
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

type PlaylistSummary = {
  id: string;
  name: string;
  isPublished: boolean;
};

export function GlobalSearch() {
  const t = useTranslations('globalSearch');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { workspaceId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const loadAll = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [scr, med, plsRes] = await Promise.all([
        fetchScreens(workspaceId),
        fetchMedia(workspaceId),
        fetchPlaylists(workspaceId),
      ]);
      setScreens(scr);
      setMedia(med);
      if (plsRes.ok) setPlaylists(await readPageItems<PlaylistSummary>(plsRes));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (open) void loadAll();
  }, [open, loadAll]);

  const navCommands = useMemo<NavCommand[]>(() => {
    const cmds: NavCommand[] = [
      { id: 'nav-overview', labelKey: 'nav.overview', href: `/${locale}/overview`, icon: LayoutDashboard },
      { id: 'nav-screens', labelKey: 'nav.screens', href: `/${locale}/screens`, icon: Monitor },
      { id: 'nav-emergency', labelKey: 'nav.emergency', href: `/${locale}/emergency`, icon: AlertTriangle },
      { id: 'nav-media', labelKey: 'nav.media', href: `/${locale}/media`, icon: FolderOpen },
      { id: 'nav-templates', labelKey: 'nav.templates', href: `/${locale}/templates`, icon: LayoutTemplate },
      { id: 'nav-playlists', labelKey: 'nav.playlists', href: `/${locale}/content/playlists`, icon: Clapperboard },
      { id: 'nav-schedules', labelKey: 'nav.schedules', href: `/${locale}/schedules`, icon: CalendarClock },
      { id: 'nav-analytics', labelKey: 'nav.analytics', href: `/${locale}/analytics`, icon: Activity },
      { id: 'nav-ai', labelKey: 'nav.ai', href: `/${locale}/ai`, icon: Sparkles },
      { id: 'nav-team', labelKey: 'nav.team', href: `/${locale}/team`, icon: Users },
    ];
    return cmds;
  }, [locale]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matched: SearchResult[] = [];

    for (const cmd of navCommands) {
      const label = tNav(cmd.labelKey).toLowerCase();
      if (label.includes(q)) {
        matched.push({
          id: cmd.id,
          label: tNav(cmd.labelKey),
          sublabel: t('goTo'),
          type: 'command',
          href: cmd.href,
        });
      }
    }

    for (const s of screens) {
      if (
        s.name.toLowerCase().includes(q) ||
        s.serialNumber.toLowerCase().includes(q) ||
        (s.location ?? '').toLowerCase().includes(q)
      ) {
        matched.push({
          id: s.id,
          label: s.name,
          sublabel: s.serialNumber,
          type: 'screen',
          href: `/${locale}/screens/${s.id}` as string,
        });
      }
    }

    for (const p of playlists) {
      if (p.name.toLowerCase().includes(q)) {
        matched.push({
          id: p.id,
          label: p.name,
          sublabel: p.isPublished ? t('published') : t('unpublished'),
          type: 'playlist',
          href: `/${locale}/playlists` as string,
        });
      }
    }

    for (const m of media) {
      if (m.originalName.toLowerCase().includes(q)) {
        matched.push({
          id: m.id,
          label: m.originalName,
          sublabel: m.mimeType,
          type: 'media',
          href: `/${locale}/media` as string,
        });
      }
    }

    return matched.slice(0, 12);
  }, [query, screens, playlists, media, locale, t, tNav, navCommands]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      router.push(results[activeIndex].href as Route);
      setOpen(false);
    }
  };

  const iconForType = (type: SearchResult['type']) => {
    if (type === 'screen') return <Monitor className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />;
    if (type === 'playlist') return <Clapperboard className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />;
    if (type === 'command') return <Search className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />;
    return <ImageIcon className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 lg:flex"
        aria-label={t('openSearch')}
      >
        <Search className="h-4 w-4" strokeWidth={ICON_STROKE} />
        <span className="text-xs">{t('placeholder')}</span>
        <kbd className="ms-4 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
        aria-label={t('openSearch')}
      >
        <Search className="h-4 w-4" strokeWidth={ICON_STROKE} />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-overlay bg-black/50 backdrop-blur-sm"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReduced ? undefined : { opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-label={t('close')}
            />
            <motion.div
              className="fixed left-1/2 top-[15%] z-command w-full max-w-xl -translate-x-1/2 px-4"
              role="dialog"
              aria-modal="true"
              aria-label={t('placeholder')}
              initial={prefersReduced ? false : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -20 }}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
            >
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={ICON_STROKE} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('placeholder')}
                    aria-label={t('placeholder')}
                    className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                    aria-label={t('close')}
                  >
                    <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {t('loading')}
                    </div>
                  ) : query.trim() === '' ? (
                    <div className="py-2">
                      <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('quickNav')}
                      </p>
                      <ul role="listbox" aria-label={t('placeholder')}>
                        {navCommands.map((cmd) => (
                          <li key={cmd.id} role="option" aria-selected={false}>
                            <Link
                              href={cmd.href as Route}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-muted/40"
                            >
                              <cmd.icon className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                              <span className="flex-1 truncate font-medium">{tNav(cmd.labelKey)}</span>
                              <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('command')}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {t('noResults', { query })}
                    </div>
                  ) : (
                    <ul className="py-2" role="listbox" aria-label={t('placeholder')}>
                      {results.map((r, i) => (
                        <li key={`${r.type}-${r.id}`} role="option" aria-selected={i === activeIndex}>
                          <Link
                            href={r.href as Route}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              i === activeIndex
                                ? 'bg-primary/10 text-foreground'
                                : 'text-foreground/80 hover:bg-muted/40'
                            }`}
                            onMouseEnter={() => setActiveIndex(i)}
                          >
                            {iconForType(r.type)}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{r.label}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {r.sublabel}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t(r.type)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                  <span>{t('navigateHint')}</span>
                  <span>{t('resultsCount', { count: results.length })}</span>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
