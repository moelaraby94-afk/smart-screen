'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminCosmicLoader } from '@/components/admin/admin-cosmic-loader';
import { setStoredAccessToken } from '@/features/auth/session';
import {
  fetchAdminCustomer as apiFetchAdminCustomer,
  updateCustomerSubscription as apiUpdateCustomerSubscription,
  createCustomerWorkspace as apiCreateCustomerWorkspace,
  updateCustomerWorkspace as apiUpdateCustomerWorkspace,
  deleteCustomerWorkspace as apiDeleteCustomerWorkspace,
  impersonateUser as apiImpersonateUser,
  sendCustomerReminder as apiSendCustomerReminder,
} from './admin-api';
import { readApiError } from '@/features/api/api-error';
import { useApiErrorMessage } from '@/features/api/use-api-error-message';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  type BranchRow,
  type ProfilePayload,
  type ProfileTabId,
  type SubStatus,
  toLocalDatetimeValue,
} from '@/features/admin/admin-customer-profile-types';
import {
  OverviewTab,
  SubscriptionTab,
  UsageTab,
  WorkspacesTab,
  ProfileTabBar,
} from '@/features/admin/admin-customer-profile-tabs';
import {
  AddBranchDialog,
  EditBranchDialog,
  DeleteBranchDialog,
} from '@/features/admin/admin-customer-profile-dialogs';

export function AdminCustomerProfileClient({ customerId }: { customerId: string }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('adminCustomerProfile');
  const errorMessage = useApiErrorMessage();
  const { refreshWorkspaces } = useWorkspace();
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatingWs, setImpersonatingWs] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  const [subStatus, setSubStatus] = useState<SubStatus>('ACTIVE');
  const [subEndLocal, setSubEndLocal] = useState('');
  const [accountEnabled, setAccountEnabled] = useState(true);
  const [savingSub, setSavingSub] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);

  const [editWs, setEditWs] = useState<BranchRow | null>(null);
  const [editName, setEditName] = useState('');
  const [savingWs, setSavingWs] = useState(false);

  const [deleteWs, setDeleteWs] = useState<BranchRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetchAdminCustomer(customerId);
    if (!res.ok) {
      toast.error(t('toastLoadFailed'));
      setData(null);
      setLoading(false);
      return;
    }
    const json = (await res.json()) as ProfilePayload;
    setData(json);
    setSubStatus(json.subscriptionStatus);
    setSubEndLocal(toLocalDatetimeValue(json.subscriptionEndDate));
    setAccountEnabled(json.isActive);
    setLoading(false);
  }, [customerId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSubscription = async () => {
    if (!data) return;
    setSavingSub(true);
    try {
      const body: {
        subscriptionStatus: SubStatus;
        subscriptionEndDate: string | null;
        isActive: boolean;
      } = {
        subscriptionStatus: subStatus,
        isActive: accountEnabled,
        subscriptionEndDate: subEndLocal.trim()
          ? new Date(subEndLocal).toISOString()
          : null,
      };
      const res = await apiUpdateCustomerSubscription(customerId, body);
      if (!res.ok) {
        throw new Error(errorMessage(await readApiError(res)));
      }
      toast.success(t('toastSubUpdated'));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('toastSubSaveFailed'));
    } finally {
      setSavingSub(false);
    }
  };

  const createBranch = async () => {
    const name = addName.trim();
    if (name.length < 2) {
      toast.error(t('toastNameMin'));
      return;
    }
    setAdding(true);
    try {
      const res = await apiCreateCustomerWorkspace(customerId, name);
      if (!res.ok) throw new Error('Failed');
      toast.success(t('toastWsCreated'));
      setAddOpen(false);
      setAddName('');
      await load();
    } catch {
      toast.error(t('toastWsCreateFailed'));
    } finally {
      setAdding(false);
    }
  };

  const saveBranchName = async () => {
    if (!editWs) return;
    const name = editName.trim();
    if (name.length < 2) {
      toast.error(t('toastNameMin'));
      return;
    }
    setSavingWs(true);
    try {
      const res = await apiUpdateCustomerWorkspace(customerId, editWs.id, { name });
      if (!res.ok) throw new Error('Failed');
      toast.success(t('toastBranchUpdated'));
      setEditWs(null);
      await load();
    } catch {
      toast.error(t('toastWsUpdateFailed'));
    } finally {
      setSavingWs(false);
    }
  };

  const removeBranch = async () => {
    if (!deleteWs) return;
    setDeleting(true);
    try {
      const res = await apiDeleteCustomerWorkspace(customerId, deleteWs.id);
      if (!res.ok) throw new Error('Failed');
      toast.success(t('toastWsRemoved'));
      setDeleteWs(null);
      await load();
    } catch {
      toast.error(t('toastWsDeleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const impersonateBranch = async (workspaceId: string) => {
    if (!data) return;
    setImpersonatingWs(workspaceId);
    try {
      const res = await apiImpersonateUser(data.id, { workspaceId });
      if (!res.ok) {
        toast.error(t('toastImpersonateFailed'));
        return;
      }
      const payload = (await res.json()) as {
        accessToken?: string;
        workspaces?: Array<{ id: string }>;
      };
      if (payload.accessToken) {
        setStoredAccessToken(payload.accessToken);
      }
      const first = payload.workspaces?.[0]?.id ?? workspaceId;
      await refreshWorkspaces(first);
      toast.success(t('toastEnteringWs'));
      const dashUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000';
      window.location.assign(`${dashUrl}/${locale}/media`);
    } finally {
      setImpersonatingWs(null);
    }
  };

  const sendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await apiSendCustomerReminder(customerId);
      if (!res.ok) throw new Error('Failed');
      const body = (await res.json()) as { message?: string };
      toast.success(body.message ?? t('toastReminderDefault'));
    } catch {
      toast.error(t('toastReminderFailed'));
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return <AdminCosmicLoader label={t('loading')} />;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('notFound')}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-xl border-border"
          onClick={() => router.push(`/${locale}/admin/customers` as Route)}
        >
          {t('backToHub')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          href={`/${locale}/admin/customers` as Route}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('linkHub')}
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-primary/35 bg-primary/5 hover:bg-primary/10"
            disabled={sendingReminder}
            onClick={() => void sendReminder()}
          >
            <Send className="me-2 h-4 w-4" />
            {t('sendReminder')}
          </Button>
        </div>
      </div>

      <ProfileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab data={data} />}

      {activeTab === 'subscription' && (
        <SubscriptionTab
          subStatus={subStatus}
          setSubStatus={setSubStatus}
          subEndLocal={subEndLocal}
          setSubEndLocal={setSubEndLocal}
          accountEnabled={accountEnabled}
          setAccountEnabled={setAccountEnabled}
          savingSub={savingSub}
          onSave={() => void saveSubscription()}
        />
      )}

      {activeTab === 'usage' && <UsageTab data={data} />}

      {activeTab === 'workspaces' && (
        <WorkspacesTab
          data={data}
          customerId={customerId}
          locale={locale}
          impersonatingWs={impersonatingWs}
          onAdd={() => {
            setAddName('');
            setAddOpen(true);
          }}
          onEdit={(b) => {
            setEditWs(b);
            setEditName(b.name);
          }}
          onDelete={(b) => setDeleteWs(b)}
          onImpersonate={(wsId) => void impersonateBranch(wsId)}
        />
      )}

      <AddBranchDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        name={addName}
        setName={setAddName}
        adding={adding}
        onCreate={() => void createBranch()}
      />

      <EditBranchDialog
        editWs={editWs}
        onClose={() => setEditWs(null)}
        name={editName}
        setName={setEditName}
        saving={savingWs}
        onSave={() => void saveBranchName()}
      />

      <DeleteBranchDialog
        deleteWs={deleteWs}
        onClose={() => setDeleteWs(null)}
        deleting={deleting}
        onConfirm={() => void removeBranch()}
      />
    </div>
  );
}
