'use client';

import { Moon, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('userMenu');
  const isDark = resolvedTheme !== 'light';
  const prefersReduced = useReducedMotion();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('switchToLight') : t('switchToDark')}
      className="h-8 w-8 shrink-0 rounded-lg border-border bg-card transition hover:bg-muted"
      suppressHydrationWarning
    >
      <motion.span
        className="flex items-center justify-center"
        key={isDark ? 'dark' : 'light'}
        initial={prefersReduced ? false : { scale: 0.9, rotate: -20, opacity: 0.7 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={prefersReduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 26 }}
      >
        {isDark ? (
          <Moon className="h-5 w-5 text-primary" strokeWidth={2} />
        ) : (
          <Sun className="h-5 w-5 text-primary" strokeWidth={2} />
        )}
      </motion.span>
    </Button>
  );
}
