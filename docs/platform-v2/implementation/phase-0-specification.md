# Phase 0 — Detailed Implementation Specification

> **Status:** Ready for implementation
> **Estimated effort:** 2 weeks (14 working days)
> **Prerequisites:** None — this is the foundation phase
> **Rule:** No other phase may begin until Phase 0 is complete and verified

---

## Table of Contents

1. [JWT Audience Claim](#1-jwt-audience-claim)
2. [AudienceGuard](#2-audienceguard)
3. [Dual-Cookie Strategy](#3-dual-cookie-strategy)
4. [WebSocket Tenant Isolation Fix](#4-websocket-tenant-isolation-fix)
5. [SuperAdminGuard Cleanup](#5-superadminguard-cleanup)
6. [PlatformSettings Table](#6-platformsettings-table)
7. [ExchangeToken Table](#7-exchangetoken-table)
8. [Shared Packages (packages/ui, packages/config)](#8-shared-packages)
9. [ESLint Boundary Rules](#9-eslint-boundary-rules)
10. [Redis Caching for RolesGuard](#10-redis-caching-for-rolesguard)
11. [Database Backups](#11-database-backups)
12. [Missing Database Indexes](#12-missing-database-indexes)
13. [Secret Rotation Documentation](#13-secret-rotation-documentation)
14. [Verification Checklist](#14-verification-checklist)

---

## 1. JWT Audience Claim

### 1.1 Current State

**File:** `apps/backend/src/domains/auth/auth.service.ts`

Current `TokenPayload`:
```typescript
interface TokenPayload {
  sub: string;          // user ID
  email: string;
  isSuperAdmin: boolean;
  impersonatedBy?: string;
  typ: 'access' | 'refresh';
  sid?: string;         // session ID (refresh only)
}
```

Current `JwtStrategy.validate()` at `apps/backend/src/domains/auth/jwt.strategy.ts:37-61`:
- Extracts JWT from `cs_access_token` cookie or `Authorization: Bearer` header
- Validates `typ === 'refresh'` is rejected as access token
- Validates user exists and `isActive` in DB
- Returns `JwtUser` object

Current `JwtUser` type at `apps/backend/src/common/auth/current-user.decorator.ts:3-9`:
```typescript
export type JwtUser = {
  sub: string;
  email: string;
  isSuperAdmin: boolean;
  impersonatedBy?: string;
};
```

### 1.2 Target State

#### 1.2.1 Token Payload

```typescript
type JwtAudience = 'platform' | 'customer' | 'player';

interface TokenPayload {
  sub: string;            // user ID
  email: string;
  aud: JwtAudience;       // NEW: audience claim
  isSuperAdmin: boolean;
  platformStaffRole?: PlatformStaffRole;  // NEW: only for platform audience
  impersonatedBy?: string;
  typ: 'access' | 'refresh';
  sid?: string;           // session ID (refresh only)
  iat?: number;           // issued at (auto by jsonwebtoken)
  exp?: number;           // expiry (auto by jsonwebtoken)
}
```

#### 1.2.2 JwtUser Type

```typescript
// apps/backend/src/common/auth/current-user.decorator.ts

export type JwtAudience = 'platform' | 'customer' | 'player';

export type JwtUser = {
  sub: string;
  email: string;
  aud: JwtAudience;                       // NEW
  isSuperAdmin: boolean;
  platformStaffRole?: PlatformStaffRole;  // NEW
  impersonatedBy?: string;
  sid?: string;
};
```

#### 1.2.3 Token Issuance — `AuthService.login()`

**File:** `apps/backend/src/domains/auth/auth.service.ts`

The `login()` method must determine audience at login time:

```typescript
private resolveAudience(user: User): JwtAudience {
  if (user.isSuperAdmin || user.platformStaffRole) {
    return 'platform';
  }
  return 'customer';
}

// In login():
const audience = this.resolveAudience(user);
const payload: TokenPayload = {
  sub: user.id,
  email: user.email,
  aud: audience,
  isSuperAdmin: user.isSuperAdmin,
  platformStaffRole: user.platformStaffRole ?? undefined,
  typ: 'access',
  sid: sessionId,
};
```

#### 1.2.4 JWT Strategy — `JwtStrategy.validate()`

**File:** `apps/backend/src/domains/auth/jwt.strategy.ts`

```typescript
async validate(payload: TokenPayload): Promise<JwtUser> {
  // Existing checks: typ, user exists, isActive
  if (payload.typ !== 'access') {
    throw new UnauthorizedException('Invalid token type');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      isActive: true,
      isSuperAdmin: true,
      platformStaffRole: true,
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedException('User not found or inactive');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    aud: payload.aud,                      // NEW
    isSuperAdmin: user.isSuperAdmin,       // from DB, not JWT
    platformStaffRole: user.platformStaffRole ?? undefined,  // NEW
    impersonatedBy: payload.impersonatedBy,
    sid: payload.sid,
  };
}
```

**Critical:** `isSuperAdmin` and `platformStaffRole` are read from DB, not from JWT payload. This prevents stale JWT from granting elevated privileges.

#### 1.2.5 JWT Module Configuration

**File:** `apps/backend/src/domains/auth/auth.module.ts`

```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_ACCESS_SECRET'),
    signOptions: {
      expiresIn: '15m',
      // No audience in signOptions — we set per-token audience in payload
    },
  }),
}),
```

**Note:** We use `aud` as a custom claim in the payload, NOT the standard `audience` sign option. The standard `audience` option in jsonwebtoken sets the `aud` JWT claim but also validates it during verification. Since we have multiple audiences on the same secret, we handle validation in our `AudienceGuard`, not in the JWT library.

**Alternative (recommended for stricter validation):** Use `audience` in sign options and verify options:

```typescript
// Signing
jwt.sign(payload, secret, { expiresIn: '15m', audience: 'platform' });

// Verifying in JwtStrategy
JwtModule.registerAsync({
  useFactory: (config) => ({
    secret: config.get('JWT_ACCESS_SECRET'),
    // Don't set verifyAudience here — we validate per-route in AudienceGuard
  }),
});
```

**Decision:** Use `aud` as a custom claim in the payload object. This gives us per-route validation flexibility via `AudienceGuard` rather than per-strategy validation. The `aud` field in the payload IS the standard JWT `aud` claim because jsonwebtoken maps it automatically.

#### 1.2.6 Backward Compatibility

During migration, tokens without `aud` must be accepted:

```typescript
// In JwtStrategy.validate()
const audience = payload.aud ?? 'customer';  // default to customer for old tokens
```

Old tokens (without `aud`) default to `customer` audience. This is safe because:
- Platform staff will get new tokens on next login (with `aud: 'platform'`)
- Old tokens expire in 15 minutes (access) or 7 days (refresh)
- After 7 days, all tokens have `aud` claim

#### 1.2.7 Login Endpoint Changes

**File:** `apps/backend/src/domains/auth/auth.controller.ts`

The login endpoint should accept an optional `audience` parameter:

```typescript
// DTO
export class LoginDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsIn(['platform', 'customer'])
  audience?: 'platform' | 'customer';
}
```

If `audience` is provided, validate that the user has the appropriate role:
- `audience: 'platform'` → user must have `isSuperAdmin` or `platformStaffRole`
- `audience: 'customer'` → user must NOT have `isSuperAdmin` (or allow with warning)

If `audience` is not provided, auto-detect via `resolveAudience()`.

#### 1.2.8 Files to Modify

| File | Change |
|---|---|
| `apps/backend/src/common/auth/current-user.decorator.ts` | Add `aud`, `platformStaffRole` to `JwtUser` type |
| `apps/backend/src/domains/auth/auth.service.ts` | Add `aud` to token payload in `login()`, `refresh()`, `issueImpersonation()` |
| `apps/backend/src/domains/auth/jwt.strategy.ts` | Extract `aud` from payload, read `isSuperAdmin`/`platformStaffRole` from DB |
| `apps/backend/src/domains/auth/dto/login.dto.ts` | Add optional `audience` field |
| `apps/backend/src/domains/auth/auth.controller.ts` | Pass `audience` through to service |

---

## 2. AudienceGuard

### 2.1 Purpose

Enforce that only tokens with the correct audience can access specific route namespaces.

### 2.2 Implementation

**New file:** `apps/backend/src/common/auth/audience.guard.ts`

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtAudience, JwtUser } from './current-user.decorator';

export const AUDIENCE_KEY = 'requiredAudience';
export const RequireAudience = (...audiences: JwtAudience[]) =>
  SetMetadata(AUDIENCE_KEY, audiences);

@Injectable()
export class AudienceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAudiences = this.reflector.getAllAndOverride<JwtAudience[]>(
      AUDIENCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAudiences || requiredAudiences.length === 0) {
      return true; // No audience requirement = allow any
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!requiredAudiences.includes(user.aud)) {
      throw new ForbiddenException(
        `This endpoint requires audience: ${requiredAudiences.join(' or ')}. ` +
          `Your token audience is: ${user.aud}`,
      );
    }

    return true;
  }
}
```

### 2.3 Usage

```typescript
// Platform controller
@Controller('platform')
@UseGuards(JwtAuthGuard, AudienceGuard, PlatformStaffDbGuard)
@RequireAudience('platform')
export class PlatformTenantController { ... }

// Customer controller
@Controller('customer/screens')
@UseGuards(JwtAuthGuard, AudienceGuard, RolesGuard)
@RequireAudience('customer')
export class CustomerScreensController { ... }

// Player controller (uses API key or player secret, not JWT audience)
@Controller('player')
export class PlayerController { ... } // No AudienceGuard — uses ApiKeyAuthGuard

// Auth controller (shared)
@Controller('auth')
export class AuthController { ... } // No AudienceGuard on login/register
```

### 2.4 Composite Guard (Recommended)

To prevent developers from forgetting guards, create composite guards:

**New file:** `apps/backend/src/common/auth/platform-route.guard.ts`

```typescript
@Injectable()
export class PlatformRouteGuard implements CanActivate {
  constructor(
    private readonly audienceGuard: AudienceGuard,
    private readonly platformStaffGuard: PlatformStaffDbGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (
      this.audienceGuard.canActivate(context) &&
      await this.platformStaffGuard.canActivate(context)
    );
  }
}
```

**New file:** `apps/backend/src/common/auth/customer-route.guard.ts`

```typescript
@Injectable()
export class CustomerRouteGuard implements CanActivate {
  constructor(
    private readonly audienceGuard: AudienceGuard,
    private readonly rolesGuard: RolesGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (
      this.audienceGuard.canActivate(context) &&
      await this.rolesGuard.canActivate(context)
    );
  }
}
```

Usage:
```typescript
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRouteGuard)
export class PlatformTenantController { ... }
```

### 2.5 Files to Create

| File | Purpose |
|---|---|
| `apps/backend/src/common/auth/audience.guard.ts` | AudienceGuard + `@RequireAudience()` decorator |
| `apps/backend/src/common/auth/platform-route.guard.ts` | Composite guard for platform routes |
| `apps/backend/src/common/auth/customer-route.guard.ts` | Composite guard for customer routes |

### 2.6 Files to Modify

| File | Change |
|---|---|
| `apps/backend/src/common/auth/roles.guard.ts` | Add super-admin audit log when bypassing |
| `apps/backend/src/domains/admin/admin.module.ts` | Register `AudienceGuard`, `PlatformRouteGuard` |
| `apps/backend/src/domains/admin/admin.controller.ts` | Replace individual guards with `PlatformRouteGuard` |
| All customer controllers | Add `@RequireAudience('customer')` |

---

## 3. Dual-Cookie Strategy

### 3.1 Current State

**File:** `apps/backend/src/domains/auth/auth.service.ts` — `setAuthCookies()` method

Current cookies:
- `cs_access_token` — JWT access token (httpOnly, secure, sameSite: lax)
- `cs_refresh_token` — JWT refresh token (httpOnly, secure, sameSite: lax)
- `csrf_token` — CSRF double-submit token (httpOnly: false)

Both admin and customer use the same cookie names on the same domain.

### 3.2 Target State

#### 3.2.1 Cookie Names

| Cookie | Domain | Purpose |
|---|---|---|
| `__Host-cs_platform_access` | `admin.smartscreen.com` | Platform access token |
| `__Host-cs_platform_refresh` | `admin.smartscreen.com` | Platform refresh token |
| `__Host-cs_customer_access` | `app.smartscreen.com` | Customer access token |
| `__Host-cs_customer_refresh` | `app.smartscreen.com` | Customer refresh token |
| `csrf_platform` | `admin.smartscreen.com` | Platform CSRF token |
| `csrf_customer` | `app.smartscreen.com` | Customer CSRF token |

#### 3.2.2 Cookie Attributes

```typescript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // __Host- prefix requires: secure=true, path=/, no domain attribute
  // In production, domain is implied by the responding server's domain
};
```

#### 3.2.3 Implementation

**File:** `apps/backend/src/domains/auth/auth.service.ts`

```typescript
private getCookieNames(audience: JwtAudience) {
  if (audience === 'platform') {
    return {
      access: '__Host-cs_platform_access',
      refresh: '__Host-cs_platform_refresh',
      csrf: 'csrf_platform',
    };
  }
  return {
    access: '__Host-cs_customer_access',
    refresh: '__Host-cs_customer_refresh',
    csrf: 'csrf_customer',
  };
}

private setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  audience: JwtAudience,
) {
  const names = this.getCookieNames(audience);
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(names.access, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie(names.refresh, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // CSRF token = random hex, also set as httpOnly:false cookie
  const csrfToken = randomBytes(32).toString('hex');
  res.cookie(names.csrf, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
```

#### 3.2.4 JWT Strategy — Cookie Extraction

**File:** `apps/backend/src/domains/auth/jwt.strategy.ts`

```typescript
// In JwtStrategy.extractJwtFromRequest()
private extractFromRequest(req: Request): string | null {
  // Try Bearer header first (API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try both cookie names (one will be set depending on which app made the request)
  const platformCookie = req.cookies?.['__Host-cs_platform_access'];
  const customerCookie = req.cookies?.['__Host-cs_customer_access'];
  const legacyCookie = req.cookies?.['cs_access_token']; // backward compat

  return platformCookie || customerCookie || legacyCookie || null;
}
```

#### 3.2.5 CSRF Middleware Update

**File:** `apps/backend/src/common/csrf/csrf.middleware.ts`

```typescript
// In CsrfMiddleware.use()
const platformCsrf = req.cookies?.['csrf_platform'];
const customerCsrf = req.cookies?.['csrf_customer'];
const legacyCsrf = req.cookies?.['csrf_token'];

const cookieToken = platformCsrf || customerCsrf || legacyCsrf;
const headerToken = req.headers['x-csrf-token'] as string | undefined;

if (!cookieToken || !headerToken || cookieToken !== headerToken) {
  res.status(403).json({ message: 'Invalid CSRF token' });
  return;
}
```

#### 3.2.6 Frontend Changes

**Dashboard (Customer App):**
```typescript
// Read CSRF token from customer cookie
const csrfToken = getCookie('csrf_customer');
// Set in header
headers['X-CSRF-Token'] = csrfToken;
```

**Control Panel (Platform App):**
```typescript
// Read CSRF token from platform cookie
const csrfToken = getCookie('csrf_platform');
// Set in header
headers['X-CSRF-Token'] = csrfToken;
```

#### 3.2.7 Backward Compatibility

During migration:
1. Both old and new cookie names are accepted (see §3.2.4)
2. New logins set new cookie names
3. Old cookies expire naturally (15 min access, 7 day refresh)
4. After 7 days, remove legacy cookie support

#### 3.2.8 Files to Modify

| File | Change |
|---|---|
| `apps/backend/src/domains/auth/auth.service.ts` | `setAuthCookies()` — audience-aware cookie names |
| `apps/backend/src/domains/auth/auth.service.ts` | `clearAuthCookies()` — clear both old and new names |
| `apps/backend/src/domains/auth/jwt.strategy.ts` | Extract from both cookie names |
| `apps/backend/src/common/csrf/csrf.middleware.ts` | Check both CSRF cookie names |
| `apps/backend/src/domains/auth/csrf.controller.ts` | Return appropriate CSRF token based on audience |
| Frontend `apiFetch` | Read correct CSRF cookie per app |

---

## 4. WebSocket Tenant Isolation Fix

### 4.1 Current Vulnerability

**File:** `apps/backend/src/domains/realtime/realtime.gateway.ts`

The `handleDashboardSubscribe()` handler accepts a `workspaceId` from the client and joins the socket to room `workspace:${workspaceId}` **without verifying** that the connecting user is a member of that workspace.

Any authenticated user can subscribe to any workspace's real-time events (screen status, playlist updates, etc.).

### 4.2 Fix

```typescript
@SubscribeMessage('dashboard:subscribe')
async handleDashboardSubscribe(
  @MessageBody() data: { workspaceId: string },
  @ConnectedSocket() client: Socket,
) {
  const user = this.authenticatedSockets.get(client.id);
  if (!user) {
    throw new WsException('Not authenticated');
  }

  // Platform staff can subscribe to any workspace
  if (user.aud === 'platform' && (user.isSuperAdmin || user.platformStaffRole)) {
    client.join(`workspace:${data.workspaceId}`);
    return { event: 'dashboard:subscribed', data: { workspaceId: data.workspaceId } };
  }

  // Customer users must be a member of the workspace
  const membership = await this.prisma.workspaceMembership.findFirst({
    where: {
      workspaceId: data.workspaceId,
      userId: user.sub,
    },
    select: { id: true },
  });

  if (!membership) {
    throw new WsException('Not a member of this workspace');
  }

  client.join(`workspace:${data.workspaceId}`);
  return { event: 'dashboard:subscribed', data: { workspaceId: data.workspaceId } };
}
```

### 4.3 Additional WebSocket Security

```typescript
// In handleConnection() — validate audience
const user = await this.validateToken(token);
if (!user) {
  client.disconnect();
  return;
}

// Player connections use X-Player-Secret, not JWT
// Dashboard connections require aud: 'customer' or 'platform'
if (user.aud !== 'customer' && user.aud !== 'platform') {
  client.disconnect();
  return;
}
```

### 4.4 Files to Modify

| File | Change |
|---|---|
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Add ownership check in `handleDashboardSubscribe()` |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Add audience validation in `handleConnection()` |

---

## 5. SuperAdminGuard Cleanup

### 5.1 Current State

Two guards exist:
- `SuperAdminGuard` at `apps/backend/src/common/auth/super-admin.guard.ts` — JWT-only check (20 lines)
- `SuperAdminDbGuard` at `apps/backend/src/common/auth/super-admin-db.guard.ts` — DB-validated (34 lines)

### 5.2 Action

1. **Delete** `apps/backend/src/common/auth/super-admin.guard.ts`
2. **Update all imports** that reference `SuperAdminGuard` to use `SuperAdminDbGuard`
3. **Update all `@UseGuards()`** that reference `SuperAdminGuard` to use `SuperAdminDbGuard`

### 5.3 Files Affected

Search for all files importing `SuperAdminGuard`:
```
grep -r "SuperAdminGuard" apps/backend/src/ --include="*.ts"
```

Replace all occurrences with `SuperAdminDbGuard`.

### 5.4 Verification

After replacement, verify that `SuperAdminDbGuard` is registered as a provider in all modules that use it. Currently it's registered in `AdminModule` — may need to add to other modules.

---

## 6. PlatformSettings Table

### 6.1 Current State

Platform settings are stored in a file-based store (`admin-runtime.store.ts`). The docker-compose.yml explicitly calls out this fragility.

### 6.2 Target Schema

```prisma
model PlatformSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON-encoded value
  category  String   // e.g., "branding", "email", "billing", "general"
  updatedAt DateTime @updatedAt
  updatedBy String?  // admin user ID

  @@index([category])
}
```

### 6.3 Initial Settings Keys

| Key | Category | Value Type | Default |
|---|---|---|---|
| `branding.logoUrl` | branding | string (URL) | `null` |
| `branding.primaryColor` | branding | string (hex) | `#6366f1` |
| `branding.companyName` | branding | string | `Cloud Signage` |
| `email.fromAddress` | email | string | `noreply@smartscreen.com` |
| `email.fromName` | email | string | `Cloud Signage` |
| `billing.currency` | billing | string | `USD` |
| `billing.trialDays` | billing | number | `14` |
| `billing.gracePeriodDays` | billing | number | `7` |
| `general.platformName` | general | string | `Cloud Signage` |
| `general.supportEmail` | general | string | `support@smartscreen.com` |
| `general.maintenanceMode` | general | boolean | `false` |
| `general.signupEnabled` | general | boolean | `true` |

### 6.4 Service Implementation

**New file:** `apps/backend/src/common/config/platform-settings.service.ts`

```typescript
@Injectable()
export class PlatformSettingsService {
  private cache = new Map<string, string>();
  private cacheExpiry = new Map<string, number>();
  private readonly TTL_MS = 60_000; // 1 minute cache

  constructor(private readonly prisma: PrismaService) {}

  async get<T>(key: string, defaultValue: T): Promise<T> {
    const cached = this.getCached(key);
    if (cached !== undefined) {
      return JSON.parse(cached) as T;
    }

    const setting = await this.prisma.platformSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      return defaultValue;
    }

    this.setCached(key, setting.value);
    return JSON.parse(setting.value) as T;
  }

  async set(key: string, value: unknown, updatedBy?: string): Promise<void> {
    const encoded = JSON.stringify(value);
    await this.prisma.platformSettings.upsert({
      where: { key },
      create: { key, value: encoded, category: key.split('.')[0], updatedBy },
      update: { value: encoded, updatedBy },
    });
    this.invalidateCache(key);
  }

  async getAllByCategory(category: string): Promise<Record<string, unknown>> {
    const settings = await this.prisma.platformSettings.findMany({
      where: { category },
    });
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.key] = JSON.parse(s.value);
    }
    return result;
  }

  private getCached(key: string): string | undefined {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && expiry > Date.now()) {
      return this.cache.get(key);
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return undefined;
  }

  private setCached(key: string, value: string): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.TTL_MS);
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }
}
```

### 6.5 Migration from File-Based Store

1. Create `PlatformSettings` table via Prisma migration
2. Read all existing settings from `admin-runtime.store.ts`
3. Insert them into the new table
4. Update `AdminService` to use `PlatformSettingsService` instead of file-based store
5. Remove `admin-runtime.store.ts` (in Phase 4 cleanup)

### 6.6 Files to Create

| File | Purpose |
|---|---|
| `apps/backend/src/common/config/platform-settings.service.ts` | Settings service with caching |
| `apps/backend/src/common/config/platform-settings.module.ts` | Module definition |

### 6.7 Files to Modify

| File | Change |
|---|---|
| `apps/backend/prisma/schema.prisma` | Add `PlatformSettings` model |
| `apps/backend/src/domains/admin/admin.service.ts` | Replace file-based store with `PlatformSettingsService` |
| `apps/backend/src/domains/admin/admin.module.ts` | Import `PlatformSettingsModule` |

---

## 7. ExchangeToken Table

### 7.1 Purpose

One-time, short-lived token for cross-domain impersonation. Platform admin generates a token, customer app redeems it.

### 7.2 Schema

```prisma
model ExchangeToken {
  id           String   @id @default(cuid())
  token        String   @unique  // random 64-char hex
  tokenHash    String   @unique  // SHA-256 of token for lookup
  actorUserId  String   // platform admin who initiated
  targetUserId String   // customer user being impersonated
  workspaceId  String?  // optional workspace context
  expiresAt    DateTime
  usedAt       DateTime?  // null = unused
  createdAt    DateTime @default(now())

  @@index([tokenHash])
  @@index([expiresAt])
}
```

### 7.3 Flow

```
1. Platform admin clicks "Impersonate" on a customer
2. POST /api/v1/platform/impersonate
   Body: { userId: string, workspaceId?: string }
   Guard: JwtAuthGuard + PlatformRouteGuard (super admin only)
3. Backend generates exchange token:
   - token = randomBytes(32).toString('hex')  // 64 chars
   - tokenHash = sha256(token)
   - expiresAt = now + 60 seconds
   - Save to ExchangeToken table
4. Backend returns: { exchangeToken: string, targetApp: 'customer', redirectUrl: 'https://app.smartscreen.com/auth/exchange?token=...' }
5. Platform frontend redirects browser to redirectUrl
6. Customer app calls POST /api/v1/auth/exchange
   Body: { token: string }
   Guard: Throttler only (no JWT — this IS the auth)
7. Backend validates:
   - Hash token, lookup in ExchangeToken
   - Check expiresAt > now
   - Check usedAt IS NULL
   - Mark usedAt = now (atomic update with WHERE usedAt IS NULL)
   - If already used or expired → reject
8. Backend mints customer-scoped tokens:
   - aud: 'customer'
   - impersonatedBy: actorUserId
   - Set customer cookies
9. Backend returns: { success: true, user: { ... } }
10. Customer app navigates to dashboard
```

### 7.4 Security Properties

- **One-time use:** `usedAt` field + atomic update prevents replay
- **Short TTL:** 60 seconds — enough for redirect, not enough for interception
- **Hashed storage:** Token is stored as SHA-256 hash, not plaintext
- **Audit logged:** Both `IMPERSONATION_START` and `IMPERSONATION_EXCHANGE_REDEEMED` events
- **Cross-domain:** Token is passed via URL query param, not cookie. No cookie domain issues.

### 7.5 Exit Impersonation

```
1. Customer app shows impersonation bar: "Viewing as [user] — Exit"
2. User clicks "Exit"
3. POST /api/v1/auth/exchange/exit
   Guard: JwtAuthGuard (customer audience, must have impersonatedBy)
4. Backend:
   - Validates token has impersonatedBy
   - Revokes customer session (delete refresh token)
   - Clears customer cookies
   - Returns: { redirectUrl: 'https://admin.smartscreen.com/' }
5. Browser redirects to platform app
6. Platform app has its own session (separate cookies) — admin is still logged in
```

### 7.6 Files to Create

| File | Purpose |
|---|---|
| `apps/backend/src/domains/auth/exchange-token.service.ts` | Token generation, validation, redemption |
| `apps/backend/src/domains/auth/dto/exchange-token.dto.ts` | DTOs for impersonate + exchange |

### 7.7 Files to Modify

| File | Change |
|---|---|
| `apps/backend/prisma/schema.prisma` | Add `ExchangeToken` model |
| `apps/backend/src/domains/auth/auth.controller.ts` | Add `POST /auth/exchange` and `POST /auth/exchange/exit` endpoints |
| `apps/backend/src/domains/auth/auth.service.ts` | Remove `issueImpersonation()` and `exitImpersonation()` (replaced by exchange flow) |
| `apps/backend/src/domains/admin/admin.controller.ts` | Replace `POST /admin/users/:id/impersonate` with `POST /platform/impersonate` |

---

## 8. Shared Packages

### 8.1 packages/ui

#### 8.1.1 Package Structure

```
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # re-exports all
│   ├── lib/
│   │   └── utils.ts      # cn() utility
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── skeleton.tsx
│   ├── alert-dialog.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   ├── toast.tsx
│   ├── switch.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── progress.tsx
│   ├── separator.tsx
│   ├── scroll-area.tsx
│   ├── avatar.tsx
│   ├── table.tsx
│   ├── language-switcher.tsx
│   ├── page-transition.tsx
│   └── shell-logo.tsx
```

#### 8.1.2 package.json

```json
{
  "name": "@smart-screen/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@radix-ui/react-alert-dialog": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-avatar": "^1.1.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "framer-motion": "^11.15.0"
  },
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19"
  }
}
```

#### 8.1.3 Extraction Process

1. Create `packages/ui/package.json` and `packages/ui/tsconfig.json`
2. Copy `apps/dashboard/src/lib/utils.ts` → `packages/ui/src/lib/utils.ts`
3. Copy each component from `apps/dashboard/src/components/ui/*` → `packages/ui/src/*.tsx`
4. Update internal imports in each component: `@/lib/utils` → `./lib/utils`
5. Create `packages/ui/src/index.ts` with all re-exports
6. In `apps/dashboard/package.json`, add `"@smart-screen/ui": "*"` to dependencies
7. In all dashboard files, replace `@/components/ui/button` → `@smart-screen/ui` (or specific import)
8. Run `npm install` to link the workspace package
9. Run `npm run typecheck && npm run build` to verify

#### 8.1.4 Import Strategy

**Option A (barrel import):**
```typescript
import { Button, Input, Dialog } from '@smart-screen/ui';
```

**Option B (named import — better tree-shaking):**
```typescript
import { Button } from '@smart-screen/ui/button';
import { Input } from '@smart-screen/ui/input';
```

**Recommendation:** Option A for simplicity. Next.js handles tree-shaking automatically.

### 8.2 packages/config

#### 8.2.1 Package Structure

```
packages/config/
├── package.json
├── tsconfig.json          # shared TS config
├── tailwind.config.ts     # shared Tailwind config
├── eslint.config.mjs      # shared ESLint config
├── prettier.config.json   # shared Prettier config
```

#### 8.2.2 package.json

```json
{
  "name": "@smart-screen/config",
  "version": "0.1.0",
  "private": true,
  "main": "./index.ts",
  "files": ["tsconfig.json", "tailwind.config.ts", "eslint.config.mjs", "prettier.config.json"]
}
```

#### 8.2.3 Usage in apps

```json
// apps/dashboard/tsconfig.json
{
  "extends": "@smart-screen/config/tsconfig.json",
  "compilerOptions": { ... }
}

// apps/dashboard/tailwind.config.ts
import config from '@smart-screen/config/tailwind.config';
export default { ...config, content: [...] };
```

---

## 9. ESLint Boundary Rules

### 9.1 Configuration

**File:** `apps/backend/eslint.config.mjs` (or `.eslintrc.json`)

```javascript
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: { import: importPlugin },
    rules: {
      'no-restricted-paths': [
        'error',
        {
          baseUrl: './src',
          zones: [
            // Customer modules cannot import platform modules
            {
              target: './domains/customer/**',
              from: ['./domains/platform/**'],
              message: 'Customer modules cannot import platform modules',
            },
            // Platform modules cannot import customer modules (except read-only)
            {
              target: './domains/platform/**',
              from: ['./domains/customer/**'],
              message: 'Platform modules cannot import customer modules directly — use shared interfaces',
            },
            // Shared modules cannot import domain modules
            {
              target: './common/**',
              from: ['./domains/**'],
              message: 'Shared modules cannot import domain modules',
            },
          ],
        },
      ],
    },
  },
];
```

### 9.2 Frontend Boundary Rules

**File:** `apps/dashboard/eslint.config.mjs`

```javascript
{
  'no-restricted-paths': [
    'error',
    {
      baseUrl: './src',
      zones: [
        // Customer features cannot import admin features
        {
          target: './features/**',
          from: ['./features/admin/**'],
          message: 'Customer features cannot import admin features',
          except: ['./features/auth/**'],
        },
      ],
    },
  ],
}
```

### 9.3 Migration

1. Add rules to ESLint config
2. Run `npm run lint` — expect violations
3. Fix violations one by one (or add `eslint-disable` for known cross-imports that will be resolved in Phase 1)
4. Add lint check to CI pipeline

---

## 10. Redis Caching for RolesGuard

### 10.1 Current Performance Issue

`RolesGuard.canActivate()` does 3+ DB queries per request via `AccountContextHelper`.

### 10.2 Solution

Cache account context in Redis with 60s TTL:

```typescript
// Cache key format
const cacheKey = `account-context:${userId}`;

// In AccountContextHelper
async resolveForWorkspace(userId: string, workspaceId: string) {
  const cacheKey = `account-context:${userId}:${workspaceId}`;
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await this.prismaQuery(userId, workspaceId);
  await this.redis.setex(cacheKey, 60, JSON.stringify(result));
  return result;
}

// Invalidate on role change
async invalidateUserContext(userId: string) {
  const keys = await this.redis.keys(`account-context:${userId}:*`);
  if (keys.length) {
    await this.redis.del(...keys);
  }
}
```

### 10.3 Invalidation Triggers

Call `invalidateUserContext(userId)` when:
- User's role is changed in any workspace
- User is removed from a workspace
- User is added to a workspace
- User's account membership is updated
- User is suspended or activated

### 10.4 Files to Modify

| File | Change |
|---|---|
| `apps/backend/src/common/auth/account-context.helper.ts` | Add Redis caching |
| `apps/backend/src/domains/workspaces/workspaces.service.ts` | Call `invalidateUserContext()` on role/member changes |
| `apps/backend/src/domains/admin/admin.service.ts` | Call `invalidateUserContext()` on user suspension/activation |

---

## 11. Database Backups

### 11.1 Strategy

| Type | Frequency | Retention | Tool |
|---|---|---|---|
| Full backup | Daily at 3 AM | 7 days | `pg_dump` + S3 |
| WAL archiving | Continuous | 7 days | PostgreSQL WAL + S3 |
| Weekly snapshot | Sunday 2 AM | 4 weeks | `pg_dump` + S3 |
| Monthly snapshot | 1st of month | 12 months | `pg_dump` + S3 |

### 11.2 Implementation

**New file:** `scripts/backup-database.sh`

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="${DATABASE_URL:?DATABASE_URL not set}"
S3_BUCKET="${BACKUP_S3_BUCKET:-smartscreen-backups}"
S3_PREFIX="db-backups"

# Create backup
pg_dump "$DB_URL" --format=custom --file="$BACKUP_DIR/smartscreen_$TIMESTAMP.dump"

# Upload to S3
if command -v aws &> /dev/null; then
  aws s3 cp "$BACKUP_DIR/smartscreen_$TIMESTAMP.dump" \
    "s3://$S3_BUCKET/$S3_PREFIX/smartscreen_$TIMESTAMP.dump"
fi

# Clean up local files older than 7 days
find "$BACKUP_DIR" -name "smartscreen_*.dump" -mtime +7 -delete

echo "Backup complete: smartscreen_$TIMESTAMP.dump"
```

### 11.3 Cron Setup

Add to Docker Compose or host crontab:
```cron
0 3 * * * /repo/scripts/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### 11.4 Restore Procedure

```bash
# Download from S3
aws s3 cp s3://smartscreen-backups/db-backups/smartscreen_20260718_030000.dump .

# Restore
pg_restore --dbname="$DATABASE_URL" --clean --if-exists smartscreen_20260718_030000.dump
```

---

## 12. Missing Database Indexes

### 12.1 Index Creation Script

```sql
-- Run with CREATE INDEX CONCURRENTLY to avoid table locks

-- Screen indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_screen_workspace_status
  ON "Screen" ("workspaceId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_screen_workspace_lastseen
  ON "Screen" ("workspaceId", "lastSeenAt");

-- Media indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_workspace_created
  ON "Media" ("workspaceId", "createdAt");

-- Playlist indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_workspace_published
  ON "Playlist" ("workspaceId", "isPublished");

-- Schedule indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_workspace_start
  ON "Schedule" ("workspaceId", "startDate");

-- Subscription indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_status_enddate
  ON "Subscription" ("status", "subscriptionEndDate");

-- WorkspaceMembership indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_membership_userid
  ON "WorkspaceMembership" ("userId");
```

### 12.2 Prisma Schema Updates

Add corresponding `@@index()` declarations to each model in `schema.prisma`.

---

## 13. Secret Rotation Documentation

### 13.1 Rotation Procedure

| Secret | Rotation Steps | Downtime |
|---|---|---|
| `JWT_ACCESS_SECRET` | 1. Generate new secret. 2. Update env var. 3. Restart backend. 4. All existing tokens become invalid. | ~15 min (token expiry) |
| `JWT_REFRESH_SECRET` | 1. Generate new secret. 2. Update env var. 3. Restart backend. 4. All refresh tokens become invalid. Users must re-login. | None (users re-login) |
| `ENCRYPTION_KEY` | 1. Generate new key. 2. Decrypt all encrypted data with old key. 3. Re-encrypt with new key. 4. Update env var. 5. Restart backend. | **Planned downtime** |
| `PLAYER_HEARTBEAT_SECRET` | 1. Generate new secret. 2. Update env var. 3. Restart backend. 4. All players must re-pair. | None (players reconnect) |
| Stripe secret key | 1. Generate new key in Stripe dashboard. 2. Update env var. 3. Restart backend. | None |
| S3 credentials | 1. Generate new credentials. 2. Update env var. 3. Restart backend. | None |

### 13.2 Dual-Secret Rotation (Zero Downtime for JWT)

For zero-downtime JWT rotation:
1. Deploy code that accepts both old and new secrets for verification
2. Update env to new secret
3. New tokens are signed with new secret
4. Old tokens are verified with old secret (still accepted)
5. After all old tokens expire (7 days), remove old secret support

```typescript
// JwtModule configuration for dual-secret verification
{
  secretOrKeyProvider: (request, rawJwt, done) => {
    // Try new secret first, fall back to old
    const decoded = jwt.decode(rawJwt);
    const iat = decoded?.iat ?? 0;
    const rotationTime = process.env.JWT_ROTATION_TIME ?? 0;
    const secret = iat < rotationTime
      ? process.env.JWT_ACCESS_SECRET_OLD
      : process.env.JWT_ACCESS_SECRET;
    done(null, secret);
  },
}
```

---

## 14. Verification Checklist

Before Phase 0 is considered complete, verify ALL of the following:

### JWT & Auth
- [ ] `TokenPayload` includes `aud` field
- [ ] `JwtUser` type includes `aud` and `platformStaffRole`
- [ ] `AuthService.login()` sets `aud` based on user type
- [ ] `AuthService.refresh()` preserves `aud` from refresh token
- [ ] `JwtStrategy.validate()` reads `isSuperAdmin` from DB, not JWT
- [ ] Old tokens without `aud` are accepted (backward compat)
- [ ] Login endpoint accepts optional `audience` parameter

### Guards
- [ ] `AudienceGuard` created and tested
- [ ] `PlatformRouteGuard` composite guard created
- [ ] `CustomerRouteGuard` composite guard created
- [ ] `SuperAdminGuard` (JWT-only) deleted
- [ ] All references to `SuperAdminGuard` replaced with `SuperAdminDbGuard`
- [ ] `@RequireAudience()` decorator applied to platform routes
- [ ] `@RequireAudience()` decorator applied to customer routes

### Cookies
- [ ] `setAuthCookies()` uses audience-aware cookie names
- [ ] `clearAuthCookies()` clears both old and new cookie names
- [ ] `JwtStrategy` extracts from both old and new cookie names
- [ ] CSRF middleware checks both old and new CSRF cookie names
- [ ] `__Host-` prefix used in production

### WebSocket
- [ ] `handleDashboardSubscribe()` verifies workspace membership
- [ ] Platform staff can subscribe to any workspace
- [ ] Customer users can only subscribe to their workspaces
- [ ] `handleConnection()` validates audience for dashboard connections

### Database
- [ ] `PlatformSettings` table created
- [ ] `ExchangeToken` table created
- [ ] Missing indexes created with `CONCURRENTLY`
- [ ] File-based settings migrated to `PlatformSettings` table
- [ ] `PlatformSettingsService` implemented with caching

### Packages
- [ ] `packages/ui` created with all UI components
- [ ] `packages/config` created with shared configs
- [ ] All dashboard imports updated to use `@smart-screen/ui`
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes

### ESLint
- [ ] `no-restricted-paths` rules added to backend ESLint config
- [ ] `no-restricted-paths` rules added to frontend ESLint config
- [ ] `npm run lint` passes (or violations are documented for Phase 1)

### Redis
- [ ] `AccountContextHelper` caches results in Redis
- [ ] Cache invalidation called on role/member changes
- [ ] Cache TTL is 60 seconds

### Operations
- [ ] Database backup script created
- [ ] Backup cron job configured
- [ ] Secret rotation documentation created
- [ ] `npm run verify` passes (typecheck + lint + test + build)
