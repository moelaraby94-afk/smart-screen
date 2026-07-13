'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { devError } from '@/lib/dev-log';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ShellError({ error, reset }: Props) {
  const isArabic =
    typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('ar');

  useEffect(() => {
    devError('[shell route error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-foreground">
          {isArabic ? 'حدث خطأ أثناء تحميل الصفحة' : 'Failed to load page'}
        </p>
        {process.env.NODE_ENV === 'development' ? (
          <p className="max-w-lg text-sm text-muted-foreground">{error.message}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'يرجى المحاولة مرة أخرى' : 'Please try again'}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
        {isArabic ? 'إعادة المحاولة' : 'Try again'}
      </button>
    </div>
  );
}
