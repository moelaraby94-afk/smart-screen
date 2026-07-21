import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Monitor,
  Play,
  Calendar,
  BarChart3,
  Wifi,
  Globe,
  Shield,
  Zap,
  Users,
  Layout,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Smart Screen — Digital Signage Platform',
  description:
    'Cloud-based digital signage platform. Manage screens, playlists, media, and campaigns from one dashboard.',
};

const features = [
  {
    icon: Monitor,
    title: 'Screen Management',
    description:
      'Pair screens with a 6-digit code, monitor online/offline status in real-time, and control your entire fleet from one dashboard.',
  },
  {
    icon: Layout,
    title: 'Visual Content Studio',
    description:
      'Design stunning canvases with drag-and-drop elements, text, images, video, shapes, and tickers. 10+ ready-made templates included.',
  },
  {
    icon: Play,
    title: 'Playlist & Scheduling',
    description:
      'Create playlists, reorder content, set playback schedules with recurrence rules, and assign to screens with ease.',
  },
  {
    icon: Calendar,
    title: 'Campaign Builder',
    description:
      'Launch campaigns across multiple screens, review before publishing, and track status with real-time updates.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Proof of Play',
    description:
      'Monitor screen uptime, playback statistics, and campaign performance with visual charts and exportable reports.',
  },
  {
    icon: Wifi,
    title: 'Offline Playback',
    description:
      'Players cache content locally and continue playback when connectivity drops. Auto-reconnect with exponential backoff.',
  },
  {
    icon: Globe,
    title: 'Arabic & English',
    description:
      'Full RTL support for Arabic and LTR for English. Every screen, every email, every notification — bilingual by design.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'JWT auth, 2FA, role-based access control, CSRF protection, rate limiting, and encrypted 2FA secrets at rest.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Invite team members with Owner, Admin, Editor, or Viewer roles. Manage multiple workspaces from one account.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: ['1 screen', '1 workspace', 'Basic templates', 'Community support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing businesses',
    features: [
      'Up to 10 screens',
      '3 workspaces',
      'All templates',
      'Scheduling & campaigns',
      'Analytics dashboard',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large deployments',
    features: [
      'Unlimited screens',
      'Unlimited workspaces',
      'Custom branding',
      'API access',
      'Priority support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '< 2s', label: 'Pairing time' },
  { value: '24/7', label: 'Offline playback' },
  { value: '2', label: 'Languages' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">Smart Screen</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign in
            </a>
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </a>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:hidden"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Zap className="h-4 w-4" />
              Cloud-based digital signage platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Manage your screens
              <br />
              <span className="text-blue-600">from the cloud</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              Smart Screen lets you manage digital displays, create visual content,
              schedule playlists, and track performance — all from one dashboard.
              Supports Arabic & English with full RTL.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Get Started Free
                <Zap className="h-5 w-5" />
              </a>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Explore Features
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-blue-600 sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to run digital signage
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From screen pairing to content design, scheduling, and analytics —
              Smart Screen covers the entire workflow.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 p-6 transition hover:shadow-lg hover:shadow-gray-100"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20 lg:py-28" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free, upgrade when you grow. No hidden fees.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
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
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
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

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Create your free account and pair your first screen in under 2 minutes.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Get Started Free
            <Zap className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
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
              <a
                href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'}
                className="hover:text-gray-900"
              >
                Dashboard
              </a>
            </div>
            <p className="text-sm text-gray-400">© 2026 Smart Screen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
