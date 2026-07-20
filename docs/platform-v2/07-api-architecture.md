# 07 — API Architecture

> **Document Type:** API Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** API namespaces, route inventory, versioning, error handling, response format

---

## 1. API Namespaces

### 1.1 Namespace Structure

```
/api/v1/platform/*     → Platform modules (Control Panel API)
/api/v1/customer/*     → Customer modules (Customer Workspace API)
/api/v1/auth/*         → Authentication (shared, public + authenticated)
/api/v1/player/*       → Player API (screen devices, x-player-secret auth)
/api/v1/public/*       → Public API (no auth, branding, health)
/api/v1/internal/*     → Internal API (IP allowlist, service-to-service)
/api/v2/*              → Future API version
```

### 1.2 Namespace Ownership

| Namespace | Owner | Auth | Guard Chain | Frontend |
|---|---|---|---|---|
| `/platform/*` | Platform team | JWT (audience: platform) | PlatformAudience + PlatformStaffDb | Control Panel |
| `/customer/*` | Customer team | JWT (audience: customer) | CustomerAudience + RolesGuard + Quota + Feature | Customer Workspace |
| `/auth/*` | Platform team | Mixed (public + JWT) | Endpoint-specific | Both apps |
| `/player/*` | Platform team | x-player-secret | PlayerGuard | Player app |
| `/public/*` | Platform team | None | None | Both apps + browser |
| `/internal/*` | Platform team | IP allowlist | IPGuard | N/A (service-to-service) |
| `/health` | Platform team | None | None | Load balancer |

---

## 2. Complete Route Inventory

### 2.1 Auth Routes (`/auth/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new customer |
| POST | `/auth/login` | Public | Login (returns JWT + sets cookies) |
| POST | `/auth/logout` | JWT | Logout (revoke session) |
| POST | `/auth/refresh` | Refresh cookie | Refresh access token |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/verify-email` | Public | Verify email with token |
| POST | `/auth/2fa/setup` | JWT | Enable 2FA (returns QR code) |
| POST | `/auth/2fa/verify` | JWT | Verify 2FA code |
| POST | `/auth/2fa/disable` | JWT | Disable 2FA |
| POST | `/auth/2fa/backup-codes` | JWT | Generate backup codes |
| GET | `/auth/me` | JWT | Get current user info |
| POST | `/auth/change-password` | JWT | Change password |
| POST | `/auth/exchange-impersonation` | Exchange token | Exchange impersonation token for JWT |
| POST | `/auth/exit-impersonation` | JWT (impersonated) | Exit impersonation, return platform token |
| GET | `/auth/sessions` | JWT | List active sessions for current user |
| DELETE | `/auth/sessions/:id` | JWT | Terminate session |

### 2.2 Platform Routes (`/platform/*`)

#### Dashboard
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/dashboard` | All staff | Aggregated dashboard |
| GET | `/platform/dashboard/revenue` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | Revenue charts |
| GET | `/platform/dashboard/growth` | SUPER_ADMIN, OPERATIONS, VIEWER | Growth charts |
| GET | `/platform/dashboard/health` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | System health |

#### Tenants
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/tenants` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING, VIEWER | List tenants |
| GET | `/platform/tenants/:id` | Same as above | Tenant profile |
| PATCH | `/platform/tenants/:id` | SUPER_ADMIN, OPERATIONS, SUPPORT (notes) | Update tenant |
| POST | `/platform/tenants/:id/suspend` | SUPER_ADMIN, OPERATIONS | Suspend |
| POST | `/platform/tenants/:id/reactivate` | SUPER_ADMIN, OPERATIONS | Reactivate |
| POST | `/platform/tenants/:id/terminate` | SUPER_ADMIN | Terminate |
| GET | `/platform/tenants/:id/timeline` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING, VIEWER | Timeline |

#### Lifecycle
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/lifecycle/stages` | All staff | List stages |
| GET | `/platform/lifecycle/funnel` | SUPER_ADMIN, OPERATIONS, VIEWER | Funnel |
| PATCH | `/platform/tenants/:id/lifecycle` | SUPER_ADMIN, OPERATIONS | Change stage |
| GET | `/platform/tenants/:id/lifecycle/history` | All staff | Stage history |

#### Workspaces (Oversight)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/workspaces` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, VIEWER | List all |
| GET | `/platform/workspaces/:id` | Same | Detail |
| POST | `/platform/tenants/:id/workspaces` | SUPER_ADMIN, OPERATIONS, SUPPORT | Create |
| PATCH | `/platform/workspaces/:id` | SUPER_ADMIN, OPERATIONS, SUPPORT | Update |
| DELETE | `/platform/workspaces/:id` | SUPER_ADMIN | Delete |

#### Subscriptions
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/subscriptions` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER | List |
| GET | `/platform/subscriptions/:id` | Same | Detail |
| PATCH | `/platform/subscriptions/:id` | SUPER_ADMIN, BILLING | Change plan |
| POST | `/platform/subscriptions/:id/cancel` | SUPER_ADMIN, BILLING | Cancel |
| POST | `/platform/subscriptions/:id/reactivate` | SUPER_ADMIN, BILLING | Reactivate |
| GET | `/platform/subscriptions/:id/history` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER | History |

#### Plans
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/plans` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER | List |
| POST | `/platform/plans` | SUPER_ADMIN, BILLING | Create |
| PATCH | `/platform/plans/:id` | SUPER_ADMIN, BILLING | Update |
| DELETE | `/platform/plans/:id` | SUPER_ADMIN, BILLING | Archive |
| PATCH | `/platform/plans/:id/features` | SUPER_ADMIN, BILLING | Update features |
| GET | `/platform/plans/:id/pricing` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER | Pricing |
| PATCH | `/platform/plans/:id/pricing` | SUPER_ADMIN, BILLING | Update pricing |

#### Billing
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/billing/transactions` | SUPER_ADMIN, BILLING, VIEWER | List |
| GET | `/platform/billing/transactions/:id` | Same | Detail |
| POST | `/platform/billing/transactions/:id/refund` | SUPER_ADMIN, BILLING | Refund |
| GET | `/platform/billing/providers` | SUPER_ADMIN, BILLING | Providers |
| PATCH | `/platform/billing/providers/:id` | SUPER_ADMIN, BILLING | Update |
| GET | `/platform/billing/failed-payments` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER | Failed |
| POST | `/platform/billing/failed-payments/:id/retry` | SUPER_ADMIN, BILLING | Retry |

#### Invoices
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/invoices` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER | List |
| GET | `/platform/invoices/:id` | Same | Detail |
| GET | `/platform/invoices/:id/pdf` | Same | Download PDF |
| POST | `/platform/invoices/:id/send` | SUPER_ADMIN, BILLING | Send |
| POST | `/platform/invoices/:id/void` | SUPER_ADMIN, BILLING | Void |
| POST | `/platform/invoices` | SUPER_ADMIN, BILLING | Create manual |

#### Coupons
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/coupons` | SUPER_ADMIN, BILLING, VIEWER | List |
| POST | `/platform/coupons` | SUPER_ADMIN, BILLING | Create |
| PATCH | `/platform/coupons/:id` | SUPER_ADMIN, BILLING | Update |
| DELETE | `/platform/coupons/:id` | SUPER_ADMIN, BILLING | Archive |
| GET | `/platform/coupons/:id/redemptions` | SUPER_ADMIN, BILLING, VIEWER | Redemptions |
| GET | `/platform/coupons/analytics` | SUPER_ADMIN, BILLING, VIEWER | Analytics |

#### Tax
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/tax/rates` | SUPER_ADMIN, BILLING, VIEWER | List |
| POST | `/platform/tax/rates` | SUPER_ADMIN, BILLING | Create |
| PATCH | `/platform/tax/rates/:id` | SUPER_ADMIN, BILLING | Update |
| POST | `/platform/tax/calculate` | SUPER_ADMIN, BILLING | Calculate |
| GET | `/platform/tax/reports` | SUPER_ADMIN, BILLING, VIEWER | Reports |

#### Usage
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/usage/:workspaceId` | SUPER_ADMIN, OPERATIONS, SUPPORT, BILLING, VIEWER | Current |
| GET | `/platform/usage/:workspaceId/history` | Same | History |
| GET | `/platform/usage/:workspaceId/limits` | Same | Limits |
| GET | `/platform/usage/overages` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | Overages |

#### Features
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/features` | All staff | Catalog |
| POST | `/platform/features` | SUPER_ADMIN | Create |
| PATCH | `/platform/features/:id` | SUPER_ADMIN | Update |
| GET | `/platform/features/:id/adoption` | SUPER_ADMIN, OPERATIONS, VIEWER | Adoption |
| PATCH | `/platform/plans/:id/features` | SUPER_ADMIN, BILLING | Map to plan |

#### Feature Flags
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/feature-flags` | SUPER_ADMIN, OPERATIONS, SUPPORT, VIEWER | All |
| GET | `/platform/feature-flags/:workspaceId` | Same | Workspace flags |
| PATCH | `/platform/feature-flags/:workspaceId` | SUPER_ADMIN, OPERATIONS, SUPPORT | Toggle |
| GET | `/platform/feature-flags/global` | SUPER_ADMIN, OPERATIONS, VIEWER | Global |
| PATCH | `/platform/feature-flags/global` | SUPER_ADMIN, OPERATIONS | Update global |

#### Fleet
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/fleet/screens` | SUPER_ADMIN, OPERATIONS, SUPPORT, VIEWER | List |
| GET | `/platform/fleet/screens/:id` | Same | Detail |
| GET | `/platform/fleet/stats` | Same | Stats |
| GET | `/platform/fleet/versions` | SUPER_ADMIN, OPERATIONS, VIEWER | Versions |
| POST | `/platform/fleet/announce` | SUPER_ADMIN, OPERATIONS | Announce |
| POST | `/platform/fleet/screens/:id/force-update` | SUPER_ADMIN, OPERATIONS | Force update |

#### Monitoring
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/monitoring/status` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | Status |
| GET | `/platform/monitoring/metrics` | SUPER_ADMIN, OPERATIONS | Metrics |
| GET | `/platform/monitoring/alerts` | SUPER_ADMIN, OPERATIONS, SECURITY | Alerts |
| POST | `/platform/monitoring/alerts/:id/acknowledge` | SUPER_ADMIN, OPERATIONS, SECURITY | Acknowledge |
| GET | `/platform/monitoring/incidents` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | Incidents |

#### Analytics
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/analytics/adoption` | SUPER_ADMIN, OPERATIONS, VIEWER | Adoption |
| GET | `/platform/analytics/engagement` | SUPER_ADMIN, OPERATIONS, VIEWER | Engagement |
| GET | `/platform/analytics/cohorts` | SUPER_ADMIN, OPERATIONS, VIEWER | Cohorts |
| GET | `/platform/analytics/funnels` | SUPER_ADMIN, OPERATIONS, VIEWER | Funnels |
| POST | `/platform/analytics/reports` | SUPER_ADMIN, OPERATIONS | Custom |

#### Revenue
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/revenue/summary` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | MRR/ARR |
| GET | `/platform/revenue/churn` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | Churn |
| GET | `/platform/revenue/ltv` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | LTV |
| GET | `/platform/revenue/by-plan` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | By plan |
| GET | `/platform/revenue/by-region` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | By region |
| GET | `/platform/revenue/forecast` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER | Forecast |

#### Support
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/support/tickets` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING | List |
| POST | `/platform/support/tickets` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING | Create |
| GET | `/platform/support/tickets/:id` | Same | Detail |
| PATCH | `/platform/support/tickets/:id` | Same | Update |
| POST | `/platform/support/tickets/:id/messages` | Same | Add message |
| POST | `/platform/support/tickets/:id/assign` | SUPER_ADMIN, SECURITY, SUPPORT, BILLING | Assign |
| POST | `/platform/support/tickets/:id/escalate` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT | Escalate |
| GET | `/platform/support/tickets/:id/messages` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING | Messages |
| GET | `/platform/support/analytics` | SUPER_ADMIN, SECURITY, SUPPORT | Analytics |

#### Impersonation
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/platform/impersonation/start` | SUPER_ADMIN, SUPPORT | Start |
| GET | `/platform/impersonation/active` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT | Active |
| POST | `/platform/impersonation/:id/end` | SUPER_ADMIN, OPERATIONS, SECURITY | Force-end |

#### Staff Management
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/staff` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | List |
| POST | `/platform/staff` | SUPER_ADMIN | Create |
| PATCH | `/platform/staff/:id` | SUPER_ADMIN | Update role |
| DELETE | `/platform/staff/:id` | SUPER_ADMIN, SECURITY | Deactivate |
| GET | `/platform/staff/:id/activity` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | Activity |

#### Audit
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/audit/events` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING, VIEWER | Query |
| GET | `/platform/audit/events/export` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | Export |
| GET | `/platform/audit/actors/:id/actions` | SUPER_ADMIN, OPERATIONS, SECURITY | By actor |
| GET | `/platform/audit/targets/:id/history` | SUPER_ADMIN, OPERATIONS, SECURITY | By target |
| GET | `/platform/audit/alerts` | SUPER_ADMIN, OPERATIONS, SECURITY | Alerts |

#### Settings
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/settings` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | View |
| PATCH | `/platform/settings` | SUPER_ADMIN, OPERATIONS | Update |
| POST | `/platform/settings/maintenance` | SUPER_ADMIN, OPERATIONS | Maintenance |
| POST | `/platform/settings/announcement` | SUPER_ADMIN, OPERATIONS | Announcement |

#### Branding
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/branding` | SUPER_ADMIN, OPERATIONS, VIEWER | View |
| PATCH | `/platform/branding` | SUPER_ADMIN, OPERATIONS | Update |
| POST | `/platform/branding/upload` | SUPER_ADMIN, OPERATIONS | Upload |
| GET | `/platform/branding/overrides/:tenantId` | SUPER_ADMIN, VIEWER | Overrides |
| PATCH | `/platform/branding/overrides/:tenantId` | SUPER_ADMIN | Set override |

#### Security
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/security/sessions` | SUPER_ADMIN, OPERATIONS, SECURITY | Sessions |
| DELETE | `/platform/security/sessions/:id` | SUPER_ADMIN, OPERATIONS, SECURITY | Terminate |
| GET | `/platform/security/access-logs` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | Logs |
| GET | `/platform/security/threats` | SUPER_ADMIN, OPERATIONS, SECURITY | Threats |
| GET | `/platform/security/scorecard` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER | Scorecard |
| PATCH | `/platform/security/ip-allowlist` | SUPER_ADMIN, OPERATIONS, SECURITY | Allowlist |
| PATCH | `/platform/security/rate-limits` | SUPER_ADMIN, OPERATIONS | Rate limits |

#### Backups
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/backups` | SUPER_ADMIN, OPERATIONS, SECURITY | List |
| POST | `/platform/backups` | SUPER_ADMIN, OPERATIONS | Trigger |
| GET | `/platform/backups/:id` | SUPER_ADMIN, OPERATIONS, SECURITY | Detail |
| POST | `/platform/backups/:id/restore` | SUPER_ADMIN | Restore |
| GET | `/platform/backups/retention` | SUPER_ADMIN, OPERATIONS, SECURITY | Policy |
| PATCH | `/platform/backups/retention` | SUPER_ADMIN, OPERATIONS | Update |

#### Jobs
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/platform/jobs/queues` | SUPER_ADMIN, OPERATIONS | List |
| GET | `/platform/jobs/queues/:name` | SUPER_ADMIN, OPERATIONS | Status |
| GET | `/platform/jobs/queues/:name/failed` | SUPER_ADMIN, OPERATIONS | Failed |
| POST | `/platform/jobs/queues/:name/failed/:id/retry` | SUPER_ADMIN, OPERATIONS | Retry |
| POST | `/platform/jobs/queues/:name/pause` | SUPER_ADMIN, OPERATIONS | Pause |
| POST | `/platform/jobs/queues/:name/resume` | SUPER_ADMIN, OPERATIONS | Resume |

### 2.3 Customer Routes (`/customer/*`)

#### Overview
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/overview` | All | Dashboard |
| GET | `/customer/overview/activity` | All | Recent activity |

#### Screens
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/screens` | All | List |
| POST | `/customer/screens` | OWNER, ADMIN, EDITOR | Create |
| GET | `/customer/screens/:id` | All | Detail |
| PATCH | `/customer/screens/:id` | OWNER, ADMIN, EDITOR | Update |
| DELETE | `/customer/screens/:id` | OWNER, ADMIN, EDITOR | Delete |
| POST | `/customer/screens/:id/assignments` | OWNER, ADMIN, EDITOR | Assign |
| PATCH | `/customer/screens/:id/assignments/:aid` | OWNER, ADMIN, EDITOR | Reorder |
| DELETE | `/customer/screens/:id/assignments/:aid` | OWNER, ADMIN, EDITOR | Remove |
| POST | `/customer/screens/:id/override` | OWNER, ADMIN, EDITOR | Override |
| DELETE | `/customer/screens/:id/override` | OWNER, ADMIN, EDITOR | Remove override |
| POST | `/customer/screens/:id/remote-command` | OWNER, ADMIN, EDITOR | Command |
| GET | `/customer/screens/:id/analytics` | All | Analytics |
| GET | `/customer/screens/:id/active-content` | All | Active content |
| POST | `/customer/screens/bulk-assign` | OWNER, ADMIN, EDITOR | Bulk |
| POST | `/customer/screens/bulk-command` | OWNER, ADMIN, EDITOR | Bulk |

#### Media
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/customer/media/upload` | OWNER, ADMIN, EDITOR | Upload |
| GET | `/customer/media` | All | List |
| GET | `/customer/media/:id` | All | Detail |
| DELETE | `/customer/media/:id` | OWNER, ADMIN, EDITOR | Delete |
| PATCH | `/customer/media/:id` | OWNER, ADMIN, EDITOR | Update |
| GET | `/customer/media/folders` | All | Folders |
| POST | `/customer/media/folders` | OWNER, ADMIN, EDITOR | Create folder |
| PATCH | `/customer/media/folders/:id` | OWNER, ADMIN, EDITOR | Rename |
| DELETE | `/customer/media/folders/:id` | OWNER, ADMIN, EDITOR | Delete |
| POST | `/customer/media/bulk-delete` | OWNER, ADMIN, EDITOR | Bulk |
| POST | `/customer/media/bulk-move` | OWNER, ADMIN, EDITOR | Bulk |
| GET | `/customer/media/stats` | All | Stats |

#### Canvases
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/canvases` | All | List |
| POST | `/customer/canvases` | OWNER, ADMIN, EDITOR | Create |
| GET | `/customer/canvases/:id` | All | Detail |
| PATCH | `/customer/canvases/:id` | OWNER, ADMIN, EDITOR | Update |
| DELETE | `/customer/canvases/:id` | OWNER, ADMIN, EDITOR | Delete |
| GET | `/customer/canvases/:id/versions` | All | Versions |
| POST | `/customer/canvases/:id/restore/:versionId` | OWNER, ADMIN, EDITOR | Restore |
| POST | `/customer/canvases/:id/duplicate` | OWNER, ADMIN, EDITOR | Duplicate |
| GET | `/customer/canvases/templates` | All | Templates |
| POST | `/customer/canvases/from-template` | OWNER, ADMIN, EDITOR | From template |

#### Playlists
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/playlists` | All | List |
| POST | `/customer/playlists` | OWNER, ADMIN, EDITOR | Create |
| GET | `/customer/playlists/:id` | All | Detail |
| PATCH | `/customer/playlists/:id` | OWNER, ADMIN, EDITOR | Update |
| DELETE | `/customer/playlists/:id` | OWNER, ADMIN | Delete |
| PATCH | `/customer/playlists/:id/items` | OWNER, ADMIN, EDITOR | Items |
| POST | `/customer/playlists/:id/duplicate` | OWNER, ADMIN, EDITOR | Duplicate |
| GET | `/customer/playlists/groups` | All | Groups |
| POST | `/customer/playlists/groups` | OWNER, ADMIN, EDITOR | Create group |
| PATCH | `/customer/playlists/groups/:id` | OWNER, ADMIN, EDITOR | Update |
| DELETE | `/customer/playlists/groups/:id` | OWNER, ADMIN, EDITOR | Delete |
| POST | `/customer/playlists/:id/preview` | All | Preview |
| POST | `/customer/playlists/:id/replace-items` | OWNER, ADMIN, EDITOR | Replace |

#### Schedules
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/schedules` | All | List |
| POST | `/customer/schedules` | OWNER, ADMIN, EDITOR | Create |
| GET | `/customer/schedules/:id` | All | Detail |
| PATCH | `/customer/schedules/:id` | OWNER, ADMIN, EDITOR | Update |
| DELETE | `/customer/schedules/:id` | OWNER, ADMIN, EDITOR | Delete |
| GET | `/customer/schedules/calendar` | All | Calendar |
| GET | `/customer/schedules/overlaps` | All | Overlaps |

#### Campaigns
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/campaigns` | All | List |
| POST | `/customer/campaigns` | OWNER, ADMIN, EDITOR | Create |
| GET | `/customer/campaigns/:id` | All | Detail |
| PATCH | `/customer/campaigns/:id` | OWNER, ADMIN, EDITOR | Update (draft) |
| DELETE | `/customer/campaigns/:id` | OWNER, ADMIN, EDITOR | Delete (draft) |
| POST | `/customer/campaigns/:id/submit` | OWNER, ADMIN, EDITOR | Submit |
| POST | `/customer/campaigns/:id/approve` | OWNER, ADMIN | Approve |
| POST | `/customer/campaigns/:id/reject` | OWNER, ADMIN | Reject |
| POST | `/customer/campaigns/:id/publish` | OWNER, ADMIN | Publish |
| POST | `/customer/campaigns/:id/pause` | OWNER, ADMIN, EDITOR | Pause |
| POST | `/customer/campaigns/:id/resume` | OWNER, ADMIN, EDITOR | Resume |
| POST | `/customer/campaigns/:id/end` | OWNER, ADMIN, EDITOR | End |
| GET | `/customer/campaigns/:id/history` | All | History |
| GET | `/customer/campaigns/:id/analytics` | All | Analytics |

#### Team
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/team/members` | OWNER, ADMIN | List |
| POST | `/customer/team/invites` | OWNER, ADMIN | Invite |
| GET | `/customer/team/invites` | OWNER, ADMIN | Pending |
| POST | `/customer/team/invites/:id/resend` | OWNER, ADMIN | Resend |
| DELETE | `/customer/team/invites/:id` | OWNER, ADMIN | Cancel |
| PATCH | `/customer/team/members/:id` | OWNER, ADMIN | Update role |
| DELETE | `/customer/team/members/:id` | OWNER, ADMIN | Remove |
| GET | `/customer/team/account-members` | OWNER, ADMIN | Account members |
| POST | `/customer/team/account-members` | OWNER, ADMIN | Add |
| DELETE | `/customer/team/account-members/:id` | OWNER, ADMIN | Remove |

#### Settings
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/settings` | OWNER, ADMIN | View |
| PATCH | `/customer/settings` | OWNER, ADMIN | Update |
| DELETE | `/customer/settings` | OWNER | Delete workspace |
| POST | `/customer/settings/export` | OWNER, ADMIN | Export |

#### Billing
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/billing/plan` | OWNER, ADMIN | Plan |
| GET | `/customer/billing/usage` | OWNER, ADMIN | Usage |
| POST | `/customer/billing/upgrade` | OWNER, ADMIN | Upgrade |
| POST | `/customer/billing/downgrade` | OWNER, ADMIN | Downgrade |
| POST | `/customer/billing/cancel` | OWNER, ADMIN | Cancel |
| POST | `/customer/billing/reactivate` | OWNER, ADMIN | Reactivate |
| POST | `/customer/billing/portal` | OWNER, ADMIN | Stripe portal |
| GET | `/customer/billing/invoices` | OWNER, ADMIN | Invoices |
| GET | `/customer/billing/invoices/:id/pdf` | OWNER, ADMIN | Download |
| PATCH | `/customer/billing/info` | OWNER, ADMIN | Update info |
| POST | `/customer/billing/coupon` | OWNER, ADMIN | Apply coupon |

#### Notifications
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/notifications` | All | Feed |
| PATCH | `/customer/notifications/:id/read` | All | Mark read |
| POST | `/customer/notifications/mark-all-read` | All | All read |
| GET | `/customer/notifications/preferences` | All | Preferences |
| PATCH | `/customer/notifications/preferences` | All | Update |

#### Webhooks
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/webhooks` | OWNER, ADMIN | List |
| POST | `/customer/webhooks` | OWNER, ADMIN | Create |
| DELETE | `/customer/webhooks/:id` | OWNER, ADMIN | Delete |
| PATCH | `/customer/webhooks/:id/toggle` | OWNER, ADMIN | Toggle |
| POST | `/customer/webhooks/:id/test` | OWNER, ADMIN | Test |
| GET | `/customer/webhooks/:id/deliveries` | OWNER, ADMIN | Deliveries |

#### API Keys
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/api-keys` | OWNER, ADMIN | List |
| POST | `/customer/api-keys` | OWNER, ADMIN | Create |
| DELETE | `/customer/api-keys/:id` | OWNER, ADMIN | Revoke |
| GET | `/customer/api-keys/:id/usage` | OWNER, ADMIN | Usage |

#### Account
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/account/profile` | All | Profile |
| PATCH | `/customer/account/profile` | All | Update |
| POST | `/customer/account/change-password` | All | Password |
| POST | `/customer/account/2fa/setup` | All | 2FA setup |
| POST | `/customer/account/2fa/verify` | All | Verify |
| POST | `/customer/account/2fa/disable` | All | Disable |
| POST | `/customer/account/email/request` | All | Email change |
| POST | `/customer/account/email/verify` | All | Verify |
| GET | `/customer/account/workspaces` | All | Workspaces |
| POST | `/customer/account/export` | All | Export |
| DELETE | `/customer/account` | All | Delete |

#### Islamic
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/islamic/prayer-times` | All | Times |
| GET | `/customer/islamic/prayer-config` | All | Config |
| PATCH | `/customer/islamic/prayer-config` | OWNER, ADMIN | Update |
| GET | `/customer/islamic/prayer-pause-status` | All | Status |
| GET | `/customer/islamic/hijri-date` | All | Hijri |
| GET | `/customer/islamic/ramadan-config` | All | Config |
| PATCH | `/customer/islamic/ramadan-config` | OWNER, ADMIN | Update |

#### Onboarding
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/onboarding` | All | Progress |
| POST | `/customer/onboarding/complete-step` | OWNER, ADMIN, EDITOR | Complete |
| PATCH | `/customer/onboarding/dismiss` | OWNER, ADMIN | Dismiss |
| POST | `/customer/onboarding/reset` | OWNER, ADMIN | Reset |

#### Usage
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customer/usage` | OWNER, ADMIN | Current |
| GET | `/customer/usage/history` | OWNER, ADMIN | History |
| GET | `/customer/usage/limits` | OWNER, ADMIN | Limits |

#### Pairing
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/customer/pairing/sessions` | OWNER, ADMIN, EDITOR | Start |
| GET | `/customer/pairing/sessions/:id` | All | Poll |
| POST | `/customer/pairing/sessions/:id/claim` | OWNER, ADMIN, EDITOR | Claim |

### 2.4 Player Routes (`/player/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/player/bootstrap` | x-player-secret | Bootstrap screen |
| GET | `/player/canvas/:id` | x-player-secret | Compiled canvas |
| GET | `/player/prayer-pause/:screenId` | x-player-secret | Prayer pause status |
| POST | `/player/pairing/sessions` | Public (rate-limited) | Start pairing |
| POST | `/player/pairing/sessions/:id/notify-started` | x-player-secret | Notify started |
| POST | `/player/heartbeat` | x-player-secret | Screen heartbeat |
| POST | `/player/proof-of-play` | x-player-secret | Report proof of play |

### 2.5 Public Routes (`/public/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/public/branding` | None | Platform branding |
| GET | `/public/branding/file/:variant` | None | Brand asset |
| GET | `/public/health` | None | Public health status |
| GET | `/public/plans` | None | Public plan list (for marketing site) |

### 2.6 Health Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Overall health |
| GET | `/health/db` | None | Database health |
| GET | `/health/redis` | None | Redis health |
| GET | `/health/storage` | None | Storage health |
| GET | `/health/realtime` | None | Realtime health |
| GET | `/health/queues` | None | Queue health |
| GET | `/health/detailed` | JWT (platform) | Detailed health |

### 2.7 Internal Routes (`/internal/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/internal/usage/record` | IP allowlist | Record usage metric |
| POST | `/internal/analytics/aggregate` | IP allowlist | Trigger aggregation |
| POST | `/internal/cron/:jobName` | IP allowlist | Trigger cron job |
| POST | `/internal/webhooks/stripe` | Stripe signature | Stripe webhook receiver |

---

## 3. API Versioning

### 3.1 Strategy

- **URL path versioning:** `/api/v1/`, `/api/v2/`
- **Version lifecycle:** v1 supported for 12 months after v2 release
- **Deprecation header:** `X-API-Deprecated: true` + `Sunset: <date>`
- **Migration guide:** Published with each new version

### 3.2 Version Rules

- New endpoints can be added to v1 without version bump
- Breaking changes (removed fields, changed types, changed behavior) require new version
- Both versions served by same backend, route-level version selection
- v1 and v2 can share service layer with version-specific DTOs

---

## 4. Response Format

### 4.1 Success Response

```json
{
  "data": { ... } | [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 4.2 Error Response

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": { ... },
    "requestId": "req-uuid"
  }
}
```

### 4.3 Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `PAYMENT_REQUIRED` | 402 | Quota exceeded — upgrade plan |
| `TOO_MANY_REQUESTS` | 429 | Rate limited |
| `MAINTENANCE` | 503 | Maintenance mode active |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 5. Rate Limiting

| Namespace | Rate Limit | Key | Strategy |
|---|---|---|---|
| `/auth/*` | 5-30 req/min | IP + email | Fixed window |
| `/platform/*` | 100 req/min | User ID | Sliding window |
| `/customer/*` | 200 req/min | User ID + Workspace | Sliding window |
| `/player/*` | 60 req/min | Screen ID | Fixed window |
| `/public/*` | 60 req/min | IP | Fixed window |
| `/internal/*` | No limit | IP allowlist | — |
| Customer API keys | 1000 req/hour | API key | Sliding window |

---

## 6. WebSocket Events

### 6.1 Customer Workspace Events

| Event | Direction | Auth | Description |
|---|---|---|---|
| `connection` | C→S | JWT | Connect to workspace room |
| `joinWorkspace` | C→S | JWT | Join workspace room |
| `screenStatus` | S→C | JWT | Screen online/offline update |
| `notification` | S→C | JWT | New notification |
| `scheduleUpdate` | S→C | JWT | Schedule changed |
| `campaignUpdate` | S→C | JWT | Campaign state changed |

### 6.2 Platform Events

| Event | Direction | Auth | Description |
|---|---|---|---|
| `joinPlatform` | C→S | JWT (platform) | Join platform room |
| `activity` | S→C | JWT (platform) | New platform activity |
| `alert` | S→C | JWT (platform) | System alert |
| `ticketUpdate` | S→C | JWT (platform) | Support ticket update |

### 6.3 Player Events

| Event | Direction | Auth | Description |
|---|---|---|---|
| `screen:connect` | C→S | x-player-secret | Screen connected |
| `screen:command` | S→C | x-player-secret | Remote command |
| `screen:config` | S→C | x-player-secret | Config update |
| `screen:heartbeat` | C→S | x-player-secret | Heartbeat |

---

## 7. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| URL path versioning | `/api/v1/` | Simple, cacheable, explicit |
| Namespace by audience | `/platform/`, `/customer/` | Guard-level enforcement, clear ownership |
| Response format | `{ data, meta }` / `{ error }` | Consistent, predictable, paginated |
| Rate limiting | Per-namespace + per-key | Different limits for different contexts |
| WebSocket rooms | Workspace + platform | Isolation, targeted broadcasts |
| Stripe webhook | `/internal/webhooks/stripe` | Internal, signature-verified, not rate-limited |
| Player auth | `x-player-secret` header | Screens don't have JWT, simple shared secret |
| Public endpoints | `/public/*` | No auth, CDN-cacheable, branding + health |
