import Link from 'next/link';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/features/auth/login-form';
import { LanguageSwitcher } from '@/components/language-switcher';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[400px] p-8">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('brand')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>

          <Suspense
            fallback={<p className="text-sm text-muted-foreground">{t('loading')}</p>}
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <span>{t('registerTitle')}</span>{' '}
          <Link
            href={`/${locale}/register`}
            className="font-semibold text-primary hover:underline"
          >
            {t('register')}
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link
            href={`/${locale}/privacy`}
            className="font-medium hover:text-foreground hover:underline"
          >
            {tLegal('privacyLink')}
          </Link>
          <span className="mx-2 text-border">·</span>
          <Link
            href={`/${locale}/terms`}
            className="font-medium hover:text-foreground hover:underline"
          >
            {tLegal('termsLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
