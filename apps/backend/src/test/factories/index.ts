import {
  UserRole,
  UserSubscriptionStatus,
  ScreenStatus,
  PlayerPlatform,
  ScreenOrientation,
  SubscriptionPlan,
  SubscriptionStatus,
  type User,
  type Workspace,
  type WorkspaceMember,
  type Screen,
  type Media,
  type Subscription,
} from '@prisma/client';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function override<T>(base: T, patch?: DeepPartial<T>): T {
  if (!patch) return base;
  return { ...base, ...patch } as T;
}

export function makeUser(patch?: DeepPartial<User>): User {
  return override(
    {
      id: 'user_1',
      email: 'test@example.com',
      fullName: 'Test User',
      passwordHash: '$2a$10$mockhash',
      refreshTokenHash: null,
      locale: 'en',
      isActive: true,
      isSuperAdmin: false,
      platformStaffRole: null,
      subscriptionStatus: UserSubscriptionStatus.TRIAL,
      subscriptionEndDate: null,
      lastLoginAt: null,
      businessName: null,
      phone: null,
      country: null,
      city: null,
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as User,
    patch,
  );
}

export function makeWorkspace(patch?: DeepPartial<Workspace>): Workspace {
  return override(
    {
      id: 'ws_1',
      name: 'Test Workspace',
      slug: 'test-workspace',
      defaultLocale: 'en',
      timezone: 'UTC',
      isPaused: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as Workspace,
    patch,
  );
}

export function makeWorkspaceMember(
  patch?: DeepPartial<WorkspaceMember>,
): WorkspaceMember {
  return override(
    {
      id: 'wm_1',
      workspaceId: 'ws_1',
      userId: 'user_1',
      role: UserRole.OWNER,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as WorkspaceMember,
    patch,
  );
}

export function makeScreen(patch?: DeepPartial<Screen>): Screen {
  return override(
    {
      id: 'screen_1',
      workspaceId: 'ws_1',
      name: 'Test Screen',
      serialNumber: 'SN-001',
      status: ScreenStatus.OFFLINE,
      location: null,
      lastSeenAt: null,
      isOfflineCacheMode: false,
      activePlaylistId: null,
      playerTicker: null,
      playerVersion: null,
      playerPlatform: PlayerPlatform.WEB,
      resolutionWidth: 1920,
      resolutionHeight: 1080,
      orientation: ScreenOrientation.AUTO,
      pairingSecretHash: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      playlistGroupId: null,
      overridePlaylistId: null,
      overrideExpiresAt: null,
    } as unknown as Screen,
    patch,
  );
}

export function makeMedia(patch?: DeepPartial<Media>): Media {
  return override(
    {
      id: 'media_1',
      ownerId: 'user_1',
      workspaceId: 'ws_1',
      fileName: 'test.png',
      originalName: 'test.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      relativePath: 'ws_1/test.png',
      folderId: null,
      fileHash: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: null,
    } as unknown as Media,
    patch,
  );
}

export function makeSubscription(
  patch?: DeepPartial<Subscription>,
): Subscription {
  return override(
    {
      id: 'sub_1',
      workspaceId: 'ws_1',
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.TRIALING,
      seats: 1,
      screenLimit: 1,
      storageLimitBytes: null,
      startedAt: new Date('2026-01-01T00:00:00Z'),
      currentPeriodEnd: null,
      canceledAt: null,
      gracePeriodEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    } as unknown as Subscription,
    patch,
  );
}
