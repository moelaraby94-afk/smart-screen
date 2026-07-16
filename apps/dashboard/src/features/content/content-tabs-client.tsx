'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaylistListClient } from '@/features/playlists/playlist-list-client';
import { MediaLibraryClient } from '@/features/media/media-library-client';

export function ContentTabsClient() {
  const t = useTranslations('contentPage');

  return (
    <Tabs defaultValue="playlists" className="w-full" role="region" aria-label={t('title')}>
      <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-none">
        <TabsTrigger value="playlists">{t('tabPlaylists')}</TabsTrigger>
        <TabsTrigger value="media">{t('tabMedia')}</TabsTrigger>
      </TabsList>
      <TabsContent value="playlists">
        <PlaylistListClient />
      </TabsContent>
      <TabsContent value="media">
        <MediaLibraryClient />
      </TabsContent>
    </Tabs>
  );
}
