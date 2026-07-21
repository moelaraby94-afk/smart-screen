import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

export const dynamic = 'force-dynamic';
import { Cairo } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Screen — Control Panel',
  description: 'Platform administration control panel',
};

function detectPreferredLocale(acceptLanguage: string | null): 'ar' | 'en' {
  if (!acceptLanguage) return routing.defaultLocale as 'ar' | 'en';
  const normalized = acceptLanguage.toLowerCase();
  if (normalized.includes('ar')) return 'ar';
  if (normalized.includes('en')) return 'en';
  return routing.defaultLocale as 'ar' | 'en';
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const htmlLang =
    localeCookie === 'ar' || localeCookie === 'en'
      ? localeCookie
      : detectPreferredLocale(requestHeaders.get('accept-language'));

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${cairo.variable}`}
    >
      <body
        className={`${GeistSans.className} min-h-screen antialiased bg-background text-foreground`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "!function(){try{var r=document.documentElement;var k='theme';var t=localStorage.getItem(k);if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){document.documentElement.classList.remove('dark');}}();",
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
