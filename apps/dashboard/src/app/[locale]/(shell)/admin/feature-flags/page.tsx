import type { Metadata } from 'next';
import { FeatureFlagsClient } from '@/features/admin/feature-flags-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Feature Flags — Admin' };
}

export default async function FeatureFlagsPage({ params }: Props) {
  const { locale } = await params;
  return <FeatureFlagsClient />;
}
