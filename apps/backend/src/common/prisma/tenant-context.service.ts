import { Injectable } from '@nestjs/common';
import { requestContext } from '../request-context/request-context';

/**
 * Provides helpers for running code within a tenant-isolated context.
 *
 * The Prisma tenant isolation extension (tenant-isolation.extension.ts) reads
 * `workspaceId` from AsyncLocalStorage. This service sets that context for
 * request-scoped operations.
 *
 * Usage:
 * ```ts
 * await this.tenantContext.run(workspaceId, async () => {
 *   // All Prisma queries inside this block auto-inject workspaceId
 *   return this.prisma.screen.findMany();
 * });
 * ```
 *
 * For platform admin operations that need cross-tenant access:
 * ```ts
 * await this.tenantContext.bypass(async () => {
 *   return this.prisma.user.findMany();
 * });
 * ```
 */
@Injectable()
export class TenantContextService {
  /**
   * Run a function within a tenant-isolated context.
   * The workspaceId is stored in AsyncLocalStorage and read by the
   * Prisma tenant isolation extension to auto-inject `where: { workspaceId }`.
   */
  async run<T>(workspaceId: string, fn: () => Promise<T>): Promise<T> {
    const store = requestContext.getStore();
    const newStore = {
      requestId: store?.requestId ?? 'no-request',
      workspaceId,
      bypassTenantIsolation: false,
    };
    return requestContext.run(newStore, fn);
  }

  /**
   * Run a function with tenant isolation bypassed.
   * Use this for platform admin operations that legitimately need
   * cross-tenant access (e.g. PlatformTenantService.listCustomers).
   */
  async bypass<T>(fn: () => Promise<T>): Promise<T> {
    const store = requestContext.getStore();
    const newStore = {
      requestId: store?.requestId ?? 'no-request',
      workspaceId: store?.workspaceId,
      bypassTenantIsolation: true,
    };
    return requestContext.run(newStore, fn);
  }

  /**
   * Get the current workspaceId from the context, if any.
   */
  getCurrentWorkspaceId(): string | undefined {
    return requestContext.getStore()?.workspaceId;
  }

  /**
   * Check if tenant isolation is bypassed in the current context.
   */
  isBypassed(): boolean {
    return requestContext.getStore()?.bypassTenantIsolation ?? false;
  }
}
