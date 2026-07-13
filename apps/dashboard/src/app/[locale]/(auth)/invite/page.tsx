import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { InviteAcceptClient } from '@/features/team/invite-accept-client';
import { LanguageSwitcher } from '@/components/language-switcher';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inviteAccept' });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-6 py-14">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('brand')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('pageTitle')}</p>
          </div>

          <Suspense
            fallback={<p className="text-center text-sm text-muted-foreground">{t('loading')}</p>}
          >
            <InviteAcceptClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
