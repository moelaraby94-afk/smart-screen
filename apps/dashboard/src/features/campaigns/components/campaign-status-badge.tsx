'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { STATUS_BADGE_VARIANT } from '../utils';
import type { CampaignStatus } from '../types';

type Props = {
  status: CampaignStatus;
};

export function CampaignStatusBadge({ status }: Props) {
  const t = useTranslations('campaigns');
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} dot>
      {t(`status.${status}`)}
    </Badge>
  );
}
