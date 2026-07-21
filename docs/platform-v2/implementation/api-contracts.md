# API Contracts — Complete Specification

> **Purpose:** Every API endpoint — new, modified, and existing — with request/response shapes
> **Base URL:** `https://api.smartscreen.com/api/v1`
> **Auth:** JWT cookies (`__Host-cs_platform_access` or `__Host-cs_customer_access`) or `Authorization: Bearer <token>`
> **CSRF:** `X-CSRF-Token` header required for all state-changing requests (except Bearer auth)

---

## 1. Route Namespace Structure

```
/api/v1/
├── auth/              — Shared authentication (login, register, refresh, exchange)
├── platform/          — Platform admin endpoints (audience: platform)
├── customer/          — Customer workspace endpoints (audience: customer)
├── player/            — Player content delivery (API key or player secret)
├── public/            — Health, readiness (no auth)
├── internal/          — Webhooks, cron jobs (signature-verified)
└── csrf/              — CSRF token issuance
```

---

## 2. Authentication Endpoints (`/auth/*`)

### 2.1 POST `/auth/login`

**Guard:** Throttler only
**Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "audience": "customer"  // optional: "platform" | "customer"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "audience": "customer",
    "isSuperAdmin": false,
    "platformStaffRole": null,
    "emailVerified": true,
    "twoFactorEnabled": false
  },
  "requiresTwoFactor": false
}
```

**Response 200 (2FA required):**
```json
{
  "requiresTwoFactor": true,
  "twoFactorChallenge": "clxxx..."  // challenge ID for 2FA verify
}
```

**Response 401:**
```json
{
  "message": "Invalid email or password",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

**Response 423 (Locked):**
```json
{
  "message": "Account temporarily locked due to too many failed attempts",
  "code": "AUTH_ACCOUNT_LOCKED",
  "retryAfter": 300  // seconds
}
```

**Cookies set:**
- `__Host-cs_customer_access` (if audience=customer) OR `__Host-cs_platform_access` (if audience=platform)
- `__Host-cs_customer_refresh` OR `__Host-cs_platform_refresh`
- `csrf_customer` OR `csrf_platform`

---

### 2.2 POST `/auth/login/2fa`

**Guard:** Throttler
**Body:**
```json
{
  "twoFactorChallenge": "clxxx...",
  "code": "123456"
}
```

**Response 200:** Same as login response
**Response 401:** `{ "message": "Invalid 2FA code", "code": "AUTH_INVALID_2FA" }`

---

### 2.3 POST `/auth/register`

**Guard:** Throttler
**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "fullName": "Jane Doe",
  "businessName": "Acme Corp",
  "phone": "+9665xxxxxxxx",
  "country": "Saudi Arabia",
  "city": "Riyadh",
  "locale": "en"
}
```

**Response 201:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "newuser@example.com",
    "fullName": "Jane Doe",
    "audience": "customer"
  },
  "otpRequired": true,
  "otpDestination": "new***@example.com"  // masked email
}
```

---

### 2.4 POST `/auth/register/verify`

**Guard:** Throttler
**Body:**
```json
{
  "email": "newuser@example.com",
  "otp": "123456"
}
```

**Response 200:**
```json
{
  "user": { "id": "clxxx...", "email": "newuser@example.com", "audience": "customer" },
  "workspace": { "id": "clxxx...", "name": "Acme Corp", "slug": "acme-corp" }
}
```

---

### 2.5 POST `/auth/refresh`

**Guard:** JWT (refresh token type)
**Body:** None (refresh token from cookie)
**Response 200:** Same as login response (new access token set in cookie)

---

### 2.6 POST `/auth/logout`

**Guard:** JWT
**Body:**
```json
{
  "allDevices": false  // optional: true = logout all devices, false = current session only
}
```

**Response 200:**
```json
{
  "success": true
}
```

**Cookies cleared:** Both access and refresh cookies for the current audience.

---

### 2.7 GET `/auth/me`

**Guard:** JWT
**Response 200:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "audience": "customer",
    "isSuperAdmin": false,
    "platformStaffRole": null,
    "emailVerified": true,
    "twoFactorEnabled": false,
    "locale": "en",
    "businessName": "Acme Corp",
    "phone": "+9665xxxxxxxx",
    "country": "Saudi Arabia",
    "city": "Riyadh"
  },
  "workspaces": [
    {
      "id": "clxxx...",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "role": "OWNER",
      "subscriptionStatus": "ACTIVE",
      "subscriptionPlan": "pro"
    }
  ],
  "activeWorkspaceId": "clxxx..."
}
```

**For platform audience:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "admin@smartscreen.com",
    "fullName": "Super Admin",
    "audience": "platform",
    "isSuperAdmin": true,
    "platformStaffRole": "SUPER_ADMIN",
    "twoFactorEnabled": true
  },
  "workspaces": null,
  "activeWorkspaceId": null
}
```

---

### 2.8 POST `/auth/exchange` (NEW — Impersonation Exchange)

**Guard:** Throttler only (no JWT — this IS the auth)
**Body:**
```json
{
  "token": "a1b2c3d4e5f6..."  // 64-char hex exchange token
}
```

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": "clxxx...",
    "email": "customer@example.com",
    "fullName": "Customer Name",
    "audience": "customer",
    "impersonatedBy": "cl_admin_xxx"
  },
  "workspace": {
    "id": "clxxx...",
    "name": "Acme Corp",
    "slug": "acme-corp"
  }
}
```

**Response 401:**
```json
{
  "message": "Invalid or expired exchange token",
  "code": "EXCHANGE_TOKEN_INVALID"
}
```

**Response 409:**
```json
{
  "message": "Exchange token already used",
  "code": "EXCHANGE_TOKEN_USED"
}
```

**Cookies set:** `__Host-cs_customer_access`, `__Host-cs_customer_refresh`, `csrf_customer`

---

### 2.9 POST `/auth/exchange/exit` (NEW — Exit Impersonation)

**Guard:** JWT (customer audience, must have `impersonatedBy` in token)
**Body:** None
**Response 200:**
```json
{
  "success": true,
  "redirectUrl": "https://admin.smartscreen.com/"
}
```

**Cookies cleared:** All customer cookies.

---

### 2.10 POST `/auth/forgot-password`

**Guard:** Throttler
**Body:** `{ "email": "user@example.com" }`
**Response 200:** `{ "success": true }` (always returns success to prevent enumeration)

---

### 2.11 POST `/auth/reset-password`

**Guard:** Throttler
**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response 200:** `{ "success": true }`

---

### 2.12 GET `/auth/2fa/setup`

**Guard:** JWT
**Response 200:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrUrl": "otpauth://totp/SmartScreen:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SmartScreen"
}
```

---

### 2.13 POST `/auth/2fa/enable`

**Guard:** JWT
**Body:** `{ "code": "123456" }`
**Response 200:** `{ "success": true, "backupCodes": ["abc123", "def456", ...] }`

---

### 2.14 POST `/auth/2fa/disable`

**Guard:** JWT
**Body:** `{ "code": "123456" }`
**Response 200:** `{ "success": true }`

---

## 3. Platform Endpoints (`/platform/*`)

**All platform endpoints require:**
- `JwtAuthGuard` — JWT authentication
- `AudienceGuard` — `aud` must be `platform`
- `PlatformStaffDbGuard` — DB-validated platform staff role
- `X-CSRF-Token` header

### 3.1 Platform Dashboard

#### GET `/platform/dashboard`

**Guard:** PlatformRouteGuard (any platform staff)
**Response 200:**
```json
{
  "stats": {
    "totalCustomers": 150,
    "totalWorkspaces": 230,
    "totalScreens": 1200,
    "activeScreens": 950,
    "totalRevenue": 4500000,  // cents
    "mrr": 380000,  // cents
    "churnRate": 2.3,  // percentage
    "trialConversions": 68.5  // percentage
  },
  "recentSignups": [
    { "id": "clxxx...", "businessName": "New Corp", "createdAt": "2026-07-18T..." }
  ],
  "expiringTrials": [
    { "id": "clxxx...", "businessName": "Trial Corp", "trialEndsAt": "2026-07-20T..." }
  ],
  "systemHealth": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy",
    "websocketConnections": 45
  }
}
```

---

### 3.2 Platform Customers

#### GET `/platform/customers`

**Guard:** PlatformRouteGuard
**Query params:**
```
?cursor=<base64>&limit=20&search=acme&status=active&plan=pro&sort=createdAt:desc
```

**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "email": "owner@acme.com",
      "fullName": "John Doe",
      "businessName": "Acme Corp",
      "subscriptionStatus": "ACTIVE",
      "subscriptionPlan": "pro",
      "workspaceCount": 3,
      "screenCount": 15,
      "createdAt": "2026-01-15T...",
      "lastLoginAt": "2026-07-18T..."
    }
  ],
  "nextCursor": "eyJpZCI6ImNseHh4Li4uIn0=",
  "hasMore": true
}
```

#### GET `/platform/customers/:id`

**Guard:** PlatformRouteGuard
**Response 200:**
```json
{
  "id": "clxxx...",
  "email": "owner@acme.com",
  "fullName": "John Doe",
  "businessName": "Acme Corp",
  "phone": "+9665xxxxxxxx",
  "country": "Saudi Arabia",
  "city": "Riyadh",
  "subscriptionStatus": "ACTIVE",
  "subscriptionPlan": "pro",
  "subscriptionEndDate": "2026-08-15T...",
  "workspaces": [
    {
      "id": "clxxx...",
      "name": "Acme HQ",
      "slug": "acme-hq",
      "screenCount": 10,
      "memberCount": 5,
      "createdAt": "2026-01-15T..."
    }
  ],
  "recentAuditLogs": [
    {
      "id": "clxxx...",
      "action": "WORKSPACE_UPDATED",
      "createdAt": "2026-07-17T...",
      "ipAddress": "1.2.3.4"
    }
  ]
}
```

#### PATCH `/platform/customers/:id`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Body:**
```json
{
  "isActive": true,
  "businessName": "Updated Name"
}
```

**Response 200:** Updated customer object

---

### 3.3 Platform Staff

#### GET `/platform/staff`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Query:** `?cursor=<base64>&limit=20&role=SUPER_ADMIN`
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "email": "admin@smartscreen.com",
      "fullName": "Super Admin",
      "platformStaffRole": "SUPER_ADMIN",
      "isActive": true,
      "lastLoginAt": "2026-07-18T...",
      "createdAt": "2026-01-01T..."
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### POST `/platform/staff`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Body:**
```json
{
  "email": "newstaff@smartscreen.com",
  "fullName": "Support Agent",
  "platformStaffRole": "SUPPORT_SPECIALIST",
  "password": "temporaryPassword123"
}
```

**Response 201:** Created staff object

#### PATCH `/platform/staff/:id/role`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only, requires 2FA)
**Body:**
```json
{
  "platformStaffRole": "BILLING_MANAGER"
}
```

**Response 200:** Updated staff object

---

### 3.4 Platform Impersonation

#### POST `/platform/impersonate`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Body:**
```json
{
  "userId": "clxxx...",
  "workspaceId": "clxxx..."  // optional
}
```

**Response 200:**
```json
{
  "exchangeToken": "a1b2c3d4e5f6...",
  "redirectUrl": "https://app.smartscreen.com/auth/exchange?token=a1b2c3d4e5f6...",
  "expiresAt": "2026-07-18T22:01:30Z"
}
```

**Audit:** `IMPERSONATION_START` logged in `PlatformStaffAudit`

---

### 3.5 Platform Settings

#### GET `/platform/settings`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Response 200:**
```json
{
  "branding": {
    "logoUrl": "https://...",
    "primaryColor": "#6366f1",
    "companyName": "Cloud Signage"
  },
  "email": {
    "fromAddress": "noreply@smartscreen.com",
    "fromName": "Cloud Signage"
  },
  "billing": {
    "currency": "USD",
    "trialDays": 14,
    "gracePeriodDays": 7
  },
  "general": {
    "platformName": "Cloud Signage",
    "supportEmail": "support@smartscreen.com",
    "maintenanceMode": false,
    "signupEnabled": true
  }
}
```

#### PATCH `/platform/settings`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Body:**
```json
{
  "branding.primaryColor": "#3b82f6",
  "general.maintenanceMode": true
}
```

**Response 200:** Updated settings object (same shape as GET)

---

### 3.6 Platform Audit Log

#### GET `/platform/audit-log`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Query:** `?cursor=<base64>&limit=50&action=IMPERSONATION_START&actorUserId=clxxx...&from=2026-07-01&to=2026-07-18`
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "actorUserId": "clxxx...",
      "actorEmail": "admin@smartscreen.com",
      "action": "IMPERSONATION_START",
      "targetUserId": "clxxx...",
      "targetEmail": "customer@acme.com",
      "ipAddress": "1.2.3.4",
      "metadata": { "workspaceId": "clxxx..." },
      "createdAt": "2026-07-18T22:00:00Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOi4uLn0=",
  "hasMore": true
}
```

---

### 3.7 Platform Fleet

#### GET `/platform/fleet/screens`

**Guard:** PlatformRouteGuard
**Query:** `?cursor=<base64>&limit=50&status=online&workspaceId=clxxx...`
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "name": "Lobby Display",
      "workspaceId": "clxxx...",
      "workspaceName": "Acme Corp",
      "status": "ONLINE",
      "lastSeenAt": "2026-07-18T21:59:00Z",
      "currentPlaylistName": "Welcome Playlist",
      "timezone": "Asia/Riyadh"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

---

### 3.8 Platform Plans

#### GET `/platform/plans`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "code": "free",
      "name": "Free",
      "priceMonthly": 0,
      "priceYearly": 0,
      "screenLimit": 1,
      "storageLimitBytes": 536870912,
      "userLimit": 1,
      "features": { "apiAccess": false, "webhooks": false },
      "isActive": true,
      "isPublic": true,
      "sortOrder": 0
    }
  ]
}
```

#### POST `/platform/plans`

**Guard:** PlatformRouteGuard (SUPER_ADMIN only)
**Body:**
```json
{
  "code": "starter",
  "name": "Starter",
  "description": "Perfect for small businesses",
  "priceMonthly": 1500,
  "priceYearly": 15000,
  "screenLimit": 3,
  "storageLimitBytes": 1073741824,
  "userLimit": 2,
  "features": { "apiAccess": false, "webhooks": false, "analytics": true }
}
```

**Response 201:** Created plan object

---

### 3.9 Platform Health

#### GET `/platform/health`

**Guard:** PlatformRouteGuard
**Response 200:**
```json
{
  "database": { "status": "healthy", "latencyMs": 5 },
  "redis": { "status": "healthy", "latencyMs": 1 },
  "storage": { "status": "healthy", "provider": "s3", "bucketSize": 5368709120 },
  "websocket": { "status": "healthy", "connections": 45, "rooms": 12 },
  "queues": {
    "email": { "status": "healthy", "waiting": 0, "active": 0 },
    "webhook": { "status": "healthy", "waiting": 2, "active": 1 }
  }
}
```

---

## 4. Customer Endpoints (`/customer/*`)

**All customer endpoints require:**
- `JwtAuthGuard` — JWT authentication
- `AudienceGuard` — `aud` must be `customer`
- `RolesGuard` — workspace membership and role check
- `X-CSRF-Token` header

### 4.1 Customer Workspaces

#### GET `/customer/workspaces`

**Guard:** JwtAuthGuard + AudienceGuard
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "role": "OWNER",
      "screenCount": 15,
      "memberCount": 5,
      "subscriptionStatus": "ACTIVE",
      "subscriptionPlan": "pro"
    }
  ]
}
```

#### POST `/customer/workspaces`

**Guard:** JwtAuthGuard + AudienceGuard
**Body:**
```json
{
  "name": "New Branch",
  "slug": "new-branch"
}
```

**Response 201:** Created workspace object

---

### 4.2 Customer Screens

#### GET `/customer/screens`

**Guard:** CustomerRouteGuard (VIEWER+)
**Query:** `?cursor=<base64>&limit=20&status=online&tag=lobby&sort=name:asc`
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "name": "Lobby Display",
      "status": "ONLINE",
      "lastSeenAt": "2026-07-18T21:59:00Z",
      "currentPlaylistId": "clxxx...",
      "currentPlaylistName": "Welcome Playlist",
      "timezone": "Asia/Riyadh",
      "tags": [{ "id": "clxxx...", "name": "lobby", "color": "#6366f1" }]
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### POST `/customer/screens`

**Guard:** CustomerRouteGuard (EDITOR+)
**Body:**
```json
{
  "name": "New Display",
  "timezone": "Asia/Riyadh",
  "tags": ["lobby", "entrance"]
}
```

---

### 4.3 Customer Media

#### GET `/customer/media`

**Guard:** CustomerRouteGuard (VIEWER+)
**Query:** `?cursor=<base64>&limit=20&folderId=clxxx...&type=image&sort=createdAt:desc`
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "name": "welcome.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 524288,
      "url": "https://cdn.smartscreen.com/media/clxxx...",
      "thumbnailUrl": "https://cdn.smartscreen.com/media/clxxx.../thumb",
      "folderId": "clxxx...",
      "expiresAt": null,
      "createdAt": "2026-07-15T..."
    }
  ],
  "nextCursor": null,
  "hasMore": false,
  "storageUsed": 5368709120,
  "storageLimit": 21474836480
}
```

#### POST `/customer/media/upload`

**Guard:** CustomerRouteGuard (EDITOR+)
**Content-Type:** `multipart/form-data`
**Body:** `file` (binary), `folderId` (optional), `expiresAt` (optional)
**Response 201:**
```json
{
  "id": "clxxx...",
  "name": "welcome.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 524288,
  "url": "https://cdn.smartscreen.com/media/clxxx..."
}
```

**Response 413 (Quota exceeded):**
```json
{
  "message": "Storage quota exceeded. Used: 5.0 GB / Limit: 5.0 GB",
  "code": "STORAGE_QUOTA_EXCEEDED",
  "storageUsed": 5368709120,
  "storageLimit": 5368709120
}
```

---

### 4.4 Customer Usage

#### GET `/customer/usage` (NEW)

**Guard:** CustomerRouteGuard (VIEWER+)
**Query:** `?period=2026-07` (optional, defaults to current month)
**Response 200:**
```json
{
  "period": "2026-07",
  "screenCount": 15,
  "screenLimit": 50,
  "storageBytes": 5368709120,
  "storageLimitBytes": 21474836480,
  "userCount": 5,
  "userLimit": 20,
  "apiCalls": 12500,
  "webhookCalls": 340,
  "proofOfPlayEvents": 45000
}
```

---

### 4.5 Customer Invoices

#### GET `/customer/invoices` (NEW)

**Guard:** CustomerRouteGuard (ADMIN+)
**Query:** `?cursor=<base64>&limit=20&status=PAID`
**Response 200:**
```json
{
  "items": [
    {
      "id": "clxxx...",
      "number": "INV-2026-0042",
      "status": "PAID",
      "amountDue": 2900,
      "amountPaid": 2900,
      "currency": "USD",
      "periodStart": "2026-07-01T...",
      "periodEnd": "2026-07-31T...",
      "paidAt": "2026-07-01T...",
      "pdfUrl": "https://..."
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### GET `/customer/invoices/:id` (NEW)

**Guard:** CustomerRouteGuard (ADMIN+)
**Response 200:**
```json
{
  "id": "clxxx...",
  "number": "INV-2026-0042",
  "status": "PAID",
  "amountDue": 2900,
  "amountPaid": 2900,
  "currency": "USD",
  "periodStart": "2026-07-01T...",
  "periodEnd": "2026-07-31T...",
  "paidAt": "2026-07-01T...",
  "pdfUrl": "https://...",
  "lineItems": [
    {
      "description": "Pro Plan - Monthly",
      "quantity": 1,
      "unitPrice": 2900,
      "total": 2900
    }
  ]
}
```

---

### 4.6 Customer Webhooks

#### POST `/customer/webhooks/test` (NEW)

**Guard:** CustomerRouteGuard (ADMIN+)
**Body:**
```json
{
  "webhookId": "clxxx...",
  "payload": { "event": "test", "data": { "foo": "bar" } }
}
```

**Response 200:**
```json
{
  "success": true,
  "responseStatus": 200,
  "responseTimeMs": 145,
  "responseBody": "{\"received\": true}"
}
```

**Response 502:**
```json
{
  "success": false,
  "responseStatus": 500,
  "responseTimeMs": 5000,
  "error": "Connection timeout"
}
```

---

## 5. Player Endpoints (`/player/*`)

**Auth:** `X-Player-Secret` header or `X-API-Key` header (no JWT)

### 5.1 GET `/player/content`

**Headers:** `X-Player-Secret: <secret>`
**Query:** `?screenId=clxxx...`
**Response 200:**
```json
{
  "screen": {
    "id": "clxxx...",
    "name": "Lobby Display",
    "timezone": "Asia/Riyadh"
  },
  "playlist": {
    "id": "clxxx...",
    "name": "Welcome Playlist",
    "items": [
      {
        "id": "clxxx...",
        "type": "media",
        "mediaId": "clxxx...",
        "url": "https://cdn.smartscreen.com/media/clxxx...",
        "durationSeconds": 15,
        "transition": "fade"
      }
    ]
  },
  "schedules": [
    {
      "id": "clxxx...",
      "playlistId": "clxxx...",
      "startTime": "08:00",
      "endTime": "17:00",
      "daysOfWeek": [1, 2, 3, 4, 5]
    }
  ],
  "config": {
    "volume": 50,
    "orientation": "landscape",
    "autoplay": true
  }
}
```

---

## 6. Public Endpoints (`/public/*`)

### 6.1 GET `/public/health`

**Auth:** None
**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-18T22:00:00Z",
  "uptime": 3600
}
```

### 6.2 GET `/public/ready`

**Auth:** None
**Response 200:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

**Response 503:**
```json
{
  "status": "not_ready",
  "checks": {
    "database": "ok",
    "redis": "failed"
  }
}
```

---

## 7. Internal Endpoints (`/internal/*`)

### 7.1 POST `/internal/webhooks/stripe`

**Auth:** Stripe signature verification
**Content-Type:** `application/json` (raw body)
**Body:** Stripe event object
**Response 200:** `{ "received": true }`

### 7.2 POST `/internal/cron/subscription-expiry` (NEW)

**Auth:** `X-Cron-Secret` header (shared secret)
**Response 200:**
```json
{
  "processed": 15,
  "expired": 3,
  "gracePeriod": 12
}
```

### 7.3 POST `/internal/cron/trial-expiry` (NEW)

**Auth:** `X-Cron-Secret` header
**Response 200:**
```json
{
  "processed": 8,
  "converted": 5,
  "expired": 3
}
```

### 7.4 POST `/internal/cron/media-cleanup` (NEW)

**Auth:** `X-Cron-Secret` header
**Response 200:**
```json
{
  "deletedMedia": 45,
  "freedBytes": 536870912
}
```

### 7.5 GET `/internal/metrics`

**Auth:** `X-Metrics-Secret` header (or internal network only)
**Response 200:** Prometheus format text

---

## 8. Route Migration Mapping

### 8.1 Old → New Route Mapping

| Old Route | New Route | Phase | Backward Compat |
|---|---|---|---|
| `POST /auth/login` | `POST /auth/login` | Phase 0 | Same path, add `audience` param |
| `POST /auth/logout` | `POST /auth/logout` | Phase 0 | Same path, add `allDevices` param |
| `GET /auth/me` | `GET /auth/me` | Phase 0 | Same path, add `audience` in response |
| `POST /admin/users/:id/impersonate` | `POST /platform/impersonate` | Phase 2 | Dual routing |
| `GET /admin/users` | `GET /platform/customers` | Phase 1 | Dual routing |
| `GET /admin/staff` | `GET /platform/staff` | Phase 1 | Dual routing |
| `GET /admin/customers` | `GET /platform/customers` | Phase 1 | Dual routing |
| `GET /admin/workspaces` | `GET /platform/workspaces` | Phase 1 | Dual routing |
| `GET /admin/fleet/screens` | `GET /platform/fleet/screens` | Phase 1 | Dual routing |
| `GET /admin/logs` | `GET /platform/audit-log` | Phase 1 | Dual routing |
| `GET /admin/settings` | `GET /platform/settings` | Phase 1 | Dual routing |
| `PATCH /admin/settings` | `PATCH /platform/settings` | Phase 1 | Dual routing |
| `GET /admin/stats` | `GET /platform/dashboard` | Phase 1 | Dual routing |
| `GET /workspaces` | `GET /customer/workspaces` | Phase 1 | Dual routing |
| `POST /workspaces` | `POST /customer/workspaces` | Phase 1 | Dual routing |
| `GET /screens` | `GET /customer/screens` | Phase 1 | Dual routing |
| `POST /screens` | `POST /customer/screens` | Phase 1 | Dual routing |
| `GET /media` | `GET /customer/media` | Phase 1 | Dual routing |
| `POST /media/upload` | `POST /customer/media/upload` | Phase 1 | Dual routing |
| `GET /playlists` | `GET /customer/playlists` | Phase 1 | Dual routing |
| `GET /canvases` | `GET /customer/canvases` | Phase 1 | Dual routing |
| `GET /schedules` | `GET /customer/schedules` | Phase 1 | Dual routing |
| `GET /campaigns` | `GET /customer/campaigns` | Phase 1 | Dual routing |
| `GET /subscriptions` | `GET /customer/subscriptions` | Phase 1 | Dual routing |
| `GET /notifications` | `GET /customer/notifications` | Phase 1 | Dual routing |
| `GET /onboarding` | `GET /customer/onboarding` | Phase 1 | Dual routing |
| `GET /islamic` | `GET /customer/islamic` | Phase 1 | Dual routing |
| `GET /audit-log` | `GET /customer/audit-log` | Phase 1 | Dual routing |
| `GET /api-keys` | `GET /customer/api-keys` | Phase 1 | Dual routing |
| `GET /webhooks` | `GET /customer/webhooks` | Phase 1 | Dual routing |
| `POST /webhooks/stripe` | `POST /internal/webhooks/stripe` | Phase 1 | Dual routing |
| `GET /player/content` | `GET /player/content` | — | No change |
| `GET /health` | `GET /public/health` | Phase 1 | Dual routing |
| `GET /ready` | `GET /public/ready` | Phase 1 | Dual routing |
| `GET /metrics` | `GET /internal/metrics` | Phase 1 | Add auth |

### 8.2 Dual Routing Implementation

```typescript
// During migration, both old and new routes point to same handler
@Controller({ path: ['admin/customers', 'platform/customers'] })
@UseGuards(JwtAuthGuard, PlatformRouteGuard)
export class PlatformCustomersController { ... }
```

Or use a redirect middleware:
```typescript
// Redirect old routes to new routes
@app.use('/api/v1/admin/*', (req, res, next) => {
  const newPath = req.path.replace('/admin/', '/platform/');
  res.redirect(308, `/api/v1${newPath}`);
});
```

**Recommendation:** Use array-based `@Controller({ path: [...] })` for dual routing. This avoids redirect overhead and keeps both routes functional.

---

## 9. Error Response Format

All error responses follow this format:

```json
{
  "message": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {}  // optional: additional context
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `AUTH_ACCOUNT_LOCKED` | 423 | Account locked due to brute force |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT expired |
| `AUTH_TOKEN_INVALID` | 401 | JWT invalid or revoked |
| `AUTH_AUDIENCE_MISMATCH` | 403 | Token audience doesn't match route |
| `AUTH_FORBIDDEN` | 403 | Insufficient role/permission |
| `AUTH_NOT_FOUND` | 404 | Resource not found |
| `AUTH_WORKSPACE_REQUIRED` | 400 | Workspace context required |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `STORAGE_QUOTA_EXCEEDED` | 413 | Media storage limit reached |
| `SCREEN_LIMIT_EXCEEDED` | 403 | Screen count limit reached |
| `USER_LIMIT_EXCEEDED` | 403 | User count limit reached |
| `EXCHANGE_TOKEN_INVALID` | 401 | Exchange token invalid or expired |
| `EXCHANGE_TOKEN_USED` | 409 | Exchange token already redeemed |
| `CSRF_TOKEN_INVALID` | 403 | CSRF token mismatch |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. Pagination Format

All list endpoints use cursor-based pagination:

### Request Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string (base64) | null | Opaque cursor for next page |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `createdAt:desc` | Sort field and direction |
| `search` | string | null | Full-text search |
| `status` | string | null | Filter by status |
| Other filters | various | null | Endpoint-specific filters |

### Response Format

```json
{
  "items": [...],
  "nextCursor": "eyJpZCI6ImNseHh4Li4uIn0=",
  "hasMore": true
}
```

- `nextCursor` is `null` when no more items
- `hasMore` is `false` when this is the last page
- Cursor is opaque — clients should not parse it
- Cursor encodes the last item's sort field value + ID

### Cursor Encoding

```typescript
function encodeCursor(lastItem: { id: string; createdAt: Date }): string {
  return Buffer.from(JSON.stringify({
    id: lastItem.id,
    createdAt: lastItem.createdAt.toISOString(),
  })).toString('base64');
}

function decodeCursor(cursor: string): { id: string; createdAt: Date } {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}
```
