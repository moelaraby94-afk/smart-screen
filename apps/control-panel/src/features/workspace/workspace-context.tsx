'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchCurrentUser } from './workspace-api';

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  isPaused?: boolean;
  role?: string;
};

type WorkspaceContextValue = {
  workspaceId: string | null;
  workspaces: WorkspaceSummary[];
  setWorkspaceId: (id: string) => void;
  refreshWorkspaces: (preferredWorkspaceId?: string | null) => Promise<void>;
  workspaceDataEpoch: number;
  bumpWorkspaceDataEpoch: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  userEmail: string | null;
  userFullName: string | null;
  businessName: string | null;
  impersonatedBySuperAdminId: string | null;
  pairingActivityEpoch: number;
  bumpPairingActivityEpoch: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [workspaceDataEpoch, setWorkspaceDataEpoch] = useState(0);
  const [pairingActivityEpoch, setPairingActivityEpoch] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [impersonatedBySuperAdminId, setImpersonatedBySuperAdminId] = useState<
    string | null
  >(null);
  const hasSuccessfulMeRef = useRef(false);

  const bumpWorkspaceDataEpoch = useCallback(() => {
    setWorkspaceDataEpoch((n) => n + 1);
  }, []);

  const bumpPairingActivityEpoch = useCallback(() => {
    setPairingActivityEpoch((n) => n + 1);
  }, []);

  const setWorkspaceId = useCallback((id: string) => {
    setWorkspaceIdState(id);
  }, []);

  const resetToLoggedOut = useCallback(() => {
    hasSuccessfulMeRef.current = false;
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    setUserEmail(null);
    setUserFullName(null);
    setBusinessName(null);
    setImpersonatedBySuperAdminId(null);
    setWorkspaces([]);
    setWorkspaceIdState(null);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchCurrentUser();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          resetToLoggedOut();
          return;
        }
        if (hasSuccessfulMeRef.current) {
          return;
        }
        resetToLoggedOut();
        return;
      }

      let raw: {
        email?: string;
        fullName?: string | null;
        businessName?: string | null;
        memberships?: Array<{ role: string; workspace: WorkspaceSummary }>;
        isSuperAdmin?: boolean;
        impersonatedBy?: string | null;
      };
      try {
        raw = (await response.json()) as typeof raw;
      } catch {
        if (hasSuccessfulMeRef.current) {
          return;
        }
        resetToLoggedOut();
        return;
      }

      setIsAuthenticated(true);
      const superAdmin = Boolean(raw.isSuperAdmin);
      setIsSuperAdmin(superAdmin);
      setUserEmail(typeof raw.email === 'string' ? raw.email : null);
      setUserFullName(
        raw.fullName != null && raw.fullName !== ''
          ? String(raw.fullName)
          : null,
      );
      setBusinessName(
        raw.businessName != null && raw.businessName !== ''
          ? String(raw.businessName)
          : null,
      );
      setImpersonatedBySuperAdminId(
        typeof raw.impersonatedBy === 'string' ? raw.impersonatedBy : null,
      );
      const list = Array.isArray(raw.memberships) ? raw.memberships : [];
      const mapped = list.map((membership) => ({
        ...membership.workspace,
        role: membership.role,
      }));
      setWorkspaces(mapped);
      hasSuccessfulMeRef.current = true;
    } catch {
      if (hasSuccessfulMeRef.current) {
        return;
      }
      resetToLoggedOut();
    } finally {
      setIsLoading(false);
    }
  }, [resetToLoggedOut]);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const value = useMemo(
    () => ({
      workspaceId,
      workspaces,
      setWorkspaceId,
      refreshWorkspaces,
      workspaceDataEpoch,
      bumpWorkspaceDataEpoch,
      isLoading,
      isAuthenticated,
      isSuperAdmin,
      userEmail,
      userFullName,
      businessName,
      impersonatedBySuperAdminId,
      pairingActivityEpoch,
      bumpPairingActivityEpoch,
    }),
    [
      workspaceId,
      workspaces,
      setWorkspaceId,
      refreshWorkspaces,
      workspaceDataEpoch,
      bumpWorkspaceDataEpoch,
      pairingActivityEpoch,
      bumpPairingActivityEpoch,
      isLoading,
      isAuthenticated,
      isSuperAdmin,
      userEmail,
      userFullName,
      businessName,
      impersonatedBySuperAdminId,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
