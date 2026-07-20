'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">{t('error')}</p>
      <Button onClick={reset} variant="outline">
        {t('retry')}
      </Button>
    </div>
  );
}
