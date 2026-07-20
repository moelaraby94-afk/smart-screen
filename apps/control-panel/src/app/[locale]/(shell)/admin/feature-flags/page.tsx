import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminBreadcrumbBar } from '@/components/admin/admin-breadcrumb-bar';
import { FeatureFlagsClient } from '@/features/admin/feature-flags-client';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Feature Flags — Admin' };
}

export default async function FeatureFlagsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'featureFlags' });
  const tb = await getTranslations({ locale, namespace: 'adminBreadcrumb' });
  return (
    <main className="space-y-6">
      <AdminBreadcrumbBar
        ariaLabel={tb('ariaLabel')}
        items={[
          { href: `/${locale}/overview`, label: tb('root') },
          { label: tb('featureFlags') },
        ]}
      />
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('kicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
      </header>
      <FeatureFlagsClient />
    </main>
  );
}
