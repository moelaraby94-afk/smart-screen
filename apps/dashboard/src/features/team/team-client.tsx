'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, RefreshCw, Shield, UserPlus, UserCheck, X, Trash2 } from 'lucide-react';
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
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
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

  const openRemoveDialog = (membershipId: string) => {
    setRemoveTarget(membershipId);
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
                <ListSkeleton count={4} />
              ) : members.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title={t('noMembers')}
                  description={t('noMembersDescription')}
                />
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[180px]">
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
                    <ul className="space-y-2">
                      {filteredMembers.map((m) => (
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
                            onClick={() => openRemoveDialog(m.membershipId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                  )}
                </>
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

      {/* ─── Account-level members ─────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vc-card-surface overflow-hidden rounded-2xl border border-border"
      >
        <div className="grid gap-8 p-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                {t('accountMembers')}
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
              />
            ) : (
              <ul className="space-y-2">
                {accountMembers.map((m) => (
                  <li
                    key={m.membershipId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                  >
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
                    <div className="flex items-center gap-3">
                      <select
                        className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold uppercase tracking-wide"
                        value={m.role}
                        disabled={acctUpdatingRoleId === m.membershipId}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={acctRemovingId === m.membershipId}
                        onClick={() => {
                          setAcctRemoveTarget(m.membershipId);
                          setAcctRemoveDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-6">
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
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acct-role">{t('role')}</Label>
                <select
                  id="acct-role"
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
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
                className="w-full rounded-xl font-semibold" variant="cta"
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
        </div>
      </motion.section>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmRemove')}</AlertDialogDescription>
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
  );
}
