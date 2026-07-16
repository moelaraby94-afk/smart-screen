import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { ForgotPasswordClient } from '@/features/auth/forgot-password-client';
import { LanguageSwitcher } from '@/components/language-switcher';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/20 px-6 py-14">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[400px]">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('brand')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>

          <Suspense
            fallback={<p className="text-sm text-muted-foreground">{t('loading')}</p>}
          >
            <ForgotPasswordClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
