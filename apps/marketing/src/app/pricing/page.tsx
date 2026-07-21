import Link from 'next/link';
import type { Metadata } from 'next';
import { Monitor, Zap, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for Smart Screen digital signage platform. Start free, upgrade when you grow.',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with your first screen',
    features: [
      '1 screen',
      '1 workspace',
      'Basic templates',
      'Media library (1GB storage)',
      'Playlist creation',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing businesses with multiple screens',
    features: [
      'Up to 10 screens',
      '3 workspaces',
      'All 10+ templates',
      'Media library (50GB storage)',
      'Scheduling & campaigns',
      'Analytics dashboard',
      'Offline playback',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large-scale deployments and custom needs',
    features: [
      'Unlimited screens',
      'Unlimited workspaces',
      'Custom branding',
      'Unlimited media storage',
      'API access & webhooks',
      'Priority support',
      'SLA guarantee',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade or downgrade your plan at any time from the billing settings in your dashboard. Changes take effect immediately.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards through Stripe. Enterprise customers can also pay by invoice.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes, the Free plan includes 1 screen and 1 workspace. You can upgrade to Pro at any time — no credit card required to start.',
  },
  {
    q: 'Do you support Arabic?',
    a: 'Yes. Smart Screen has full Arabic (RTL) and English (LTR) support across the dashboard, emails, and player.',
  },
  {
    q: 'What happens if my screen goes offline?',
    a: 'The player caches content locally and continues playback. When connectivity returns, it auto-reconnects and syncs new content.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time from the billing settings. You will retain access until the end of your billing period.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">Smart Screen</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="text-sm font-semibold text-gray-900">Pricing</Link>
            <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'} className="text-sm text-gray-600 hover:text-gray-900">Sign in</a>
            <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Get Started</a>
          </div>
        </div>
      </nav>

      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50 to-white py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Pricing</h1>
          <p className="mt-4 text-lg text-gray-600">
            Start free, upgrade when you grow. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-8 ${
                  p.highlighted
                    ? 'border-blue-600 bg-white shadow-xl shadow-blue-600/10'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {p.highlighted && (
                  <div className="mb-4 inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{p.price}</span>
                  <span className="text-sm text-gray-500">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
                  className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
                    p.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-lg font-semibold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <a
            href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Get Started Free <Zap className="h-5 w-5" />
          </a>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Smart Screen</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/features" className="hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
              <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'} className="hover:text-gray-900">Dashboard</a>
            </div>
            <p className="text-sm text-gray-400">© 2026 Smart Screen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
