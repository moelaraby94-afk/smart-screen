'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <Toaster
      richColors
      expand
      closeButton
      position={isRtl ? 'top-left' : 'top-right'}
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      aria-live="polite"
      style={{ zIndex: 'var(--z-toast)' }}
      toastOptions={{
        classNames: {
          toast:
            'border border-border/80 bg-card/95 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(255,107,0,0.12)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)]',
        },
      }}
    />
  );
}
