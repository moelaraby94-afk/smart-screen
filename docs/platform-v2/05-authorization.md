# 05 — Authorization

> **Document Type:** Authorization Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Complete RBAC model, permission matrix for every role, endpoint, page, and action

---

## 1. Role Hierarchy

### 1.1 Platform Roles

| Role | Enum Value | Level | Description |
|---|---|---|---|
| Platform Owner | `SUPER_ADMIN` | 100 | Business owner. Full platform access. |
| Operations | `OPERATIONS` | 80 | DevOps, deployment, infrastructure management. |
| Security | `SECURITY` | 70 | Security audits, session management, compliance. |
| Support | `SUPPORT` | 50 | Customer support, tickets, impersonation. |
| Billing | `BILLING` | 50 | Billing, invoices, subscriptions. |
| Developer | `DEVELOPER` | 40 | API management, developer portal, OAuth clients. |
| Platform Viewer | `VIEWER` | 10 | Read-only platform access (investors, auditors). |

**Rules:**
- Higher level can do everything lower level can do
- `SUPER_ADMIN` can do everything
- `SUPPORT` and `BILLING` are peer roles (neither can do the other's actions)
- `DEVELOPER` is limited to API management and developer portal
- `VIEWER` is read-only across all platform modules

### 1.2 Customer Roles

| Role | Enum Value | Level | Description |
|---|---|---|---|
| Owner | `OWNER` | 100 | Workspace owner. Full workspace access including deletion and billing. |
| Admin | `ADMIN` | 80 | Workspace administrator. Full workspace access except deletion. |
| Editor | `EDITOR` | 50 | Content creator. Create/edit content, screens, schedules. No team/billing/settings. |
| Viewer | `VIEWER` | 10 | Read-only access to all workspace content. |

### 1.3 System Roles

| Role | Description | Used By |
|---|---|---|
| `SYSTEM` | Automated processes, cron jobs, webhooks | Background jobs, scheduled tasks |
| `PLAYER` | Screen player devices | Player API authentication via `x-player-secret` |
| `PUBLIC` | Unauthenticated access | Public API endpoints (branding, health) |
| `OAUTH_CLIENT` | Third-party OAuth applications | API access on behalf of customers |

---

## 2. Platform Permission Matrix

### 2.1 Platform Dashboard

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View revenue | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View system health | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Configure widgets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 2.2 Tenant Management

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List tenants | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| View tenant profile | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Update tenant | ✅ | ✅ | ❌ | ✅ (notes only) | ❌ | ❌ | ❌ |
| Suspend tenant | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reactivate tenant | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Terminate tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign CSM | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View timeline | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### 2.3 Subscription Engine

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List subscriptions | ✅ | ❌ | ❌ | ✅ (read) | ✅ | ❌ | ✅ |
| View subscription | ✅ | ❌ | ❌ | ✅ (read) | ✅ | ❌ | ✅ |
| Change plan | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Extend trial | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Cancel subscription | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Reactivate | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Custom pricing | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View history | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |

### 2.4 Plan Management

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List plans | ✅ | ❌ | ❌ | ✅ (read) | ✅ | ❌ | ✅ |
| Create plan | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Update plan | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Archive plan | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage features | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage pricing | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 2.5 Billing Center

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List transactions | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View transaction | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Process refund | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage providers | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View failed payments | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Retry payment | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 2.6 Invoice Engine

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List invoices | ✅ | ❌ | ❌ | ✅ (read) | ✅ | ❌ | ✅ |
| View invoice | ✅ | ❌ | ❌ | ✅ (read) | ✅ | ❌ | ✅ |
| Download PDF | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Send invoice | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Void invoice | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create manual invoice | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 2.7 Feature Flags

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List feature flags | ✅ | ✅ | ❌ | ✅ (read) | ❌ | ✅ (read) | ✅ |
| Toggle per workspace | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Toggle global | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.8 Device Fleet

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List fleet screens | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| View screen detail | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| View fleet stats | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Force update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Global announce | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.9 Support Center

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List tickets | ✅ | ❌ | ✅ (read) | ✅ | ✅ (billing) | ❌ | ❌ |
| Create ticket | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View ticket | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update ticket | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign ticket | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Escalate ticket | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add message | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 2.10 Impersonation

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| Start impersonation | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View active sessions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Force-end session | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 2.11 Audit Center

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| Query audit events | ✅ | ✅ | ✅ | ✅ (workspace) | ✅ (billing) | ❌ | ✅ |
| Export audit log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View alerts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 2.12 Platform Settings

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| View settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Update settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Toggle maintenance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Set announcement | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.13 Branding & White Label

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| View branding | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update branding | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upload assets | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage white-label | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 2.14 Security Center

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| View sessions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Terminate session | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View access logs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View threats | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View scorecard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Update IP allowlist | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update rate limits | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.15 Staff Management

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List staff | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Create staff | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update staff role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deactivate staff | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View staff activity | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### 2.16 API Management & Developer Portal

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List API keys | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create API key | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Revoke API key | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View API usage | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage OAuth clients | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage API versions | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### 2.17 Backups & Restore

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| List backups | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Trigger backup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Restore from backup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update retention | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Run restore drill | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.18 Compliance

| Action | SUPER_ADMIN | OPERATIONS | SECURITY | SUPPORT | BILLING | DEVELOPER | VIEWER |
|---|---|---|---|---|---|---|---|
| Create DSAR | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Process erasure | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View consents | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View reports | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Customer Permission Matrix

### 3.1 Screen Management

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List screens | ✅ | ✅ | ✅ | ✅ |
| View screen | ✅ | ✅ | ✅ | ✅ |
| Create screen | ✅ | ✅ | ✅ | ❌ |
| Update screen | ✅ | ✅ | ✅ | ❌ |
| Delete screen | ✅ | ✅ | ✅ | ❌ |
| Assign playlist | ✅ | ✅ | ✅ | ❌ |
| Set override | ✅ | ✅ | ✅ | ❌ |
| Send remote command | ✅ | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| View active content | ✅ | ✅ | ✅ | ✅ |
| Bulk operations | ✅ | ✅ | ✅ | ❌ |
| Pair screen | ✅ | ✅ | ✅ | ❌ |

### 3.2 Content Library (Media)

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List media | ✅ | ✅ | ✅ | ✅ |
| View media | ✅ | ✅ | ✅ | ✅ |
| Upload media | ✅ | ✅ | ✅ | ❌ |
| Update media | ✅ | ✅ | ✅ | ❌ |
| Delete media | ✅ | ✅ | ✅ | ❌ |
| Manage folders | ✅ | ✅ | ✅ | ❌ |
| Bulk operations | ✅ | ✅ | ✅ | ❌ |
| View stats | ✅ | ✅ | ✅ | ✅ |

### 3.3 Studio Editor (Canvases)

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List canvases | ✅ | ✅ | ✅ | ✅ |
| View canvas | ✅ | ✅ | ✅ | ✅ |
| Create canvas | ✅ | ✅ | ✅ | ❌ |
| Update canvas | ✅ | ✅ | ✅ | ❌ |
| Delete canvas | ✅ | ✅ | ✅ | ❌ |
| View versions | ✅ | ✅ | ✅ | ✅ |
| Restore version | ✅ | ✅ | ✅ | ❌ |
| Duplicate | ✅ | ✅ | ✅ | ❌ |
| Use templates | ✅ | ✅ | ✅ | ❌ |

### 3.4 Playlists

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List playlists | ✅ | ✅ | ✅ | ✅ |
| View playlist | ✅ | ✅ | ✅ | ✅ |
| Create playlist | ✅ | ✅ | ✅ | ❌ |
| Update playlist | ✅ | ✅ | ✅ | ❌ |
| Delete playlist | ✅ | ✅ | ❌ | ❌ |
| Manage items | ✅ | ✅ | ✅ | ❌ |
| Duplicate | ✅ | ✅ | ✅ | ❌ |
| Preview | ✅ | ✅ | ✅ | ✅ |
| Manage groups | ✅ | ✅ | ✅ | ❌ |

**Note:** Playlist deletion is OWNER/ADMIN only. This is a content governance decision — deleting a playlist that's assigned to screens could disrupt operations.

### 3.5 Scheduling

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List schedules | ✅ | ✅ | ✅ | ✅ |
| View schedule | ✅ | ✅ | ✅ | ✅ |
| Create schedule | ✅ | ✅ | ✅ | ❌ |
| Update schedule | ✅ | ✅ | ✅ | ❌ |
| Delete schedule | ✅ | ✅ | ✅ | ❌ |
| View calendar | ✅ | ✅ | ✅ | ✅ |
| View overlaps | ✅ | ✅ | ✅ | ✅ |

### 3.6 Campaigns

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List campaigns | ✅ | ✅ | ✅ | ✅ |
| View campaign | ✅ | ✅ | ✅ | ✅ |
| Create campaign | ✅ | ✅ | ✅ | ❌ |
| Update campaign (draft) | ✅ | ✅ | ✅ | ❌ |
| Delete campaign (draft) | ✅ | ✅ | ✅ | ❌ |
| Submit for approval | ✅ | ✅ | ✅ | ❌ |
| Approve campaign | ✅ | ✅ | ❌ | ❌ |
| Reject campaign | ✅ | ✅ | ❌ | ❌ |
| Publish campaign | ✅ | ✅ | ❌ | ❌ |
| Pause campaign | ✅ | ✅ | ✅ | ❌ |
| Resume campaign | ✅ | ✅ | ✅ | ❌ |
| End campaign | ✅ | ✅ | ✅ | ❌ |
| View history | ✅ | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ | ✅ |

### 3.7 Analytics

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| View overview | ✅ | ✅ | ✅ | ✅ |
| View screen analytics | ✅ | ✅ | ✅ | ✅ |
| View content analytics | ✅ | ✅ | ✅ | ✅ |
| View proof of play | ✅ | ✅ | ✅ | ✅ |
| View campaign analytics | ✅ | ✅ | ✅ | ✅ |
| Generate report | ✅ | ✅ | ✅ | ✅ |
| Schedule report | ✅ | ✅ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ | ✅ |

### 3.8 Team Management

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List members | ✅ | ✅ | ❌ | ❌ |
| Invite member | ✅ | ✅ | ❌ | ❌ |
| Resend invite | ✅ | ✅ | ❌ | ❌ |
| Cancel invite | ✅ | ✅ | ❌ | ❌ |
| Update member role | ✅ | ✅ | ❌ | ❌ |
| Remove member | ✅ | ✅ | ❌ | ❌ |
| View member activity | ✅ | ✅ | ❌ | ❌ |
| Manage account members | ✅ | ✅ | ❌ | ❌ |

### 3.9 Workspace Settings

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| View settings | ✅ | ✅ | ❌ | ❌ |
| Update settings | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ |

### 3.10 Billing (Self-Service)

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| View plan | ✅ | ✅ | ❌ | ❌ |
| View usage | ✅ | ✅ | ❌ | ❌ |
| Upgrade plan | ✅ | ✅ | ❌ | ❌ |
| Downgrade plan | ✅ | ✅ | ❌ | ❌ |
| Cancel subscription | ✅ | ✅ | ❌ | ❌ |
| Reactivate | ✅ | ✅ | ❌ | ❌ |
| Manage payment | ✅ | ✅ | ❌ | ❌ |
| View invoices | ✅ | ✅ | ❌ | ❌ |
| Download invoice | ✅ | ✅ | ❌ | ❌ |
| Update billing info | ✅ | ✅ | ❌ | ❌ |
| Apply coupon | ✅ | ✅ | ❌ | ❌ |

### 3.11 API Keys & Webhooks

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| List API keys | ✅ | ✅ | ❌ | ❌ |
| Create API key | ✅ | ✅ | ❌ | ❌ |
| Revoke API key | ✅ | ✅ | ❌ | ❌ |
| View usage | ✅ | ✅ | ❌ | ❌ |
| List webhooks | ✅ | ✅ | ❌ | ❌ |
| Create webhook | ✅ | ✅ | ❌ | ❌ |
| Delete webhook | ✅ | ✅ | ❌ | ❌ |
| Toggle webhook | ✅ | ✅ | ❌ | ❌ |
| Test webhook | ✅ | ✅ | ❌ | ❌ |
| View deliveries | ✅ | ✅ | ❌ | ❌ |

### 3.12 Account Management

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| View profile | ✅ | ✅ | ✅ | ✅ |
| Update profile | ✅ | ✅ | ✅ | ✅ |
| Change password | ✅ | ✅ | ✅ | ✅ |
| Enable 2FA | ✅ | ✅ | ✅ | ✅ |
| Disable 2FA | ✅ | ✅ | ✅ | ✅ |
| Request email change | ✅ | ✅ | ✅ | ✅ |
| Verify email change | ✅ | ✅ | ✅ | ✅ |
| View workspaces | ✅ | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ | ✅ |
| Delete account | ✅ | ✅ | ✅ | ✅ |

### 3.13 Islamic Features

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| View prayer times | ✅ | ✅ | ✅ | ✅ |
| View config | ✅ | ✅ | ✅ | ✅ |
| Update config | ✅ | ✅ | ❌ | ❌ |
| View pause status | ✅ | ✅ | ✅ | ✅ |
| View Hijri date | ✅ | ✅ | ✅ | ✅ |
| View Ramadan config | ✅ | ✅ | ✅ | ✅ |
| Update Ramadan config | ✅ | ✅ | ❌ | ❌ |

### 3.14 Notifications

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| View notifications | ✅ | ✅ | ✅ | ✅ |
| Mark as read | ✅ | ✅ | ✅ | ✅ |
| Mark all as read | ✅ | ✅ | ✅ | ✅ |
| View preferences | ✅ | ✅ | ✅ | ✅ |
| Update preferences | ✅ | ✅ | ✅ | ✅ |

---

## 4. Authorization Enforcement Points

### 4.1 REST APIs

```
Request → JwtAuthGuard → AudienceGuard → RoleGuard → QuotaGuard → FeatureGuard → Handler
```

- **JwtAuthGuard:** Validates JWT, extracts user and claims
- **AudienceGuard:** Checks `audience` claim matches route namespace
- **RoleGuard:** Checks role against `@Roles()` or `@PlatformRoles()` decorator
- **QuotaGuard:** Checks workspace quota for write operations (customer only)
- **FeatureGuard:** Checks feature flag for the workspace (customer only)

### 4.2 WebSocket Events

| Event | Auth | Authorization |
|---|---|---|
| `connection` | JWT in handshake | Validate audience + session |
| `joinWorkspace` | JWT | Check workspace membership + role |
| `sendRemoteCommand` | JWT | Check EDITOR+ role for workspace |
| `screenHeartbeat` | `x-player-secret` | Validate screen ownership |
| `subscribeActivity` | JWT | Check platform audience + role |
| `subscribeNotifications` | JWT | Check session ownership |

### 4.3 Background Jobs

- Jobs carry `actorId` and `workspaceId` in payload
- Authorization is implicit (enqueued by authenticated service)
- Job results logged to AuditLog with actor and action
- System jobs (cron) use `SYSTEM` role — no user context

### 4.4 Scheduled Tasks

- Run as `SYSTEM` role
- Authorized by deployment (only platform staff can deploy)
- Actions logged to AuditLog with `actorId: 'system'`
- Cannot be triggered by customer API

### 4.5 Media Upload

- Auth: JWT + `EDITOR+` role
- Quota check: Storage usage + file size ≤ plan limit
- File type validation: Whitelist (image, video, audio, PDF)
- File size limit: 150MB (configurable per plan)
- Virus scan: Future (ClamAV integration)
- Audit: Log upload with filename, size, mimeType

### 4.6 File Downloads

- Auth: JWT + `VIEWER+` role (any workspace member)
- Pre-signed URL: 5-minute TTL
- Audit: Log download
- Branding files: Public (no auth)
- Player canvas: `x-player-secret` or JWT

---

## 5. Role Assignment Rules

### 5.1 Platform Roles

| Action | Who Can Assign | Target |
|---|---|---|
| Create staff | SUPER_ADMIN only | Any platform role |
| Change role | SUPER_ADMIN only | Any platform role |
| Deactivate staff | SUPER_ADMIN or SECURITY | Any platform role |
| Self-promote | ❌ Never | — |

### 5.2 Customer Roles

| Action | Who Can Assign | Target |
|---|---|---|
| Invite member | OWNER or ADMIN | EDITOR, VIEWER |
| Invite ADMIN | OWNER only | ADMIN |
| Invite OWNER | OWNER only | OWNER (requires current OWNER to transfer) |
| Change role | OWNER or ADMIN | Cannot assign role higher than own |
| Remove member | OWNER or ADMIN | Cannot remove self if last OWNER |
| Self-promote | ❌ Never | — |

---

## 6. Forbidden Actions (All Roles)

### 6.1 Platform Staff

- **Never** directly modify customer content (media, playlists, canvases, schedules) — must impersonate
- **Never** access customer payment card data (PCI compliance)
- **Never** delete audit log entries (append-only)
- **Never** issue API keys for customer workspaces without audit
- **Never** bypass 2FA (if required)

### 6.2 Customer Users

- **Never** access platform endpoints (`/platform/*`)
- **Never** access other workspaces' data
- **Never** modify subscription without payment (except mock in dev)
- **Never** assign role higher than own
- **Never** remove self if last OWNER

### 6.3 System

- **Never** make changes without audit log
- **Never** process customer data without workspace context
- **Never** send external requests without audit

---

## 7. Open Questions

1. **Should SUPPORT role be able to create workspaces for customers?** Yes — for support purposes. But with audit trail and customer notification.
2. **Should BILLING role be able to view customer screens?** No — billing staff only see financial data. Screen data is support/operations concern.
3. **Should EDITOR be able to delete playlists?** No — playlist deletion is OWNER/ADMIN only (content governance). But can delete canvases and media.
4. **Should VIEWER be able to export analytics?** Yes — export is read-only. No data modification.
5. **Should there be a custom role engine** (create custom roles with specific permissions)? Future — current 7 platform + 4 customer roles cover all use cases. Custom roles add complexity.
6. **Should OAuth clients have per-scoped permissions?** Yes — OAuth tokens carry scopes (read:screens, write:playlists). Validated by `OAuthScopeGuard`.

---

## 8. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform roles | 7 roles | Covers all operational needs without over-engineering |
| Customer roles | 4 roles | Industry standard for SaaS (OWNER/ADMIN/EDITOR/VIEWER) |
| Role hierarchy | Level-based | Higher level inherits lower level permissions |
| Playlist deletion | OWNER/ADMIN only | Content governance — prevents accidental disruption |
| Campaign approval | OWNER/ADMIN only | Separation of duties — EDITOR creates, ADMIN approves |
| Team management | OWNER/ADMIN only | Access control is sensitive — not for EDITOR/VIEWER |
| Billing | OWNER/ADMIN only | Financial operations require trust |
| API keys | OWNER/ADMIN only | Security-sensitive — not for EDITOR/VIEWER |
| Guard chain | 5 layers | Defense in depth — each guard checks one concern |
| Quota enforcement | Guard-level | Centralized, consistent, cannot be bypassed by controller |
| Feature gating | Guard-level | Runtime feature evaluation per workspace |
