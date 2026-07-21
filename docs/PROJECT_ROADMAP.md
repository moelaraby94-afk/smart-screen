# Smart Screen — خارطة الطريق الاحترافية الشاملة

> **تاريخ الإصدار:** 20 يوليو 2026
> **الإصدار:** 1.0
> **النطاق:** منصة Digital Signage SaaS كاملة — تقنياً، تسويقياً، تشغيلياً
> **المرجعية:** ORCA Design System، وثائق المنتج، تحليل المنافسين، خطة التنفيذ

---

## جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [المعمارية التقنية](#2-المعمارية-التقنية)
3. [التطبيقات (Applications)](#3-التطبيقات-applications)
4. [نطاق الـ Backend الكامل](#4-نطاق-الـ-backend-الكامل)
5. [نطاق الـ Frontend الكامل](#5-نطاق-الـ-frontend-الكامل)
6. [رحلة العميل الكاملة (Customer Journey)](#6-رحلة-العميل-الكاملة-customer-journey)
7. [نموذج الأعمال والتسعير](#7-نموذج-الأعمال-والتسعير)
8. [الاستراتيجية التسويقية](#8-الاستراتيجية-التسويقية)
9. [مقارنة تنافسية](#9-مقارنة-تنافسية)
10. [خارطة الطريق التنفيذية](#10-خارطة-الطريق-التنفيذية)
11. [حالة المشروع الحالية](#11-حالة-المشروع-الحالية)
12. [المخاطر والتخفيف](#12-المخاطر-والتخفيف)
13. [المؤشرات الرئيسية (KPIs)](#13-المؤشرات-الرئيسية-kpis)

---

## 1. نظرة عامة على المشروع

### 1.1 ما هو Smart Screen؟

Smart Screen هو منصة **Digital Signage SaaS** (لافتات رقمية سحابية) تتيح للشركات إدارة شاشات العرض الرقمية من مكان واحد — رفع المحتوى، تصميم الكانفس، إنشاء القوائم التشغيلية، جدولة العرض، وإدارة أسطول الشاشات عن بُعد.

### 1.2 القيمة المقترحة

| المحور | القيمة |
|--------|--------|
| **لمن؟** | الشركات متعددة الفروع، المطاعم، المساجد، المتاجر، المؤسسات الحكومية |
| **ماذا؟** | إدارة كاملة للشاشات الرقمية من متصفح — بدون أجهزة إضافية |
| **كيف؟** | Player app على الشاشة + Dashboard للإدارة + Backend للمعالجة |
| **لماذا؟** | توفير الوقت والتكلفة، تحكم مركزي، محتوى ديناميكي، جدولة ذكية |
| **التميز؟** | دعم عربي كامل (RTL)، ميزات إسلامية فريدة (أوقات الصلاة، رمضان)، AI لتوليد المحتوى |

### 1.3 المبدأ التوجيهي

> "منصة لافتات رقمية تجعل إدارة الشاشات سهلة كإدارة صفحة على وسائل التواصل الاجتماعي — مع قوة المؤسسات و بساطة المستهلك."

---

## 2. المعمارية التقنية

### 2.1 المعمارية الحالية

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Shared Backend API                            │
│                      (NestJS — apps/backend)                        │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Platform API    │  │ Customer API    │  │ Player API          │ │
│  │ /api/v1/admin/* │  │ /api/v1/*       │  │ /api/v1/player/*    │ │
│  │ /api/v1/staff/* │  │ (workspace-     │  │ (kiosk + JWT)       │ │
│  │ (PlatformStaff  │  │  scoped)        │  │                     │ │
│  │  DbGuard)       │  │ (RolesGuard)    │  │                     │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────┘ │
│           │                    │                                     │
│  ┌────────┴────────────────────┴────────────────────────────────┐  │
│  │              26 Domain Modules (DDD)                          │  │
│  │  Auth · Workspaces · Screens · Media · Playlists · Canvases  │  │
│  │  Schedules · Campaigns · Subscriptions · Realtime · Player   │  │
│  │  Admin · Account · Webhooks · ApiKeys · Onboarding · Islamic │  │
│  │  Maintenance · Email · Notifications · AuditLog · AI         │  │
│  │  Analytics · BulkOps · SecurityEvents · Pairing              │  │
│  └───────────────────────────┬─────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────┴─────────────────────────────────┐  │
│  │          Shared Infrastructure Layer                         │  │
│  │  PostgreSQL 16 · Redis 7 · MinIO (S3) · BullMQ · Sentry     │  │
│  │  Helmet · CORS · CSRF · Rate Limiting · Swagger · Metrics   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                    │
┌──────────┴──────────┐ ┌──────┴───────┐ ┌──────────┴──────────┐
│  Control Panel      │ │  Dashboard   │ │  Player             │
│  (apps/control-     │ │  (apps/      │ │  (apps/player)      │
│   panel)            │ │   dashboard) │ │                     │
│  Next.js · :3003    │ │  Next.js     │ │  Next.js · :3001    │
│  Platform Admin     │ │  · :3000     │ │  Kiosk + JWT        │
└─────────────────────┘ │  Customer    │ └─────────────────────┘
                        └──────────────┘
                     ┌──────────────────┐
                     │  Marketing       │
                     │  (apps/marketing)│
                     │  Next.js · :3010 │
                     │  Landing Page    │
                     └──────────────────┘
```

### 2.2 الـ Tech Stack

| الطبقة | التقنية | الإصدار | الوصف |
|--------|---------|---------|-------|
| **Backend** | NestJS | Latest | إطار Node.js مع DDD، Guards، Interceptors |
| **ORM** | Prisma | Latest | ORM مع Type Safety، Migrations، Shadow DB |
| **Database** | PostgreSQL | 16 | قاعدة بيانات رئيسية مع Enums، JSONB، Full-text search |
| **Cache/Queue** | Redis | 7 | Rate limiting، WebSocket adapter، BullMQ queues |
| **Storage** | MinIO / S3 | Latest | تخزين الميديا مع Signed URLs |
| **Realtime** | Socket.IO | Latest | WebSocket مع Redis adapter للـ multi-instance |
| **Frontend** | Next.js | 15+ | App Router، SSR، i18n، RTL |
| **UI Framework** | TailwindCSS + Radix UI | Latest | Design System V2 (ORCA) |
| **Canvas Engine** | Konva.js | Latest | محرك الرسم للـ Studio Editor |
| **Charts** | Recharts | Latest | رسوم بيانية للـ Analytics |
| **Animations** | Framer Motion | Latest | انتقالات وحركات مع useReducedMotion |
| **Auth** | JWT + Refresh Tokens | — | Access 15min، Refresh 7d، 2FA TOTP |
| **Payments** | Stripe | Latest | Checkout، Webhooks، Customer Portal |
| **Email** | Resend / SendGrid / SMTP | — | قائمة إيميلات مع BullMQ queue |
| **Monitoring** | Sentry | Latest | Error tracking للـ backend + frontend |
| **Containerization** | Docker Compose | Latest | 8 services مع health checks |
| **CI/CD** | GitHub Actions | — | typecheck + lint + test + build + i18n |

### 2.3 البنية الأمنية (Defense-in-Depth)

```
Request → Helmet (HTTP headers)
       → CORS (allow-list)
       → Rate Limiter (Redis-backed, per-IP)
       → CSRF (double-submit cookie)
       → JWT Auth (access + refresh)
       → RBAC Guard (OWNER/ADMIN/EDITOR/VIEWER)
       → Platform Staff Guard (SUPER_ADMIN/SUPPORT/BILLING)
       → Admin IP Allowlist (ADMIN_ALLOWED_IPS)
       → Sensitive Field Interceptor (strip private fields)
       → Validation Pipe (class-validator DTOs)
       → Controller → Service → Prisma
```

### 2.4 الـ Domain Modules (26 وحدة)

| # | الوحدة | المسار | الوظيفة |
|---|--------|--------|---------|
| 1 | **Auth** | `domains/auth/` | تسجيل، دخول، OTP، 2FA، impersonation، refresh tokens |
| 2 | **Workspaces** | `domains/workspaces/` | مساحات عمل (فروع)، أعضاء، أدوار، دعوات |
| 3 | **Screens** | `domains/screens/` | شاشات، pairing، remote commands، active content |
| 4 | **Media** | `domains/media/` | رفع، تخزين، EXIF stripping، file hash، expiry |
| 5 | **Playlists** | `domains/playlists/` | قوائم تشغيل، items، drag reorder، clone |
| 6 | **Canvases** | `domains/canvases/` | تصميم بصري (Studio)، version history، restore |
| 7 | **Schedules** | `domains/schedules/` | جدولة، recurrence، overlaps، holidays |
| 8 | **Campaigns** | `domains/campaigns/` | حملات، lifecycle (draft→publish→end)، approval |
| 9 | **Subscriptions** | `domains/subscriptions/` | خطط، trial، overage، seat limits |
| 10 | **Stripe** | `domains/stripe/` | Stripe checkout، webhooks، customer portal |
| 11 | **Realtime** | `domains/realtime/` | WebSocket، offline queue، WS throttler |
| 12 | **Player** | `domains/player/` | Player bootstrap، canvas compiled، heartbeat |
| 13 | **Admin** | `domains/admin/` | إدارة عملاء، fleet، staff، stats، settings |
| 14 | **Account** | `domains/account/` | profile، email change، billing، insights |
| 15 | **Webhooks** | `domains/webhooks/` | Stripe + customer webhooks، retry، delivery log |
| 16 | **API Keys** | `domains/api-keys/` | CRUD، SHA-256 hash، scopes، guard |
| 17 | **Onboarding** | `domains/onboarding/` | wizard، demo content seeding |
| 18 | **Islamic** | `domains/islamic/` | أوقات الصلاة، Hijri، Ramadan mode |
| 19 | **Maintenance** | `domains/maintenance/` | cron jobs، expiry purge، grace period downgrade |
| 20 | **Email** | `domains/email/` | queue، templates، retry logic |
| 21 | **Notifications** | `domains/notifications/` | in-app، realtime push، pagination |
| 22 | **Audit Log** | `domains/audit-log/` | audit trail، 90-day retention |
| 23 | **AI** | `domains/ai/` | توليد محتوى (headlines، CTAs، color schemes) |
| 24 | **Analytics** | `domains/analytics/` | screen uptime، PoP، performer rankings |
| 25 | **Bulk Operations** | `domains/bulk-operations/` | batch actions على شاشات/ميديا |
| 26 | **Pairing** | `domains/pairing/` | 6-digit pairing code، advisory locks |

---

## 3. التطبيقات (Applications)

### 3.1 Customer Dashboard (`apps/dashboard`)

| الخاصية | التفاصيل |
|---------|----------|
| **التقنية** | Next.js 15+ (App Router)، SSR، TailwindCSS، Radix UI |
| **المنفذ** | 3000 |
| **المستخدمون** | عملاء المنصة (OWNER، ADMIN، EDITOR، VIEWER) |
| **اللغات** | العربية (RTL) + الإنجليزية (LTR) |
| **التصميم** | ORCA Design System V2 (50+ ملف مواصفات) |

**الصفحات الرئيسية:**

```
/[locale]/
├── (auth)/
│   ├── login              — دخول مع 2FA
│   ├── register           — تسجيل + OTP
│   ├── forgot-password    — استعادة كلمة المرور
│   ├── invite             — قبول دعوة فريق
│   ├── privacy            — سياسة الخصوصية
│   └── terms              — الشروط والأحكام
├── (shell)/
│   ├── overview           — لوحة المعلومات الرئيسية
│   ├── media              — مكتبة الميديا + folders
│   ├── studio             — محرر الكانفس (Konva)
│   ├── templates          — قوالب جاهزة (10 قوالب)
│   ├── playlists          — قوائم التشغيل
│   ├── screens            — إدارة الشاشات + pairing
│   ├── schedules          — الجدولة (calendar + list)
│   ├── campaigns          — الحملات
│   ├── analytics          — التحليلات
│   ├── proof-of-play      — تقارير العرض
│   ├── ai-tools           — أدوات AI
│   ├── team               — إدارة الفريق
│   ├── branches           — الفروع (multi-workspace)
│   ├── settings/
│   │   ├── profile        — الملف الشخصي
│   │   ├── billing        — الفواتير + Stripe
│   │   ├── notifications  — تفضيلات الإشعارات
│   │   └── api-docs       — API keys + webhooks
│   ├── help               — المساعدة
│   └── admin/             — لوحة الأدمن (Super Admin)
│       ├── overview       — نظرة عامة
│       ├── customers      — إدارة العملاء
│       ├── fleet          — الشاشات العالمية
│       ├── staff          — إدارة الموظفين
│       ├── stats          — إحصائيات
│       ├── logs           — سجلات التدقيق
│       ├── settings       — إعدادات المنصة
│       ├── users          — إدارة المستخدمين
│       └── billing        — الفواتير
```

### 3.2 Platform Control Panel (`apps/control-panel`)

| الخاصية | التفاصيل |
|---------|----------|
| **التقنية** | Next.js (مستقل عن Dashboard) |
| **المنفذ** | 3003 |
| **المستخدمون** | موظفو المنصة (SUPER_ADMIN، SUPPORT_SPECIALIST، BILLING_MANAGER) |
| **الوظيفة** | إدارة العملاء، الـ fleet العالمي، الإحصائيات، الإعدادات |
| **المستقبل** | JWT audience claims، CORS منفصل، deployment مستقل |

### 3.3 Player App (`apps/player`)

| الخاصية | التفاصيل |
|---------|----------|
| **التقنية** | Next.js (lightweight) |
| **المنفذ** | 3001 |
| **الوضع** | Kiosk mode (6-digit pairing) + JWT mode |
| **الوظائف** | Playback، heartbeat، offline cache، HUD، ticker، remote commands |

**دورة حياة الـ Player:**

```
Boot → Check persisted secret
  ├── No secret → Pairing mode (6-digit code)
  │     → Poll every 2s → Paired → Bootstrap
  └── Has secret → Bootstrap
       → Fetch playlist + media
       → Playback (Canvas Konva + media rotation)
       → Heartbeat every 30s (WebSocket)
       → Offline cache (localStorage snapshot)
       → Realtime updates (Socket.IO)
       → Remote commands (refresh/restart)
       → HUD (clock + ticker + online status)
```

### 3.4 Marketing Site (`apps/marketing`)

| الخاصية | التفاصيل |
|---------|----------|
| **التقنية** | Next.js |
| **المنفذ** | 3010 |
| **الحالة** | محتوى أساسي (hero، features، pricing) — يحتاج تطوير كامل |
| **المستقبل** | 3D landing page (Three.js)، testimonials، SEO، blog |

---

## 4. نطاق الـ Backend الكامل

### 4.1 الميزات المنفذة (Production-Ready)

| المجال | الميزة | الحالة |
|--------|--------|--------|
| **Auth** | Register + OTP verification | ✅ |
| | Login + 2FA (TOTP، encrypted) | ✅ |
| | Refresh token rotation + reuse detection | ✅ |
| | Password reset + complexity validation | ✅ |
| | Impersonation (Super Admin → Customer) | ✅ |
| | Session revocation on role change | ✅ |
| **Workspaces** | CRUD + members + roles (OWNER/ADMIN/EDITOR/VIEWER) | ✅ |
| | Invites (email + token + accept/cancel/resend) | ✅ |
| | Workspace pause enforcement | ✅ |
| | Seat limit enforcement | ✅ |
| | Multi-workspace (branches) | ✅ |
| | Account members (cross-workspace) | ✅ |
| **Screens** | CRUD + pairing (6-digit code + advisory locks) | ✅ |
| | Remote commands (refresh/restart/identify) | ✅ |
| | Override (playlist + duration) | ✅ |
| | Active content endpoint | ✅ |
| | Analytics per screen | ✅ |
| | Player version tracking | ✅ |
| **Media** | Upload (multi-file، parallel) | ✅ |
| | S3 + Local storage abstraction | ✅ |
| | Signed URLs | ✅ |
| | EXIF stripping (sharp) | ✅ |
| | SHA-256 file hash | ✅ |
| | Folders + stats | ✅ |
| | Auto-expiry + purge cron | ✅ |
| | Storage quota enforcement | ✅ |
| **Playlists** | CRUD + items + drag reorder | ✅ |
| | Duplicate + clone-to-workspace | ✅ |
| | Preview mode (frontend) | ✅ |
| **Canvases** | CRUD + Studio (Konva) | ✅ |
| | Version history + restore | ✅ |
| | 10 pre-built templates | ✅ |
| **Schedules** | CRUD + recurrence (DAILY/WEEKLY/MONTHLY/ONCE) | ✅ |
| | Overlap detection | ✅ |
| | Holiday schedules | ✅ |
| | Calendar view (day/week/month) | ✅ |
| **Campaigns** | CRUD + lifecycle (draft→submit→approve→publish→pause→end) | ✅ |
| | Campaign-to-screen push | ✅ |
| **Subscriptions** | Plans (FREE/STARTER/PRO/ENTERPRISE) | ✅ |
| | Trial system (14 days) | ✅ |
| | Stripe checkout + webhooks | ✅ |
| | Dunning management | ✅ |
| | Invoice PDF download | ✅ |
| | Mock-plan (dev/test) | ✅ |
| **Realtime** | WebSocket + Redis adapter | ✅ |
| | WS event validation (DTOs) | ✅ |
| | WS rate limiting | ✅ |
| | Offline event queue | ✅ |
| **Notifications** | In-app + realtime push | ✅ |
| | Pagination + mark read | ✅ |
| **Admin** | Customers + workspaces + fleet + staff + stats + logs + settings | ✅ |
| | User impersonation + audit trail | ✅ |
| | IP allowlist for admin | ✅ |
| **API Keys** | CRUD + SHA-256 hash + scopes + guard | ✅ |
| **Webhooks** | Stripe + customer webhooks | ✅ |
| | Retry policy (3 retries، exponential backoff) | ✅ |
| | Delivery log | ✅ |
| **Islamic** | Prayer times + Hijri calendar + Ramadan mode | ✅ |
| **AI** | Content generation (headlines، CTAs، colors) | ✅ |
| **Analytics** | Screen uptime، PoP، performer rankings | ✅ |
| **Security** | Helmet + CORS + CSRF + Rate limiting | ✅ |
| | Audit log (90-day retention) | ✅ |
| | Security event logging | ✅ |
| | Admin IP guard | ✅ |
| | Two-factor required guard (privilege escalation) | ✅ |
| **Infrastructure** | Graceful shutdown (SIGTERM) | ✅ |
| | Health checks (Prisma + Redis) | ✅ |
| | DB connection pool tuning | ✅ |
| | Structured logging (JSON) | ✅ |
| | Request ID (UUID per request) | ✅ |
| | Metrics endpoint (IP/basic-auth protected) | ✅ |
| | Swagger API docs | ✅ |
| | Docker multi-stage build | ✅ |
| | CI pipeline (typecheck + lint + test + audit) | ✅ |

### 4.2 الفجوات المتبقية في الـ Backend

| # | الفجوة | الأولوية | الجهد | الحالة |
|---|--------|----------|-------|--------|
| 1 | Integration tests (Testcontainers) | P1 | كبير | مؤجل |
| 2 | E2E test suite expansion | P1 | كبير | مؤجل |
| 3 | Coverage threshold raise (→70%) | P2 | متوسط | مؤجل |
| 4 | Load testing (k6/Artillery) | P3 | متوسط | مؤجل |
| 5 | Security penetration test | P3 | متوسط | مؤجل |
| 6 | WAF / DDoS protection | P3 | متوسط | بنية تحتية |
| 7 | Secret rotation strategy | P3 | متوسط | مؤجل |
| 8 | API versioning strategy | P3 | متوسط | مؤجل |
| 9 | Idempotency keys | P3 | متوسط | مؤجل |
| 10 | Player OTA update mechanism | P3 | كبير | مؤجل |
| 11 | Virus scanning (ClamAV) | P2 | متوسط | مؤجل |
| 12 | Circular dependency Auth ↔ Workspaces | P2 | متوسط | مؤجل |

### 4.3 إحصائيات الـ Backend

| المؤشر | القيمة |
|--------|--------|
| Domain Modules | 26 |
| Test Suites | 66 |
| Tests | 623 |
| TypeScript Errors | 0 |
| Production Readiness | 81% (26/32) |
| Gap Closure | 64% (52/81) |
| CI Pipeline | نشط (typecheck + lint + test + build + i18n + audit) |

---

## 5. نطاق الـ Frontend الكامل

### 5.1 الميزات المنفذة

| المجال | الميزة | الحالة | الامتثال |
|--------|--------|--------|----------|
| **Application Shell** | Crystal Shell (sidebar + header + breadcrumbs) | ✅ | ~97% |
| | RTL/LTR switching | ✅ | 100% |
| | Mobile responsive (hamburger + drawer) | ✅ | 100% |
| | Notifications bell (unread count + dropdown) | ✅ | 100% |
| | Mobile more menu (⋮ dropdown) | ✅ | 100% |
| **Auth** | Login + 2FA flow | ✅ | ~95% |
| | Register + OTP | ✅ | ~95% |
| | Forgot password | ✅ | ~95% |
| | Invite accept page | ✅ | ~95% |
| | Error pages (404، runtime error) | ✅ | ~95% |
| **Overview** | Stats cards + branch cards + quick actions | ✅ | ~95% |
| **Media** | Library + folders + multi-file upload | ✅ | ~90% |
| | Storage indicator (progress bar) | ✅ | 100% |
| | Expiry date picker + badges | ✅ | 100% |
| | Search + filter | ✅ | ~90% |
| **Studio** | Konva canvas editor (text، shapes، images، tickers) | ✅ | ~89% |
| | 10 pre-built templates + preview | ✅ | ~98% |
| | Version history (server + local snapshots) | ✅ | ~95% |
| | Auto-save (3s debounce) | ✅ | 100% |
| | Tablet responsive | ✅ | 100% |
| **Playlists** | CRUD + drag reorder + durations | ✅ | ~90% |
| | Preview mode (full-screen overlay) | ✅ | ~95% |
| | Clone to workspace | ✅ | ~90% |
| **Screens** | Fleet list + status badges + pairing | ✅ | ~90% |
| | Quick edit panel | ✅ | ~90% |
| | Active content preview | ✅ | ~90% |
| | Bulk actions | ✅ | ~85% |
| | Screen detail page | ✅ | ~85% |
| **Schedules** | Calendar (day/week/month) + list views | ✅ | ~90% |
| | Recurrence + overlap detection | ✅ | ~90% |
| | Override with custom duration | ✅ | ~90% |
| | Keyboard navigation in calendar | ✅ | ~90% |
| **Campaigns** | List + create + lifecycle | ✅ | ~85% |
| **Analytics** | Metric cards + trend charts + performers | ✅ | ~90% |
| | Bottom performers + trend indicators | ✅ | ~90% |
| | useReducedMotion | ✅ | 100% |
| **Team** | Members list + invites + role change + remove | ✅ | ~95% |
| | Account members section | ✅ | ~95% |
| | Cancel/resend invite | ✅ | ~95% |
| **Billing** | Plan selection + comparison table | ✅ | ~90% |
| | Payment history + invoice PDF | ✅ | ~90% |
| | Stripe portal link | ✅ | 100% |
| **API Docs** | API keys management (create/revoke) | ✅ | ~90% |
| | Webhooks management (create/test/delete) | ✅ | ~90% |
| **Settings** | Profile + email change | ✅ | ~90% |
| | Workspace settings | ✅ | ~85% |
| **Islamic** | Prayer times + Hijri calendar + Ramadan mode | ✅ | ~85% |
| **AI Tools** | Content generation UI | ✅ | ~85% |
| **Admin** | Full admin panel (customers، fleet، staff، stats، logs، settings) | ✅ | ~90% |
| **i18n** | EN + AR translations | ✅ | ~95% |

### 5.2 الفجوات المتبقية في الـ Frontend

| # | الفجوة | الأولوية | المرحلة |
|---|--------|----------|---------|
| 1 | Global Search (Cmd+K) | P2 | Phase 10 |
| 2 | Multi-zone layouts في Studio | P1 | Phase 10 |
| 3 | Live screenshot من الشاشة | P2 | Phase 10 |
| 4 | Map view للشاشات | P2 | Phase 10 |
| 5 | 2FA setup UI (QR code + backup codes) | P1 | Phase 10 |
| 6 | Onboarding wizard متقدم (8 خطوات) | P1 | Phase 8 |
| 7 | Contextual help tooltips | P2 | Phase 8 |
| 8 | Content approval workflow UI | P2 | Phase 5 |
| 9 | Nested playlists | P2 | Phase 5 |
| 10 | OTA updates UI | P3 | Phase 10 |
| 11 | Keyboard shortcuts في Studio | P2 | Phase 10 |
| 12 | Marketing landing page كامل | P0 | Phase 11 |

---

## 6. رحلة العميل الكاملة (Customer Journey)

### 6.1 Discovery → Signup → Onboarding

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. وصول      │───▶│  2. تسجيل     │───▶│  3. OTP       │───▶│  4. إنشاء     │
│  للموقع       │    │  (email +     │    │  (6 أرقام)    │    │  workspace   │
│  (marketing)  │    │   password)   │    │               │    │  (اسم فقط)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
                    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                    │  7. بدء       │◀──│  6. اختيار    │◀──│  5. Onboard   │
                    │  التشغيل      │    │  المحتوى      │    │  wizard      │
                    │  اليومي       │    │  (demo/fresh) │    │  (2 خطوات)   │
                    └──────────────┘    └──────────────┘    └──────────────┘
```

### 6.2 Daily Operations (المستخدم العادي)

| # | الخطوة | الصفحة | الحالة |
|---|--------|--------|--------|
| 1 | Login (email + password + 2FA) | `/login` | ✅ |
| 2 | يرى Overview (stats + quick actions) | `/overview` | ✅ |
| 3 | يرفع ملف (drag & drop multi-file) | `/media` | ✅ |
| 4 | ينشئ Canvas (Studio editor) | `/studio` | ✅ |
| 5 | يختار قالب جاهز (10 قوالب) | `/templates` | ✅ |
| 6 | ينشئ Playlist (drag reorder + durations) | `/playlists` | ✅ |
| 7 | يشاهد Preview للـ playlist | `/playlists` | ✅ |
| 8 | يسجل شاشة (6-digit pairing code) | `/screens` | ✅ |
| 9 | يربط Playlist بشاشة | `/screens` | ✅ |
| 10 | ينشئ Schedule (calendar + recurrence) | `/schedules` | ✅ |
| 11 | Override شاشة (مدة مخصصة) | `/schedules` | ✅ |
| 12 | يدعو عضو فريق (email + role) | `/team` | ✅ |
| 13 | يغير دور عضو / يزيل عضو | `/team` | ✅ |
| 14 | ينشئ Campaign (lifecycle كامل) | `/campaigns` | ✅ |
| 15 | يرى Analytics (uptime، performers) | `/analytics` | ✅ |
| 16 | يولد محتوى بالـ AI | `/ai-tools` | ✅ |
| 17 | يعدل ملفه الشخصي | `/settings/profile` | ✅ |
| 18 | يرى الفواتير + يحمّل PDF | `/settings/billing` | ✅ |
| 19 | يدير API keys + webhooks | `/api-docs` | ✅ |

### 6.3 Multi-Branch (الفروع)

| # | الخطوة | الحالة |
|---|--------|--------|
| 1 | ينشئ workspace ثاني (branch) | ✅ |
| 2 | يدخل فرع (branch detail) | ✅ |
| 3 | يستنسخ playlist لفرع آخر | ✅ |
| 4 | ينشئ group داخل فرع | ✅ |
| 5 | Workspace switcher (تبديل سريع) | ✅ |

### 6.4 Admin Journey (Platform Staff)

| # | الخطوة | الصفحة | الحالة |
|---|--------|--------|--------|
| A1 | Admin Overview (revenue، screens، users) | `/admin` | ✅ |
| A2 | إدارة العملاء (search + filter) | `/admin/customers` | ✅ |
| A3 | تفاصيل عميل (workspaces + subscription) | `/admin/customers/[id]` | ✅ |
| A4 | Fleet عالمي (كل الشاشات) | `/admin/fleet` | ✅ |
| A5 | إدارة الموظفين (create + role) | `/admin/staff` | ✅ |
| A6 | الإحصائيات (revenue + usage) | `/admin/stats` | ✅ |
| A7 | سجلات التدقيق | `/admin/logs` | ✅ |
| A8 | إعدادات المنصة + branding | `/admin/settings` | ✅ |
| A9 | Impersonation (Super Admin) | from user list | ✅ |

### 6.5 Player Journey (Kiosk / Screen)

| # | الخطوة | الحالة |
|---|--------|--------|
| P1 | Boot → check persisted secret | ✅ |
| P2 | Pairing mode (6-digit code) | ✅ |
| P3 | Poll → Paired → Bootstrap | ✅ |
| P4 | Playback (playlist engine) | ✅ |
| P5 | Heartbeat every 30s | ✅ |
| P6 | Offline cache (localStorage) | ✅ |
| P7 | HUD (clock + ticker + status) | ✅ |
| P8 | Remote commands (refresh/restart) | ✅ |
| P9 | Realtime updates (Socket.IO) | ✅ |

### 6.6 Cancellation / Downgrade

| # | الخطوة | الحالة |
|---|--------|--------|
| 1 | يفتح Stripe portal | ✅ |
| 2 | يلغي subscription | ✅ |
| 3 | Post-cancellation flow | ⚠️ يحتاج retention + survey |

---

## 7. نموذج الأعمال والتسعير

### 7.1 خطط الاشتراك

| الميزة | FREE | STARTER | PRO | ENTERPRISE |
|--------|------|---------|-----|------------|
| **الشاشات** | 3 | 10 | 50 | غير محدود |
| **التخزين** | 1GB | 5GB | 25GB | مخصص |
| **API calls/شهر** | 1,000 | 10,000 | 100,000 | مخصص |
| **Proof of Play** | ❌ | ✅ (30 يوم) | ✅ (سنة) | ✅ (مخصص) |
| **Campaigns** | ❌ | ✅ | ✅ | ✅ |
| **أعضاء الفريق** | 1 | 3 | 10 | غير محدود |
| **Webhooks** | ❌ | ✅ | ✅ | ✅ |
| **API Keys** | ❌ | 1 | 5 | غير محدود |
| **Custom Branding** | ❌ | ❌ | ❌ | ✅ |
| **SSO** | ❌ | ❌ | ❌ | ✅ |
| **SLA** | — | 99.5% | 99.9% | 99.99% |
| **الدعم** | Email | Email + Chat | Priority | Dedicated |
| **السعر/شهر** | $0 | $29 | $99 | مخصص |
| **Trial** | — | 14 يوم | 14 يوم | 30 يوم |

### 7.2 التسعير الإقليمي

| المنطقة | العملة | STARTER | PRO | ملاحظات |
|---------|--------|---------|-----|---------|
| عالمي | USD | $29 | $99 | افتراضي |
| الشرق الأوسط | SAR | 109 | 371 | شامل VAT |
| الشرق الأوسط | AED | 107 | 364 | شامل VAT |
| أوروبا | EUR | €27 | €92 | غير شامل VAT |
| آسيا | USD | $19 | $69 | خصم إقليمي |

### 7.3 مصادر الدخل

| المصدر | الوصف | التسعير | الفئة المستهدفة |
|--------|--------|---------|-----------------|
| **اشتراك** | شهري/سنوي per workspace | $0–$99/شهر | كل العملاء |
| **Overage** | شاشات إضافية beyond plan | $5/شاشة/شهر | العملاء المتنامين |
| **Enterprise** | عقود مخصصة مع SLA | $500–$10,000/شهر | المنظمات الكبيرة |
| **White-Label** | تسعير الموزعين مع branding | $200–$5,000/شهر | الوكالات، الموزعين |
| **Marketplace** | عمولة على تطبيقات الطرف الثالث | 30% من سعر التطبيق | المطورين |
| **API** | استخدام API (مستقبلاً) | $0.01 per 1,000 calls | المطورين |
| **Professional Services** | تطوير مخصص، onboarding | $150/ساعة | Enterprise |

### 7.4 دورة حياة العميل

```
LEAD → TRIAL → ACTIVE (Paid) → AT_RISK → CHURNED → REACTIVATED
                        │                                    │
                        └── ACTIVE (growing) ────────────────┘
                             (شاشات أكثر، خطط أعلى)
```

### 7.5 أتمتة دورة الحياة

| Trigger | الشرط | الإجراء |
|---------|-------|---------|
| `trial.started` | بداية trial | Welcome email + onboarding |
| `trial.day_7` | 7 أيام | "Getting started" email |
| `trial.day_12` | 12 يوم | "Upgrade now" email |
| `trial.expired` | انتهاء trial | Downgrade to FREE + email |
| `subscription.cancelled` | إلغاء | Exit survey + retention |
| `usage.declining` | استخدام ↓50% | Flag as AT_RISK + notify CSM |
| `payment.failed` | فشل دفع | Dunning email + retry |
| `screen.offline_24h` | شاشة offline >24h | "Your screen is offline" email |
| `storage.80%` | تخزين 80% | "Upgrade for more storage" email |

---

## 8. الاستراتيجية التسويقية

### 8.1 السوق المستهدف

**السوق الأساسي:** الشرق الأوسط (السعودية، الإمارات، مصر، الكويت، قطر)
**السوق الثانوي:** أسيا، أوروبا، أمريكا الشمالية

**شرائح العملاء:**

| الشريحة | الحجم | الاحتياج | الميزة التنافسية |
|---------|-------|----------|-----------------|
| **مطاعم** | كبير | قوائم طعام رقمية، promotions | قوالب جاهزة + scheduling |
| **متاجر تجزئة** | كبير | عروض، منتجات، branding | Multi-branch + campaigns |
| **مساجد** | متوسط | أوقات الصلاة، Hijri، رمضان | ميزات إسلامية فريدة |
| **مؤسسات حكومية** | متوسط | إعلانات، wayfinding، أمن | On-premise + SSO + SLA |
| **شركات (Corporate)** | متوسط | لوبيات، اجتماعات، KPIs | Analytics + API + webhooks |
| **تعليم** | متوسط | إعلانات مدرسية، wayfinding | Templates + scheduling |
| **رعاية صحية** | صغير | قوائم انتظار، توعية | Scheduling + offline |

### 8.2 الميزات التنافسية الفريدة (USP)

| # | الميزة | لماذا فريدة؟ |
|---|--------|-------------|
| 1 | **دعم عربي كامل (RTL)** | كل المنافسين يدعمون العربية بشكل ضعيف — نحن bilingual by design |
| 2 | **ميزات إسلامية** | أوقات الصلاة، Hijri، رمضان — لا يوجد منافس يقدم هذا |
| 3 | **AI لتوليد المحتوى** | فقط OptiSigns يقدمه — نقدمه مع دعم العربية |
| 4 | **Multi-workspace (فروع)** | إدارة فروع متعددة من حساب واحد — تنافسي |
| 5 | **On-premise licensing** | للحكومات والشركات المعزولة — لا يقدمه معظم المنافسين |
| 6 | **White-label program** | للموزعين والوكالات — مصدر دخل إضافي |

### 8.3 قمع التحويل (Conversion Funnel)

```
┌─────────────────────────────────────────────────────────────┐
│                    AWARENESS                                  │
│  Google Ads · SEO · Social Media · Content Marketing          │
│  Target: 10,000 visitors/month                                │
└──────────────────────────┬──────────────────────────────────┘
                           │ 3% click-through
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTEREST                                   │
│  Landing Page (hero + features + pricing + testimonials)      │
│  Target: 3,000 visitors/month                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ 15% sign-up rate
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONSIDERATION                               │
│  Free Plan (3 screens) or 14-day Trial (PRO)                 │
│  Onboarding wizard + demo content                             │
│  Target: 450 trials/month                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ 25% conversion
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONVERSION                                  │
│  Paid Subscription (STARTER $29 or PRO $99)                  │
│  Target: 112 new customers/month                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    RETENTION                                   │
│  In-app notifications · Email lifecycle · Analytics value     │
│  Target: <8% churn (Year 1)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 قنوات التسويق

| القناة | الاستراتيجية | الميزانية (شهرياً) | KPI |
|--------|-------------|-------------------|-----|
| **Google Ads** | "digital signage Saudi Arabia"، "شاشات رقمية" | $2,000 | CPL < $20 |
| **SEO** | Blog (digital signage tips، Ramadan content ideas) | $1,000 | 10k organic visits |
| **LinkedIn** | B2B content، case studies، white papers | $500 | 50 leads/month |
| **Social Media** | Instagram/Twitter (templates showcase، before/after) | $500 | 5k followers |
| **Partnerships** |系统集成商، AV installers، IT companies | Revenue share | 10 partners |
| **Referral** | "Refer a customer، get 1 month free" | $500 | 5 referrals/month |
| **Events** | Digital signage expos، tech conferences | $2,000 | 50 leads/event |

### 8.5 محتوى التسويق

| المحتوى | الفئة | اللغة | القناة |
|---------|--------|-------|--------|
| **Landing Page** | Hero + Features + Pricing + Testimonials | EN + AR | Website |
| **Blog Articles** | "How to use digital signage in Ramadan" | EN + AR | SEO |
| **Case Studies** | "How [Restaurant Chain] improved sales 30%" | EN + AR | LinkedIn |
| **Video Demos** | 2-min product walkthrough | EN + AR | YouTube + Landing |
| **Templates Gallery** | Free templates as lead magnet | EN + AR | Landing + Email |
| **Comparison Pages** | "Smart Screen vs ScreenCloud" | EN | SEO |
| **Ramadan Guide** | "Digital signage best practices for Ramadan" | AR | SEO + Email |

---

## 9. مقارنة تنافسية

| الميزة | Smart Screen | ScreenCloud | Yodeck | OptiSigns |
|--------|:---:|:---:|:---:|:---:|
| **Templates** | 10 ✅ | 150+ | 400+ | 4000+ |
| **Built-in Designer** | ✅ Konva Studio | ✅ Studio+Canvas | ✅ Layout Editor | ✅ Designer 2.0 |
| **Multi-zone Layouts** | ⚠️ قريباً | ✅ | ✅ | ✅ (Pro) |
| **App Integrations** | ❌ | ✅ 80+ | ✅ 50+ | ✅ 160+ |
| **AI Content** | ✅ | ❌ | ❌ | ✅ |
| **Team Management** | ✅ RBAC + invites | ✅ RBAC + approval | ✅ Simple | ✅ Simple |
| **Content Approval** | ⚠️ قريباً | ✅ | ❌ | ❌ |
| **Analytics** | ✅ | ✅ | ✅ Basic | ✅ Basic |
| **Scheduling** | ✅ Calendar | ✅ Advanced | ✅ Advanced | ✅ Advanced |
| **Remote Management** | ✅ | ✅ Full | ✅ Full | ✅ Full |
| **Offline Playback** | ✅ | ✅ | ✅ | ✅ |
| **Mobile App** | ❌ قريباً | ✅ | ❌ | ✅ |
| **Arabic Support (RTL)** | ✅ Native | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| **Islamic Features** | ✅ فريدة | ❌ | ❌ | ❌ |
| **Free Tier** | ✅ 3 screens | ❌ (trial) | ✅ 1 screen | ✅ 1 screen |
| **Onboarding Wizard** | ✅ | ✅ | ✅ | ✅ |
| **Marketing Site** | ⚠️ أساسي | ✅ Full | ✅ Full | ✅ Full |
| **On-Premise** | ✅ | ❌ | ❌ | ❌ |
| **White-Label** | ✅ | ❌ | ❌ | ❌ |
| **Pricing (Pro)** | $99 | $90 | $99 | $99 |

**الخلاصة:** Smart Screen يتفوق في **الدعم العربي، الميزات الإسلامية، AI، On-premise، White-label**. يحتاج تحسين في **Templates، App integrations، Multi-zone، Mobile app**.

---

## 10. خارطة الطريق التنفيذية

### المرحلة الحالية: ما تم إنجازه

| المرحلة | الوصف | الحالة |
|---------|--------|--------|
| **Backend Phase 1-10** | Foundation → Production Readiness | ✅ 81% |
| **Frontend Phase 1** | Application Shell | ✅ ~97% |
| **Frontend Phase 2** | Team Management | ✅ ~95% |
| **Frontend Phase 4** | Content & Templates | ✅ ~98% |
| **Frontend Phase 7** | Billing & API | ✅ ~90% |
| **Frontend Scheduling** | Calendar + Analytics fixes | ✅ ~90% |
| **Frontend Auth** | Login + Error pages | ✅ ~95% |
| **Frontend Overview** | Dashboard + quick actions | ✅ ~95% |
| **Frontend Screens** | Fleet + detail + bulk | ✅ ~90% |

### المراحل المتبقية (مرتبة حسب الأولوية)

#### Phase 3: Screen Improvements + DD-02 (6-8 ساعات)
- **DD-02:** إزالة Studio من الـ sidebar → route مستقل + full-screen
- Screen detail enhancement (remote commands panel، health metrics)
- Display groups hierarchical support
- **الأولوية:** متوسطة

#### Phase 5: Scheduling & Campaigns (8-10 ساعات)
- Campaign approval workflow UI كامل
- Schedule overlaps visualization
- Nested playlists support
- **الأولوية:** متوسطة

#### Phase 6: AI & Analytics (10-12 ساعة)
- AI content generation حقيقي (OpenAI/Anthropic)
- AI suggestion history
- Proof-of-Play reports enhancement
- Device metrics charts
- Crash reports UI
- **الأولوية:** متوسطة

#### Phase 8: Advanced Onboarding (8-10 ساعات)
- Onboarding wizard متقدم (8 خطوات مع progress tracking)
- Guided onboarding steps
- Contextual help tooltips
- Onboarding emails (day 1/3/7)
- **الأولوية:** متوسطة

#### Phase 9: Arabic Market Features (10-12 ساعة)
- Prayer times widget (player + dashboard)
- Hijri calendar widget
- Prayer time scheduling (auto-pause during prayer)
- Ramadan mode (auto-switch playlists)
- **الأولوية:** عالية (ميزة تنافسية فريدة)

#### Phase 10: Advanced Tech (12-15 ساعة)
- Global Search (Cmd+K)
- Live screenshot من الشاشة
- Map view للشاشات
- OTA updates UI
- Multi-zone layouts في Studio
- 2FA/MFA setup UI
- Keyboard shortcuts في Studio
- **الأولوية:** متوسطة

#### Phase 11: Landing Page + Player (15-20 ساعة)
- 3D Landing Page (Three.js) — hero، features، pricing، testimonials
- Android Player (Capacitor) — wake lock، boot startup، kiosk mode
- Player app enhancements — video wall sync، ticker UI، crash storage
- **الأولوية:** حرجة (P0 — conversion funnel)

### الجدول الزمني التقديري

| المرحلة | المدة | الترتيب |
|---------|------|---------|
| Phase 3 (Screens + DD-02) | 1-2 أسبوع | يمكن البدء فوراً |
| Phase 5 (Scheduling & Campaigns) | 1-2 أسبوع | بعد Phase 3 |
| Phase 9 (Arabic Features) | 1-2 أسبوع | يمكن بالتوازي |
| Phase 6 (AI & Analytics) | 2 أسبوع | بعد Phase 5 |
| Phase 8 (Onboarding) | 1-2 أسبوع | بعد Phase 6 |
| Phase 10 (Advanced Tech) | 2-3 أسبوع | بعد Phase 8 |
| Phase 11 (Landing + Player) | 3-4 أسبوع | بعد اكتمال كل المراحل |
| **الإجمالي** | **12-18 أسبوع** | |

---

## 11. حالة المشروع الحالية

### 11.1 النقاط القوية

- **Backend قوي:** 26 domain module، 623 test، 0 TypeScript errors، production-ready 81%
- **Architecture sound:** Modular monolith مع DDD، clean boundaries، defense-in-depth
- **i18n native:** Bilingual (EN + AR) مع RTL في كل صفحة
- **Security hardened:** JWT + 2FA + CSRF + rate limiting + audit log + IP allowlist
- **Realtime:** WebSocket + Redis adapter + offline queue + WS throttling
- **Docker:** 8 containers مع health checks، multi-stage builds، non-root user
- **CI/CD:** GitHub Actions (typecheck + lint + test + build + i18n + dependency audit)
- **Documentation:** 50+ ملف مواصفات (screen specs، UX blueprint، design system)

### 11.2 النقاط التي تحتاج تحسين

- **Marketing page:** محتوى أساسي فقط — يحتاج landing page احترافي
- **Templates:** 10 قوالب (المنافسين 150-4000+) — يحتاج توسيع
- **Multi-zone layouts:** غير متوفر (المنافسين كلهم يقدمونه)
- **Mobile app:** غير متوفر (ScreenCloud و OptiSigns يقدمونه)
- **App integrations:** غير متوفر (المنافسين 50-160+)
- **Test coverage:** 37-45% (الهدف 70%)
- **Load testing:** غير منفذ
- **Penetration testing:** غير منفذ

### 11.3 الإحصائيات الحالية

| المؤشر | القيمة |
|--------|--------|
| Backend Domain Modules | 26 |
| Backend Test Suites | 66 |
| Backend Tests | 623 |
| Frontend Features | 23+ مجال |
| Frontend Pages | 28+ صفحة |
| Docker Services | 8 |
| Design System Files | 50+ |
| Documentation Files | 80+ |
| TypeScript Errors | 0 |
| i18n Languages | 2 (EN + AR) |

---

## 12. المخاطر والتخفيف

| # | الخطر | الشدة | الاحتمالية | التخفيف |
|---|--------|------|-----------|---------|
| 1 | **Marketing page ضعيف** | عالية | عالية | Phase 11 — landing page احترافي |
| 2 | **Templates قليلة** | متوسطة | عالية | توسيع المكتبة تدريجياً |
| 3 | **لا mobile app** | متوسطة | متوسطة | Capacitor wrapper (Phase 11) |
| 4 | **Test coverage منخفض** | متوسطة | عالية | Phase 8.1-8.3 (Testcontainers + E2E + coverage) |
| 5 | **لا load testing** | متوسطة | متوسطة | k6/Artillery scripts |
| 6 | **Circular dependency** | منخفضة | عالية | مؤجل — لا يؤثر على الإنتاج |
| 7 | **Admin settings في file** | متوسطة | منخفضة | Migration إلى PostgreSQL |
| 8 | **لا WAF/DDoS** | متوسطة | منخفضة | Cloudflare/AWS WAF |
| 9 | **منافسين كبار** | عالية | عالية | التميز في السوق العربي + ميزات فريدة |
| 10 | **اعتماد على Stripe** | منخفضة | منخفضة | إضافة بوابة دفع محلية (مستقبلاً) |

---

## 13. المؤشرات الرئيسية (KPIs)

### 13.1 مؤشرات المنتج

| المؤشر | الهدف (سنة 1) | الهدف (سنة 3) |
|--------|---------------|---------------|
| عملاء نشطين | 100 | 1,000 |
| شاشات نشطة | 500 | 10,000 |
| متوسط الشاشات/عميل | 5 | 10 |
| Template usage | 40% من العملاء | 60% |
| AI usage | 20% من عملاء PRO | 50% |
| Mobile app usage | — | 30% |

### 13.2 مؤشرات الأعمال

| المؤشر | الهدف (سنة 1) | الهدف (سنة 3) | الهدف (سنة 5) |
|--------|---------------|---------------|---------------|
| MRR | $10K | $100K | $500K |
| ARPU | $100/شهر | $100/شهر | $100/شهر |
| Trial Conversion | 15% | 25% | 30% |
| Churn Rate | <8% | <5% | <3% |
| LTV | $1,200 | $2,400 | $4,000 |
| CAC | $200 | $150 | $100 |

### 13.3 مؤشرات تقنية

| المؤشر | الهدف |
|--------|--------|
| Uptime | 99.9% (PRO) / 99.99% (Enterprise) |
| API Response Time | <200ms (P95) |
| WebSocket Latency | <100ms |
| Test Coverage | 70% |
| Deploy Frequency | أسبوعياً |
| MTTR (Mean Time to Recovery) | <30 دقيقة |

---

## الخلاصة

Smart Screen هو منصة **Digital Signage SaaS** قوية تقنياً مع **backend production-ready (81%)** و **frontend شامل (28+ صفحة)**. المنصة تتميز بـ:

1. **قاعدة تقنية صلبة:** 26 domain module، 623 test، Docker، CI/CD
2. **ميزات تنافسية فريدة:** دعم عربي كامل، ميزات إسلامية، AI، on-premise، white-label
3. **نموذج أعمال واضح:** 4 خطط + overage + enterprise + white-label + marketplace
4. **استراتيجية تسويقية محددة:** السوق العربي أولاً، ثم التوسع العالمي

**الخطوات الحرجة التالية:**
1. إكمال Phase 3 (Screens + DD-02)
2. إكمال Phase 9 (Arabic Features — ميزة تنافسية فريدة)
3. إكمال Phase 11 (Landing Page — conversion funnel)
4. رفع test coverage إلى 70%
5. إجراء load testing + penetration testing

> **الهدف النهائي:** منصة Digital Signage الرائدة في الشرق الأوسط بحلول 2028، مع توسع عالمي بعد إثبات التفوق في السوق الإقليمي.
