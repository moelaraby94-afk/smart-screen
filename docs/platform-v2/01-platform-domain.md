# 01 — Platform Domain

> **Document Type:** Domain Design Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Complete platform module catalog for the Control Panel

---

## 1. Overview

The Platform Domain encompasses every module that operates the SaaS business. These modules are internal-facing, accessed only by platform staff through the Control Panel. Customers never interact with these modules directly.

### Design Principles

1. **Platform modules read customer data through oversight APIs** — never through customer endpoints
2. **Platform modules write customer data only through explicit administrative actions** — never silently
3. **Every platform action is audited** with actor, target, action, and context
4. **Platform modules depend on Shared modules, not Customer modules** — except for read-only oversight
5. **Platform modules are independently deployable** from customer modules

---

## 2. Module Catalog

### 2.1 Platform Dashboard

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Executive dashboard with global KPIs, revenue, customer health, system status |
| **Why** | Platform staff need a single view to understand platform health at a glance |
| **Business value** | Faster decision-making, early warning for churn and system issues |
| **Technical value** | Aggregates data from multiple modules into a single API call |

**Responsibilities:**
- Display global statistics: MRR, ARR, active customers, churn rate, trial conversion rate
- Display operational metrics: connected screens, online/offline ratio, storage usage
- Display system health: API latency, error rate, queue depth, database connections
- Display recent activity: new signups, subscription changes, support tickets
- Configurable widgets per staff role

**Public APIs:**
- `GET /platform/dashboard` — Aggregated dashboard data
- `GET /platform/dashboard/revenue` — Revenue charts (daily, weekly, monthly)
- `GET /platform/dashboard/growth` — Customer growth charts
- `GET /platform/dashboard/health` — System health summary

**Dependencies:** TenantMgmt, SubscriptionEngine, DeviceFleet, SystemHealth, RevenueAnalytics
**Forbidden:** Direct customer content access (media, playlists, canvases)

---

### 2.2 Tenant Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage customer accounts (tenants) — lifecycle, status, suspension, termination |
| **Why** | The core of SaaS operations — managing who is a customer and their lifecycle state |
| **Business value** | Controlled customer lifecycle, reduced churn through proactive management |
| **Technical value** | Single source of truth for tenant status, integrated with billing and access |

**Responsibilities:**
- List all tenants with search, filter, sort, pagination
- View tenant profile: contact info, lifecycle stage, subscription, workspaces, usage, timeline
- Suspend tenant (blocks all access, preserves data)
- Reactivate tenant
- Terminate tenant (marks for deletion after grace period)
- Manage tenant lifecycle stages: TRIAL → ACTIVE → CHURNED → REACTIVATED
- Assign Customer Success Manager (CSM) to tenant
- Add internal notes and tags to tenant

**Public APIs:**
- `GET /platform/tenants` — List tenants (paginated, filterable)
- `GET /platform/tenants/:id` — Tenant profile
- `PATCH /platform/tenants/:id` — Update tenant (status, CSM, tags, notes)
- `POST /platform/tenants/:id/suspend` — Suspend tenant
- `POST /platform/tenants/:id/reactivate` — Reactivate tenant
- `POST /platform/tenants/:id/terminate` — Terminate tenant
- `GET /platform/tenants/:id/timeline` — Customer timeline (lifecycle events)

**Dependencies:** SubscriptionEngine, WorkspaceMgmt, UsageTracking, AuditCenter
**Forbidden:** Modifying customer content (screens, playlists, media)

---

### 2.3 Customer Lifecycle

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Track and automate customer lifecycle stages and transitions |
| **Why** | Lifecycle stage drives automated actions (emails, feature gates, retention campaigns) |
| **Business value** | Automated onboarding, trial conversion, retention, and win-back campaigns |
| **Technical value** | Event-driven lifecycle transitions, integrated with Automation Engine |

**Responsibilities:**
- Define lifecycle stages: LEAD, TRIAL, ACTIVE, AT_RISK, CHURNED, REACTIVATED
- Track lifecycle transitions with timestamps and triggers
- Trigger automated actions on stage changes (via Automation Engine)
- Display lifecycle funnel analytics

**Public APIs:**
- `GET /platform/lifecycle/stages` — List stages
- `GET /platform/lifecycle/funnel` — Funnel analytics
- `PATCH /platform/tenants/:id/lifecycle` — Manually change stage
- `GET /platform/tenants/:id/lifecycle/history` — Stage transition history

**Dependencies:** TenantMgmt, AutomationEngine, EmailCenter, AuditCenter
**Forbidden:** Direct customer access modification

---

### 2.4 Workspace Management (Platform Oversight)

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Platform-side oversight of customer workspaces — create, view, update, delete |
| **Why** | Support staff need to manage customer workspaces without impersonating |
| **Business value** | Faster support resolution, no impersonation needed for simple workspace tasks |
| **Technical value** | Separates platform workspace operations from customer workspace operations |

**Responsibilities:**
- List all workspaces across all tenants
- View workspace details: screens, members, storage, subscription
- Create workspace for a tenant
- Update workspace name and settings
- Delete workspace (with confirmation and audit)
- Transfer workspace between tenants (for reorganization)

**Public APIs:**
- `GET /platform/workspaces` — List all workspaces
- `GET /platform/workspaces/:id` — Workspace detail
- `POST /platform/tenants/:id/workspaces` — Create workspace
- `PATCH /platform/workspaces/:id` — Update workspace
- `DELETE /platform/workspaces/:id` — Delete workspace

**Dependencies:** WorkspaceModule (shared, read-only for customer data), AuditCenter
**Forbidden:** Modifying workspace content (playlists, schedules, campaigns)

---

### 2.5 Subscription Engine

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage customer subscriptions — plan assignment, status, billing cycle |
| **Why** | Subscriptions are the revenue engine — must be managed centrally |
| **Business value** | Revenue visibility, plan changes, trial management, dunning |
| **Technical value** | Integrates with PlanMgmt, BillingCenter, and customer-facing billing |

**Responsibilities:**
- View all subscriptions with status (TRIALING, ACTIVE, PAST_DUE, CANCELLED)
- Change customer plan (upgrade, downgrade, cross-grade)
- Extend trial period
- Apply custom pricing (enterprise contracts)
- Manage subscription status (activate, cancel, reactivate)
- Trigger dunning emails for past_due subscriptions
- Record subscription history (plan changes, status changes)

**Public APIs:**
- `GET /platform/subscriptions` — List all subscriptions
- `GET /platform/subscriptions/:id` — Subscription detail
- `PATCH /platform/subscriptions/:id` — Change plan, extend trial, custom pricing
- `POST /platform/subscriptions/:id/cancel` — Cancel subscription
- `POST /platform/subscriptions/:id/reactivate` — Reactivate subscription
- `GET /platform/subscriptions/:id/history` — Subscription history

**Dependencies:** PlanMgmt, BillingCenter, InvoiceEngine, TenantMgmt, AuditCenter
**Forbidden:** Direct Stripe API calls (must go through BillingCenter)

---

### 2.6 Plan Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Define and manage subscription plans, pricing, and features |
| **Why** | Plans are currently hardcoded — dynamic management enables pricing experiments and new plans without code deployment |
| **Business value** | A/B test pricing, launch new plans, sunset old plans, regional pricing |
| **Technical value** | Single source of truth for plan configuration, consumed by SubscriptionEngine and Customer billing |

**Responsibilities:**
- Create, update, archive plans
- Define plan features (max screens, max storage, features list)
- Set pricing per currency and region
- Manage plan visibility (public, private, enterprise-only)
- Define trial parameters per plan (duration, feature limits)
- Version plans (preserve historical plan definitions for existing subscriptions)

**Public APIs:**
- `GET /platform/plans` — List all plans
- `POST /platform/plans` — Create plan
- `PATCH /platform/plans/:id` — Update plan
- `DELETE /platform/plans/:id` — Archive plan (soft delete)
- `GET /platform/plans/:id/features` — Plan features
- `PATCH /platform/plans/:id/features` — Update features
- `GET /platform/plans/:id/pricing` — Plan pricing per currency/region
- `PATCH /platform/plans/:id/pricing` — Update pricing

**Dependencies:** None (master data)
**Forbidden:** Direct subscription modification (must go through SubscriptionEngine)

---

### 2.7 Billing Center

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Central billing management — payment providers, transactions, refunds |
| **Why** | Multiple payment providers (Stripe, PayPal, local gateways) need unified management |
| **Business value** | Revenue reconciliation, refund management, payment provider health |
| **Technical value** | Abstracts payment providers behind a unified interface |

**Responsibilities:**
- View all transactions across all payment providers
- Process refunds (full and partial)
- Manage payment provider configurations (API keys, webhooks)
- Reconcile transactions with invoices
- View failed payments and retry status
- Manage dunning rules (retry schedule, email templates)

**Public APIs:**
- `GET /platform/billing/transactions` — List transactions
- `GET /platform/billing/transactions/:id` — Transaction detail
- `POST /platform/billing/transactions/:id/refund` — Process refund
- `GET /platform/billing/providers` — List payment providers
- `PATCH /platform/billing/providers/:id` — Update provider config
- `GET /platform/billing/failed-payments` — Failed payments list
- `POST /platform/billing/failed-payments/:id/retry` — Retry failed payment

**Dependencies:** SubscriptionEngine, InvoiceEngine, EmailCenter, AuditCenter
**Forbidden:** Direct customer card data access (PCI compliance)

---

### 2.8 Invoice Engine

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Generate, manage, and deliver invoices to customers |
| **Why** | Invoices are required for B2B customers and tax compliance |
| **Business value** | Professional invoicing, tax compliance, PDF delivery, invoice tracking |
| **Technical value** | Automated invoice generation on subscription renewal, PDF rendering, storage |

**Responsibilities:**
- Generate invoices on subscription renewal or one-time charge
- Generate PDF invoices with branding
- Track invoice status (DRAFT, SENT, PAID, VOID, OVERDUE)
- Send invoices via email
- Allow customers to download invoices from Customer Workspace
- Apply taxes based on customer region (see TaxEngine)
- Manage invoice numbering and sequences

**Public APIs:**
- `GET /platform/invoices` — List all invoices
- `GET /platform/invoices/:id` — Invoice detail
- `GET /platform/invoices/:id/pdf` — Download PDF
- `POST /platform/invoices/:id/send` — Send via email
- `POST /platform/invoices/:id/void` — Void invoice
- `POST /platform/invoices` — Create manual invoice (one-time charge)

**Dependencies:** BillingCenter, TaxEngine, EmailCenter, Branding, StorageModule
**Forbidden:** Direct payment processing (must go through BillingCenter)

---

### 2.9 Coupon Engine

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Create and manage discount coupons for subscriptions |
| **Why** | Promotional pricing, partner discounts, win-back campaigns |
| **Business value** | Marketing campaigns, conversion optimization, partner programs |
| **Technical value** | Validated at checkout, tracked for ROI analysis |

**Responsibilities:**
- Create coupons (percentage or fixed amount, per-plan or global)
- Set coupon constraints (max redemptions, expiry, first-time customers only)
- Track coupon redemptions
- Analytics on coupon performance (revenue impact, conversion rate)
- Apply coupons to subscriptions (platform-side or customer-side at checkout)

**Public APIs:**
- `GET /platform/coupons` — List coupons
- `POST /platform/coupons` — Create coupon
- `PATCH /platform/coupons/:id` — Update coupon
- `DELETE /platform/coupons/:id` — Archive coupon
- `GET /platform/coupons/:id/redemptions` — Redemption history
- `GET /platform/coupons/analytics` — Coupon performance analytics

**Dependencies:** SubscriptionEngine, BillingCenter
**Forbidden:** Direct subscription modification without audit

---

### 2.10 Tax Engine

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Calculate and apply taxes to invoices based on customer region |
| **Why** | VAT, GST, sales tax compliance varies by jurisdiction |
| **Business value** | Tax compliance, accurate invoicing, reduced audit risk |
| **Technical value** | Integrates with tax service providers (TaxJar, Avalara) or manual tax tables |

**Responsibilities:**
- Define tax rates per region/country
- Calculate tax on invoice generation
- Apply tax exemptions (for exempt customers)
- Generate tax reports for accounting
- Integrate with external tax services (future)

**Public APIs:**
- `GET /platform/tax/rates` — List tax rates
- `POST /platform/tax/rates` — Create tax rate
- `PATCH /platform/tax/rates/:id` — Update tax rate
- `POST /platform/tax/calculate` — Calculate tax for a given amount and region
- `GET /platform/tax/reports` — Tax reports by period

**Dependencies:** InvoiceEngine
**Forbidden:** Direct customer billing modification

---

### 2.11 Usage Tracking

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Track resource usage per workspace for billing, quotas, and analytics |
| **Why** | Screen count, storage, API calls, and bandwidth need tracking for plan enforcement and overage billing |
| **Business value** | Accurate billing, upsell opportunities, abuse detection |
| **Technical value** | Aggregated metrics from multiple sources, queryable by time range |

**Responsibilities:**
- Track active screen count per workspace (real-time from RealtimeModule)
- Track storage usage per workspace (from StorageModule)
- Track API call count per workspace (from ThrottlerModule)
- Track bandwidth usage per workspace (from CDN logs)
- Track proof-of-play events per workspace (from PlayerModule)
- Aggregate usage into daily/monthly summaries
- Compare usage against plan limits (trigger overage charges or alerts)
- Export usage data for customer visibility

**Public APIs:**
- `GET /platform/usage/:workspaceId` — Current usage
- `GET /platform/usage/:workspaceId/history` — Historical usage
- `GET /platform/usage/:workspaceId/limits` — Plan limits vs actual usage
- `GET /platform/usage/overages` — All workspaces exceeding limits

**Dependencies:** PlanMgmt, SubscriptionEngine, RealtimeModule, StorageModule
**Forbidden:** Modifying customer content to reduce usage

---

### 2.12 Feature Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Define the feature catalog and manage feature availability per plan |
| **Why** | Features should be gated by plan, not hardcoded. New features need a way to be gradually rolled out. |
| **Business value** | Plan differentiation, upsell drivers, beta feature management |
| **Technical value** | Single feature catalog consumed by Feature Flags and Customer Workspace |

**Responsibilities:**
- Define feature catalog (feature key, name, description, category)
- Map features to plans (which plans include which features)
- Define feature dependencies (feature X requires feature Y)
- Manage feature visibility (enabled, disabled, beta, coming_soon)
- Track feature adoption (which workspaces use which features)

**Public APIs:**
- `GET /platform/features` — Feature catalog
- `POST /platform/features` — Create feature
- `PATCH /platform/features/:id` — Update feature
- `GET /platform/features/:id/adoption` — Adoption metrics
- `PATCH /platform/plans/:id/features` — Map features to plan

**Dependencies:** PlanMgmt, FeatureFlags
**Forbidden:** Direct customer feature toggling (must go through Feature Flags)

---

### 2.13 Feature Flags

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Per-workspace feature toggles for gradual rollout and beta access |
| **Why** | Enable features per customer without deploying code. Kill switch for problematic features. |
| **Business value** | Safe feature rollout, beta programs, customer-specific feature access |
| **Technical value** | Runtime feature evaluation, cached per workspace, updated via Control Panel |

**Responsibilities:**
- Toggle features per workspace (enable/disable)
- Set feature flag values (boolean or JSON config)
- Global feature flags (affect all workspaces)
- Scheduled feature activation (enable on date X)
- Feature flag audit trail (who toggled what, when)

**Public APIs:**
- `GET /platform/feature-flags` — All feature flags
- `GET /platform/feature-flags/:workspaceId` — Workspace flags
- `PATCH /platform/feature-flags/:workspaceId` — Toggle flags
- `GET /platform/feature-flags/global` — Global flags
- `PATCH /platform/feature-flags/global` — Update global flags

**Dependencies:** FeatureMgmt
**Forbidden:** Modifying customer behavior without audit

---

### 2.14 Storage Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage storage infrastructure, quotas, and cleanup |
| **Why** | Storage is a significant cost. Orphaned media, expired content, and quota enforcement need central management. |
| **Business value** | Cost control, storage optimization, quota-based billing |
| **Technical value** | Centralized storage metrics, automated cleanup, quota enforcement |

**Responsibilities:**
- View storage usage per workspace, per tenant, globally
- Set storage quotas per plan and per workspace (overrides)
- Identify orphaned media (not referenced by any playlist)
- Identify expired media (past expiry date, not cleaned up)
- Trigger storage cleanup (delete orphaned/expired media)
- Manage storage infrastructure (MinIO bucket configuration, CDN settings)
- Storage cost analytics (cost per TB, cost per customer)

**Public APIs:**
- `GET /platform/storage/usage` — Global storage usage
- `GET /platform/storage/usage/:workspaceId` — Workspace storage
- `GET /platform/storage/orphans` — Orphaned media list
- `POST /platform/storage/cleanup` — Trigger cleanup
- `PATCH /platform/storage/quotas/:workspaceId` — Set quota override
- `GET /platform/storage/costs` — Storage cost analytics

**Dependencies:** StorageModule, UsageTracking, PlanMgmt
**Forbidden:** Deleting customer media without audit and notification

---

### 2.15 Quota Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Enforce resource limits per workspace (screens, storage, API calls, bandwidth) |
| **Why** | Plan limits must be enforced to prevent abuse and drive upsells |
| **Business value** | Fair usage, upsell triggers, abuse prevention |
| **Technical value** | Centralized quota evaluation, real-time enforcement, graceful limit errors |

**Responsibilities:**
- Evaluate screen count against plan limit on screen creation
- Evaluate storage usage on media upload
- Evaluate API call rate against plan limit
- Return graceful 402 Payment Required or 429 Too Many Requests when limits exceeded
- Allow platform staff to override limits per workspace
- Alert when workspace approaches 80% of any limit

**Public APIs:**
- `GET /platform/quotas/:workspaceId` — Current quotas and usage
- `PATCH /platform/quotas/:workspaceId` — Override limits
- `GET /platform/quotas/alerts` — Workspaces approaching limits

**Dependencies:** UsageTracking, PlanMgmt, SubscriptionEngine
**Forbidden:** Silently blocking customer operations without clear error messages

---

### 2.16 Screen Licensing

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage screen licenses — count, assign, and revoke |
| **Why** | Screen count is the primary billing metric. Licenses ensure customers don't exceed their plan. |
| **Business value** | Revenue protection, accurate billing, license compliance |
| **Technical value** | License pool per workspace, checked on screen activation |

**Responsibilities:**
- Track licensed screens per workspace (from plan limit + overrides)
- Track active screens per workspace (from RealtimeModule)
- Block new screen pairing when license limit reached
- Allow platform staff to grant additional licenses
- Display license utilization (used/available) per workspace
- Alert when license utilization exceeds 90%

**Public APIs:**
- `GET /platform/licenses/:workspaceId` — License status
- `PATCH /platform/licenses/:workspaceId` — Grant additional licenses
- `GET /platform/licenses/utilization` — License utilization across all workspaces

**Dependencies:** PlanMgmt, UsageTracking, DeviceFleet
**Forbidden:** Blocking screens without customer notification

---

### 2.17 License Engine

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Generate and manage software licenses for on-premise and marketplace distribution |
| **Why** | White-label and marketplace require license keys that aren't tied to the SaaS billing system |
| **Business value** | Marketplace revenue, on-premise deployment, partner distribution |
| **Technical value** | Signed license keys, offline validation, fingerprint binding |

**Responsibilities:**
- Generate license keys (signed, tamper-proof)
- Bind licenses to hardware fingerprints or domains
- Set license expiration and renewal
- Validate licenses offline (player can check without internet)
- Track license usage and activations
- Revoke licenses

**Public APIs:**
- `GET /platform/licenses` — List all licenses
- `POST /platform/licenses` — Generate license
- `PATCH /platform/licenses/:id` — Update license
- `DELETE /platform/licenses/:id` — Revoke license
- `POST /platform/licenses/:id/validate` — Validate license (internal)

**Dependencies:** None (standalone)
**Forbidden:** Issuing licenses without audit trail

---

### 2.18 Device Fleet

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Global oversight of all screens across all customers |
| **Why** | Platform staff need to see the global fleet status for support and monitoring |
| **Business value** | Proactive support, fleet health, player version management |
| **Technical value** | Aggregated screen data from RealtimeModule, read-only |

**Responsibilities:**
- List all screens globally with filters (online/offline, player version, workspace, tenant)
- View screen details: status, last heartbeat, player version, offline cache mode, location
- View fleet distribution: online/offline ratio, player version distribution, geographic distribution
- Send global announcements to all screens (maintenance notices)
- Force player updates (when new player version is released)
- Identify screens with stale player versions

**Public APIs:**
- `GET /platform/fleet/screens` — Global screen list
- `GET /platform/fleet/screens/:id` — Screen detail
- `GET /platform/fleet/stats` — Fleet statistics
- `GET /platform/fleet/versions` — Player version distribution
- `POST /platform/fleet/announce` — Global announcement
- `POST /platform/fleet/screens/:id/force-update` — Force player update

**Dependencies:** RealtimeModule (read-only), ScreensModule (read-only)
**Forbidden:** Sending remote commands to screens (must go through customer ScreensModule or impersonation)

---

### 2.19 Global Monitoring

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Real-time monitoring of platform infrastructure and services |
| **Why** | Platform staff need to detect and respond to incidents before customers notice |
| **Business value** | Reduced downtime, faster incident response, SLA compliance |
| **Technical value** | Aggregated health from all services, alerting, incident tracking |

**Responsibilities:**
- Monitor API latency, error rate, request volume
- Monitor database connections, slow queries, replication lag
- Monitor Redis memory, connection count, queue depth
- Monitor storage capacity, upload/download speed
- Monitor WebSocket connection count, message rate
- Monitor worker queue depth, job failure rate
- Display service status (operational, degraded, outage)
- Trigger alerts on threshold breaches (PagerDuty, Slack, email)

**Public APIs:**
- `GET /platform/monitoring/status` — Service status overview
- `GET /platform/monitoring/metrics` — Detailed metrics
- `GET /platform/monitoring/alerts` — Active alerts
- `POST /platform/monitoring/alerts/:id/acknowledge` — Acknowledge alert
- `GET /platform/monitoring/incidents` — Incident history

**Dependencies:** SystemHealth, MetricsModule
**Forbidden:** Modifying service configurations (must go through Operations)

---

### 2.20 Platform Analytics

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Business analytics — customer behavior, feature adoption, usage patterns |
| **Why** | Data-driven decisions for product roadmap, pricing, and retention |
| **Business value** | Churn prediction, upsell identification, product insights |
| **Technical value** | Aggregated from UsageTracking, AuditCenter, SubscriptionEngine |

**Responsibilities:**
- Feature adoption metrics (which features are used, by how many customers)
- Customer engagement scoring (based on login frequency, content changes, screen activity)
- Cohort analysis (retention by signup month)
- Funnel analysis (trial → paid conversion rates)
- Usage heatmaps (when customers are most active)
- Custom report builder (query any metric by dimension)

**Public APIs:**
- `GET /platform/analytics/adoption` — Feature adoption
- `GET /platform/analytics/engagement` — Customer engagement
- `GET /platform/analytics/cohorts` — Cohort analysis
- `GET /platform/analytics/funnels` — Funnel analysis
- `POST /platform/analytics/reports` — Custom report

**Dependencies:** UsageTracking, AuditCenter, SubscriptionEngine, FeatureMgmt
**Forbidden:** Accessing individual customer content (analytics are aggregated)

---

### 2.21 Revenue Analytics

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Financial analytics — MRR, ARR, churn, LTV, ARPU |
| **Why** | Financial reporting, investor relations, pricing optimization |
| **Business value** | Revenue visibility, churn tracking, growth measurement |
| **Technical value** | Aggregated from BillingCenter, SubscriptionEngine, InvoiceEngine |

**Responsibilities:**
- Calculate MRR, ARR, ARPU (Average Revenue Per User)
- Track churn rate (logo churn, revenue churn)
- Calculate LTV (Life Time Value) per cohort
- Revenue by plan, by region, by currency
- Forecasting (projected revenue based on current growth)
- Refund and discount impact analysis

**Public APIs:**
- `GET /platform/revenue/summary` — MRR, ARR, ARPU
- `GET /platform/revenue/churn` — Churn metrics
- `GET /platform/revenue/ltv` — LTV by cohort
- `GET /platform/revenue/by-plan` — Revenue by plan
- `GET /platform/revenue/by-region` — Revenue by region
- `GET /platform/revenue/forecast` — Revenue forecast

**Dependencies:** BillingCenter, SubscriptionEngine, InvoiceEngine
**Forbidden:** Accessing individual customer payment data (PCI compliance)

---

### 2.22 Support Center

| Attribute | Value |
|---|---|
| **Owner** | Platform team (Support team is primary user) |
| **Purpose** | Manage customer support tickets, inquiries, and issue resolution |
| **Why** | Ad-hoc impersonation is not a support system. Formal ticketing enables tracking, SLA, and reporting. |
| **Business value** | Customer satisfaction, SLA compliance, support team productivity |
| **Technical value** | Integrated with TenantMgmt, Impersonation, AuditCenter |

**Responsibilities:**
- Create support tickets (platform-staff-created or customer-submitted via email/API)
- Assign tickets to support agents
- Track ticket status (OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED)
- Track ticket priority (LOW, MEDIUM, HIGH, URGENT)
- Track SLA (response time, resolution time)
- Link tickets to tenants and workspaces
- Internal notes (not visible to customer)
- Customer-visible messages
- Attach files to tickets
- Escalate tickets to engineering
- Link tickets to incidents (from GlobalMonitoring)
- Initiate impersonation from ticket context
- Ticket analytics (volume, resolution time, satisfaction score)

**Public APIs:**
- `GET /platform/support/tickets` — List tickets
- `POST /platform/support/tickets` — Create ticket
- `GET /platform/support/tickets/:id` — Ticket detail
- `PATCH /platform/support/tickets/:id` — Update ticket
- `POST /platform/support/tickets/:id/messages` — Add message
- `POST /platform/support/tickets/:id/assign` — Assign ticket
- `POST /platform/support/tickets/:id/escalate` — Escalate ticket
- `GET /platform/support/tickets/:id/messages` — Ticket messages
- `GET /platform/support/analytics` — Support analytics

**Dependencies:** TenantMgmt, Impersonation, AuditCenter, EmailCenter
**Forbidden:** Modifying customer data through support tickets (must use impersonation)

---

### 2.23 Remote Assistance

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Remote screen control and diagnostics for support purposes |
| **Why** | Support agents need to see what the customer sees on their screens |
| **Business value** | Faster issue resolution, reduced truck rolls, customer satisfaction |
| **Technical value** | VNC-like screen sharing through the RealtimeModule, with customer consent |

**Responsibilities:**
- Request remote assistance session (requires customer approval)
- View screen content in real-time (read-only or interactive)
- Send remote commands (restart, refresh, screenshot)
- View screen logs and diagnostics
- Record session for audit trail
- Auto-terminate session after timeout

**Public APIs:**
- `POST /platform/assistance/sessions` — Request assistance session
- `GET /platform/assistance/sessions/:id` — Session status
- `POST /platform/assistance/sessions/:id/command` — Send command
- `POST /platform/assistance/sessions/:id/end` — End session
- `GET /platform/assistance/sessions/:id/recording` — Session recording

**Dependencies:** RealtimeModule, ScreensModule (read-only), AuditCenter
**Forbidden:** Accessing screens without customer consent

---

### 2.24 Impersonation

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Allow platform staff to act as customer users for support and debugging |
| **Why** | Some issues require seeing the customer's exact view. Impersonation is the safest way to provide this. |
| **Business value** | Faster support resolution, debugging without customer involvement |
| **Technical value** | Exchange token flow, cross-domain redirect, JWT with `impersonatedBy` claim |

**Responsibilities:**
- Initiate impersonation from Control Panel
- Generate one-time exchange token (30s TTL, Redis)
- Redirect to Customer Workspace with exchange token
- Issue customer-audience JWT with `impersonatedBy` claim
- Show impersonation banner in Customer Workspace
- Exit impersonation and return to Control Panel
- Log all impersonation events to AuditCenter
- Track active impersonation sessions
- Force-end impersonation sessions

**Public APIs:**
- `POST /platform/impersonation/start` — Start impersonation (returns exchange token)
- `GET /platform/impersonation/active` — List active sessions
- `POST /platform/impersonation/:id/end` — Force-end session
- `POST /auth/exchange-impersonation` — Exchange token (shared auth endpoint)
- `POST /auth/exit-impersonation` — Exit impersonation (shared auth endpoint)

**Dependencies:** AuthModule, AuditCenter, TenantMgmt
**Forbidden:** Impersonating without audit trail; impersonating other platform staff

---

### 2.25 Customer Timeline

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Chronological view of all events related to a customer (lifecycle, billing, support, usage, audit) |
| **Why** | Platform staff need a complete customer history for support and account management |
| **Business value** | Customer 360 view, proactive account management, churn prevention |
| **Technical value** | Aggregates events from multiple modules into a unified timeline |

**Responsibilities:**
- Aggregate events from: TenantMgmt, SubscriptionEngine, BillingCenter, SupportCenter, AuditCenter, UsageTracking
- Display timeline with event type, timestamp, actor, and description
- Filter by event type (billing, support, lifecycle, usage, security)
- Export timeline as PDF or CSV
- Pin important events for quick reference

**Public APIs:**
- `GET /platform/tenants/:id/timeline` — Customer timeline
- `GET /platform/tenants/:id/timeline?type=billing` — Filtered timeline
- `GET /platform/tenants/:id/timeline/export` — Export timeline

**Dependencies:** TenantMgmt, SubscriptionEngine, BillingCenter, SupportCenter, AuditCenter, UsageTracking
**Forbidden:** Modifying timeline events (append-only, immutable)

---

### 2.26 Email Center

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage email templates, campaigns, and delivery |
| **Why** | Hardcoded emails prevent white-label and customization. A central email center enables template management and tracking. |
| **Business value** | White-label emails, A/B test subject lines, delivery tracking, email analytics |
| **Technical value** | Template engine, variable substitution, multi-language, multi-provider |

**Responsibilities:**
- Manage email templates (subject, body, variables, locale)
- Template categories: transactional (password reset, invoice), lifecycle (trial ending, churned), marketing (announcements)
- Send test emails
- Track email delivery (sent, delivered, opened, clicked, bounced)
- Manage email provider configurations (SMTP, SendGrid, SES, Postmark)
- Email suppression list (unsubscribe, bounces)
- White-label: per-customer template overrides

**Public APIs:**
- `GET /platform/email/templates` — List templates
- `POST /platform/email/templates` — Create template
- `PATCH /platform/email/templates/:id` — Update template
- `POST /platform/email/templates/:id/test` — Send test email
- `GET /platform/email/delivery` — Delivery tracking
- `GET /platform/email/analytics` — Email analytics (open rate, click rate, bounce rate)
- `GET /platform/email/providers` — Email provider configs
- `PATCH /platform/email/providers/:id` — Update provider config

**Dependencies:** EmailModule, Branding, Localization
**Forbidden:** Sending emails without unsubscribe option (for marketing emails)

---

### 2.27 Notification Center (Platform)

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Platform-internal notifications for staff (system alerts, new signups, support escalations) |
| **Why** | Platform staff need their own notification stream, separate from customer notifications |
| **Business value** | Faster response to events, reduced alert fatigue, staff productivity |
| **Technical value** | Per-staff notification feed, configurable preferences, push to Control Panel |

**Responsibilities:**
- Generate platform notifications (system health, new customers, subscription cancellations, support escalations)
- Per-staff notification feed (read, unread, archived)
- Notification preferences per staff member (email, in-app, Slack webhook)
- Notification categories (system, billing, support, security, usage)
- Mark as read, archive, dismiss
- Push notifications via WebSocket to Control Panel

**Public APIs:**
- `GET /platform/notifications` — Staff notification feed
- `PATCH /platform/notifications/:id/read` — Mark as read
- `POST /platform/notifications/mark-all-read` — Mark all as read
- `GET /platform/notifications/preferences` — Notification preferences
- `PATCH /platform/notifications/preferences` — Update preferences

**Dependencies:** GlobalMonitoring, SupportCenter, SubscriptionEngine, RealtimeModule
**Forbidden:** Sending notifications to customers (that's the customer NotificationModule)

---

### 2.28 Webhook Center (Platform)

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Platform-level webhooks for internal integrations and automation |
| **Why** | Platform events (customer signup, subscription change, screen offline) need to trigger external integrations |
| **Business value** | Integration with CRM, Slack, Zapier, internal tools |
| **Technical value** | Event-driven webhooks with retry, signing, and delivery logs |

**Responsibilities:**
- Define platform webhook endpoints (URL, events, secret)
- Sign webhook payloads (HMAC-SHA256)
- Retry failed deliveries (exponential backoff)
- Track delivery logs (request, response, status, latency)
- Event types: customer.created, customer.churned, subscription.activated, subscription.cancelled, screen.offline, payment.failed, support.ticket.created

**Public APIs:**
- `GET /platform/webhooks` — List platform webhooks
- `POST /platform/webhooks` — Create webhook
- `PATCH /platform/webhooks/:id` — Update webhook
- `DELETE /platform/webhooks/:id` — Delete webhook
- `POST /platform/webhooks/:id/test` — Send test event
- `GET /platform/webhooks/:id/deliveries` — Delivery logs

**Dependencies:** AuditCenter
**Forbidden:** Sending customer data in webhooks without consent

---

### 2.29 API Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage public API keys, rate limits, and developer access |
| **Why** | Third-party developers need API access. This must be managed, rate-limited, and monitored. |
| **Business value** | Developer ecosystem, integrations, marketplace apps |
| **Technical value** | API key management, per-key rate limits, usage tracking, API versioning |

**Responsibilities:**
- Create API keys for developers (platform-level, not customer-level)
- Set per-key rate limits and quotas
- Track API usage per key
- Manage API versions (deprecate old versions, document new versions)
- API documentation portal (Swagger/OpenAPI)
- API key scopes (read-only, read-write, admin)

**Public APIs:**
- `GET /platform/api-keys` — List platform API keys
- `POST /platform/api-keys` — Create API key
- `DELETE /platform/api-keys/:id` — Revoke API key
- `GET /platform/api-keys/:id/usage` — API usage per key
- `GET /platform/api/versions` — API version status

**Dependencies:** ThrottlerModule, UsageTracking, AuditCenter
**Forbidden:** Using platform API keys for customer operations

---

### 2.30 OAuth Clients

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage OAuth 2.0 applications for third-party integrations |
| **Why** | Third-party apps (Slack, Teams, Zapier) need OAuth access to customer workspaces |
| **Business value** | Integration ecosystem, marketplace apps, partner integrations |
| **Technical value** | OAuth 2.0 authorization server, client management, token issuance |

**Responsibilities:**
- Register OAuth clients (name, redirect URIs, scopes, logo)
- Manage client credentials (client ID, client secret)
- Define OAuth scopes (read:screens, write:playlists, admin:workspace)
- Issue authorization codes and access tokens
- Track active OAuth sessions per client
- Revoke client access
- OAuth consent screen (shown to customers)

**Public APIs:**
- `GET /platform/oauth/clients` — List OAuth clients
- `POST /platform/oauth/clients` — Register client
- `PATCH /platform/oauth/clients/:id` — Update client
- `DELETE /platform/oauth/clients/:id` — Revoke client
- `GET /platform/oauth/clients/:id/sessions` — Active sessions

**Dependencies:** AuthModule, AuditCenter
**Forbidden:** Issuing tokens without customer consent

---

### 2.31 Marketplace

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage marketplace apps and extensions |
| **Why** | Third-party developers can build and sell apps that extend Cloud-Screen |
| **Business value** | Platform revenue (app store commission), ecosystem growth, customer retention |
| **Technical value** | App registry, versioning, sandbox, review process |

**Responsibilities:**
- App registry (name, developer, description, screenshots, pricing, category)
- App versions and changelog
- App review process (submission, review, approval, rejection)
- App installation tracking (which customers installed which apps)
- App revenue tracking (commission, payouts to developers)
- App permissions (what API scopes each app requests)
- Featured apps and categories

**Public APIs:**
- `GET /platform/marketplace/apps` — List apps
- `POST /platform/marketplace/apps` — Submit app
- `PATCH /platform/marketplace/apps/:id` — Update app
- `POST /platform/marketplace/apps/:id/approve` — Approve app
- `POST /platform/marketplace/apps/:id/reject` — Reject app
- `GET /platform/marketplace/apps/:id/installations` — Installation tracking
- `GET /platform/marketplace/revenue` — Revenue analytics

**Dependencies:** OAuthClients, APIManagement, BillingCenter
**Forbidden:** Installing apps on customer workspaces without consent

---

### 2.32 Audit Center

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Cross-tenant audit trail for security, compliance, and forensic analysis |
| **Why** | Enterprise customers and regulators require audit trails. Platform actions must be traceable. |
| **Business value** | Compliance (SOC2, GDPR, PDPL), security forensics, dispute resolution |
| **Technical value** | Append-only, immutable, indexed, queryable audit log |

**Responsibilities:**
- Record platform events (impersonation, settings changes, staff management, subscription changes)
- Record customer events (screen CRUD, playlist CRUD, media upload, team changes) — from AuditLogModule
- Query audit log by actor, target, action, date range, workspace
- Export audit log (CSV, JSON) for compliance
- Audit log retention policy (configurable, default 2 years)
- Tamper detection (hash chain for integrity)
- Real-time alerting on suspicious activities

**Public APIs:**
- `GET /platform/audit/events` — Query audit events
- `GET /platform/audit/events/export` — Export audit log
- `GET /platform/audit/actors/:id/actions` — Actions by actor
- `GET /platform/audit/targets/:id/history` — History of target
- `GET /platform/audit/alerts` — Suspicious activity alerts

**Dependencies:** AuditLogModule
**Forbidden:** Modifying or deleting audit events (append-only, immutable)

---

### 2.33 Activity Timeline

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Real-time activity feed of platform operations |
| **Why** | Platform staff need to see what's happening on the platform in real-time |
| **Business value** | Situational awareness, anomaly detection, operational transparency |
| **Technical value** | WebSocket-pushed events from AuditLogModule, filtered by staff role |

**Responsibilities:**
- Real-time stream of platform events (new signups, subscription changes, support tickets, system alerts)
- Filter by event type, severity, actor
- Save custom views (filters)
- Link events to relevant modules (click to navigate)

**Public APIs:**
- `GET /platform/activity` — Recent activity (paginated)
- `WS /platform/activity/stream` — Real-time activity stream (WebSocket)

**Dependencies:** AuditLogModule, RealtimeModule
**Forbidden:** Showing customer content in activity feed (metadata only)

---

### 2.34 Platform Settings

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Global platform configuration — name, support email, default language, maintenance mode |
| **Why** | Platform-wide settings must be configurable without code deployment |
| **Business value** | Operational flexibility, maintenance communication, localization |
| **Technical value** | Database-backed (replaces file-based store), singleton or per-environment |

**Responsibilities:**
- Platform name, support email, default language
- Maintenance mode (toggles a banner on Customer Workspace and blocks non-essential operations)
- Default trial duration
- Default subscription grace period
- Platform-wide feature toggles (global feature flags)
- System announcements (banner on Customer Workspace)
- Environment configuration (staging vs. production settings)

**Public APIs:**
- `GET /platform/settings` — Platform settings
- `PATCH /platform/settings` — Update settings
- `POST /platform/settings/maintenance` — Toggle maintenance mode
- `POST /platform/settings/announcement` — Set platform announcement

**Dependencies:** None (master data)
**Forbidden:** Storing secrets in settings (must use SecretsMgmt)

---

### 2.35 Branding

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage platform visual identity — logos, colors, fonts |
| **Why** | Branding must be configurable for white-label and platform customization |
| **Business value** | White-label revenue, brand consistency, professional appearance |
| **Technical value** | Per-environment and per-customer branding overrides, CDN-served assets |

**Responsibilities:**
- Upload logos (EN/AR × Light/Dark = 4 variants)
- Set brand colors (primary, secondary, accent)
- Set custom fonts (URL to font files)
- Favicon management
- Email template branding (header logo, footer)
- Per-customer branding overrides (white-label)
- Branding epoch (cache-busting on asset updates)
- Custom domain mapping (for white-label: `signage.customer-brand.com`)

**Public APIs:**
- `GET /platform/branding` — Platform branding
- `PATCH /platform/branding` — Update branding
- `POST /platform/branding/upload` — Upload brand asset
- `GET /platform/branding/file/:variant` — Serve brand asset (public)
- `GET /platform/branding/overrides/:tenantId` — Customer branding override
- `PATCH /platform/branding/overrides/:tenantId` — Set customer branding

**Dependencies:** StorageModule, PlatformSettings
**Forbidden:** Storing branding assets in database (use file storage)

---

### 2.36 White Label

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Enable per-customer branding, custom domains, and custom emails |
| **Why** | Enterprise customers and resellers need the platform to appear as their own |
| **Business value** | Premium pricing, reseller channel, agency partnerships |
| **Technical value** | Per-customer configuration layer over platform defaults |

**Responsibilities:**
- Per-customer branding (logos, colors, fonts — via Branding module)
- Per-customer custom domain (DNS verification, SSL certificate)
- Per-customer email templates (via EmailCenter overrides)
- Per-customer login page (branded login)
- Per-customer default language
- Hide "Powered by Cloud-Screen" badge
- Reseller hierarchy (reseller manages multiple customers)

**Public APIs:**
- `GET /platform/white-label/:tenantId` — White-label config
- `PATCH /platform/white-label/:tenantId` — Update config
- `POST /platform/white-label/:tenantId/domain` — Add custom domain
- `POST /platform/white-label/:tenantId/domain/verify` — Verify domain
- `GET /platform/white-label/resellers` — List resellers
- `POST /platform/white-label/resellers` — Create reseller

**Dependencies:** Branding, EmailCenter, PlatformSettings, AuthModule (custom domain routing)
**Forbidden:** White-labeling without audit trail

---

### 2.37 Localization

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage supported languages, translations, and locale-specific configurations |
| **Why** | Platform serves Arabic and English. Adding languages should not require code changes. |
| **Business value** | Market expansion, regional compliance, customer satisfaction |
| **Technical value** | Centralized translation management, RTL/LTR support, locale fallback |

**Responsibilities:**
- Manage supported locales (ar, en, future: fr, ur, tr, id)
- Import/export translation files (JSON, CSV)
- Translation status per locale (complete, partial, missing)
- Locale-specific configurations (date format, number format, currency)
- RTL/LTR direction management
- Translation override per customer (white-label)

**Public APIs:**
- `GET /platform/localization/locales` — Supported locales
- `POST /platform/localization/locales` — Add locale
- `GET /platform/localization/translations/:locale` — Translations
- `PATCH /platform/localization/translations/:locale` — Update translations
- `GET /platform/localization/status` — Translation completeness

**Dependencies:** None (master data)
**Forbidden:** Hardcoding translations in source code

---

### 2.38 System Health

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Health check endpoints for load balancers, monitoring, and status pages |
| **Why** | Infrastructure needs health endpoints for automated recovery and status reporting |
| **Business value** | Reduced downtime, transparent status communication |
| **Technical value** | Standardized health check format, dependency cascade detection |

**Responsibilities:**
- `GET /health` — Overall health (ok, degraded, down)
- `GET /health/db` — Database connectivity and latency
- `GET /health/redis` — Redis connectivity and latency
- `GET /health/storage` — Storage service connectivity
- `GET /health/realtime` — WebSocket service status
- `GET /health/queues` — Queue depth and worker status
- Public status page (optional, at `status.cloudsignage.com`)

**Public APIs:**
- `GET /health` — Health overview
- `GET /health/:service` — Service-specific health
- `GET /health/detailed` — Detailed health (staff only)

**Dependencies:** PrismaModule, RedisModule, StorageModule, RealtimeModule
**Forbidden:** Exposing sensitive information in health endpoints

---

### 2.39 Background Jobs

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage and monitor background job queues |
| **Why** | Background jobs (email, webhooks, media processing) need monitoring and management |
| **Business value** | Operational visibility, job failure detection, performance optimization |
| **Technical value** | BullMQ queue management, retry configuration, dead letter queue |

**Responsibilities:**
- View all queues (email, webhooks, media-processing, analytics-aggregation, backup)
- View queue depth, processing rate, failure rate
- Retry failed jobs
- Move jobs to dead letter queue
- Pause/resume queues
- Configure retry policies (max attempts, backoff strategy)
- Schedule recurring jobs (cron)

**Public APIs:**
- `GET /platform/jobs/queues` — List queues
- `GET /platform/jobs/queues/:name` — Queue status
- `GET /platform/jobs/queues/:name/failed` — Failed jobs
- `POST /platform/jobs/queues/:name/failed/:id/retry` — Retry failed job
- `POST /platform/jobs/queues/:name/pause` — Pause queue
- `POST /platform/jobs/queues/:name/resume` — Resume queue

**Dependencies:** BullMQ (Redis)
**Forbidden:** Deleting jobs without audit trail

---

### 2.40 Queues

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Configure queue infrastructure and worker processes |
| **Why** | Queue configuration (concurrency, priorities, rate limits) needs central management |
| **Business value** | Performance tuning, cost optimization, SLA compliance |
| **Technical value** | Infrastructure configuration, worker scaling, priority management |

**Responsibilities:**
- Configure queue concurrency per worker
- Set queue priorities (email > webhook > media-processing > analytics)
- Configure rate limits per queue (e.g., email: 100/s, webhook: 50/s)
- Worker process management (start, stop, scale)
- Queue metrics (throughput, latency, error rate)

**Public APIs:**
- `GET /platform/queues` — Queue configuration
- `PATCH /platform/queues/:name` — Update configuration
- `GET /platform/queues/:name/metrics` — Queue metrics
- `POST /platform/queues/:name/workers` — Scale workers

**Dependencies:** BackgroundJobs, RedisModule
**Forbidden:** Stopping all workers (would halt platform operations)

---

### 2.41 Backups

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage database and storage backups |
| **Why** | Data loss is the worst-case scenario. Backups must be automated, verified, and restorable. |
| **Business value** | Disaster recovery, data protection, customer trust |
| **Technical value** | Automated pg_dump, storage replication, backup verification |

**Responsibilities:**
- Schedule automated database backups (daily full, hourly incremental)
- Schedule storage backups (daily sync to backup bucket)
- Backup verification (restore test on staging)
- Backup retention policy (daily: 7 days, weekly: 4 weeks, monthly: 12 months)
- Manual backup trigger
- Backup restoration (with confirmation and audit)
- Backup encryption

**Public APIs:**
- `GET /platform/backups` — Backup history
- `POST /platform/backups` — Trigger manual backup
- `GET /platform/backups/:id` — Backup detail
- `POST /platform/backups/:id/restore` — Restore from backup (super admin only)
- `GET /platform/backups/retention` — Retention policy
- `PATCH /platform/backups/retention` — Update retention policy

**Dependencies:** PrismaModule, StorageModule
**Forbidden:** Restoring backups without super admin approval and audit trail

---

### 2.42 Restore

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Disaster recovery restoration process |
| **Why** | When data is lost, restoration must be fast, verified, and documented |
| **Business value** | RTO (Recovery Time Objective) < 4 hours, RPO (Recovery Point Objective) < 1 hour |
| **Technical value** | Automated restoration scripts, verification checks, rollback plan |

**Responsibilities:**
- Restore database from backup (point-in-time recovery)
- Restore storage from backup
- Verify restoration integrity (row counts, checksums)
- Notify customers of restoration
- Document restoration for post-mortem
- Test restoration on staging (monthly drill)

**Public APIs:**
- `POST /platform/restore/database` — Restore database (super admin only)
- `POST /platform/restore/storage` — Restore storage (super admin only)
- `GET /platform/restore/verify` — Verify restoration
- `POST /platform/restore/drill` — Test restoration on staging

**Dependencies:** Backups, SystemHealth
**Forbidden:** Restoring without super admin approval, customer notification, and audit trail

---

### 2.43 Maintenance Mode

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Temporarily restrict customer access during maintenance |
| **Why** | Some maintenance operations require blocking customer writes to prevent data corruption |
| **Business value** | Safe maintenance windows, customer communication |
| **Technical value** | Feature flag on API gateway, graceful degradation |

**Responsibilities:**
- Toggle maintenance mode (scheduled or immediate)
- Display maintenance banner on Customer Workspace
- Block non-essential API calls (allow read, block write)
- Schedule maintenance windows (recurring or one-time)
- Notify customers via email and in-app banner
- Allow platform staff to bypass maintenance mode

**Public APIs:**
- `POST /platform/maintenance/enable` — Enable maintenance mode
- `POST /platform/maintenance/disable` — Disable maintenance mode
- `POST /platform/maintenance/schedule` — Schedule maintenance window
- `GET /platform/maintenance/status` — Current maintenance status

**Dependencies:** PlatformSettings, EmailCenter, NotificationCenter
**Forbidden:** Enabling maintenance mode without customer notification

---

### 2.44 Security Center

| Attribute | Value |
|---|---|
| **Owner** | Platform team (Security team is primary user) |
| **Purpose** | Central security management — sessions, secrets, access review, threat detection |
| **Why** | Security posture must be actively managed, not passively assumed |
| **Business value** | Compliance, customer trust, reduced breach risk |
| **Technical value** | Centralized security operations, integrated with AuditCenter |

**Responsibilities:**
- View active sessions (platform staff and customers)
- Force-terminate sessions
- Review access logs (login attempts, failed logins, IP changes)
- Manage API key access review
- Detect suspicious activities (impossible travel, brute force, credential stuffing)
- Security scorecard (2FA adoption, password strength, session hygiene)
- IP allowlist management (for Control Panel access)
- Rate limit configuration (per endpoint, per tenant)

**Public APIs:**
- `GET /platform/security/sessions` — Active sessions
- `DELETE /platform/security/sessions/:id` — Terminate session
- `GET /platform/security/access-logs` — Access logs
- `GET /platform/security/threats` — Detected threats
- `GET /platform/security/scorecard` — Security scorecard
- `PATCH /platform/security/ip-allowlist` — Update IP allowlist
- `PATCH /platform/security/rate-limits` — Update rate limits

**Dependencies:** AuthModule, AuditCenter, SessionMgmt
**Forbidden:** Accessing customer passwords or tokens

---

### 2.45 Secrets Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage platform secrets (API keys, encryption keys, provider credentials) |
| **Why** | Secrets in `.env` files are a security risk. Central management enables rotation and audit. |
| **Business value** | Security compliance, key rotation, breach containment |
| **Technical value** | Encrypted secret store, rotation reminders, access audit |

**Responsibilities:**
- Store secrets (Stripe key, SendGrid key, S3 credentials, JWT signing key)
- Rotate secrets with zero downtime (dual-key support)
- Access audit (who accessed which secret, when)
- Secret scopes (platform, billing, email, storage)
- Environment separation (staging vs. production secrets)
- Integration with external secret managers (HashiCorp Vault, AWS Secrets Manager)

**Public APIs:**
- `GET /platform/secrets` — List secrets (metadata only, no values)
- `POST /platform/secrets` — Create secret
- `PATCH /platform/secrets/:id` — Update secret
- `POST /platform/secrets/:id/rotate` — Rotate secret
- `GET /platform/secrets/:id/access-log` — Access audit

**Dependencies:** AuditCenter
**Forbidden:** Displaying secret values in API responses (only on creation/rotation)

---

### 2.46 Session Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage user sessions across platform and customer applications |
| **Why** | Session control is essential for security — force logout, session timeout, concurrent session limits |
| **Business value** | Security compliance, account takeover response |
| **Technical value** | Redis-backed session store, JWT blacklist, refresh token rotation |

**Responsibilities:**
- Track active sessions per user (platform staff and customers)
- Session timeout configuration (platform: 4h, customer: 24h, configurable)
- Concurrent session limit (platform: 2, customer: 5, configurable)
- Force logout (all devices or specific session)
- JWT revocation (blacklist in Redis until expiry)
- Refresh token rotation (detect token reuse → revoke all sessions)
- Session binding (IP, user-agent fingerprint)

**Public APIs:**
- `GET /platform/sessions` — All active sessions
- `GET /platform/sessions/user/:id` — Sessions for a user
- `DELETE /platform/sessions/:id` — Terminate session
- `DELETE /platform/sessions/user/:id` — Terminate all sessions for a user
- `PATCH /platform/sessions/config` — Update session config

**Dependencies:** AuthModule, RedisModule, AuditCenter
**Forbidden:** Accessing session token values (only metadata)

---

### 2.47 Compliance

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage regulatory compliance — GDPR, PDPL, SOC2 |
| **Why** | Legal compliance is mandatory for enterprise customers and certain regions |
| **Business value** | Enterprise sales enablement, legal protection, customer trust |
| **Technical value** | Data subject access requests, data export, data deletion, consent management |

**Responsibilities:**
- GDPR: Data subject access requests (DSAR) — export all customer data
- GDPR: Right to erasure — delete customer data (with verification)
- GDPR: Consent management — track what customer consented to
- PDPL (Saudi Arabia): Data localization, processing records
- SOC2: Access reviews, change management, incident response tracking
- Data processing agreements (DPA) tracking
- Compliance reports (on-demand)

**Public APIs:**
- `POST /platform/compliance/dsar` — Create data subject access request
- `GET /platform/compliance/dsar/:id` — DSAR status
- `GET /platform/compliance/dsar/:id/export` — Download customer data
- `POST /platform/compliance/erasure/:tenantId` — Delete customer data
- `GET /platform/compliance/consents/:tenantId` — Consent records
- `GET /platform/compliance/reports` — Compliance reports

**Dependencies:** TenantMgmt, AuditCenter, StorageModule, EmailModule
**Forbidden:** Deleting customer data without verification and backup

---

### 2.48 Automation Engine

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Rule-based automation for platform operations |
| **Why** | Manual operations don't scale. Automated rules reduce human error and response time. |
| **Business value** | Operational efficiency, proactive customer management, reduced churn |
| **Technical value** | Event-driven rules engine, integrated with all platform modules |

**Responsibilities:**
- Define automation rules (trigger → condition → action)
- Triggers: customer.created, subscription.cancelled, screen.offline > 24h, storage > 80%, trial.expiring
- Conditions: plan = FREE, region = ME, usage > limit
- Actions: send email, create support ticket, change lifecycle stage, notify staff, call webhook
- Rule versioning and audit trail
- Rule testing (dry run)
- Rule analytics (trigger count, action success rate)

**Public APIs:**
- `GET /platform/automation/rules` — List rules
- `POST /platform/automation/rules` — Create rule
- `PATCH /platform/automation/rules/:id` — Update rule
- `DELETE /platform/automation/rules/:id` — Delete rule
- `POST /platform/automation/rules/:id/test` — Dry run
- `GET /platform/automation/rules/:id/logs` — Execution logs

**Dependencies:** EmailCenter, SupportCenter, TenantMgmt, NotificationCenter, WebhookCenter
**Forbidden:** Rules that modify customer data without audit

---

### 2.49 Cron Management

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Manage scheduled tasks and recurring jobs |
| **Why** | Many platform operations are scheduled (billing renewal, trial expiry, cleanup, reports) |
| **Business value** | Automated operations, consistent scheduling, audit trail |
| **Technical value** | Centralized cron registry, distributed lock for single execution, failure alerting |

**Responsibilities:**
- Register cron jobs (schedule, handler, timeout, retry policy)
- View cron job status (last run, next run, duration, success/failure)
- Manually trigger cron jobs
- Pause/resume cron jobs
- Cron job execution logs
- Distributed lock (prevent duplicate execution across instances)

**Public APIs:**
- `GET /platform/cron/jobs` — List cron jobs
- `POST /platform/cron/jobs/:id/trigger` — Manual trigger
- `POST /platform/cron/jobs/:id/pause` — Pause job
- `POST /platform/cron/jobs/:id/resume` — Resume job
- `GET /platform/cron/jobs/:id/logs` — Execution logs

**Dependencies:** BackgroundJobs, RedisModule
**Forbidden:** Running cron jobs without timeout and failure alerting

---

### 2.50 AI Services

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | AI-powered features for platform operations and customer assistance |
| **Why** | AI can automate support, generate content, and provide insights that humans can't scale |
| **Business value** | Content generation, support automation, predictive analytics |
| **Technical value** | LLM integration (OpenAI, Anthropic), vector store, prompt management |

**Responsibilities:**
- AI-powered support ticket summarization and routing
- AI-generated content suggestions (for customer Studio)
- Churn prediction model (based on usage patterns)
- Anomaly detection (unusual usage spikes, security anomalies)
- AI-powered customer insights (natural language queries on platform data)
- Prompt template management
- AI usage tracking and cost management

**Public APIs:**
- `POST /platform/ai/summarize/ticket/:id` — Summarize support ticket
- `POST /platform/ai/suggest/content` — Content suggestions
- `GET /platform/ai/insights` — AI-generated insights
- `POST /platform/ai/query` — Natural language query
- `GET /platform/ai/usage` — AI usage and cost

**Dependencies:** SupportCenter, PlatformAnalytics, AuditCenter
**Forbidden:** Sending customer personal data to AI without consent

---

### 2.51 Developer Portal

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Public documentation and API explorer for third-party developers |
| **Why** | Developer ecosystem requires documentation, API keys, and sandbox |
| **Business value** | Integration ecosystem, marketplace apps, developer community |
| **Technical value** | OpenAPI documentation, interactive API explorer, sandbox environment |

**Responsibilities:**
- API documentation (OpenAPI/Swagger)
- Interactive API explorer (try endpoints with live API keys)
- SDK downloads (JavaScript, Python, mobile)
- Developer registration and API key management
- Sandbox environment (test API calls without affecting production)
- Webhook testing tool
- OAuth client registration
- Developer forum/support (future)

**Public APIs:**
- `GET /platform/developer/docs` — API documentation
- `GET /platform/developer/openapi.json` — OpenAPI spec
- `POST /platform/developer/sandbox` — Create sandbox
- `GET /platform/developer/sdks` — SDK downloads

**Dependencies:** APIManagement, OAuthClients
**Forbidden:** Exposing internal API documentation to public

---

### 2.52 Internal Tools

| Attribute | Value |
|---|---|
| **Owner** | Platform team |
| **Purpose** | Internal utilities for platform operations (data migration, cache flush, feature sync) |
| **Why** | Some operations don't fit into any module but are needed for day-to-day operations |
| **Business value** | Operational efficiency, reduced engineering intervention |
| **Technical value** | Admin utilities with audit trail and confirmation steps |

**Responsibilities:**
- Cache flush (Redis cache invalidation by pattern)
- Database query tool (read-only, super admin only)
- Feature flag bulk operations (enable/disable for all workspaces)
- Data consistency checks (verify referential integrity)
- User merge tool (merge duplicate accounts)
- Workspace data export (for customer migration)
- Configuration import/export (platform settings backup)

**Public APIs:**
- `POST /platform/tools/cache-flush` — Flush cache
- `POST /platform/tools/consistency-check` — Run consistency check
- `POST /platform/tools/user-merge` — Merge users (super admin only)
- `GET /platform/tools/config-export` — Export configuration
- `POST /platform/tools/config-import` — Import configuration

**Dependencies:** All modules (read-only access)
**Forbidden:** Write operations without super admin approval and audit trail

---

## 3. Module Summary

| # | Module | Category | Priority |
|---|---|---|---|
| 1 | Platform Dashboard | Operations | P0 |
| 2 | Tenant Management | Operations | P0 |
| 3 | Customer Lifecycle | Operations | P1 |
| 4 | Workspace Management (Oversight) | Operations | P0 |
| 5 | Subscription Engine | Billing | P0 |
| 6 | Plan Management | Billing | P1 |
| 7 | Billing Center | Billing | P1 |
| 8 | Invoice Engine | Billing | P1 |
| 9 | Coupon Engine | Billing | P2 |
| 10 | Tax Engine | Billing | P2 |
| 11 | Usage Tracking | Operations | P1 |
| 12 | Feature Management | Product | P1 |
| 13 | Feature Flags | Product | P0 |
| 14 | Storage Management | Operations | P1 |
| 15 | Quota Management | Operations | P1 |
| 16 | Screen Licensing | Billing | P1 |
| 17 | License Engine | Marketplace | P2 |
| 18 | Device Fleet | Operations | P0 |
| 19 | Global Monitoring | Operations | P0 |
| 20 | Platform Analytics | Analytics | P1 |
| 21 | Revenue Analytics | Analytics | P1 |
| 22 | Support Center | Support | P1 |
| 23 | Remote Assistance | Support | P2 |
| 24 | Impersonation | Support | P0 |
| 25 | Customer Timeline | Operations | P1 |
| 26 | Email Center | Communications | P1 |
| 27 | Notification Center (Platform) | Communications | P1 |
| 28 | Webhook Center (Platform) | Communications | P2 |
| 29 | API Management | Developer | P2 |
| 30 | OAuth Clients | Developer | P2 |
| 31 | Marketplace | Developer | P3 |
| 32 | Audit Center | Security | P0 |
| 33 | Activity Timeline | Operations | P2 |
| 34 | Platform Settings | Configuration | P0 |
| 35 | Branding | Configuration | P0 |
| 36 | White Label | Configuration | P2 |
| 37 | Localization | Configuration | P2 |
| 38 | System Health | Infrastructure | P0 |
| 39 | Background Jobs | Infrastructure | P1 |
| 40 | Queues | Infrastructure | P2 |
| 41 | Backups | Infrastructure | P1 |
| 42 | Restore | Infrastructure | P1 |
| 43 | Maintenance Mode | Operations | P1 |
| 44 | Security Center | Security | P1 |
| 45 | Secrets Management | Security | P1 |
| 46 | Session Management | Security | P1 |
| 47 | Compliance | Security | P2 |
| 48 | Automation Engine | Operations | P2 |
| 49 | Cron Management | Operations | P2 |
| 50 | AI Services | Product | P3 |
| 51 | Developer Portal | Developer | P3 |
| 52 | Internal Tools | Operations | P2 |

### Priority Legend

- **P0:** Required for initial separation (Phase 1–3 of migration)
- **P1:** Required for SaaS maturity (Phase 4–6 of migration)
- **P2:** Required for enterprise readiness (Post-migration)
- **P3:** Future enhancement (Marketplace, AI, Developer ecosystem)
