'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, RefreshCw, Shield, UserPlus, UserCheck, X, Trash2, AlertCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  fetchMembers as apiFetchMembers,
  inviteMember as apiInviteMember,
  fetchInvites as apiFetchInvites,
  cancelInvite as apiCancelInvite,
  resendInvite as apiResendInvite,
  updateMemberRole as apiUpdateMemberRole,
  removeMember as apiRemoveMember,
  fetchAccountMembers as apiFetchAccountMembers,
  createAccountMember as apiCreateAccountMember,
  updateAccountMemberRole as apiUpdateAccountMemberRole,
  removeAccountMember as apiRemoveAccountMember,
} from '@/features/team/team-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { fetchAccountWorkspaces as apiFetchAccountWorkspaces } from '@/features/team/team-api';
import { cn } from '@/lib/utils';
import { ListSkeleton } from '@/components/ui/skeleton-patterns';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-primary/15 text-primary',
  ADMIN: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  EDITOR: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  VIEWER: 'bg-muted text-muted-foreground',
};

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

type AccountMember = Member & {
  workspaceScopes?: Array<{
    id: string;
    workspaceId: string;
    workspaceName: string;
    role: string;
  }>;
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
  const { workspaceId, workspaces, userEmail } = useWorkspace();

  const currentRole = useMemo(() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws?.role ?? null;
  }, [workspaces, workspaceId]);
  const isOwner = currentRole === 'OWNER';
  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersError, setMembersError] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('EDITOR');
  const [sending, setSending] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelInviteDialogOpen, setCancelInviteDialogOpen] = useState(false);
  const [cancelInviteTarget, setCancelInviteTarget] = useState<string | null>(null);
  const [cancelInviteEmail, setCancelInviteEmail] = useState<string>('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeTargetName, setRemoveTargetName] = useState<string>('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Account-level members
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<string>('EDITOR');
  const [creating, setCreating] = useState(false);
  const [acctUpdatingRoleId, setAcctUpdatingRoleId] = useState<string | null>(null);
  const [acctRemovingId, setAcctRemovingId] = useState<string | null>(null);
  const [acctRemoveDialogOpen, setAcctRemoveDialogOpen] = useState(false);
  const [acctRemoveTarget, setAcctRemoveTarget] = useState<string | null>(null);

  // Workspace scopes for account member creation
  const [accountWorkspaces, setAccountWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [scopeWsId, setScopeWsId] = useState<string>('');
  const [scopeRole, setScopeRole] = useState<string>('VIEWER');
  const [selectedScopes, setSelectedScopes] = useState<Array<{ workspaceId: string; role: string }>>([]);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setMembersError(false);
    const [membersRes, invitesRes] = await Promise.all([
      apiFetchMembers(workspaceId),
      apiFetchInvites(workspaceId),
    ]);
    if (membersRes.ok) {
      setMembers((await membersRes.json()) as Member[]);
    } else {
      setMembers([]);
      setMembersError(true);
    }
    if (invitesRes.ok) {
      setPendingInvites((await invitesRes.json()) as PendingInvite[]);
    } else {
      setPendingInvites([]);
    }
    setLoading(false);
  }, [workspaceId]);

  const loadAccountMembers = useCallback(async () => {
    setAccountLoading(true);
    const [membersRes, wsRes] = await Promise.all([
      apiFetchAccountMembers(),
      apiFetchAccountWorkspaces(),
    ]);
    if (membersRes.ok) {
      setAccountMembers((await membersRes.json()) as AccountMember[]);
    } else {
      setAccountMembers([]);
    }
    if (wsRes.ok) {
      const wsData = (await wsRes.json()) as Array<{ id: string; name: string }>;
      setAccountWorkspaces(wsData);
    }
    setAccountLoading(false);
  }, []);

  useEffect(() => {
    void load();
    void loadAccountMembers();
  }, [load, loadAccountMembers]);

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const sendInvite = async () => {
    if (!workspaceId || !email.trim()) {
      setEmailError(t('enterEmail'));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t('invalidEmail'));
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      const res = await apiInviteMember(workspaceId, email.trim(), role);
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        if (res.status === 409) {
          setEmailError(data.message ?? t('alreadyInvited'));
        } else {
          toast.error(data.message ?? t('inviteFailed'));
        }
        return;
      }
      toast.success(data.message ?? t('inviteSent'));
      setEmail('');
      setRole('EDITOR');
      setInviteDialogOpen(false);
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
    setRemovingId(membershipId);
    setRemoveDialogOpen(false);
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
      setRemoveTarget(null);
    }
  };

  const openRemoveDialog = (membershipId: string, memberName: string) => {
    setRemoveTarget(membershipId);
    setRemoveTargetName(memberName);
    setRemoveDialogOpen(true);
  };

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.user.fullName.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q)
      );
    });
  }, [members, search, roleFilter]);

  const handleCreateAccountMember = async () => {
    if (!createEmail.trim() || !createName.trim() || !createPassword.trim()) {
      toast.error(t('enterAllFields'));
      return;
    }
    if (createPassword.trim().length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }
    setCreating(true);
    try {
      const res = await apiCreateAccountMember({
        email: createEmail.trim(),
        fullName: createName.trim(),
        password: createPassword.trim(),
        role: createRole,
        workspaceScopes: selectedScopes.length > 0 ? selectedScopes : undefined,
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? t('createFailed'));
        return;
      }
      toast.success(t('accountMemberCreated'));
      setCreateEmail('');
      setCreateName('');
      setCreatePassword('');
      setSelectedScopes([]);
      setScopeWsId('');
      void loadAccountMembers();
    } finally {
      setCreating(false);
    }
  };

  const handleAcctChangeRole = async (membershipId: string, newRole: string) => {
    setAcctUpdatingRoleId(membershipId);
    try {
      const res = await apiUpdateAccountMemberRole(membershipId, newRole);
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        toast.error(data.message ?? t('roleUpdateFailed'));
        return;
      }
      toast.success(t('roleUpdated'));
      void loadAccountMembers();
    } finally {
      setAcctUpdatingRoleId(null);
    }
  };

  const handleAcctRemoveMember = async (membershipId: string) => {
    setAcctRemovingId(membershipId);
    setAcctRemoveDialogOpen(false);
    try {
      const res = await apiRemoveAccountMember(membershipId);
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        toast.error(data.message ?? t('removeFailed'));
        return;
      }
      toast.success(t('memberRemoved'));
      void loadAccountMembers();
    } finally {
      setAcctRemovingId(null);
      setAcctRemoveTarget(null);
    }
  };

  if (!workspaceId) {
    return (
      <p className="text-[15px] text-muted-foreground">{t('selectWorkspace')}</p>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* ─── Page Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t('teamTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('memberCount', { count: members.length })}
            </p>
          </div>
          {isOwner && (
            <Button variant="default" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="me-2 h-4 w-4" />
              {t('inviteMember')}
            </Button>
          )}
        </div>

        {/* ─── Pending Invites (conditional) ──────────────────── */}
        {!loading && pendingInvites.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            role="region"
            aria-label={t('pendingInvites')}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {t('pendingInvitesCount', { count: pendingInvites.length })}
            </h3>
            <ul role="list" className="space-y-2">
              {pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  role="listitem"
                  aria-label={`${inv.email}, pending, ${inv.role}`}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('expiresOn', { date: new Date(inv.expiresAt).toLocaleDateString(locale) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', ROLE_COLORS[inv.role] ?? ROLE_COLORS.VIEWER)}>
                      {inv.role}
                    </span>
                    {isOwner && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => void handleResendInvite(inv.id)}
                          disabled={resendingId === inv.id}
                          aria-label={t('resendInviteAria', { email: inv.email })}
                        >
                          <RefreshCw className={cn('h-4 w-4', resendingId === inv.id && 'animate-spin')} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setCancelInviteTarget(inv.id);
                            setCancelInviteEmail(inv.email);
                            setCancelInviteDialogOpen(true);
                          }}
                          disabled={cancellingId === inv.id}
                          aria-label={t('cancelInviteAria', { email: inv.email })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ─── Active Members ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="region"
          aria-label={t('activeMembers')}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            {t('activeMembersCount', { count: members.length })}
          </h3>

          {loading ? (
            <ListSkeleton count={4} />
          ) : membersError ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{t('loadError')}</p>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                {t('retry')}
              </Button>
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title={t('noMembers')}
              description={t('noMembersDescription')}
              actionLabel={isOwner ? t('inviteTeammate') : undefined}
              onAction={isOwner ? () => setInviteDialogOpen(true) : undefined}
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    className="ps-8"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label={t('filterByRole')}
                >
                  <option value="all">{t('filterAllRoles')}</option>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              {filteredMembers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noSearchResults')}</p>
              ) : (
                <ul role="list" className="space-y-2">
                  {filteredMembers.map((m) => {
                    const isSelf = m.user.email === userEmail;
                    return (
                      <li
                        key={m.membershipId}
                        role="listitem"
                        className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                            aria-hidden="true"
                          >
                            {getInitials(m.user.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {m.user.fullName}
                              {isSelf && <span className="ms-1 text-xs text-muted-foreground">({t('you')})</span>}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">{m.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {m.role === 'OWNER' || !isOwner ? (
                            <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', ROLE_COLORS[m.role] ?? ROLE_COLORS.VIEWER)}>
                              {m.role}
                            </span>
                          ) : (
                            <select
                              className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold uppercase tracking-wide"
                              value={m.role}
                              disabled={updatingRoleId === m.membershipId || isSelf}
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
                          {isOwner && m.role !== 'OWNER' && !isSelf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                              disabled={removingId === m.membershipId}
                              onClick={() => openRemoveDialog(m.membershipId, m.user.fullName)}
                              aria-label={t('removeMemberAria', { name: m.user.fullName })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </motion.section>

        {/* ─── Account-Level Members (undocumented, kept per user request) ─── */}
        {isOwnerOrAdmin && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            role="region"
            aria-label={t('accountMembers')}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    {t('accountMembersCount', { count: accountMembers.length })}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t('accountMembersDescription')}</p>
                </div>
                {accountLoading ? (
                  <ListSkeleton count={3} />
                ) : accountMembers.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title={t('noAccountMembers')}
                    description={t('noAccountMembersDescription')}
                    actionLabel={isOwner ? t('createAccountMember') : undefined}
                    onAction={isOwner ? () => document.getElementById('acct-name')?.focus() : undefined}
                  />
                ) : (
                  <ul role="list" className="space-y-2">
                    {accountMembers.map((m) => (
                      <li
                        key={m.membershipId}
                        role="listitem"
                        className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                            aria-hidden="true"
                          >
                            {getInitials(m.user.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{m.user.fullName}</p>
                            <p className="truncate text-sm text-muted-foreground">{m.user.email}</p>
                            {m.workspaceScopes && m.workspaceScopes.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {m.workspaceScopes.map((s) => (
                                  <span key={s.id} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                    {s.workspaceName}: {s.role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold uppercase tracking-wide"
                            value={m.role}
                            disabled={acctUpdatingRoleId === m.membershipId || !isOwner}
                            onChange={(e) => void handleAcctChangeRole(m.membershipId, e.target.value)}
                            aria-label={t('changeRoleAria', { name: m.user.fullName })}
                          >
                            {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <span className="font-mono-nums text-xs text-muted-foreground">
                            {new Date(m.joinedAt).toLocaleDateString(locale)}
                          </span>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                              disabled={acctRemovingId === m.membershipId}
                              onClick={() => {
                                setAcctRemoveTarget(m.membershipId);
                                setAcctRemoveDialogOpen(true);
                              }}
                              aria-label={t('removeMemberAria', { name: m.user.fullName })}
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

              {isOwner && (
                <div className="rounded-xl border border-border bg-muted/20 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <UserPlus className="h-4 w-4 text-primary" />
                    {t('createAccountMember')}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="acct-name">{t('fullName')}</Label>
                      <Input
                        id="acct-name"
                        placeholder={t('fullNamePlaceholder')}
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acct-email">{t('email')}</Label>
                      <Input
                        id="acct-email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acct-password">{t('password')}</Label>
                      <Input
                        id="acct-password"
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acct-role">{t('role')}</Label>
                      <select
                        id="acct-role"
                        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                        value={createRole}
                        onChange={(e) => setCreateRole(e.target.value)}
                      >
                        {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    {accountWorkspaces.length > 0 && (
                      <div className="space-y-2">
                        <Label>{t('workspaceScopes')}</Label>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="h-9 rounded-lg border border-border bg-card px-2 text-xs"
                            value={scopeWsId}
                            onChange={(e) => setScopeWsId(e.target.value)}
                          >
                            <option value="">{t('selectWorkspaceScope')}</option>
                            {accountWorkspaces.map((w) => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                          <select
                            className="h-9 rounded-lg border border-border bg-card px-2 text-xs"
                            value={scopeRole}
                            onChange={(e) => setScopeRole(e.target.value)}
                          >
                            {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-lg"
                            disabled={!scopeWsId}
                            onClick={() => {
                              if (!scopeWsId) return;
                              setSelectedScopes((prev) => [...prev, { workspaceId: scopeWsId, role: scopeRole }]);
                              setScopeWsId('');
                            }}
                          >
                            {t('addScope')}
                          </Button>
                        </div>
                        {selectedScopes.length > 0 && (
                          <ul className="space-y-1">
                            {selectedScopes.map((s, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs">
                                <span className="font-medium">{accountWorkspaces.find((w) => w.id === s.workspaceId)?.name ?? s.workspaceId}</span>
                                <span className="text-muted-foreground">({s.role})</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => setSelectedScopes((prev) => prev.filter((_, idx) => idx !== i))}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <Button
                      type="button"
                      className="w-full font-semibold"
                      variant="cta"
                      onClick={() => void handleCreateAccountMember()}
                      disabled={creating}
                    >
                      <UserPlus className="me-2 h-4 w-4" />
                      {creating ? t('creating') : t('createAccountMember')}
                    </Button>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {t('createAccountHint')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ─── Invite Dialog ──────────────────────────────────── */}
        <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
          setInviteDialogOpen(open);
          if (!open) {
            setEmail('');
            setEmailError(null);
            setRole('EDITOR');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('inviteMember')}</DialogTitle>
              <DialogDescription>{t('inviteHint')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">{t('email')}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  onBlur={() => {
                    if (email.trim() && !validateEmail(email)) {
                      setEmailError(t('invalidEmail'));
                    }
                  }}
                  aria-invalid={!!emailError}
                />
                {emailError && (
                  <p className="text-sm text-destructive" role="alert">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">{t('role')}</Label>
                <select
                  id="invite-role"
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {role === 'ADMIN' && t('roleAdminDesc')}
                  {role === 'EDITOR' && t('roleEditorDesc')}
                  {role === 'VIEWER' && t('roleViewerDesc')}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="cta"
                onClick={() => void sendInvite()}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <RefreshCw className="me-2 h-4 w-4 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Mail className="me-2 h-4 w-4" />
                    {t('sendInvite')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Cancel Invite AlertDialog ─────────────────────── */}
        <AlertDialog open={cancelInviteDialogOpen} onOpenChange={setCancelInviteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('cancelInviteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmCancelInvite', { email: cancelInviteEmail })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setCancelInviteTarget(null); setCancelInviteEmail(''); }}>
                {t('cancelRemove')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!!cancellingId}
                onClick={() => {
                  if (cancelInviteTarget) void handleCancelInvite(cancelInviteTarget);
                  setCancelInviteEmail('');
                }}
              >
                {t('cancelInviteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Remove Member AlertDialog ─────────────────────── */}
        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmRemoveName', { name: removeTargetName })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRemoveTarget(null)}>
                {t('cancelRemove')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!!removingId}
                onClick={() => {
                  if (removeTarget) void handleRemoveMember(removeTarget);
                }}
              >
                {t('removeMemberConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Remove Account Member AlertDialog ─────────────── */}
        <AlertDialog open={acctRemoveDialogOpen} onOpenChange={setAcctRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('confirmRemoveAccount')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAcctRemoveTarget(null)}>
                {t('cancelRemove')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!!acctRemovingId}
                onClick={() => {
                  if (acctRemoveTarget) void handleAcctRemoveMember(acctRemoveTarget);
                }}
              >
                {t('removeMemberConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
