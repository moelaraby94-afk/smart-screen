'use client';

import { motion } from 'framer-motion';

type Props = {
  serialNumber: string;
};

export function IdentifyOverlay({ serialNumber }: Props) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[200] flex items-start justify-center pt-[8vh]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="relative rounded-2xl border border-white/20 bg-black/70 px-8 py-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-cyan-200/70">
              Screen ID
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold tracking-[0.08em] text-white md:text-3xl">
              {serialNumber}
            </p>
          </div>
        </div>
        <motion.div
          className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/10"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 30, ease: 'linear' }}
        >
          <div className="h-full w-full bg-gradient-to-r from-cyan-400 to-blue-500" />
        </motion.div>
      </div>
    </motion.div>
  );
}
