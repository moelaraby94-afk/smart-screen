# 00 — Master Blueprint

> **Document Type:** SaaS Platform Architecture Blueprint
> **Status:** Architecture Design — Pre-Implementation
> **Author:** Principal Software Architect
> **Date:** July 2026
> **Horizon:** 10-year platform lifecycle

---

## 1. Executive Summary

Cloud-Screen is a digital signage SaaS platform. The current architecture is a monolithic application where platform administration and customer workspace functionality share a single frontend, a single backend process, and a single authentication context. This blueprint redesigns the platform into a **true enterprise-grade SaaS Operating System** with two completely independent products, a comprehensive platform domain, and a scalable architecture designed to support 100,000 screens across 10,000+ customers.

This is not an admin panel separation. This is a platform redesign.

---

## 2. The Two Products

### Product A: Cloud-Screen Control Panel

```
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUD-SCREEN CONTROL PANEL                      │
│                                                                  │
│  "The SaaS Operating System"                                    │
│                                                                  │
│  Owner: Platform Owner                                          │
│  Users: Platform Staff (Super Admin, Support, Billing,          │
│         Security, Operations, Developer)                        │
│  Domain: admin.cloudsignage.com                                 │
│  Purpose: Run the SaaS business                                 │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Platform │ │ Tenant   │ │ Billing  │ │ Support  │           │
│  │ Dashboard│ │ Mgmt     │ │ Center   │ │ Center   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Device   │ │ Feature  │ │ Email    │ │ Audit    │           │
│  │ Fleet    │ │ Mgmt     │ │ Center   │ │ Center   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Plans &  │ │ Storage  │ │ API      │ │ Security │           │
│  │ Pricing  │ │ Mgmt     │ │ Mgmt     │ │ Center   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Settings │ │ Branding │ │ Dev      │ │ Auto-    │           │
│  │ & Config │ │ & WL     │ │ Portal   │ │ mation   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

**The Control Panel is the SaaS business operating system.** It manages tenants, subscriptions, billing, devices, features, support, branding, security, and platform configuration. It is NOT a customer-facing application. It is the internal tool that runs the business.

### Product B: Cloud-Screen Customer Workspace

```
┌─────────────────────────────────────────────────────────────────┐
│                CLOUD-SCREEN CUSTOMER WORKSPACE                   │
│                                                                  │
│  "The Digital Signage Studio"                                   │
│                                                                  │
│  Owner: Customer                                                │
│  Users: Customer Owner, Admin, Editor, Viewer                   │
│  Domain: app.cloudsignage.com                                   │
│  Purpose: Manage digital signage content and screens            │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Overview │ │ Screens  │ │ Content  │ │ Studio   │           │
│  │ Dashboard│ │ Mgmt     │ │ Library  │ │ Editor   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Schedul- │ │ Campaigns│ │ Analytics│ │ Team     │           │
│  │ ing      │ │          │ │ & Reports│ │ Mgmt     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Settings │ │ Billing  │ │ API Keys │ │ Notifi-  │           │
│  │          │ │ (self)   │ │ & Webhooks│ │ cations  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

**The Customer Workspace is the product the customer pays for.** It manages screens, content, playlists, schedules, campaigns, analytics, and team. The customer NEVER sees platform administration. The customer NEVER feels like they are inside a system administration tool. The customer experience is clean, focused, and self-served.

### Separation Principles

| Principle | Control Panel | Customer Workspace |
|---|---|---|
| **Identity** | Platform staff (internal) | Customer users (external) |
| **Authentication** | `audience: 'platform'` JWT | `audience: 'customer'` JWT |
| **Authorization** | Platform RBAC | Workspace RBAC |
| **Navigation** | Platform modules | Customer modules only |
| **Layout** | ControlPanelShell | CustomerShell |
| **Branding** | Platform branding (internal) | Customer branding (white-label capable) |
| **Deployment** | Independent | Independent |
| **Scaling** | Scaled to staff count (~100) | Scaled to customer count (~10,000+) |
| **Release Cycle** | Independent | Independent |
| **Cookies** | `admin.cloudsignage.com` | `app.cloudsignage.com` |
| **Security** | Stricter (2FA required, IP allowlist capable) | Standard (2FA optional) |

---

## 3. Architecture Overview

### 3.1 System Architecture

```
                          ┌─────────────────┐
                          │   CDN / WAF     │
                          │ (Cloudflare)    │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────┴───────┐  ┌────────┴───────┐  ┌────────┴───────┐
     │  admin.        │  │  app.          │  │  player.       │
     │  cloudsignage  │  │  cloudsignage  │  │  cloudsignage  │
     │  .com          │  │  .com          │  │  .com          │
     │                │  │                │  │                │
     │  Control       │  │  Customer      │  │  Player        │
     │  Panel         │  │  Workspace     │  │  (Kiosk)       │
     │                │  │                │  │                │
     │  Next.js       │  │  Next.js       │  │  Next.js       │
     │  App Router    │  │  App Router    │  │  App Router    │
     └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
             │                   │                    │
             │                   │                    │
             └───────────────────┼────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    API Gateway / LB     │
                    │   (nginx / Kong)        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │   Backend API (NestJS)  │
                    │   ┌─────────────────┐   │
                    │   │  Platform API   │   │
                    │   │  /platform/*    │   │
                    │   ├─────────────────┤   │
                    │   │  Customer API   │   │
                    │   │  /customer/*    │   │
                    │   ├─────────────────┤   │
                    │   │  Player API     │   │
                    │   │  /player/*      │   │
                    │   ├─────────────────┤   │
                    │   │  Auth API       │   │
                    │   │  /auth/*        │   │
                    │   ├─────────────────┤   │
                    │   │  Public API     │   │
                    │   │  /public/*      │   │
                    │   ├─────────────────┤   │
                    │   │  Internal API   │   │
                    │   │  /internal/*    │   │
                    │   └─────────────────┘   │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
   ┌──────┴──────┐      ┌───────┴───────┐     ┌────────┴───────┐
   │ PostgreSQL  │      │    Redis      │     │  MinIO / S3    │
   │ Primary +   │      │  (cache,      │     │  (media,       │
   │ Read        │      │   sessions,   │     │   branding,    │
   │ Replicas    │      │   queues)     │     │   exports)     │
   └─────────────┘      └───────────────┘     └────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Worker Processes       │
                    │   (BullMQ consumers)     │
                    │   - Email delivery       │
                    │   - Webhook delivery     │
                    │   - Media processing     │
                    │   - Analytics aggregation│
                    │   - Backup tasks         │
                    └─────────────────────────┘
```

### 3.2 Backend Module Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLATFORM MODULES                             │
│                                                                  │
│  PlatformDashboard  TenantMgmt    SubscriptionEngine  PlanMgmt  │
│  BillingCenter      InvoiceEngine CouponEngine        TaxEngine  │
│  UsageTracking      FeatureMgmt    FeatureFlags        QuotaMgmt │
│  LicenseEngine      DeviceFleet    GlobalMonitoring    Platform  │
│  Analytics          RevenueAnalytics SupportCenter     RemoteAssist│
│  Impersonation      CustomerTimeline EmailCenter       NotifCenter│
│  WebhookCenter      APIManagement  OAuthClients        Marketplace│
│  AuditCenter        ActivityTimeline PlatformSettings  Branding  │
│  WhiteLabel         Localization   SystemHealth        BackgroundJobs│
│  SecurityCenter     SecretsMgmt    SessionMgmt         Compliance│
│  AutomationEngine   CronMgmt       AIServices          DevPortal │
│  StorageMgmt        BackupEngine   MaintenanceMode     InternalTools│
└─────────────────────────────────────────────────────────────────┘
                              │ depends on
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SHARED MODULES                              │
│                                                                  │
│  AuthModule    PrismaModule    RedisModule    StorageModule      │
│  EmailModule   AuditLogModule  ThrottlerModule HealthModule     │
│  MetricsModule RealtimeModule  PlayerModule   PairingModule     │
└─────────────────────────────────────────────────────────────────┘
                              │ depends on
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER MODULES                             │
│                                                                  │
│  WorkspaceModule  ScreensModule   CanvasesModule   MediaModule  │
│  PlaylistsModule  SchedulesModule CampaignsModule  AnalyticsMod │
│  SubscriptionsMod OnboardingMod   IslamicModule    NotifsModule │
│  WebhooksModule   ApiKeysModule   AccountModule    TeamModule   │
│  BillingSelfServ  UsageDashboard  QuotaDashboard   IntegrationsMod│
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend separation | Two independent Next.js apps | Origin-level isolation, independent deployment, clean bundles |
| Backend | Single NestJS process, route-level partitioning | Shared data model, shared transactions, simpler ops. Microservices when scale demands. |
| Database | Single PostgreSQL with read replicas | Tightly related data, ACID transactions needed. Read replicas for analytics. |
| Auth | JWT with audience claims + Redis session tracking | Stateless validation + revocation capability |
| Realtime | Socket.IO with Redis adapter | Horizontal scaling of WebSocket connections |
| Background jobs | BullMQ (Redis-backed) | Already in use, reliable, supports retries and scheduled jobs |
| Storage | MinIO (S3-compatible) | Self-hosted, portable to AWS S3, CDN-fronted |
| API versioning | URL-based (`/api/v1/`, `/api/v2/`) | Simple, explicit, cache-friendly |
| Package sharing | Monorepo workspace packages | Atomic commits, version pinning, no registry overhead |

---

## 4. Document Index

| # | Document | Scope |
|---|---|---|
| 00 | **Master Blueprint** (this document) | Executive summary, architecture overview, decisions |
| 01 | **Platform Domain** | All platform modules — 30+ modules with responsibilities, APIs, dependencies |
| 02 | **Customer Domain** | Customer-only features, stripped of all platform concerns |
| 03 | **Backend Architecture** | Module categorization, dependency graph, service boundaries |
| 04 | **Authentication** | Platform/Customer/Support identity, JWT design, session management, impersonation |
| 05 | **Authorization** | Complete RBAC, permission matrix for every endpoint, page, action |
| 06 | **Database Design** | All existing + proposed tables, entity relationships, migration impact |
| 07 | **API Architecture** | API namespaces, ownership, auth, rate limits, versioning |
| 08 | **Frontend Architecture** | Two independent apps, navigation, layouts, shared packages |
| 09 | **Business Architecture** | SaaS model, plans, pricing, licensing, white-label, marketplace |
| 10 | **Scalability** | Scale tiers: 100 / 1K / 10K / 100K screens, capacity planning |
| 11 | **Security** | Zero trust, tenant isolation, abuse protection, compliance |
| 12 | **Operations** | DevOps, observability, monitoring, DR, backup, incident response |
| 13 | **UX Review** | Per-persona experience: platform owner, staff, support, customer roles |
| 14 | **Migration Strategy** | Phased migration from current to v2, zero downtime |
| 15 | **Future Roadmap** | 10-year roadmap, evolution path, technology refresh |

---

## 5. What Changed From Previous Architecture

### Previous Architecture (v1) vs. Platform V2

| Aspect | v1 (Previous) | v2 (This Blueprint) |
|---|---|---|
| **Scope** | Frontend separation + API partitioning | Complete SaaS platform redesign |
| **Platform modules** | 1 (AdminModule) | 30+ platform modules |
| **Database tables** | 1 new (PlatformSettings) | 20+ new tables proposed |
| **Auth** | JWT audience (platform/customer) | JWT audience + session tracking + SSO + 2FA enforcement |
| **Authorization** | 3 platform roles, 4 customer roles | 7 platform roles, 4 customer roles, system roles |
| **Business model** | Not addressed | Plans, pricing, licensing, white-label, marketplace |
| **Scalability** | Mentioned but not detailed | Tiered: 100 / 1K / 10K / 100K with specific actions |
| **Security** | JWT audience + CORS | Zero trust, tenant isolation, abuse protection, compliance |
| **Operations** | Not addressed | DevOps, observability, DR, backup, incident response |
| **UX** | Not addressed | Per-persona experience design |
| **Support** | Not addressed | Support center, tickets, remote assistance |
| **Email** | Hardcoded templates | Email center, template management |
| **Automation** | Not addressed | Rules engine, cron management, AI services |
| **Developer portal** | Not addressed | API management, OAuth clients, developer portal |
| **Marketplace** | Not addressed | Extensions, marketplace apps |

### Challenged Assumptions

| Assumption | v1 Position | v2 Position | Reason |
|---|---|---|---|
| Single backend is sufficient | Accepted | Accepted for now, with extraction plan | Scale demands will require realtime and worker extraction |
| `isSuperAdmin` boolean | Keep | Deprecate in favor of `platformStaffRole: SUPER_ADMIN` | Reduces ambiguity, single source of truth |
| No Plans table | Not addressed | Required — hardcoded plans are technical debt | SaaS maturity requires dynamic plan management |
| No SubscriptionHistory | Not addressed | Required — billing disputes and churn analysis | Enterprise customers demand audit trail |
| No EmailTemplates | Not addressed | Required — white-label needs customizable emails | Hardcoded emails prevent white-label |
| No Support tickets | Not addressed | Required — formalized support workflow | Ad-hoc impersonation is not a support system |
| No Usage tracking | Not addressed | Required — usage-based billing and quota enforcement | Screen count and storage need tracking |
| No License engine | Not addressed | Required for marketplace and on-premise | Digital licensing is a core SaaS capability |
| No Automation | Not addressed | Required — scheduled tasks and rules engine | Manual operations don't scale |
| No Developer portal | Not addressed | Required for public API | Third-party developers need documentation and keys |

---

## 6. Architecture Scorecard

| Dimension | Current State | Target (v2) | Industry Benchmark |
|---|---|---|---|
| Frontend separation | 0/10 (shared) | 10/10 (independent) | ScreenCloud: 10/10 |
| Platform modules | 1/10 (single admin) | 9/10 (30+ modules) | Shopify: 10/10 |
| Customer modules | 7/10 (good, but coupled) | 9/10 (clean, self-served) | Linear: 9/10 |
| Authentication | 4/10 (no audience) | 9/10 (audience + SSO + 2FA) | Stripe: 10/10 |
| Authorization | 5/10 (basic RBAC) | 9/10 (comprehensive RBAC) | Vercel: 9/10 |
| Database design | 6/10 (functional but missing) | 9/10 (complete SaaS schema) | Shopify: 10/10 |
| API architecture | 5/10 (flat routes) | 9/10 (namespaced, versioned) | Stripe: 10/10 |
| Business model | 2/10 (hardcoded) | 8/10 (dynamic plans, licensing) | ScreenCloud: 9/10 |
| Scalability | 3/10 (single instance) | 8/10 (tiered scaling plan) | Rise Vision: 7/10 |
| Security | 4/10 (basic) | 9/10 (zero trust, compliance) | Stripe: 10/10 |
| Operations | 2/10 (manual) | 8/10 (automated, observable) | Vercel: 10/10 |
| UX | 5/10 (functional) | 9/10 (per-persona design) | Linear: 10/10 |
| **Overall** | **4.0/10** | **8.8/10** | — |

---

## 7. Guiding Principles

1. **Two Products, One Platform** — Control Panel and Customer Workspace are independent products sharing a single backend and database. They have different users, different UX, different security postures, and different release cycles.

2. **Platform Owns the Business** — The Control Panel runs the SaaS business: tenants, subscriptions, billing, devices, features, support, and configuration. It is the internal operating system.

3. **Customer Owns Their Workspace** — The Customer Workspace is the product. Customers manage their screens, content, and team. They never see platform administration.

4. **Tenant Isolation is Absolute** — Customer data is workspace-scoped. Platform staff access customer data through explicit oversight endpoints, never through customer endpoints (except impersonation).

5. **Every Action is Audited** — Platform actions are logged with actor, target, action, and context. Customer actions are logged per-workspace. Audit logs are append-only and immutable.

6. **Scale by Extraction** — Start with a monolithic backend. Extract services (realtime, workers, analytics) only when scale demands it. The module structure must support clean extraction.

7. **Design for White-Label** — Branding, emails, and domains must be per-customer configurable from day one. White-label is a configuration, not a rewrite.

8. **API-First** — Every feature is accessible via API. The frontend is one consumer of the API. Mobile apps, integrations, and marketplace extensions are equal consumers.

9. **Zero Trust Security** — No implicit trust. Every request is authenticated, authorized, and audited. Token audience, scope, and expiry are enforced on every call.

10. **Boring Infrastructure** — Use proven, well-understood technology. PostgreSQL, Redis, Nginx, Docker. Innovation in product, not infrastructure.

---

## 8. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Already in use, RSC, i18n, API routes |
| UI Components | Radix UI + Tailwind CSS | Already in use, accessible, customizable |
| Backend | NestJS | Already in use, modular, TypeScript-native |
| ORM | Prisma | Already in use, type-safe, migration support |
| Database | PostgreSQL 15+ | ACID, JSON support, full-text search, read replicas |
| Cache/Queue | Redis 7+ | Sessions, rate limiting, BullMQ, Socket.IO adapter |
| Storage | MinIO (S3-compatible) | Self-hosted, CDN-fronted, portable to AWS |
| Realtime | Socket.IO | Already in use, Redis adapter for scaling |
| Background Jobs | BullMQ | Already in use, Redis-backed, reliable |
| CDN | Cloudflare | DDoS protection, edge caching, WAF |
| Container | Docker + Docker Compose | Already in use, simple orchestration |
| Orchestration (future) | Kubernetes | When scale demands (>10K customers) |
| Monitoring | Sentry + Prometheus + Grafana | Error tracking + metrics + dashboards |
| Logging | Structured JSON logs → Loki | Searchable, correlated with traces |
| CI/CD | GitHub Actions | Already in use, monorepo-friendly |

---

## 9. Final Deliverable Summary

This blueprint consists of 16 documents (00–15) covering every aspect of the Cloud-Screen SaaS platform:

- **Domain design:** 30+ platform modules, 16+ customer modules
- **Database design:** 20+ new tables proposed
- **Authorization:** 7 platform roles, 4 customer roles, system roles
- **API design:** 6 API namespaces with ownership and auth
- **Frontend:** Two independent Next.js applications
- **Business:** Plans, pricing, licensing, white-label, marketplace
- **Scalability:** Tiered plan from 100 to 100,000 screens
- **Security:** Zero trust, tenant isolation, compliance (GDPR, PDPL)
- **Operations:** DevOps, observability, DR, incident response
- **UX:** Per-persona experience for 10+ user types
- **Migration:** 6-phase zero-downtime migration from current to v2
- **Roadmap:** 10-year evolution path

**This blueprint is implementation-ready.** No architectural decisions should need to change during implementation. All trade-offs are documented. All alternatives are evaluated. All risks are cataloged.
