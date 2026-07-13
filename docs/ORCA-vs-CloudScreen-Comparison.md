# تقرير مقارنة جوهري: ORCA-CLOUDSCREEN vs Cloud-Screen

> **تاريخ:** 12 يوليو 2026
> **الهدف:** مقارنة جوهرية بين مشروعين لنفس المنتج (Digital Signage SaaS)

---

## 1. نظرة عامة على المشروعين

| المعيار | ORCA-CLOUDSCREEN | Cloud-Screen |
|---------|-----------------|--------------|
| **الاسم** | DX-OS (Digital Experience OS) | Cloud-Screen / CloudSignage |
| **الوصف** | منصة digital signage متعددة المستأجرين | منصة digital signage متعددة المستأجرين |
| **Package Manager** | pnpm 9 + Turborepo | npm workspaces |
| **Monorepo Tool** | Turborepo | npm workspaces (بدون turborepo) |
| **Node.js** | ≥ 20 | ≥ 20 |
| **TypeScript** | 5.3 | 5.x |
| **Backend Framework** | NestJS 10 | NestJS 11 |
| **Frontend Framework** | Next.js 14 | Next.js 16 (Turbopack) |
| **ORM** | Prisma 5 | Prisma 7 |
| **Database** | PostgreSQL 16 + TimescaleDB + pgvector | PostgreSQL 16 |
| **Cache** | Redis 7 | — (غير مستخدم) |
| **Message Queue** | Apache Kafka (KRaft) | — (غير مستخدم) |
| **Object Storage** | MinIO (S3) | — (تخزين محلي) |
| **Player App** | React + Vite + Capacitor (Android) | Next.js (Web) |
| **3D Graphics** | Three.js + React Three Fiber | — |
| **Testing** | Vitest + Playwright + k6 | Vitest |
| **Monitoring** | Prometheus + Grafana | — |
| **i18n** | مخصص (react-i18next) | next-intl (EN/AR) |
| **UI Components** | Tailwind + @dxos/ui مخصص | Tailwind + shadcn/ui |
| **Notifications** | Sonner | Sonner |
| **Animations** | Framer Motion | Framer Motion |
| **Deployment** | Dokploy / Docker Compose / K8s | Docker Compose |

---

## 2. البنية المعمارية (Architecture)

### ORCA-CLOUDSCREEN: Microservices

```
8 خدمات منفصلة (NestJS):
├── auth-service (3001)       — JWT, RBAC, multi-tenancy
├── cms-service (3002)        — Content, assets, templates
├── scheduling-service (3003) — Playlists, schedules, campaigns
├── device-service (3004)     — Displays, heartbeat, OTA, crashes
├── ai-service (3005)         — AI gateway, content generation
├── billing-service (3006)    — Stripe, subscriptions, invoices
├── notification-service (3007) — Email, push, in-app
└── public-api-service (3008) — API keys, webhooks

3 تطبيقات frontend:
├── customer-dashboard (3000) — Next.js 14
├── super-admin (3009)        — Next.js 14
└── player-app (5173)         — React + Vite + Capacitor

6 حزم مشتركة (packages):
├── database  — Prisma schema, RLS
├── types     — TypeScript types
├── events    — Kafka topics, EventPublisher
├── config    — Env validation (Zod), metrics
├── ui        — Shared UI components
└── utils     — Shared utilities
```

### Cloud-Screen: Monolith + Apps

```
1 backend موحد (NestJS):
└── apps/backend (4000) — كل الدومينات في خدمة واحدة
    ├── auth          ├── workspaces    ├── screens
    ├── canvases      ├── media         ├── playlists
    ├── schedules     ├── subscriptions ├── billing (Stripe)
    ├── admin         ├── player        ├── notifications
    ├── audit-log     ├── webhooks      ├── health
    └── realtime (WebSocket)

3 تطبيقات frontend:
├── apps/dashboard (3000) — Next.js 16 (dashboard + admin في واحد)
├── apps/player (3001)    — Next.js (Web player)
└── apps/marketing (3010) — Next.js (landing page — فارغ)
```

### الخلاصة المعمارية

| المعيار | ORCA | Cloud-Screen |
|---------|------|-------------|
| **Backend** | 8 microservices منفصلة | 1 monolith موحد |
| **Database** | مشتركة (Prisma + RLS) | مشتركة (Prisma) |
| **Event System** | Kafka (event-driven) | — (بدون message queue) |
| **Cache** | Redis | — |
| **Object Storage** | MinIO/S3 | تخزين محلي (uploads/) |
| **Monitoring** | Prometheus + Grafana | — |
| **Player** | React + Vite + Capacitor (Android native) | Next.js (Web only) |
| **Admin** | Super Admin منفصل (تطبيق مستقل) | Admin مدمج في dashboard |
| **Shared packages** | 6 حزم منفصلة | بدون shared packages |

---

## 3. قاعدة البيانات (Database Schema)

### ORCA: Prisma 5 + RLS + TimescaleDB + pgvector

**النماذج الرئيسية:**
- `Tenant` — المستأجر (multi-tenancy عبر tenantId)
- `User` — مستخدم مرتبط بـ tenant
- `RefreshToken` — tokens قابلة للإلغاء
- `Asset` — ملفات (image, video, audio, html, pdf, widget, url)
- `ContentItem` — محتوى مع versioning و locale
- `ContentVersion` — نسخ المحتوى
- `Playlist` + `PlaylistItem` — قوائم التشغيل
- `Campaign` — حملات (draft → submitted → approved → published → paused → ended)
- `Display` + `DisplayGroup` — شاشات ومجموعات هرمية
- `Schedule` — جدولة مع dayparting
- `Subscription` + `Invoice` + `UsageRecord` — billing
- `ApiKey` + `WebhookEndpoint` + `WebhookDelivery` — public API
- `Notification` — إشعارات
- `AuditLog` — سجل التدقيق
- `DeviceMetric` — مقاييس الشاشات (TimescaleDB)
- `CrashReport` — تقارير الأعطال
- `PlayerVersion` — إصدارات OTA
- `AIRequest` — طلبات AI وتكلفتها
- `EmergencyAlert` — تنبيهات الطوارئ
- `DeviceCommand` — أوامر للشاشات

### Cloud-Screen: Prisma 7

**النماذج الرئيسية:**
- `User` — مستخدم مع isSuperAdmin
- `Workspace` — مساحة عمل (بدلاً من Tenant)
- `WorkspaceMember` — أعضاء مع أدوار (OWNER, ADMIN, EDITOR, VIEWER)
- `Screen` — شاشات مع pairing, heartbeat, override
- `ScreenPairingSession` — جلسات اقتران الشاشات
- `Canvas` — تصميمات بـ JSON (shapes, zones)
- `MediaAsset` — ملفات الوسائط
- `Playlist` + `PlaylistItem` — قوائم التشغيل
- `Schedule` — جدولة مع dayparting
- `Subscription` — billing مع Stripe
- `Notification` — إشعارات
- `AuditLog` — سجل التدقيق
- `AdminUser` — مستخدمين admin
- `PlatformSettings` — إعدادات المنصة
- `BrandingAsset` — أصول الـ branding

### الفروقات الجوهرية في قاعدة البيانات

| المعيار | ORCA | Cloud-Screen |
|---------|------|-------------|
| **Multi-tenancy** | `Tenant` + `tenantId` على كل model | `Workspace` + `workspaceId` |
| **Roles** | `super_admin, tenant_admin, editor, operator, viewer` | `OWNER, ADMIN, EDITOR, VIEWER` + `isSuperAdmin` |
| **Content** | `ContentItem` + `ContentVersion` (versioning كامل) | `Canvas` (JSON shapes — بدون versioning في DB) |
| **Campaigns** | `Campaign` model كامل بـ lifecycle | — (مش موجود) |
| **Display Groups** | `DisplayGroup` هرمية (parent/child) | — (مش موجود) |
| **Emergency Alerts** | `EmergencyAlert` model | — (مش موجود) |
| **Device Metrics** | `DeviceMetric` (TimescaleDB) | — (مش موجود) |
| **Crash Reports** | `CrashReport` model | — (مش موجود) |
| **OTA Updates** | `PlayerVersion` model | — (مش موجود) |
| **AI Requests** | `AIRequest` model (cost tracking) | — (مش موجود) |
| **API Keys** | `ApiKey` model | — (مش موجود) |
| **Webhooks** | `WebhookEndpoint` + `WebhookDelivery` | — (مش موجود) |
| **Screen Pairing** | `enrollmentCode` بسيط | `ScreenPairingSession` مع pollSecret و expiry |
| **Branding** | — | `BrandingAsset` + `PlatformSettings` |
| **2FA** | — | مدعوم في auth |

---

## 4. المميزات (Features)

### 4.1 المميزات الموجودة في ORCA وغير موجودة في Cloud-Screen

| # | الميزة | الوصف | الأهمية |
|---|--------|------|---------|
| 1 | **AI Service كامل** | gateway مع OpenAI/Anthropic، توليد محتوى، cost tracking، moderation | عالية |
| 2 | **Campaign Lifecycle** | draft → submitted → approved → published → paused → ended | عالية |
| 3 | **Display Groups هرمية** | parent/child groups مع metadata | متوسطة |
| 4 | **Emergency Alerts** | إرسال رسائل طوارئ لكل الشاشات | متوسطة |
| 5 | **Device Metrics** | مقاييس أداء الشاشات (TimescaleDB) | متوسطة |
| 6 | **Crash Reports** | تقارير أعطال الـ player مع stack trace | متوسطة |
| 7 | **OTA Updates** | إدارة إصدارات الـ player وتحديثات عن بعد | متوسطة |
| 8 | **Public API + API Keys** | API للمطورين مع scopes و rate limiting | عالية |
| 9 | **Webhooks** | HMAC-signed مع retry (3 محاولات) | متوسطة |
| 10 | **Content Versioning** | ContentVersion model لتتبع تغييرات المحتوى | متوسطة |
| 11 | **Kafka Event System** | event-driven architecture كامل | عالية (معمارية) |
| 12 | **Redis Cache** | caching layer + JWT blacklist | متوسطة |
| 13 | **MinIO/S3 Storage** | object storage قابل للتوسع | عالية |
| 14 | **Prometheus + Grafana** | monitoring و metrics | متوسطة |
| 15 | **3D Landing Page** | Three.js + React Three Fiber | منخفضة (visual) |
| 16 | **Capacitor Android Player** | player app كـ Android native | عالية |
| 17 | **Super Admin منفصل** | تطبيق admin مستقل تماماً | متوسطة |
| 18 | **Multi-file Upload** | رفع ملفات متعددة | منخفضة |
| 19 | **Proof-of-Play** | تسجيل ما تم عرضه ومتى | متوسطة |
| 20 | **Content Templates** | 8 templates جاهزة (fullscreen, split, social wall, menu board) | متوسطة |

### 4.2 المميزات الموجودة في Cloud-Screen وغير موجودة في ORCA

| # | الميزة | الوصف | الأهمية |
|---|--------|------|---------|
| 1 | **i18n كامل (EN/AR)** | next-intl مع RTL support كامل | عالية جداً |
| 2 | **Canvas Studio** | محرر تصميم مرئي (shapes, zones, drag & drop) | عالية |
| 3 | **Screen Pairing Sessions** | نظام اقتران متقدم مع pollSecret و expiry | متوسطة |
| 4 | **Branding System** | branding assets + platform settings للـ white-label | متوسطة |
| 5 | **2FA / MFA** | مصادقة ثنائية في login | عالية |
| 6 | **Per-screen billing** | billing breakdown لكل شاشة | متوسطة |
| 7 | **WebSocket Realtime** | Socket.IO للـ heartbeat و status updates | عالية |
| 8 | **Player Offline Cache** | offline mode مع exponential backoff | متوسطة |
| 9 | **Onboarding Wizard** | wizard تفاعلي للتسجيل | متوسطة |
| 10 | **Global Search** | Cmd+K command palette | منخفضة |
| 11 | **Breadcrumb Navigation** | breadcrumbs في كل الصفحات | منخفضة |
| 12 | **shadcn/ui Components** | مكتبة UI غنية ومتسقة | متوسطة |
| 13 | **Schedule Calendar** | day/week/month views | متوسطة |
| 14 | **Playlist Preview** | preview overlay للـ playlist | منخفضة |
| 15 | **Usage Indicators** | storage + screen limit indicators | متوسطة |
| 16 | **Admin Customer Management** | إدارة عملاء كاملة مع subscription management | متوسطة |

### 4.3 المميزات الموجودة في كلا المشروعين

| الميزة | ORCA | Cloud-Screen |
|--------|------|-------------|
| **Multi-tenant** | Tenant + RBAC | Workspace + roles |
| **JWT Auth** | + refresh tokens + Redis blacklist | + refresh tokens + multi-session |
| **Playlist CRUD** | + items + reorder | + items + reorder + transitions |
| **Schedule + Dayparting** | recurrence + dayparts + timezone | recurrence + dayparts + timezone |
| **Stripe Billing** | subscriptions + invoices + usage | subscriptions + invoices + per-screen |
| **Notifications** | email + push + in-app | email + in-app (Socket.IO) |
| **Display Management** | enrollment + heartbeat + groups | pairing + heartbeat + override |
| **Asset Upload** | MinIO/S3 presigned URLs | local uploads |
| **Audit Log** | AuditLog model | AuditLog model |
| **Docker Deployment** | docker-compose + Dokploy + K8s | docker-compose |

---

## 5. جودة الكود والتشغيل

| المعيار | ORCA | Cloud-Screen |
|---------|------|-------------|
| **Build Status** | ✅ يبني بنجاح | ✅ يبني بنجاح |
| **TypeScript** | ✅ بدون أخطاء | ✅ بدون أخطاء |
| **Tests** | Vitest + Playwright + k6 | Vitest (unit tests) |
| **Security** | CSP + Zod validation | JWT secrets + rate limiting + 2FA + lockout |
| **Error Handling** | مكتوبة لكن مش متختبطة تماماً | AllExceptionsFilter + Sentry + structured logging |
| **Documentation** | 200+ ملف docs شامل | docs مختصرة + audit reports |
| **Deployment** | Dokploy + K8s + Docker Compose | Docker Compose فقط |
| **CI/CD** | GitHub Actions | GitHub Actions |

---

## 6. مشاكل ORCA المعروفة (من AUDIT_REPORT.md)

1. **No .env.local** — API calls hit self (localhost:3000)
2. **Root redirects to /login** — no landing page entry
3. **CSP blocks external connections**
4. **No API proxy** — CORS will block backend calls
5. **Password change not wired to API**
6. **Notification preferences not saved**
7. **Team deactivate non-functional**
8. **Invoice PDF doesn't open**
9. **No loading/error boundaries**
10. **No middleware for auth** (client-side only)
11. **3D scene no fallback/loading state**

---

## 7. مشاكل Cloud-Screen المعروفة

1. **No marketing/landing page** (apps/marketing فارغ)
2. **No content approval workflow** (campaign lifecycle)
3. **No AI service** (مش موجود تماماً)
4. **No public API / API keys**
5. **No webhooks system**
6. **No object storage** (تخزين محلي فقط)
7. **No message queue** (بدون Kafka)
8. **No Redis cache**
9. **No monitoring** (بدون Prometheus/Grafana)
10. **No OTA updates** للـ player
11. **No crash reporting**
12. **No device metrics**
13. **No emergency alerts**
14. **No proof-of-play**
15. **No content versioning** في DB
16. **No display groups** هرمية
17. **No Android native player** (Web only)

---

## 8. الخلاصة والتوصيات

### 8.1 ما يميز ORCA عن Cloud-Screen

- **بنية microservices كاملة** — قابلة للتوسع بشكل أفضل
- **AI service متكامل** — توليد محتوى + moderation + cost tracking
- **بنية تحتية قوية** — Kafka + Redis + MinIO + Prometheus + Grafana
- **Player Android native** — Capacitor
- **Public API + Webhooks** — للمطورين الخارجيين
- **200+ ملف توثيق** — شامل جداً
- **Content versioning + Campaign lifecycle** — ميزات enterprise

### 8.2 ما يميز Cloud-Screen عن ORCA

- **i18n كامل (EN/AR + RTL)** — جاهز للسوق العربي
- **Canvas Studio مرئي** — محرر تصميم drag & drop
- **2FA / MFA** — أمان أقوى
- **WebSocket Realtime** — تحديثات فورية
- **shadcn/ui** — UI أكثر احترافية
- **Onboarding + Global Search + Breadcrumbs** — UX أفضل
- **Branding System** — white-label جاهز
- **Screen Pairing متقدم** — نظام اقتران أكثر أماناً
- **Build ناجح بدون مشاكل runtime** — ORCA فيه مشاكل CSP و CORS

### 8.3 التوصية

**دمج المميزات من المشروعين:**

1. **من ORCA → Cloud-Screen:**
   - AI service (توليد محتوى)
   - Campaign lifecycle (approval workflow)
   - Public API + API keys + Webhooks
   - Content versioning
   - Display groups هرمية
   - Emergency alerts
   - Proof-of-play
   - OTA updates + crash reporting
   - MinIO/S3 object storage
   - Redis cache

2. **من Cloud-Screen → ORCA:**
   - i18n + RTL support
   - Canvas Studio
   - 2FA / MFA
   - WebSocket realtime
   - shadcn/ui components
   - Onboarding wizard
   - Screen pairing متقدم
   - Branding system
   - Error handling + Sentry

3. **قرار معماري:**
   - ORCA: microservices أفضل للتوسع الكبير
   - Cloud-Screen: monolith أبسط للصيانة والتشغيل السريع
   - **التوصية:** البقاء على monolith (Cloud-Screen) مع إضافة مميزات ORCA تدريجياً
