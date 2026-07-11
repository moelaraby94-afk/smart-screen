import Link from 'next/link';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/features/auth/login-form';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1fr]">
      {/* ── Hero panel — violet gradient, hidden on mobile ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 ps-12 pe-10 pt-14 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative z-[1] max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            {t('brand')}
          </p>
          <h1 className="mt-8 text-4xl font-bold tracking-[-0.03em] text-white">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-md text-[15px] font-normal leading-relaxed text-white/70">
            {t('description')}
          </p>
        </div>
        <p className="relative z-[1] text-xs text-white/50">{t('tagline')}</p>
      </div>

      {/* ── Form panel — clean card ── */}
      <div className="relative flex flex-col items-center justify-center bg-background px-6 py-14 sm:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          {/* Mobile brand header */}
          <div className="mb-10 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {t('brand')}
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('title')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>

          <Suspense
            fallback={<p className="text-sm text-muted-foreground">{t('loading')}</p>}
          >
            <LoginForm />
          </Suspense>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            <Link
              href={`/${locale}/register`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t('registerTitle')}
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link
              href={`/${locale}/privacy`}
              className="font-medium underline-offset-4 hover:text-foreground hover:underline"
            >
              {tLegal('privacyLink')}
            </Link>
            <span className="mx-2 text-border">·</span>
            <Link
              href={`/${locale}/terms`}
              className="font-medium underline-offset-4 hover:text-foreground hover:underline"
            >
              {tLegal('termsLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
