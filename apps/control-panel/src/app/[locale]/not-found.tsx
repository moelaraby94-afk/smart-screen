import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('nav');
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">404</h2>
      <p className="text-sm text-muted-foreground">Page not found</p>
      <Link
        href="/overview"
        className="text-sm font-medium text-primary hover:underline"
      >
        {t('overview')}
      </Link>
    </div>
  );
}
