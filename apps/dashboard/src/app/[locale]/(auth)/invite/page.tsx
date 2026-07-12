import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { InviteAcceptClient } from '@/features/team/invite-accept-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inviteAccept' });

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-6 py-14 sm:px-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            {t('brand')}
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {t('pageTitle')}
          </h1>
        </div>
        <Suspense
          fallback={<p className="text-center text-sm text-muted-foreground">{t('loading')}</p>}
        >
          <InviteAcceptClient />
        </Suspense>
      </div>
    </div>
  );
}
