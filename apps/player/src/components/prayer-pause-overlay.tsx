'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type PrayerPauseOverlayProps = {
  prayer: string | null;
  remainingMinutes: number;
};

export function PrayerPauseOverlay({
  prayer,
  remainingMinutes,
}: PrayerPauseOverlayProps) {
  const prefersReduced = useReducedMotion();
  return (
    <AnimatePresence>
      <motion.div
        key="prayer-pause"
        className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReduced ? undefined : { opacity: 0 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.5 }}
      >
        <div className="text-center">
          <div className="mb-4 text-6xl">🕌</div>
          <h2 className="text-2xl font-semibold text-white/90">
            {prayer ? `Prayer Time — ${prayer}` : 'Prayer Time'}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Content paused for prayer
            {remainingMinutes > 0
              ? ` · ${remainingMinutes} min remaining`
              : ''}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
