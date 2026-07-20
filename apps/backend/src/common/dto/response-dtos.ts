import { Expose, plainToInstance, Type } from 'class-transformer';
import type { PaginatedResult } from '../pagination/cursor-pagination';

/**
 * Base helper to map a plain object to a DTO instance, exposing only
 * fields decorated with @Expose. All other fields are stripped from
 * the JSON response, preventing accidental data leakage.
 */
export function toResponseDto<T>(
  cls: new (...args: unknown[]) => T,
  plain: Record<string, unknown>,
): T {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true,
  });
}

export function toResponseDtoList<T>(
  cls: new (...args: unknown[]) => T,
  plains: Record<string, unknown>[],
): T[] {
  return plains.map((p) => toResponseDto(cls, p));
}

export function toPaginatedResponseDto<T>(
  cls: new (...args: unknown[]) => T,
  result: PaginatedResult<Record<string, unknown>>,
): PaginatedResult<T> {
  return {
    items: toResponseDtoList(cls, result.items),
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  };
}

// ─── Auth Response DTOs ────────────────────────────────────────────

export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() fullName: string;
  @Expose() audience: string;
  @Expose() isSuperAdmin: boolean;
  @Expose() platformStaffRole: string | null;
  @Expose() emailVerified: boolean;
  @Expose() twoFactorEnabled: boolean;
  @Expose() locale: string;
  @Expose() businessName: string | null;
  @Expose() phone: string | null;
  @Expose() country: string | null;
  @Expose() city: string | null;
}

export class WorkspaceBriefDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug: string;
  @Expose() role: string;
  @Expose() subscriptionStatus: string;
  @Expose() subscriptionPlan: string;
}

export class AuthMeResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
  @Expose()
  @Type(() => WorkspaceBriefDto)
  workspaces: WorkspaceBriefDto[] | null;
  @Expose() activeWorkspaceId: string | null;
}

// ─── Platform Admin Response DTOs ──────────────────────────────────

export class CustomerListItemDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() fullName: string;
  @Expose() businessName: string | null;
  @Expose() subscriptionStatus: string;
  @Expose() subscriptionPlan: string;
  @Expose() workspaceCount: number;
  @Expose() screenCount: number;
  @Expose() createdAt: string;
  @Expose() lastLoginAt: string | null;
}

export class CustomerProfileWorkspaceDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug: string;
  @Expose() screenCount: number;
  @Expose() memberCount: number;
  @Expose() createdAt: string;
}

export class CustomerProfileAuditLogDto {
  @Expose() id: string;
  @Expose() action: string;
  @Expose() createdAt: string;
  @Expose() ipAddress: string;
}

export class CustomerProfileDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() fullName: string;
  @Expose() businessName: string | null;
  @Expose() phone: string | null;
  @Expose() country: string | null;
  @Expose() city: string | null;
  @Expose() subscriptionStatus: string;
  @Expose() subscriptionPlan: string;
  @Expose() subscriptionEndDate: string | null;
  @Expose()
  @Type(() => CustomerProfileWorkspaceDto)
  workspaces: CustomerProfileWorkspaceDto[];
  @Expose()
  @Type(() => CustomerProfileAuditLogDto)
  recentAuditLogs: CustomerProfileAuditLogDto[];
}

export class WorkspaceListItemDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug: string;
  @Expose() ownerId: string;
  @Expose() memberCount: number;
  @Expose() screenCount: number;
  @Expose() subscriptionPlan: string;
  @Expose() subscriptionStatus: string;
  @Expose() createdAt: string;
}

export class FleetScreenItemDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() workspaceId: string;
  @Expose() workspaceName: string;
  @Expose() status: string;
  @Expose() lastSeenAt: string | null;
  @Expose() createdAt: string;
}

export class AdminAuditLogItemDto {
  @Expose() id: string;
  @Expose() action: string;
  @Expose() adminName: string;
  @Expose() targetCustomer: string;
  @Expose() ipAddress: string;
  @Expose() timestamp: string;
}

export class StaffListItemDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() fullName: string;
  @Expose() platformStaffRole: string;
  @Expose() isActive: boolean;
  @Expose() lastLoginAt: string | null;
  @Expose() createdAt: string;
}

export class PlatformStatsDto {
  @Expose() totalCustomers: number;
  @Expose() totalWorkspaces: number;
  @Expose() totalScreens: number;
  @Expose() activeScreens: number;
  @Expose() totalRevenue: number;
  @Expose() mrr: number;
  @Expose() churnRate: number;
  @Expose() trialConversions: number;
}

// ─── Customer Domain Response DTOs ─────────────────────────────────

export class ScreenListItemDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() status: string;
  @Expose() workspaceId: string;
  @Expose() lastSeenAt: string | null;
  @Expose() createdAt: string;
  @Expose() updatedAt: string;
}

export class MediaItemDto {
  @Expose() id: string;
  @Expose() fileName: string;
  @Expose() mimeType: string;
  @Expose() sizeBytes: number;
  @Expose() url: string;
  @Expose() workspaceId: string | null;
  @Expose() createdAt: string;
}

export class PlaylistItemDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() isPublished: boolean;
  @Expose() workspaceId: string | null;
  @Expose() updatedAt: string;
}

export class ScheduleItemDto {
  @Expose() id: string;
  @Expose() workspaceId: string;
  @Expose() screenId: string | null;
  @Expose() playlistId: string;
  @Expose() startDate: string;
  @Expose() endDate: string;
  @Expose() createdAt: string;
}

export class WorkspaceAuditLogItemDto {
  @Expose() id: string;
  @Expose() action: string;
  @Expose() actorName: string;
  @Expose() ipAddress: string;
  @Expose() createdAt: string;
}
