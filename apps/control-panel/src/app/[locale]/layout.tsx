import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { MotionConfig } from 'framer-motion';
import { AppToaster } from '@/components/app-toaster';
import { SwrProvider } from '@/components/swr-provider';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'Smart Screen — Control Panel',
  description: 'Platform administration control panel',
};
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      lang={locale}
      dir={dir}
      className={`min-h-screen ${locale === 'ar' ? 'font-ar' : ''}`}
    >
      <SwrProvider>
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
        <AppToaster />
      </SwrProvider>
    </div>
  );
}
