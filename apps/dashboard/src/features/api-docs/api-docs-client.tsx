'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Copy,
  Terminal,
  Key,
  Webhook,
  Shield,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { ApiKeysManager } from '@/features/api-docs/api-keys-manager';
import { WebhooksManager } from '@/features/api-docs/webhooks-manager';

type Endpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
};

type EndpointGroup = {
  title: string;
  endpoints: Endpoint[];
};

const methodColor: Record<Endpoint['method'], string> = {
  GET: 'bg-primary/10 text-primary ring-primary/20',
  POST: 'bg-success/10 text-success ring-success/20',
  PATCH: 'bg-warning/10 text-warning ring-warning/20',
  DELETE: 'bg-destructive/10 text-destructive ring-destructive/20',
};

export function ApiDocsClient() {
  const t = useTranslations('apiDocs');
  const [openSection, setOpenSection] = useState<string | null>('auth');

  const groups: Array<{ key: string; icon: typeof Terminal; title: string; endpoints: Endpoint[] }> = [
    {
      key: 'auth',
      icon: Key,
      title: t('groups.auth'),
      endpoints: [
        { method: 'POST', path: '/auth/login', description: t('endpoints.login') },
        { method: 'POST', path: '/auth/register', description: t('endpoints.register') },
        { method: 'POST', path: '/auth/refresh', description: t('endpoints.refresh') },
        { method: 'POST', path: '/auth/logout', description: t('endpoints.logout') },
        { method: 'GET', path: '/auth/me', description: t('endpoints.me') },
      ],
    },
    {
      key: 'workspaces',
      icon: BookOpen,
      title: t('groups.workspaces'),
      endpoints: [
        { method: 'GET', path: '/workspaces', description: t('endpoints.listWorkspaces') },
        { method: 'POST', path: '/workspaces', description: t('endpoints.createWorkspace') },
        { method: 'GET', path: '/workspaces/:id', description: t('endpoints.getWorkspace') },
        { method: 'PATCH', path: '/workspaces/:id', description: t('endpoints.updateWorkspace') },
        { method: 'DELETE', path: '/workspaces/:id', description: t('endpoints.deleteWorkspace') },
      ],
    },
    {
      key: 'screens',
      icon: Terminal,
      title: t('groups.screens'),
      endpoints: [
        { method: 'GET', path: '/screens?workspaceId=:id', description: t('endpoints.listScreens') },
        { method: 'POST', path: '/screens', description: t('endpoints.createScreen') },
        { method: 'GET', path: '/screens/:id', description: t('endpoints.getScreen') },
        { method: 'PATCH', path: '/screens/:id', description: t('endpoints.updateScreen') },
        { method: 'DELETE', path: '/screens/:id', description: t('endpoints.deleteScreen') },
      ],
    },
    {
      key: 'playlists',
      icon: BookOpen,
      title: t('groups.playlists'),
      endpoints: [
        { method: 'GET', path: '/playlists?workspaceId=:id', description: t('endpoints.listPlaylists') },
        { method: 'POST', path: '/playlists', description: t('endpoints.createPlaylist') },
        { method: 'GET', path: '/playlists/:id', description: t('endpoints.getPlaylist') },
        { method: 'PATCH', path: '/playlists/:id', description: t('endpoints.updatePlaylist') },
        { method: 'PATCH', path: '/playlists/:id/items', description: t('endpoints.updatePlaylistItems') },
        { method: 'DELETE', path: '/playlists/:id', description: t('endpoints.deletePlaylist') },
      ],
    },
    {
      key: 'media',
      icon: Terminal,
      title: t('groups.media'),
      endpoints: [
        { method: 'GET', path: '/media?workspaceId=:id', description: t('endpoints.listMedia') },
        { method: 'POST', path: '/media', description: t('endpoints.uploadMedia') },
        { method: 'DELETE', path: '/media/:id', description: t('endpoints.deleteMedia') },
      ],
    },
    {
      key: 'schedules',
      icon: Terminal,
      title: t('groups.schedules'),
      endpoints: [
        { method: 'GET', path: '/schedules?workspaceId=:id', description: t('endpoints.listSchedules') },
        { method: 'POST', path: '/schedules', description: t('endpoints.createSchedule') },
        { method: 'PATCH', path: '/schedules/:id', description: t('endpoints.updateSchedule') },
        { method: 'DELETE', path: '/schedules/:id', description: t('endpoints.deleteSchedule') },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, title: t('cards.authTitle'), desc: t('cards.authDesc') },
          { icon: Key, title: t('cards.apiKeyTitle'), desc: t('cards.apiKeyDesc') },
          { icon: Webhook, title: t('cards.webhooksTitle'), desc: t('cards.webhooksDesc') },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.3 }}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <card.icon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
            </div>
            <p className="font-medium text-foreground">{card.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Base URL */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('baseUrlLabel')}
        </h2>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg bg-muted/50 px-4 py-2.5 font-mono text-sm text-foreground">
            {t('baseUrlValue')}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(t('baseUrlValue'));
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
            aria-label={t('copy')}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Auth example */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('authExampleTitle')}
        </h2>
        <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground">
{`curl -X GET ${t('baseUrlValue')}/auth/me \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"`}
        </pre>
      </section>

      {/* Endpoint groups */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t('endpointsTitle')}
        </h2>
        {groups.map((group) => {
          const isOpen = openSection === group.key;
          return (
            <div
              key={group.key}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : group.key)}
                className="flex w-full items-center gap-3 px-5 py-4 text-start"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <group.icon className="h-4 w-4 text-primary" strokeWidth={ICON_STROKE} />
                </div>
                <span className="flex-1 font-medium text-foreground">{group.title}</span>
                <span className="text-xs text-muted-foreground">{group.endpoints.length}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border border-t border-border">
                    {group.endpoints.map((ep, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-3"
                      >
                        <span
                          className={cn(
                            'inline-flex w-16 shrink-0 justify-center rounded-lg px-2 py-1 text-xs font-bold uppercase ring-1',
                            methodColor[ep.method],
                          )}
                        >
                          {ep.method}
                        </span>
                        <code className="shrink-0 font-mono text-xs text-foreground">
                          {ep.path}
                        </code>
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                          {ep.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </section>

      {/* API Keys Management */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <ApiKeysManager />
      </section>

      {/* Webhooks Management */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <WebhooksManager />
      </section>
    </div>
  );
}
