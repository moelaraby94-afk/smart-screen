import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cloud-Screen — Digital Signage Platform',
    template: '%s — Cloud-Screen',
  },
  description:
    'Cloud-based digital signage platform. Manage screens, playlists, media, and campaigns from one dashboard. Supports Arabic & English, offline playback, and real-time control.',
  keywords: [
    'digital signage',
    'screen management',
    'cloud signage',
    'content scheduling',
    'playlist management',
    'kiosk mode',
    'digital displays',
  ],
  authors: [{ name: 'Cloud-Screen' }],
  openGraph: {
    title: 'Cloud-Screen — Digital Signage Platform',
    description:
      'Cloud-based digital signage platform. Manage screens, playlists, media, and campaigns from one dashboard.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cloud-Screen — Digital Signage Platform',
    description:
      'Cloud-based digital signage platform. Manage screens, playlists, media, and campaigns.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
