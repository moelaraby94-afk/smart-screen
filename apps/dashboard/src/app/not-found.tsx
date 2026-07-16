import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Home } from 'lucide-react';
import { routing } from '@/i18n/routing';

function detectPreferredLocale(acceptLanguage: string | null): 'ar' | 'en' {
  if (!acceptLanguage) return routing.defaultLocale as 'ar' | 'en';
  const normalized = acceptLanguage.toLowerCase();
  if (normalized.includes('ar')) return 'ar';
  if (normalized.includes('en')) return 'en';
  return routing.defaultLocale as 'ar' | 'en';
}

export default async function GlobalNotFound() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locale =
    localeCookie === 'ar' || localeCookie === 'en'
      ? localeCookie
      : detectPreferredLocale(requestHeaders.get('accept-language'));
  const t = await getTranslations({ locale, namespace: 'notFoundPage' });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-4xl font-bold tracking-tight text-foreground">{t('code')}</p>
        <p className="text-lg font-semibold text-foreground">{t('title')}</p>
        <p className="max-w-md text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <Home className="h-4 w-4" strokeWidth={1.8} />
        {t('backToHome')}
      </Link>
    </div>
  );
}
