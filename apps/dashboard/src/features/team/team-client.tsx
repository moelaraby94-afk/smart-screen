'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, RefreshCw, Shield, UserPlus, UserCheck, X, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
  fetchMembers as apiFetchMembers,
  inviteMember as apiInviteMember,
  fetchInvites as apiFetchInvites,
  cancelInvite as apiCancelInvite,
  resendInvite as apiResendInvite,
  updateMemberRole as apiUpdateMemberRole,
  removeMember as apiRemoveMember,
} from '@/features/team/team-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/utils';

type Member = {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    locale: string;
    isActive: boolean;
  };
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

const ROLES = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'] as const;

export function TeamClient() {
  const t = useTranslations('teamClient');
  const locale = useLocale();
  const { workspaceId } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('EDITOR');
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const [membersRes, invitesRes] = await Promise.all([
      apiFetchMembers(workspaceId),
      apiFetchInvites(workspaceId),
    ]);
    if (membersRes.ok) {
      setMembers((await membersRes.json()) as Member[]);
    } else {
      setMembers([]);
    }
    if (invitesRes.ok) {
      setPendingInvites((await invitesRes.json()) as PendingInvite[]);
    } else {
      setPendingInvites([]);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendInvite = async () => {
    if (!workspaceId || !email.trim()) {
      toast.error(t('enterEmail'));
      return;
    }
    setSending(true);
    try {
      const res = await apiInviteMember(workspaceId, email.trim(), role);
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? t('inviteFailed'));
        return;
      }
      toast.success(data.message ?? t('inviteSent'));
      setEmail('');
      void load();
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!workspaceId) return;
    setCancellingId(inviteId);
    try {
      const res = await apiCancelInvite(workspaceId, inviteId);
      if (!res.ok) {
        toast.error(t('cancelFailed'));
        return;
      }
      toast.success(t('cancelOk'));
      void load();
    } finally {
      setCancellingId(null);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    if (!workspaceId) return;
    setResendingId(inviteId);
    try {
      const res = await apiResendInvite(workspaceId, inviteId);
      if (!res.ok) {
        toast.error(t('resendFailed'));
        return;
      }
      toast.success(t('resendOk'));
      void load();
    } finally {
      setResendingId(null);
    }
  };

  const handleChangeRole = async (membershipId: string, newRole: string) => {
    if (!workspaceId) return;
    setUpdatingRoleId(membershipId);
    try {
      const res = await apiUpdateMemberRole(workspaceId, membershipId, newRole);
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        toast.error(data.message ?? t('roleUpdateFailed'));
        return;
      }
      toast.success(t('roleUpdated'));
      void load();
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!workspaceId) return;
    if (!confirm(t('confirmRemove'))) return;
    setRemovingId(membershipId);
    try {
      const res = await apiRemoveMember(workspaceId, membershipId);
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        toast.error(data.message ?? t('removeFailed'));
        return;
      }
      toast.success(t('memberRemoved'));
      void load();
    } finally {
      setRemovingId(null);
    }
  };

  if (!workspaceId) {
    return (
      <p className="text-[15px] text-muted-foreground">{t('selectWorkspace')}</p>
    );
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-card-surface overflow-hidden rounded-2xl border border-border"
      >
        <div className="grid gap-8 p-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                {t('members')}
              </h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">{t('loading')}</p>
              ) : members.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title={t('noMembers')}
                  description={t('noMembersDescription')}
                />
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.membershipId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{m.user.fullName}</p>
                        <p className="truncate text-sm text-muted-foreground">{m.user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.role === 'OWNER' ? (
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
                              'bg-primary/15 text-primary',
                            )}
                          >
                            {m.role}
                          </span>
                        ) : (
                          <select
                            className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold uppercase tracking-wide"
                            value={m.role}
                            disabled={updatingRoleId === m.membershipId}
                            onChange={(e) => void handleChangeRole(m.membershipId, e.target.value)}
                            aria-label={t('changeRoleAria', { name: m.user.fullName })}
                          >
                            {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        )}
                        <span className="font-mono-nums text-xs text-muted-foreground">
                          {new Date(m.joinedAt).toLocaleDateString(locale)}
                        </span>
                        {m.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            disabled={removingId === m.membershipId}
                            onClick={() => void handleRemoveMember(m.membershipId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!loading && pendingInvites.length > 0 && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('pendingInvites')}
                </h3>
                <ul className="space-y-2">
                  {pendingInvites.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('expiresOn', { date: new Date(inv.expiresAt).toLocaleDateString(locale) })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {inv.role}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => void handleResendInvite(inv.id)}
                          disabled={resendingId === inv.id}
                        >
                          <RefreshCw className={cn('h-4 w-4', resendingId === inv.id && 'animate-spin')} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleCancelInvite(inv.id)}
                          disabled={cancellingId === inv.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-4 w-4 text-primary" />
              {t('inviteTeammate')}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">{t('email')}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">{t('role')}</Label>
                <select
                  id="invite-role"
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                className="w-full rounded-xl font-semibold" variant="cta"
                onClick={() => void sendInvite()}
                disabled={sending}
              >
                <Mail className="me-2 h-4 w-4" />
                {sending ? t('sending') : t('sendInvite')}
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t('inviteHint')}
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
