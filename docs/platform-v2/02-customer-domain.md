# 02 — Customer Domain

> **Document Type:** Domain Design Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Complete customer module catalog for the Customer Workspace

---

## 1. Overview

The Customer Domain encompasses every module that the customer interacts with. These modules are customer-facing, accessed through the Customer Workspace. Platform staff never access these modules directly (except through impersonation).

### Design Principles

1. **Customer modules are workspace-scoped** — every request includes a `workspaceId`, validated against membership
2. **Customer modules never know about platform operations** — no tenant management, no platform settings, no staff roles
3. **Customer modules enforce plan limits** — screen count, storage, API calls are checked against subscription
4. **Customer modules are self-served** — customers can do everything without contacting support
5. **Customer modules degrade gracefully** — maintenance mode, quota exceeded, and feature disabled states are handled with clear messaging

---

## 2. Module Catalog

### 2.1 Overview Dashboard

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Personalized dashboard with workspace KPIs, recent activity, and quick actions |
| **Why** | Customers need a landing page that shows what matters at a glance |
| **Business value** | Engagement, feature adoption, time-to-value |
| **Technical value** | Aggregates data from multiple customer modules in a single API call |

**Responsibilities:**
- Display workspace summary: screen count (online/offline), content count, storage usage
- Display recent activity: last uploaded media, last edited playlist, last schedule change
- Display quick actions: add screen, create playlist, upload media, create schedule
- Display workspace health: screens offline, schedules expiring, storage near limit
- Display onboarding progress (if not completed)
- Display announcements from platform (maintenance, new features)

**Public APIs:**
- `GET /customer/overview` — Dashboard data
- `GET /customer/overview/activity` — Recent activity feed

**Dependencies:** ScreensModule, MediaModule, PlaylistsModule, SchedulesModule, OnboardingModule
**Forbidden:** Accessing platform-level data (other workspaces, tenant info, staff info)

---

### 2.2 Screen Management

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | CRUD operations for screens, playlist assignments, remote commands |
| **Why** | Screens are the core product — customers manage their digital signage devices |
| **Business value** | Core product functionality, screen utilization, uptime |
| **Technical value** | Integrates with RealtimeModule for live status and remote commands |

**Responsibilities:**
- List screens with status (online, offline, syncing), location, current playlist
- Create screen (generates pairing code for player)
- Edit screen (name, location, orientation, tags)
- Delete screen (with confirmation, preserves analytics data)
- Assign playlist to screen
- Set playlist override (temporary playlist for a duration)
- Reorder assigned playlists
- Remove playlist assignment
- Send remote commands (reload, reboot, screenshot, volume, brightness)
- View screen analytics (uptime, impressions, proof of play)
- View active content (what's currently displayed)
- Screen grouping (by location, tag, or custom group)
- Bulk operations (assign playlist to multiple screens, send command to group)

**Public APIs:**
- `GET /customer/screens` — List screens
- `POST /customer/screens` — Create screen
- `GET /customer/screens/:id` — Screen detail
- `PATCH /customer/screens/:id` — Update screen
- `DELETE /customer/screens/:id` — Delete screen
- `POST /customer/screens/:id/assignments` — Assign playlist
- `PATCH /customer/screens/:id/assignments/:aid` — Reorder/update
- `DELETE /customer/screens/:id/assignments/:aid` — Remove assignment
- `POST /customer/screens/:id/override` — Set override
- `DELETE /customer/screens/:id/override` — Remove override
- `POST /customer/screens/:id/remote-command` — Send command
- `GET /customer/screens/:id/analytics` — Screen analytics
- `GET /customer/screens/:id/active-content` — Current content
- `POST /customer/screens/bulk-assign` — Bulk assign
- `POST /customer/screens/bulk-command` — Bulk command

**Dependencies:** RealtimeModule, PlaylistsModule (read-only), AnalyticsModule, QuotaModule
**Forbidden:** Accessing screens outside authenticated workspace

---

### 2.3 Content Library (Media)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Media upload, organization, and management |
| **Why** | Media (images, videos) is the raw material for digital signage content |
| **Business value** | Content creation, storage utilization, media lifecycle |
| **Technical value** | S3-compatible storage, CDN-served, thumbnail generation |

**Responsibilities:**
- Upload media (images, videos, audio, PDF) — multi-file upload supported
- List media with filters (type, folder, tags, expiry status)
- Create, rename, delete folders
- Move media between folders
- Set media expiry date (auto-delete after date)
- View media stats (file size, dimensions, duration, format)
- Search media by name, tag, type
- Bulk delete, bulk move
- Media preview (thumbnail, video preview)
- Storage usage display (used vs plan limit)
- Duplicate detection (same hash)

**Public APIs:**
- `POST /customer/media/upload` — Upload media (multipart)
- `GET /customer/media` — List media
- `GET /customer/media/:id` — Media detail
- `DELETE /customer/media/:id` — Delete media
- `PATCH /customer/media/:id` — Update media (name, tags, folder, expiry)
- `GET /customer/media/folders` — List folders
- `POST /customer/media/folders` — Create folder
- `PATCH /customer/media/folders/:id` — Rename folder
- `DELETE /customer/media/folders/:id` — Delete folder (moves media to root)
- `POST /customer/media/bulk-delete` — Bulk delete
- `POST /customer/media/bulk-move` — Bulk move
- `GET /customer/media/stats` — Media statistics

**Dependencies:** StorageModule, QuotaModule
**Forbidden:** Uploading media that exceeds storage quota

---

### 2.4 Studio Editor (Canvases)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Visual canvas editor for creating digital signage content |
| **Why** | Customers need a drag-and-drop editor to create rich content without design tools |
| **Business value** | Core product differentiation, content quality, time-to-value |
| **Technical value** | Konva-based editor, JSON canvas format, version history |

**Responsibilities:**
- Create canvas (blank or from template)
- Edit canvas (add text, image, video, shapes, QR code, time, weather widget)
- Canvas properties (size, orientation, background, duration)
- Layer management (z-order, lock, visibility)
- Element properties (position, size, rotation, opacity, animation)
- Save canvas (auto-save + manual save)
- Version history (snapshot on save, restore previous version)
- Canvas preview (render in editor)
- Canvas templates (10 built-in templates, one-click create)
- Export canvas as image
- Multi-language text support (Arabic, English)

**Public APIs:**
- `GET /customer/canvases` — List canvases
- `POST /customer/canvases` — Create canvas
- `GET /customer/canvases/:id` — Canvas detail
- `PATCH /customer/canvases/:id` — Update canvas
- `DELETE /customer/canvases/:id` — Delete canvas
- `GET /customer/canvases/:id/versions` — Version history
- `POST /customer/canvases/:id/restore/:versionId` — Restore version
- `POST /customer/canvases/:id/duplicate` — Duplicate canvas
- `GET /customer/canvases/templates` — List templates
- `POST /customer/canvases/from-template` — Create from template

**Dependencies:** StorageModule, MediaModule (read-only)
**Forbidden:** Accessing canvases outside authenticated workspace

---

### 2.5 Playlists

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Create and manage playlists — sequences of content items |
| **Why** | Playlists are the scheduling unit assigned to screens |
| **Business value** | Content organization, scheduling flexibility, playback control |
| **Technical value** | Ordered items with duration, transitions, and time windows |

**Responsibilities:**
- Create playlist (name, description, orientation)
- Add items to playlist (canvas, media, playlist group)
- Reorder items (drag-and-drop)
- Set item duration (seconds per item)
- Set item transitions (fade, slide, none)
- Set item time window (play only between 9am-5pm)
- Duplicate playlist
- Clone playlist to another workspace (future)
- Playlist groups (group multiple playlists for rotation)
- Playlist preview (full-screen sequential playback)
- Replace all items (bulk replace)
- Playlist validation (check all items exist, not expired)

**Public APIs:**
- `GET /customer/playlists` — List playlists
- `POST /customer/playlists` — Create playlist
- `GET /customer/playlists/:id` — Playlist detail
- `PATCH /customer/playlists/:id` — Update playlist
- `DELETE /customer/playlists/:id` — Delete playlist
- `PATCH /customer/playlists/:id/items` — Update items (reorder, add, remove)
- `POST /customer/playlists/:id/duplicate` — Duplicate
- `POST /customer/playlists/:id/clone` — Clone to workspace (future)
- `GET /customer/playlists/groups` — List groups
- `POST /customer/playlists/groups` — Create group
- `PATCH /customer/playlists/groups/:id` — Update group
- `DELETE /customer/playlists/groups/:id` — Delete group
- `POST /customer/playlists/:id/preview` — Get preview data
- `POST /customer/playlists/:id/replace-items` — Replace all items

**Dependencies:** MediaModule (read-only), CanvasesModule (read-only)
**Forbidden:** Including items from other workspaces

---

### 2.6 Scheduling

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Schedule playlists on screens with time-based rules |
| **Why** | Customers need to control what plays when — dayparting, event scheduling, recurring schedules |
| **Business value** | Scheduling flexibility, content relevance, operational efficiency |
| **Technical value** | Calendar-based scheduling with overlap detection and conflict resolution |

**Responsibilities:**
- Create schedule (playlist, screen(s), start, end, recurrence)
- Recurrence patterns: daily, weekly, monthly, custom (CRON-like)
- Dayparting (play only during specific hours)
- Assign schedule to single screen, screen group, or all screens
- View schedule calendar (day, week, month views)
- Detect scheduling conflicts (overlapping schedules on same screen)
- List schedule overlaps
- Edit schedule
- Delete schedule
- Schedule priority (higher priority overrides lower)
- Schedule timezone support (per workspace timezone)

**Public APIs:**
- `GET /customer/schedules` — List schedules
- `POST /customer/schedules` — Create schedule
- `GET /customer/schedules/:id` — Schedule detail
- `PATCH /customer/schedules/:id` — Update schedule
- `DELETE /customer/schedules/:id` — Delete schedule
- `GET /customer/schedules/calendar` — Calendar view (day/week/month)
- `GET /customer/schedules/overlaps` — Overlap detection

**Dependencies:** PlaylistsModule (read-only), ScreensModule (read-only)
**Forbidden:** Scheduling playlists from other workspaces

---

### 2.7 Campaigns

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Campaign lifecycle management — draft, submit, approve, publish, monitor |
| **Why** | Campaigns coordinate content across multiple screens with a business goal |
| **Business value** | Marketing campaign management, content governance, performance tracking |
| **Technical value** | State machine (draft → submit → approve → publish → pause → resume → end) |

**Responsibilities:**
- Create campaign (name, description, screens, playlists, start, end)
- Campaign lifecycle: DRAFT → SUBMITTED → APPROVED → PUBLISHED → PAUSED → ENDED
- Submit campaign for approval (OWNER/ADMIN approves)
- Approve/reject campaign
- Publish campaign (activates on assigned screens)
- Pause campaign (temporarily stop)
- Resume campaign
- End campaign (permanently stop, preserve data)
- Campaign history (all state transitions with timestamps)
- Campaign analytics (impressions, reach, engagement)

**Public APIs:**
- `GET /customer/campaigns` — List campaigns
- `POST /customer/campaigns` — Create campaign
- `GET /customer/campaigns/:id` — Campaign detail
- `PATCH /customer/campaigns/:id` — Update campaign (draft only)
- `DELETE /customer/campaigns/:id` — Delete campaign (draft only)
- `POST /customer/campaigns/:id/submit` — Submit for approval
- `POST /customer/campaigns/:id/approve` — Approve
- `POST /customer/campaigns/:id/reject` — Reject
- `POST /customer/campaigns/:id/publish` — Publish
- `POST /customer/campaigns/:id/pause` — Pause
- `POST /customer/campaigns/:id/resume` — Resume
- `POST /customer/campaigns/:id/end` — End
- `GET /customer/campaigns/:id/history` — Campaign history
- `GET /customer/campaigns/:id/analytics` — Campaign analytics

**Dependencies:** PlaylistsModule (read-only), ScreensModule (read-only), AnalyticsModule
**Forbidden:** Publishing without approval (EDITOR cannot approve)

---

### 2.8 Analytics & Reports

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Workspace analytics — screen performance, content engagement, proof of play |
| **Why** | Customers need data to justify their digital signage investment |
| **Business value** | ROI demonstration, content optimization, screen utilization |
| **Technical value** | Aggregated from PlayerModule events, cached, exportable |

**Responsibilities:**
- Screen analytics: uptime, impressions, active hours, content played
- Content analytics: top performing content, play count, dwell time
- Proof of play: when was what played on which screen (with photo evidence if enabled)
- Campaign analytics: impressions, reach, frequency
- Custom date ranges
- Export reports (PDF, CSV)
- Scheduled reports (email weekly/monthly)
- Top/bottom performers
- Trend indicators (up/down vs previous period)

**Public APIs:**
- `GET /customer/analytics/overview` — Analytics overview
- `GET /customer/analytics/screens/:id` — Screen analytics
- `GET /customer/analytics/content` — Content analytics
- `GET /customer/analytics/proof-of-play` — Proof of play
- `GET /customer/analytics/campaigns/:id` — Campaign analytics
- `POST /customer/analytics/reports` — Generate report
- `GET /customer/analytics/reports/scheduled` — Scheduled reports
- `POST /customer/analytics/reports/scheduled` — Create scheduled report
- `GET /customer/analytics/export` — Export data (CSV/PDF)

**Dependencies:** ScreensModule (read-only), CampaignsModule (read-only), PlaylistsModule (read-only)
**Forbidden:** Accessing analytics from other workspaces

---

### 2.9 Team Management

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Manage workspace members and their roles |
| **Why** | Customers have teams with different permission levels |
| **Business value** | Collaboration, access control, team productivity |
| **Technical value** | Role-based access control, invitation flow, audit trail |

**Responsibilities:**
- List workspace members with roles
- Invite member by email (sends invitation)
- Resend invitation
- Cancel invitation
- Update member role (OWNER, ADMIN, EDITOR, VIEWER)
- Remove member
- Prevent self-removal (OWNER cannot remove self if last owner)
- View pending invitations
- Account-level members (cross-workspace members, managed by OWNER/ADMIN)
- Member activity (last login, actions count)

**Public APIs:**
- `GET /customer/team/members` — List members
- `POST /customer/team/invites` — Invite member
- `GET /customer/team/invites` — List pending invites
- `POST /customer/team/invites/:id/resend` — Resend invite
- `DELETE /customer/team/invites/:id` — Cancel invite
- `PATCH /customer/team/members/:id` — Update role
- `DELETE /customer/team/members/:id` — Remove member
- `GET /customer/team/members/:id/activity` — Member activity
- `GET /customer/team/account-members` — Account-level members
- `POST /customer/team/account-members` — Add account member
- `DELETE /customer/team/account-members/:id` — Remove account member

**Dependencies:** AuthModule, EmailModule, AuditLogModule
**Forbidden:** Assigning roles higher than own role (EDITOR cannot promote to OWNER)

---

### 2.10 Workspace Settings

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Workspace configuration — name, timezone, language, defaults |
| **Why** | Each workspace has unique settings that affect all operations |
| **Business value** | Personalization, regional compliance, operational consistency |
| **Technical value** | Per-workspace configuration, consumed by all customer modules |

**Responsibilities:**
- Workspace name and description
- Workspace timezone (affects scheduling)
- Default language (affects UI and content)
- Default screen orientation
- Default playlist duration
- Workspace tags (for organization)
- Workspace logo (for reports and invoices)
- Data retention policy (how long to keep analytics data)
- Delete workspace (OWNER only, with confirmation)

**Public APIs:**
- `GET /customer/settings` — Workspace settings
- `PATCH /customer/settings` — Update settings
- `DELETE /customer/settings` — Delete workspace (OWNER only)
- `POST /customer/settings/export` — Export workspace data (GDPR)

**Dependencies:** AuditLogModule
**Forbidden:** Accessing platform settings

---

### 2.11 Billing (Self-Service)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Self-service billing — view plan, upgrade, manage payment, download invoices |
| **Why** | Customers should be able to manage their subscription without contacting support |
| **Business value** | Self-service reduces support load, enables upsells, improves retention |
| **Technical value** | Integrates with Stripe for payment processing, platform SubscriptionEngine for plan management |

**Responsibilities:**
- View current plan and features
- View usage vs plan limits (screens, storage, API calls)
- Upgrade plan (Stripe checkout)
- Downgrade plan (takes effect at next billing cycle)
- Cancel subscription (takes effect at end of current period)
- Reactivate cancelled subscription
- Manage payment method (Stripe customer portal)
- View billing history (invoices)
- Download invoices (PDF)
- Update billing information (company name, tax ID, address)
- Apply coupon code at checkout
- View trial status and remaining days

**Public APIs:**
- `GET /customer/billing/plan` — Current plan and features
- `GET /customer/billing/usage` — Usage vs limits
- `POST /customer/billing/upgrade` — Upgrade plan (returns Stripe checkout URL)
- `POST /customer/billing/downgrade` — Downgrade plan
- `POST /customer/billing/cancel` — Cancel subscription
- `POST /customer/billing/reactivate` — Reactivate
- `POST /customer/billing/portal` — Stripe customer portal URL
- `GET /customer/billing/invoices` — Invoice list
- `GET /customer/billing/invoices/:id/pdf` — Download invoice
- `PATCH /customer/billing/info` — Update billing info
- `POST /customer/billing/coupon` — Apply coupon

**Dependencies:** SubscriptionEngine (platform, via internal API), StripeModule, InvoiceEngine (platform, via internal API)
**Forbidden:** Modifying subscription without payment (except mock plan in dev/staging)

---

### 2.12 Onboarding

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Guided onboarding for new workspaces — step-by-step setup |
| **Why** | Customers who complete onboarding have higher retention and engagement |
| **Business value** | Time-to-value, activation rate, retention |
| **Technical value** | Step tracking, progress persistence, dismissible |

**Responsibilities:**
- Onboarding steps: create workspace, add screen, create playlist, upload media, assign playlist to screen, create schedule
- Track step completion
- Show progress bar
- Dismiss onboarding (hide permanently)
- Reset onboarding (for testing or re-training)
- Onboarding checklist on dashboard

**Public APIs:**
- `GET /customer/onboarding` — Onboarding progress
- `POST /customer/onboarding/complete-step` — Complete step
- `PATCH /customer/onboarding/dismiss` — Dismiss
- `POST /customer/onboarding/reset` — Reset

**Dependencies:** ScreensModule, PlaylistsModule, MediaModule, SchedulesModule
**Forbidden:** Auto-completing steps without actual action

---

### 2.13 Islamic Features

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Prayer times integration, prayer pause, Hijri date, Ramadan mode |
| **Why** | Core feature for MENA region customers — screens pause during prayer times |
| **Business value** | Regional market differentiation, customer satisfaction |
| **Technical value** | Prayer time calculation, Hijri calendar, playlist switching |

**Responsibilities:**
- Configure prayer times (calculation method, location, offsets)
- Prayer pause (pause screen during prayer, resume after)
- Hijri date display (on canvases)
- Ramadan mode (switch to Ramadan playlist during Ramadan month)
- Prayer pause status (real-time, for player)
- Mosque-specific features (future: full prayer time display)

**Public APIs:**
- `GET /customer/islamic/prayer-times` — Prayer times for today
- `GET /customer/islamic/prayer-config` — Configuration
- `PATCH /customer/islamic/prayer-config` — Update configuration
- `GET /customer/islamic/prayer-pause-status` — Current pause status
- `GET /customer/islamic/hijri-date` — Hijri date
- `GET /customer/islamic/ramadan-config` — Ramadan configuration
- `PATCH /customer/islamic/ramadan-config` — Update Ramadan config
- `GET /customer/islamic/ramadan-status` — Ramadan mode status

**Dependencies:** PlaylistsModule (read-only, for Ramadan playlist)
**Forbidden:** Accessing prayer times for locations outside workspace scope

---

### 2.14 Notifications (Customer)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | User notifications — screen offline, schedule expired, storage warning, team updates |
| **Why** | Customers need to be informed about events affecting their workspace |
| **Business value** | Proactive management, reduced downtime, engagement |
| **Technical value** | Per-user notification feed, WebSocket push, email fallback |

**Responsibilities:**
- User notification feed (per user, not per workspace)
- Notification types: screen_offline, screen_online, schedule_expired, storage_warning, team_invite, billing_failed, maintenance_scheduled
- Mark as read, mark all as read
- Notification preferences (in-app, email, per type)
- WebSocket push for real-time notifications
- Notification history (archived after 30 days)

**Public APIs:**
- `GET /customer/notifications` — Notification feed
- `PATCH /customer/notifications/:id/read` — Mark as read
- `POST /customer/notifications/mark-all-read` — Mark all as read
- `GET /customer/notifications/preferences` — Preferences
- `PATCH /customer/notifications/preferences` — Update preferences

**Dependencies:** RealtimeModule, EmailModule
**Forbidden:** Sending notifications to users outside the workspace

---

### 2.15 Webhooks (Customer)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Customer-configured webhooks for workspace events |
| **Why** | Customers integrate Cloud-Screen with their internal systems (Slack, custom dashboards) |
| **Business value** | Integration ecosystem, customer lock-in, automation |
| **Technical value** | Event-driven webhooks with retry, signing, and delivery logs |

**Responsibilities:**
- Create webhook endpoint (URL, events, secret)
- Event types: screen.offline, screen.online, schedule.expired, media.expired, campaign.published, team.member_added
- Sign webhook payloads (HMAC-SHA256)
- Retry failed deliveries (3 attempts, exponential backoff)
- Track delivery logs (request, response, status)
- Toggle webhook (enable/disable)
- Test webhook (send test event)

**Public APIs:**
- `GET /customer/webhooks` — List webhooks
- `POST /customer/webhooks` — Create webhook
- `DELETE /customer/webhooks/:id` — Delete webhook
- `PATCH /customer/webhooks/:id/toggle` — Toggle webhook
- `POST /customer/webhooks/:id/test` — Send test event
- `GET /customer/webhooks/:id/deliveries` — Delivery logs

**Dependencies:** AuditLogModule
**Forbidden:** Sending data from other workspaces in webhook payloads

---

### 2.16 API Keys (Customer)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Customer API keys for programmatic access to workspace data |
| **Why** | Developers and integrations need API access to manage screens, content, and schedules |
| **Business value** | Developer ecosystem, automation, integration |
| **Technical value** | Scoped API keys, rate-limited, audit-tracked |

**Responsibilities:**
- Create API key (name, scopes, expiry)
- API key scopes: read:screens, write:screens, read:content, write:content, read:analytics
- List API keys (name only, not the key value)
- Revoke API key
- Track API key usage (call count, last used)
- Rate limit per API key (configurable)

**Public APIs:**
- `GET /customer/api-keys` — List API keys
- `POST /customer/api-keys` — Create API key (returns key value once)
- `DELETE /customer/api-keys/:id` — Revoke API key
- `GET /customer/api-keys/:id/usage` — Usage stats

**Dependencies:** ThrottlerModule, AuditLogModule
**Forbidden:** Creating API keys with scopes beyond user's role

---

### 2.17 Account Management

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | User account management — profile, email, password, 2FA, GDPR |
| **Why** | Users need to manage their own identity across workspaces |
| **Business value** | Self-service, security, compliance |
| **Technical value** | User-level (not workspace-level), cross-workspace |

**Responsibilities:**
- View and edit profile (name, avatar, phone)
- Change password
- Enable/disable 2FA (TOTP)
- Request email change (sends verification to new email)
- Verify email change (confirms new email)
- View all workspaces the user belongs to
- Export personal data (GDPR)
- Delete account (anonymizes user data, removes from workspaces)

**Public APIs:**
- `GET /customer/account/profile` — Profile
- `PATCH /customer/account/profile` — Update profile
- `POST /customer/account/change-password` — Change password
- `POST /customer/account/2fa/setup` — Enable 2FA
- `POST /customer/account/2fa/verify` — Verify 2FA
- `POST /customer/account/2fa/disable` — Disable 2FA
- `POST /customer/account/email/request` — Request email change
- `POST /customer/account/email/verify` — Verify email change
- `GET /customer/account/workspaces` — User's workspaces
- `POST /customer/account/export` — Export personal data
- `DELETE /customer/account` — Delete account

**Dependencies:** AuthModule, EmailModule, AuditLogModule
**Forbidden:** Accessing other users' account data

---

### 2.18 Integrations (Customer)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Third-party integrations — Slack, Microsoft Teams, Google Drive, Dropbox |
| **Why** | Customers want to pull content from their existing tools |
| **Business value** | Ecosystem, customer lock-in, content automation |
| **Technical value** | OAuth-based integrations, content sync, webhook events |

**Responsibilities:**
- Browse available integrations (integration catalog)
- Connect integration (OAuth flow)
- Configure integration (sync settings, frequency)
- Disconnect integration
- View integration status (last sync, sync errors)
- Content sync (e.g., sync Google Drive folder to media library)
- Notification routing (e.g., screen offline → Slack channel)

**Public APIs:**
- `GET /customer/integrations` — List available and connected integrations
- `POST /customer/integrations/:provider/connect` — Initiate OAuth
- `POST /customer/integrations/:provider/callback` — OAuth callback
- `PATCH /customer/integrations/:id` — Update config
- `DELETE /customer/integrations/:id` — Disconnect
- `GET /customer/integrations/:id/status` — Sync status
- `POST /customer/integrations/:id/sync` — Manual sync

**Dependencies:** OAuthClients (platform), StorageModule, MediaModule
**Forbidden:** Accessing integration data from other workspaces

---

### 2.19 Usage Dashboard (Customer)

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Self-service usage monitoring — screens, storage, API calls, bandwidth |
| **Why** | Customers need to understand their usage to make plan decisions |
| **Business value** | Upsell trigger, transparency, plan satisfaction |
| **Technical value** | Aggregated from UsageTracking (platform), read-only view |

**Responsibilities:**
- Current usage: active screens, storage used, API calls this month, bandwidth this month
- Usage vs plan limits (progress bars, warnings at 80%)
- Usage history (30-day, 90-day, 12-month charts)
- Usage breakdown by type (screens by location, storage by media type)
- Upgrade prompt when approaching limits

**Public APIs:**
- `GET /customer/usage` — Current usage
- `GET /customer/usage/history` — Historical usage
- `GET /customer/usage/limits` — Plan limits vs actual

**Dependencies:** UsageTracking (platform, via internal API), SubscriptionEngine (platform, via internal API)
**Forbidden:** Accessing usage data from other workspaces

---

### 2.20 Screen Pairing

| Attribute | Value |
|---|---|
| **Owner** | Customer team |
| **Purpose** | Pair physical screens with the workspace via pairing codes |
| **Why** | Customers need a simple flow to connect physical devices to their workspace |
| **Business value** | Onboarding ease, time-to-value, reduced support |
| **Technical value** | Pairing session lifecycle (start, poll, claim) |

**Responsibilities:**
- Generate pairing code (6-character alphanumeric)
- Display pairing code and instructions
- Poll pairing session status (waiting, claimed, expired)
- Claim paired screen (assign to workspace, set name and location)
- Notify screen that pairing is complete
- Pairing code expiry (10 minutes)

**Public APIs:**
- `POST /customer/pairing/sessions` — Start pairing session
- `GET /customer/pairing/sessions/:id` — Poll status
- `POST /customer/pairing/sessions/:id/claim` — Claim paired screen
- `POST /customer/pairing/sessions/:id/notify-started` — Notify screen started

**Dependencies:** PairingModule, ScreensModule, QuotaModule
**Forbidden:** Pairing screens beyond license limit

---

## 3. Module Summary

| # | Module | Category | Priority |
|---|---|---|---|
| 1 | Overview Dashboard | Core | P0 |
| 2 | Screen Management | Core | P0 |
| 3 | Content Library (Media) | Core | P0 |
| 4 | Studio Editor (Canvases) | Core | P0 |
| 5 | Playlists | Core | P0 |
| 6 | Scheduling | Core | P0 |
| 7 | Campaigns | Core | P1 |
| 8 | Analytics & Reports | Core | P1 |
| 9 | Team Management | Core | P0 |
| 10 | Workspace Settings | Core | P0 |
| 11 | Billing (Self-Service) | Core | P0 |
| 12 | Onboarding | Core | P0 |
| 13 | Islamic Features | Core | P0 |
| 14 | Notifications (Customer) | Core | P0 |
| 15 | Webhooks (Customer) | Core | P1 |
| 16 | API Keys (Customer) | Core | P1 |
| 17 | Account Management | Core | P0 |
| 18 | Integrations (Customer) | Future | P2 |
| 19 | Usage Dashboard (Customer) | Core | P1 |
| 20 | Screen Pairing | Core | P0 |

### Priority Legend

- **P0:** Required for initial customer workspace (existing functionality)
- **P1:** Required for customer workspace maturity (post-separation)
- **P2:** Future enhancement (integrations ecosystem)

---

## 4. What Was Removed From Customer Domain

The following features currently exist in the dashboard but belong to the **Platform Domain** and must be removed from the Customer Workspace:

| Feature | Current Location | Target Location | Reason |
|---|---|---|---|
| Admin Overview (global stats) | `features/dashboard/admin-overview.tsx` | Control Panel → Platform Dashboard | Platform-level data, not customer |
| Admin Customers | `features/admin/admin-customers-client.tsx` | Control Panel → Tenant Management | Manages tenants, not workspace |
| Admin Staff | `features/admin/admin-staff-client.tsx` | Control Panel → Staff Management | Manages platform staff |
| Admin Users | `features/admin/admin-users-client.tsx` | Control Panel → User Management | Manages all users globally |
| Admin Workspaces | `features/admin/admin-workspaces-client.tsx` | Control Panel → Workspace Oversight | Manages all workspaces globally |
| Admin Fleet | `features/admin/admin-fleet-client.tsx` | Control Panel → Device Fleet | Global fleet, not workspace |
| Admin Logs | `features/admin/admin-logs-client.tsx` | Control Panel → Audit Center | Cross-tenant audit log |
| Admin Settings | `features/admin/admin-settings-client.tsx` | Control Panel → Platform Settings | Platform configuration |
| Admin Feature Flags | `features/admin/admin-feature-flags-client.tsx` | Control Panel → Feature Flags | Platform feature management |
| Admin System Health | `features/admin/admin-system-health-client.tsx` | Control Panel → Global Monitoring | Platform health |
| Super Admin Guard | `features/admin/super-admin-guard.tsx` | Control Panel → Platform Guard | Platform access control |
| Impersonation Return Button | `components/impersonation-return-button.tsx` | Replaced by Impersonation Banner | Cross-system flow |
| `isSuperAdmin` in WorkspaceContext | `features/workspace/workspace-context.tsx` | Removed entirely | Not a customer concern |
| `sovereign` mode in CrystalShell | `components/crystal-shell.tsx` | Removed entirely | Not a customer concern |
| `cs_super_admin` sessionStorage | Browser | Removed entirely | Not a customer concern |
| Admin API client | `features/admin/admin-api.ts` | Control Panel API client | Platform API calls |
| Admin section shell | `app/[locale]/(shell)/admin/admin-section-shell.tsx` | Control Panel shell | Platform layout |
| Admin layout | `app/[locale]/(shell)/admin/layout.tsx` | Control Panel layout | Platform layout |

**Total: 18 features/components to remove from Customer Workspace.**

---

## 5. Customer Navigation Map

### Sidebar Structure

```
┌─────────────────────────────────┐
│  [Workspace Switcher ▾]         │
│                                 │
│  📊 Overview                    │
│                                 │
│  CONTENT                        │
│  📺 Screens                     │
│  🎬 Playlists                   │
│  🖼️ Media Library               │
│  🎨 Studio                      │
│  📋 Templates                   │
│                                 │
│  SCHEDULING                     │
│  📅 Schedule Calendar           │
│  📢 Campaigns                   │
│                                 │
│  INSIGHTS                       │
│  📈 Analytics                   │
│  ▶️ Proof of Play               │
│  📊 Usage                       │
│                                 │
│  TEAM                           │
│  👥 Team Members                │
│                                 │
│  CONFIGURATION                  │
│  ⚙️ Settings                    │
│  💳 Billing                     │
│  🔑 API Keys                    │
│  🔗 Webhooks                    │
│  📦 Integrations                │
│                                 │
│  ─────────────────────          │
│  🌐 EN | AR                     │
│  🌙 Theme                       │
│  👤 User Menu                   │
└─────────────────────────────────┘
```

### Role-Based Visibility

| Nav Item | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| Overview | ✅ | ✅ | ✅ | ✅ |
| Screens | ✅ | ✅ | ✅ | ✅ (read-only) |
| Playlists | ✅ | ✅ | ✅ | ✅ (read-only) |
| Media Library | ✅ | ✅ | ✅ | ✅ (read-only) |
| Studio | ✅ | ✅ | ✅ | ✅ (read-only) |
| Templates | ✅ | ✅ | ✅ | ✅ (read-only) |
| Schedule Calendar | ✅ | ✅ | ✅ | ✅ (read-only) |
| Campaigns | ✅ | ✅ | ✅ | ✅ (read-only) |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Proof of Play | ✅ | ✅ | ✅ | ✅ |
| Usage | ✅ | ✅ | ❌ | ❌ |
| Team Members | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Billing | ✅ | ✅ | ❌ | ❌ |
| API Keys | ✅ | ✅ | ❌ | ❌ |
| Webhooks | ✅ | ✅ | ❌ | ❌ |
| Integrations | ✅ | ✅ | ❌ | ❌ |

---

## 6. Customer Identity vs Platform Identity

| Aspect | Customer Identity | Platform Identity |
|---|---|---|
| **JWT Audience** | `customer` | `platform` |
| **Login endpoint** | `POST /auth/login` (audience: customer) | `POST /auth/login` (audience: platform) |
| **Cookie domain** | `app.cloudsignage.com` | `admin.cloudsignage.com` |
| **Cookie names** | `__dash_access`, `__dash_refresh` | `__cp_access`, `__cp_refresh` |
| **2FA** | Optional | Required |
| **Session timeout** | 24 hours | 4 hours |
| **Concurrent sessions** | 5 | 2 |
| **Password policy** | Standard (8+ chars) | Strong (12+ chars, mixed) |
| **IP allowlist** | No | Yes (configurable) |
| **Roles** | OWNER, ADMIN, EDITOR, VIEWER | SUPER_ADMIN, SUPPORT, BILLING, SECURITY, OPERATIONS, DEVELOPER |

---

## 7. Open Questions

1. **Should customers have a "support" link** that creates a ticket in the platform Support Center? Yes — but through a public API, not through platform UI.
2. **Should customers see platform announcements** (maintenance, new features)? Yes — via a banner controlled by Platform Settings.
3. **Should customers be able to request a plan upgrade** that goes to the platform sales team? Yes — via a form that creates a support ticket.
4. **Should the impersonation banner show the admin's name** to the customer? No — the customer should not know they're being impersonated unless the platform configures "transparent impersonation."
5. **Should customers have access to their own audit log** (workspace-scoped)? Yes — a read-only view of workspace events.
