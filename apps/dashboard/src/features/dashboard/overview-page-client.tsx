'use client';

import { HomeOverview } from '@/features/dashboard/home-overview';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { CardGridSkeleton } from '@/components/ui/skeleton-patterns';

type Props = {
  appTitle: string;
  headline: string;
  description: string;
};

export function OverviewPageClient({ appTitle, headline, description }: Props) {
  const { isLoading } = useWorkspace();
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        </div>
        <CardGridSkeleton count={4} />
      </div>
    );
  }
  return <HomeOverview appTitle={appTitle} headline={headline} description={description} />;
}
