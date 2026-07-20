import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
  workspaceId?: string;
  bypassTenantIsolation?: boolean;
}

/**
 * AsyncLocalStorage instance shared across the entire process.
 * The middleware wraps each request in `.run()` so any async code
 * path that executes within the request can retrieve the requestId
 * via `requestContext.getStore()`.
 *
 * `workspaceId` is set by the tenant middleware after workspace membership
 * is verified, enabling the Prisma tenant-isolation extension to auto-inject
 * `where: { workspaceId }` on tenant-scoped models.
 *
 * `bypassTenantIsolation` is set only for platform-level admin queries that
 * legitimately need cross-tenant access (e.g. PlatformTenantService).
 */
export const requestContext = new AsyncLocalStorage<RequestContextData>();
