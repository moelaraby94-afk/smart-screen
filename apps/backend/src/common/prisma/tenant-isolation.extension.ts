import { Prisma } from '@prisma/client';
import { requestContext } from '../request-context/request-context';

/**
 * Tenant-scoped models that have a `workspaceId` field.
 * Queries on these models will automatically get `where.workspaceId` injected
 * from the AsyncLocalStorage request context.
 */
const TENANT_SCOPED_MODELS = new Set([
  'WorkspaceMembership',
  'WorkspaceInvitation',
  'Screen',
  'ScreenPairingSession',
  'Canvas',
  'CanvasVersion',
  'Media',
  'MediaFolder',
  'Playlist',
  'PlaylistItem',
  'PlaylistGroup',
  'Schedule',
  'Campaign',
  'CampaignHistory',
  'Subscription',
  'PaymentRecord',
  'OnboardingProgress',
  'FeatureFlag',
  'PrayerConfig',
  'RamadanConfig',
  'ApiKey',
  'WebhookEndpoint',
  'WebhookDeliveryLog',
  'AuditLog',
]);

/**
 * Models that support soft delete via a `deletedAt` field.
 * Queries on these models will automatically get `where.deletedAt = null` injected.
 */
const SOFT_DELETE_MODELS = new Set(['WebhookEndpoint']);

/**
 * Prisma operations that accept a `where` clause and should have
 * tenant isolation + soft delete filters injected.
 */
const WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

type PrismaParams = {
  model?: string;
  operation: string;
  args?: Record<string, unknown> & { where?: Record<string, unknown> };
};

/**
 * Creates a Prisma client extension that automatically:
 * 1. Injects `workspaceId` into `where` clauses for tenant-scoped models
 * 2. Filters out soft-deleted records (`deletedAt: null`)
 *
 * The workspaceId is read from AsyncLocalStorage (requestContext).
 * If no context exists or `bypassTenantIsolation` is set, no injection occurs.
 *
 * This prevents accidental cross-tenant data access when a service forgets
 * to manually add `where: { workspaceId }`.
 *
 * @see docs/platform-v2/review/01-architectural-decisions.md — D-05
 */
export function createTenantIsolationExtension() {
  return Prisma.defineExtension({
    name: 'tenantIsolation',
    query: {
      async $allOperations(params: PrismaParams) {
        const { model, operation, args } = params;

        if (!model || !args || !WHERE_OPERATIONS.has(operation)) {
          return (
            params as unknown as { query: (p: unknown) => Promise<unknown> }
          ).query(params);
        }

        const ctx = requestContext.getStore();

        const shouldInjectWorkspace =
          TENANT_SCOPED_MODELS.has(model) &&
          ctx?.workspaceId &&
          !ctx?.bypassTenantIsolation;

        const shouldInjectSoftDelete = SOFT_DELETE_MODELS.has(model);

        if (!shouldInjectWorkspace && !shouldInjectSoftDelete) {
          return (
            params as unknown as { query: (p: unknown) => Promise<unknown> }
          ).query(params);
        }

        const where = args.where ?? {};

        if (shouldInjectWorkspace && ctx?.workspaceId) {
          if (!where.workspaceId) {
            where.workspaceId = ctx.workspaceId;
          }
        }

        if (shouldInjectSoftDelete) {
          if (where.deletedAt === undefined) {
            where.deletedAt = null;
          }
        }

        args.where = where;

        return (
          params as unknown as { query: (p: unknown) => Promise<unknown> }
        ).query(params);
      },
    },
  });
}
