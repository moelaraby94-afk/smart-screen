# 09 — Business Architecture

> **Document Type:** Business Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** SaaS business model, pricing, licensing, white-label, marketplace, revenue streams

---

## 1. Business Model

### 1.1 SaaS Subscription Model

Cloud-Screen operates on a **tiered SaaS subscription model** with screen-based pricing. The primary billing metric is the number of active screens per workspace.

```
┌─────────────────────────────────────────────────────────┐
│                  REVENUE MODEL                            │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  FREE       │  │  STARTER    │  │  PRO        │      │
│  │  $0/mo      │  │  $29/mo     │  │  $99/mo     │      │
│  │  3 screens  │  │  10 screens │  │  50 screens │      │
│  │  1GB storage│  │  5GB storage│  │  25GB storage│     │
│  │  Basic      │  │  Standard   │  │  Advanced    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  ENTERPRISE │  │  WHITE-LABEL│  │  MARKETPLACE│      │
│  │  Custom     │  │  Custom     │  │  30% comm.  │      │
│  │  Unlimited  │  │  Reseller   │  │  Per app    │      │
│  │  SLA        │  │  Custom dom │  │  sale       │      │
│  │  SSO        │  │  Branding   │  │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Revenue Streams

| Stream | Description | Pricing | Target |
|---|---|---|---|
| **Subscription** | Monthly/yearly per workspace | $0–$99/mo per plan | All customers |
| **Overage** | Extra screens beyond plan limit | $5/screen/mo | Growing customers |
| **Enterprise** | Custom contracts with SLA | $500–$10,000/mo | Large organizations |
| **White-Label** | Reseller pricing with custom branding | $200–$5,000/mo + per-screen | Agencies, resellers |
| **Marketplace** | Commission on third-party app sales | 30% of app price | Developers |
| **API** | Usage-based API access (future) | $0.01 per 1,000 calls | Developers |
| **Professional Services** | Custom development, onboarding | $150/hr | Enterprise |

### 1.3 Key Business Metrics

| Metric | Target (Year 1) | Target (Year 3) | Target (Year 5) |
|---|---|---|---|
| MRR | $10K | $100K | $500K |
| Customers | 100 | 1,000 | 5,000 |
| Active screens | 500 | 10,000 | 50,000 |
| Trial conversion | 15% | 25% | 30% |
| Churn rate | <8% | <5% | <3% |
| ARPU | $100/mo | $100/mo | $100/mo |
| LTV | $1,200 | $2,400 | $4,000 |
| CAC | $200 | $150 | $100 |

---

## 2. Plan Structure

### 2.1 Plan Definitions

| Feature | FREE | STARTER | PRO | ENTERPRISE |
|---|---|---|---|---|
| **Max screens** | 3 | 10 | 50 | Unlimited |
| **Max storage** | 1GB | 5GB | 25GB | Custom |
| **Max API calls/mo** | 1,000 | 10,000 | 100,000 | Custom |
| **Max bandwidth** | 5GB | 25GB | 100GB | Custom |
| **Proof of play** | ❌ | ✅ (30 days) | ✅ (1 year) | ✅ (custom retention) |
| **Campaigns** | ❌ | ✅ | ✅ | ✅ |
| **Scheduling** | Basic | Standard | Advanced | Advanced |
| **Islamic features** | ✅ | ✅ | ✅ | ✅ |
| **Team members** | 1 | 3 | 10 | Unlimited |
| **Webhooks** | ❌ | ✅ | ✅ | ✅ |
| **API keys** | ❌ | 1 | 5 | Unlimited |
| **Custom branding** | ❌ | ❌ | ❌ | ✅ |
| **SSO** | ❌ | ❌ | ❌ | ✅ |
| **SLA** | None | 99.5% | 99.9% | 99.99% |
| **Support** | Email | Email + Chat | Priority | Dedicated |
| **Price/mo** | $0 | $29 | $99 | Custom |
| **Price/yr** | $0 | $290 (2 months free) | $990 (2 months free) | Custom |
| **Trial** | N/A | 14 days | 14 days | 30 days |

### 2.2 Regional Pricing

| Region | Currency | STARTER | PRO | Notes |
|---|---|---|---|---|
| Global | USD | $29 | $99 | Default |
| Middle East | SAR | 109 SAR | 371 SAR | VAT included |
| Middle East | AED | 107 AED | 364 AED | VAT included |
| Europe | EUR | €27 | €92 | VAT not included |
| Asia | USD | $19 | $69 | Regional discount |

### 2.3 Plan Lifecycle

```
Plan Created (DRAFT)
  │
  ▼
Plan Published (ACTIVE)
  │
  ├── Customers subscribe to plan
  │
  ▼
Plan Archived (ARCHIVED)
  │ - No new subscriptions
  │ - Existing subscriptions grandfathered
  │ - Plan definition preserved for historical reference
  │
  ▼
Plan Migrated (all customers moved to new plan)
  │ - Archive becomes obsolete
```

---

## 3. Trial System

### 3.1 Trial Flow

```
Customer registers
  │
  ├── Workspace created
  ├── Subscription created (status: TRIALING)
  ├── Trial plan: PRO (configurable)
  ├── Trial duration: 14 days (configurable per plan)
  │
  ▼
Trial active
  │
  ├── Full PRO features available
  ├── Trial banner shown in Customer Workspace
  ├── Email reminders: Day 7, Day 12, Day 14
  │
  ▼
Trial expires
  │
  ├── If payment method added: Convert to paid PRO
  ├── If no payment method: Downgrade to FREE
  ├── Grace period: 7 days (configurable)
  │   - Screens beyond FREE limit disabled (not deleted)
  │   - Content preserved
  │   - Customer can upgrade anytime
  │
  ▼
Post-grace
  │
  ├── Customer on FREE: Limited features
  ├── Customer upgrades: Full restoration
  ├── Customer churns: Data preserved 90 days, then deleted
```

### 3.2 Trial Extensions

- Platform staff can extend trial by up to 14 days
- Extension reason recorded in audit log
- Maximum total trial: 30 days (14 default + 14 extension)
- Extension triggers email notification to customer

---

## 4. Overage Billing

### 4.1 Screen Overage

| Condition | Action |
|---|---|
| Active screens = plan limit | Warning at 90% utilization |
| Active screens > plan limit | Block new screen pairing |
| Customer wants more screens | Upgrade plan OR pay overage |
| Overage rate | $5/screen/month (prorated) |
| Overage billing | Added to next invoice |

### 4.2 Storage Overage

| Condition | Action |
|---|---|
| Storage usage > plan limit | Block new uploads |
| Customer wants more storage | Upgrade plan OR buy storage add-on |
| Storage add-on | $2/GB/month |
| Storage add-on billing | Added to next invoice |

### 4.3 API Overage

| Condition | Action |
|---|---|
| API calls > plan limit | Rate limit to 10 req/min (degraded) |
| Customer wants more API calls | Upgrade plan |
| No API overage billing | API is a plan feature, not metered (future: metered) |

---

## 5. White-Label Program

### 5.1 White-Label Tiers

| Tier | Price | Features | Target |
|---|---|---|---|
| **Reseller** | $200/mo + $3/screen | Custom branding, custom domain, hide "Powered by", reseller dashboard | Small agencies |
| **Agency** | $500/mo + $2/screen | Everything in Reseller + multi-tenant management, bulk provisioning, priority support | Mid-size agencies |
| **Enterprise Reseller** | $2,000/mo + $1/screen | Everything in Agency + white-label emails, custom login page, API access, dedicated CSM | Large resellers |

### 5.2 Reseller Hierarchy

```
Platform Owner (Cloud-Screen)
  │
  ├── Reseller A (Agency)
  │   ├── Customer 1 (branded as Reseller A)
  │   ├── Customer 2 (branded as Reseller A)
  │   └── Customer 3 (branded as Reseller A)
  │
  ├── Reseller B (Enterprise Reseller)
  │   ├── Customer 4 (branded as Reseller B)
  │   └── Customer 5 (branded as Reseller B)
  │
  └── Direct Customer 6 (branded as Cloud-Screen)
```

### 5.3 White-Label Features

| Feature | Description |
|---|---|
| Custom logo | Replace Cloud-Screen logo with reseller's logo |
| Custom colors | Brand colors applied to UI |
| Custom domain | `signage.reseller-brand.com` instead of `app.cloudsignage.com` |
| Custom email | Emails sent from `noreply@reseller-brand.com` |
| Custom login | Branded login page |
| Hide branding | Remove "Powered by Cloud-Screen" |
| Reseller dashboard | Manage customers under reseller account |
| Bulk provisioning | Create multiple workspaces at once |

---

## 6. Marketplace

### 6.1 Marketplace Model

```
Developer creates app
  │
  ├── App submitted to marketplace
  ├── Platform reviews app (security, functionality)
  ├── App approved → listed in marketplace
  │
  ▼
Customer browses marketplace
  │
  ├── Customer installs app
  ├── App requests OAuth scopes
  ├── Customer grants access
  ├── App installed on workspace
  │
  ▼
App generates revenue
  │
  ├── Free app: No revenue
  ├── One-time purchase: Customer pays once
  ├── Subscription: Customer pays monthly
  │
  ▼
Revenue split
  │
  ├── Developer: 70%
  ├── Platform: 30%
  ├── Payout: Monthly to developer
```

### 6.2 App Categories

| Category | Examples |
|---|---|
| **Content** | Weather widget, news feed, social media feed, RSS ticker |
| **Analytics** | Advanced analytics dashboard, ROI calculator |
| **Integration** | Slack notifications, Google Calendar sync, SharePoint |
| **Productivity** | Bulk content uploader, playlist generator, approval workflow |
| **Industry** | Mosque prayer times, restaurant menu, retail promotions |

### 6.3 App Review Process

1. **Submission:** Developer submits app with description, screenshots, scopes, pricing
2. **Security review:** Platform checks requested scopes, data access patterns
3. **Functionality review:** Platform tests app in sandbox environment
4. **Approval:** App listed in marketplace
5. **Ongoing monitoring:** Platform monitors app usage, security, and customer feedback
6. **Suspension:** Platform can suspend apps that violate policies

---

## 7. Licensing

### 7.1 License Types

| Type | Description | Use Case |
|---|---|---|
| **SaaS** | Subscription-based, hosted by Cloud-Screen | Default |
| **On-Premise** | Self-hosted, license key required | Government, air-gapped networks |
| **Marketplace** | App-specific license | Third-party apps |

### 7.2 On-Premise Licensing

```
Customer purchases on-premise license
  │
  ├── License key generated (signed, tamper-proof)
  ├── License bound to:
  │   - Hardware fingerprint (CPU ID + MAC address)
  │   - Domain name
  │   - Max screens
  │   - Expiration date
  │
  ▼
Customer deploys on-premise
  │
  ├── Player validates license on startup
  ├── License checked offline (no internet required)
  ├── License renewal: Contact platform for new key
  │
  ▼
License management
  │
  ├── Platform tracks active licenses
  ├── Platform can revoke licenses (remote kill switch if online)
  ├── License audit trail
```

---

## 8. Customer Lifecycle

### 8.1 Lifecycle Stages

```
LEAD
  │ - Visited marketing site
  │ - Not registered
  │
  ▼
TRIAL
  │ - Registered, on trial
  │ - Trial active
  │
  ▼
ACTIVE (Paid)
  │ - Subscription active
  │ - Using platform
  │
  ├──► AT_RISK
  │    │ - Usage declining
  │    │ - Support tickets increasing
  │    │ - Payment failures
  │    │
  │    ├──► CHURNED
  │    │    │ - Subscription cancelled
  │    │    │ - Data preserved 90 days
  │    │    │
  │    │    └──► REACTIVATED
  │    │         │ - Customer returns
  │    │         │ - Data restored
  │    │         │
  │    │         └──► ACTIVE
  │    │
  │    └──► ACTIVE (retained)
  │
  └──► ACTIVE (growing)
       │ - Adding screens
       │ - Upgrading plans
       │ - Using more features
```

### 8.2 Lifecycle Automation

| Trigger | Condition | Action |
|---|---|---|
| `trial.started` | Trial begins | Send welcome email, start onboarding |
| `trial.day_7` | 7 days into trial | Send "getting started" email |
| `trial.day_12` | 12 days into trial | Send "upgrade now" email |
| `trial.expired` | Trial expires | Downgrade to FREE, send "we miss you" email |
| `subscription.cancelled` | Customer cancels | Send exit survey, trigger retention campaign |
| `usage.declining` | Usage down 50% in 30 days | Flag as AT_RISK, notify CSM |
| `payment.failed` | Payment fails | Send dunning email, retry after 3 days |
| `support.escalated` | Ticket escalated to engineering | Notify CSM, flag as AT_RISK |
| `screen.offline_24h` | Screen offline > 24 hours | Send "your screen is offline" email |
| `storage.80%` | Storage at 80% of limit | Send "upgrade for more storage" email |

---

## 9. Dunning Management

### 9.1 Dunning Flow

```
Payment fails
  │
  ├── Day 0: Dunning email 1 (payment failed, retry in 3 days)
  ├── Day 3: Retry payment
  │   ├── Success → Subscription active, email "payment received"
  │   └── Fail → Dunning email 2 (payment failed, retry in 5 days)
  ├── Day 8: Retry payment
  │   ├── Success → Subscription active
  │   └── Fail → Dunning email 3 (final notice, retry in 7 days)
  ├── Day 15: Retry payment
  │   ├── Success → Subscription active
  │   └── Fail → Subscription suspended (PAST_DUE)
  ├── Day 22: Grace period ends
  │   └── Subscription cancelled, downgrade to FREE
  │
  ▼
Recovery
  │
  ├── Customer updates payment method
  ├── Outstanding balance charged
  ├── Subscription reactivated
  └── Features restored
```

### 9.2 Dunning Configuration

| Setting | Default | Configurable |
|---|---|---|
| Retry attempts | 3 | Yes |
| Retry intervals | 3, 5, 7 days | Yes |
| Grace period | 7 days | Yes |
| Email templates | 3 (failed, final, suspended) | Yes |
| Suspension behavior | Read-only access | Yes |
| Cancellation behavior | Downgrade to FREE | Yes |

---

## 10. Revenue Recognition

### 10.1 Recognition Rules

| Revenue Type | Recognition | Timing |
|---|---|---|
| Monthly subscription | Recognized monthly | On invoice generation |
| Annual subscription | Deferred revenue, recognized monthly | On payment, 1/12 per month |
| Overage charges | Recognized on invoice | On invoice generation |
| One-time purchases (marketplace) | Recognized immediately | On purchase |
| Professional services | Recognized on delivery | On milestone completion |

### 10.2 Financial Reports

| Report | Frequency | Audience |
|---|---|---|
| MRR/ARR summary | Daily | Platform team, investors |
| Revenue by plan | Monthly | Platform team |
| Revenue by region | Monthly | Platform team |
| Churn analysis | Monthly | Platform team |
| Cohort retention | Quarterly | Platform team, investors |
| Marketplace revenue | Monthly | Platform team, developers |
| Tax summary | Quarterly | Finance team |

---

## 11. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Primary metric | Active screens | Industry standard, directly tied to value |
| Free plan | Yes (3 screens) | Reduces friction, drives adoption |
| Trial plan | PRO (14 days) | Show full value, drive conversion |
| Annual discount | 2 months free (~17%) | Industry standard, improves cash flow |
| Overage pricing | $5/screen/mo | Simple, predictable, drives upgrades |
| White-label | Tiered (Reseller/Agency/Enterprise) | Different price points for different segments |
| Marketplace commission | 30% | Industry standard (Apple, Google) |
| On-premise licensing | Yes | Government/enterprise market in MENA |
| Dunning | 3 retries + 7-day grace | Balance between recovery and revenue protection |
| Churn data retention | 90 days | Enough time for win-back, not too long for storage cost |
