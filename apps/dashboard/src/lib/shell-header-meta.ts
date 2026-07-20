'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export type ShellHeaderMeta = {
  pageTitle: string;
  kicker: string;
  showBack: boolean;
  backHref: string | null;
  backLabel: string;
};

export function useShellHeaderMeta(pathname: string | null): ShellHeaderMeta {
  const t = useTranslations('shell');
  const activeLocale = useLocale();
  const locale = activeLocale === 'ar' || activeLocale === 'en' ? activeLocale : 'en';

  return useMemo(() => {
    const base = `/${locale}`;
    const parts = pathname?.split('/').filter(Boolean) ?? [];
    if (parts[0] !== locale) {
      return {
        pageTitle: t('pageTitles.default'),
        kicker: '',
        showBack: false,
        backHref: null,
        backLabel: '',
      };
    }

    const rest = parts.slice(1);
    const join = (segments: string[]) => `${base}/${segments.join('/')}`;

    if (
      rest[0] === 'branches' && rest[1] && rest[2] === 'playlists' && rest[3]
    ) {
      return {
        pageTitle: t('pageTitles.branchPlaylist'),
        kicker: '',
        showBack: true,
        backHref: join(['branches', rest[1]]),
        backLabel: t('backToBranch'),
      };
    }

    if (rest[0] === 'branches' && rest[1] && rest.length === 2) {
      return {
        pageTitle: t('pageTitles.branchDetail'),
        kicker: '',
        showBack: true,
        backHref: `${base}/overview`,
        backLabel: t('backToOverview'),
      };
    }

    if (rest[0] === 'screens' && rest[1] && rest.length === 2) {
      return {
        pageTitle: t('pageTitles.screens'),
        kicker: '',
        showBack: true,
        backHref: `${base}/screens`,
        backLabel: t('backToScreens'),
      };
    }

    if (
      rest[0] === 'settings' &&
      (rest[1] === 'profile' || rest[1] === 'billing' || rest[1] === 'api' || rest[1] === 'security' || rest[1] === 'notifications' || rest[1] === 'workspace') &&
      rest.length === 2
    ) {
      const titleMap: Record<string, string> = {
        profile: t('pageTitles.settingsProfile'),
        billing: t('pageTitles.settingsBilling'),
        api: t('pageTitles.settingsApi'),
        security: t('pageTitles.settingsSecurity'),
        notifications: t('pageTitles.settingsNotifications'),
        workspace: t('pageTitles.settingsWorkspace'),
      };
      return {
        pageTitle: titleMap[rest[1]] ?? t('pageTitles.settingsIndex'),
        kicker: '',
        showBack: true,
        backHref: `${base}/settings`,
        backLabel: t('backToSettings'),
      };
    }

    if (rest[0] === 'settings' && rest.length === 1) {
      return {
        pageTitle: t('pageTitles.settingsIndex'),
        kicker: '',
        showBack: true,
        backHref: `${base}/overview`,
        backLabel: t('backToOverview'),
      };
    }

    let pageTitle = t('pageTitles.default');

    if (rest.length === 0 || rest[0] === 'overview') {
      pageTitle = t('pageTitles.overview');
    } else if (rest[0] === 'screens') {
      pageTitle = t('pageTitles.screens');
    } else if (rest[0] === 'templates') {
      pageTitle = t('pageTitles.templates');
    } else if (rest[0] === 'ai') {
      pageTitle = t('pageTitles.ai');
    } else if (rest[0] === 'emergency') {
      pageTitle = t('pageTitles.emergency');
    } else if (rest[0] === 'analytics') {
      pageTitle = t('pageTitles.analytics');
    } else if (rest[0] === 'audit-log') {
      pageTitle = t('pageTitles.auditLog');
    } else if (rest[0] === 'notifications') {
      pageTitle = t('pageTitles.notifications');
    } else if (rest[0] === 'api-docs') {
      pageTitle = t('pageTitles.apiDocs');
    } else if (rest[0] === 'billing') {
      pageTitle = t('pageTitles.billing');
    } else if (rest[0] === 'campaigns') {
      pageTitle = t('pageTitles.campaigns');
    } else if (rest[0] === 'displays') {
      pageTitle = t('pageTitles.displays');
    } else if (rest[0] === 'proof-of-play') {
      pageTitle = t('pageTitles.proofOfPlay');
    } else if (rest[0] === 'branches' && rest.length === 1) {
      pageTitle = t('pageTitles.branches');
    } else if (rest[0] === 'help') {
      pageTitle = t('pageTitles.help');
    } else if (rest[0] === 'media') {
      pageTitle = t('pageTitles.media');
    } else if (rest[0] === 'studio') {
      pageTitle = t('pageTitles.studio');
    } else if (rest[0] === 'playlists') {
      pageTitle = t('pageTitles.playlists');
    } else if (rest[0] === 'content' && rest[1] === 'media') {
      pageTitle = t('pageTitles.media');
    } else if (rest[0] === 'content' && rest[1] === 'playlists') {
      pageTitle = t('pageTitles.playlists');
    } else if (rest[0] === 'content') {
      pageTitle = t('pageTitles.content');
    } else if (rest[0] === 'schedules') {
      pageTitle = t('pageTitles.schedules');
    } else if (rest[0] === 'scheduling') {
      pageTitle = t('pageTitles.schedules');
    } else if (rest[0] === 'team') {
      pageTitle = t('pageTitles.team');
    }

    const clientMainWithBack = new Set([
      'content',
      'media',
      'screens',
      'studio',
      'playlists',
      'schedules',
      'scheduling',
      'team',
      'templates',
      'ai',
      'emergency',
      'analytics',
      'audit-log',
      'notifications',
      'api-docs',
      'help',
      'billing',
      'campaigns',
      'displays',
      'proof-of-play',
      'branches',
    ]);
    if (rest.length === 1 && clientMainWithBack.has(rest[0])) {
      return {
        pageTitle,
        kicker: '',
        showBack: true,
        backHref: `${base}/overview`,
        backLabel: t('backToOverview'),
      };
    }

    return {
      pageTitle,
      kicker: '',
      showBack: false,
      backHref: null,
      backLabel: '',
    };
  }, [pathname, locale, t]);
}

