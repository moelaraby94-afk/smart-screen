export type TransitionType =
  | 'none'
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'zoomIn'
  | 'zoomOut'
  | 'flip'
  | 'cube'
  | 'dissolve'
  | 'wipe'
  | 'push'
  | 'reveal'
  | 'blur'
  | 'rotate';

export type TransitionDirection = 'in' | 'out';

export type TransitionConfig = {
  type: TransitionType;
  duration: number;
};

export type TransitionDef = {
  id: TransitionType;
  nameEn: string;
  nameAr: string;
  icon: string;
  group: 'basic' | 'slide' | 'scale' | 'effect' | '3d';
};

export const TRANSITIONS: TransitionDef[] = [
  { id: 'none', nameEn: 'None', nameAr: 'بدون', icon: 'Minus', group: 'basic' },
  { id: 'fade', nameEn: 'Fade', nameAr: 'تلاشي', icon: 'Circle', group: 'basic' },
  { id: 'dissolve', nameEn: 'Dissolve', nameAr: 'ذوبان', icon: 'Sparkles', group: 'basic' },
  { id: 'blur', nameEn: 'Blur', nameAr: 'ضبابية', icon: 'Aperture', group: 'effect' },
  { id: 'slideLeft', nameEn: 'Slide Left', nameAr: 'انزلاق يسار', icon: 'ArrowLeft', group: 'slide' },
  { id: 'slideRight', nameEn: 'Slide Right', nameAr: 'انزلاق يمين', icon: 'ArrowRight', group: 'slide' },
  { id: 'slideUp', nameEn: 'Slide Up', nameAr: 'انزلاق لأعلى', icon: 'ArrowUp', group: 'slide' },
  { id: 'slideDown', nameEn: 'Slide Down', nameAr: 'انزلاق لأسفل', icon: 'ArrowDown', group: 'slide' },
  { id: 'push', nameEn: 'Push', nameAr: 'دفع', icon: 'ChevronsRight', group: 'slide' },
  { id: 'reveal', nameEn: 'Reveal', nameAr: 'كشف', icon: 'Eye', group: 'slide' },
  { id: 'wipe', nameEn: 'Wipe', nameAr: 'مسح', icon: 'Eraser', group: 'slide' },
  { id: 'zoomIn', nameEn: 'Zoom In', nameAr: 'تكبير', icon: 'ZoomIn', group: 'scale' },
  { id: 'zoomOut', nameEn: 'Zoom Out', nameAr: 'تصغير', icon: 'ZoomOut', group: 'scale' },
  { id: 'flip', nameEn: 'Flip', nameAr: 'قلب', icon: 'FlipHorizontal', group: '3d' },
  { id: 'cube', nameEn: 'Cube', nameAr: 'مكعب', icon: 'Box', group: '3d' },
  { id: 'rotate', nameEn: 'Rotate', nameAr: 'تدوير', icon: 'RotateCw', group: '3d' },
];

export const TRANSITION_GROUPS: Array<{ id: string; nameEn: string; nameAr: string }> = [
  { id: 'basic', nameEn: 'Basic', nameAr: 'أساسية' },
  { id: 'slide', nameEn: 'Slide', nameAr: 'انزلاق' },
  { id: 'scale', nameEn: 'Scale', nameAr: 'تكبير/تصغير' },
  { id: 'effect', nameEn: 'Effects', nameAr: 'تأثيرات' },
  { id: '3d', nameEn: '3D', nameAr: 'ثلاثي الأبعاد' },
];

export function getTransitionDef(id: TransitionType): TransitionDef | undefined {
  return TRANSITIONS.find((t) => t.id === id);
}

export type FramerMotionVariant = {
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  exit: Record<string, number | string>;
};

export function getMotionVariant(
  type: TransitionType,
  duration: number = 0.6,
): { initial: Record<string, number>; animate: Record<string, number>; exit: Record<string, number>; transition: { duration: number; ease: [number, number, number, number] } } {
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const d = duration;

  switch (type) {
    case 'fade':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'dissolve':
      return {
        initial: { opacity: 0, scale: 1.05 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: d, ease: ease },
      };
    case 'blur':
      return {
        initial: { opacity: 0, filter: 'blur(20px)' as unknown as number },
        animate: { opacity: 1, filter: 'blur(0px)' as unknown as number },
        exit: { opacity: 0, filter: 'blur(20px)' as unknown as number },
        transition: { duration: d, ease: ease },
      };
    case 'slideLeft':
      return {
        initial: { x: 300, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -300, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'slideRight':
      return {
        initial: { x: -300, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 300, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'slideUp':
      return {
        initial: { y: 300, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -300, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'slideDown':
      return {
        initial: { y: -300, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 300, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'push':
      return {
        initial: { x: '100%' as unknown as number, opacity: 0.5 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '-100%' as unknown as number, opacity: 0.5 },
        transition: { duration: d, ease: ease },
      };
    case 'reveal':
      return {
        initial: { clipPath: 'inset(0 100% 0 0)' as unknown as number },
        animate: { clipPath: 'inset(0 0% 0 0)' as unknown as number },
        exit: { clipPath: 'inset(0 0 0 100%)' as unknown as number },
        transition: { duration: d, ease: ease },
      };
    case 'wipe':
      return {
        initial: { clipPath: 'inset(0 0 100% 0)' as unknown as number },
        animate: { clipPath: 'inset(0 0 0% 0)' as unknown as number },
        exit: { clipPath: 'inset(100% 0 0 0)' as unknown as number },
        transition: { duration: d, ease: ease },
      };
    case 'zoomIn':
      return {
        initial: { scale: 0.3, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1.5, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'zoomOut':
      return {
        initial: { scale: 1.5, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.3, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'flip':
      return {
        initial: { rotateY: 90, opacity: 0 },
        animate: { rotateY: 0, opacity: 1 },
        exit: { rotateY: -90, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'cube':
      return {
        initial: { rotateY: 45, x: 200, opacity: 0 },
        animate: { rotateY: 0, x: 0, opacity: 1 },
        exit: { rotateY: -45, x: -200, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'rotate':
      return {
        initial: { rotate: 15, scale: 0.8, opacity: 0 },
        animate: { rotate: 0, scale: 1, opacity: 1 },
        exit: { rotate: -15, scale: 1.2, opacity: 0 },
        transition: { duration: d, ease: ease },
      };
    case 'none':
    default:
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0, ease: ease },
      };
  }
}

export type PlaylistOrientation = 'landscape' | 'portrait' | 'square';

export type PlaylistLayoutType = 'single' | 'multi_zone';

export type PlaylistLocalMeta = {
  orientation: PlaylistOrientation;
  layoutType: PlaylistLayoutType;
  defaultTransition: TransitionType;
  transitionDuration: number;
};

export const DEFAULT_PLAYLIST_META: PlaylistLocalMeta = {
  orientation: 'landscape',
  layoutType: 'single',
  defaultTransition: 'fade',
  transitionDuration: 0.6,
};

const STORAGE_PREFIX = 'playlist-meta:';

export function loadPlaylistMeta(playlistId: string): PlaylistLocalMeta {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${playlistId}`);
    if (!raw) return DEFAULT_PLAYLIST_META;
    const parsed = JSON.parse(raw) as Partial<PlaylistLocalMeta>;
    return { ...DEFAULT_PLAYLIST_META, ...parsed };
  } catch {
    return DEFAULT_PLAYLIST_META;
  }
}

export function savePlaylistMeta(playlistId: string, meta: PlaylistLocalMeta): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${playlistId}`, JSON.stringify(meta));
  } catch {
    /* quota */
  }
}

const ITEM_TRANSITION_PREFIX = 'playlist-item-tr:';

export function itemTransitionKey(kind: string, mediaId: string | undefined, canvasId: string | undefined, orderIndex: number): string {
  return `${kind}:${mediaId ?? canvasId ?? 'unknown'}:${orderIndex}`;
}

export function loadItemTransition(playlistId: string, key: string): TransitionType | null {
  try {
    const raw = localStorage.getItem(`${ITEM_TRANSITION_PREFIX}${playlistId}:${key}`);
    if (!raw) return null;
    return raw as TransitionType;
  } catch {
    return null;
  }
}

export function saveItemTransition(playlistId: string, key: string, transition: TransitionType): void {
  try {
    localStorage.setItem(`${ITEM_TRANSITION_PREFIX}${playlistId}:${key}`, transition);
  } catch {
    /* quota */
  }
}
