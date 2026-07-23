'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  Mail,
  Monitor,
  Image as ImageIcon,
  Clapperboard,
  CalendarClock,
  Users,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

type FaqItem = {
  q: string;
  a: string;
};

type GuideItem = {
  icon: typeof Monitor;
  title: string;
  description: string;
  href: string;
};

export function HelpSupportClient() {
  const t = useTranslations('helpPage');
  const locale = useLocale();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];

  const guides: GuideItem[] = [
    {
      icon: Monitor,
      title: t('guides.screens'),
      description: t('guides.screensDesc'),
      href: `/${locale}/screens`,
    },
    {
      icon: ImageIcon,
      title: t('guides.media'),
      description: t('guides.mediaDesc'),
      href: `/${locale}/media`,
    },
    {
      icon: Clapperboard,
      title: t('guides.playlists'),
      description: t('guides.playlistsDesc'),
      href: `/${locale}/playlists`,
    },
    {
      icon: CalendarClock,
      title: t('guides.schedules'),
      description: t('guides.schedulesDesc'),
      href: `/${locale}/schedules`,
    },
    {
      icon: Users,
      title: t('guides.team'),
      description: t('guides.teamDesc'),
      href: `/${locale}/team`,
    },
    {
      icon: BookOpen,
      title: t('guides.studio'),
      description: t('guides.studioDesc'),
      href: `/${locale}/playlists`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick guides */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t('guidesTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide, i) => (
            <motion.a
              key={guide.title}
              href={guide.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              className="group flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <guide.icon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{guide.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t('faqTitle')}
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start"
              >
                <span className="font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    openFaq === i && 'rotate-180',
                  )}
                />
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <LifeBuoy className="h-6 w-6 text-primary" strokeWidth={ICON_STROKE} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t('contactTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('contactDescription')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:support@smartscreen.app"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="h-4 w-4" />
                support@smartscreen.app
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
