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
  Users,
  Layout,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore Smart Screen features: screen management, visual content studio, playlists, scheduling, campaigns, analytics, offline playback, and more.',
};

const featureSections = [
  {
    icon: Monitor,
    title: 'Screen Management',
    description:
      'Pair any screen with a 6-digit code, monitor online/offline status in real-time, and control your entire display fleet from one dashboard.',
    points: [
      '6-digit pairing code flow',
      'Real-time online/offline indicators',
      'Player version reporting',
      'Screen settings & override rules',
      'Fleet status dashboard',
    ],
  },
  {
    icon: Layout,
    title: 'Visual Content Studio',
    description:
      'Design stunning visual content with a drag-and-drop canvas editor. Text, images, video, shapes, tickers, and 10+ ready-made templates.',
    points: [
      'Drag-and-drop canvas editor',
      '10+ pre-built templates',
      'Text, image, video, shape elements',
      'Scrolling ticker support',
      'Version history & restore',
    ],
  },
  {
    icon: Play,
    title: 'Playlists & Scheduling',
    description:
      'Create playlists from canvases and media, reorder items with drag-and-drop, set playback schedules with recurrence rules, and assign to screens.',
    points: [
      'Playlist CRUD with drag-and-drop reorder',
      'Schedule with daily/weekly/monthly recurrence',
      'Conflict detection for overlapping schedules',
      'Screen assignment & quick publish',
      'Preview mode with transitions',
    ],
  },
  {
    icon: Calendar,
    title: 'Campaign Builder',
    description:
      'Launch campaigns across multiple screens, review before publishing, and track status with real-time updates.',
    points: [
      'Campaign creation flow with playlist & screen selection',
      'Review & approve before publishing',
      'Real-time status: draft, pending, active, paused, completed',
      'Assign campaigns to multiple screens',
      'Campaign analytics integration',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics & Proof of Play',
    description:
      'Monitor screen uptime, playback statistics, and campaign performance with visual charts and period-based filtering.',
    points: [
      'Screen uptime tracking',
      'Per-screen playback statistics',
      'Campaign performance metrics',
      'Trend charts with period filters',
      'Top performers & content breakdown',
    ],
  },
  {
    icon: Wifi,
    title: 'Offline Playback & Reliability',
    description:
      'Players cache content locally and continue playback when connectivity drops. Auto-reconnect with exponential backoff.',
    points: [
      'Local media caching for offline playback',
      'Auto-reconnect with exponential backoff',
      'Playlist snapshot persistence',
      'Heartbeat-based health monitoring',
      'Error reporting to dashboard',
    ],
  },
  {
    icon: Globe,
    title: 'Arabic & English Support',
    description:
      'Full RTL support for Arabic and LTR for English. Every screen, every email, every notification — bilingual by design.',
    points: [
      'RTL layout for Arabic interface',
      'Bilingual email notifications',
      'Arabic & English content templates',
      'Hijri date widget',
      'Prayer times & prayer pause for Islamic content',
    ],
  },
  {
    icon: Shield,
    title: 'Security & Access Control',
    description:
      'Enterprise-grade security: JWT auth, 2FA, role-based access control, CSRF protection, rate limiting, and encrypted 2FA secrets.',
    points: [
      'JWT with httpOnly cookies',
      'Two-factor authentication (TOTP)',
      'Role-based access: Owner, Admin, Editor, Viewer',
      'CSRF protection & rate limiting',
      'Encrypted 2FA secrets at rest',
    ],
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Invite team members with role-based permissions, manage multiple workspaces, and collaborate on content.',
    points: [
      'Invite with Owner, Admin, Editor, Viewer roles',
      'Multiple workspaces per account',
      'Account-level member management',
      'Pending invite tracking & resend',
      'Workspace switcher',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">Smart Screen</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-sm font-semibold text-gray-900">Features</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'} className="text-sm text-gray-600 hover:text-gray-900">Sign in</a>
            <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Get Started</a>
          </div>
        </div>
      </nav>

      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50 to-white py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Features</h1>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to manage digital signage — from screen pairing to content design,
            scheduling, analytics, and team collaboration.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {featureSections.map((f, i) => (
            <div key={f.title} className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{f.title}</h2>
                <p className="mt-3 text-gray-600">{f.description}</p>
                <ul className="mt-6 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-gray-50 p-12">
                <f.icon className="mx-auto h-24 w-24 text-blue-200" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Start using these features today</h2>
          <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000'} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50">
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
