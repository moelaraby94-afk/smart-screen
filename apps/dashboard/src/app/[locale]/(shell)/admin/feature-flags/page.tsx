import type { Metadata } from 'next';
import { FeatureFlagsClient } from '@/features/admin/feature-flags-client';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Feature Flags — Admin' };
}

export default function FeatureFlagsPage() {
  return <FeatureFlagsClient />;
}
