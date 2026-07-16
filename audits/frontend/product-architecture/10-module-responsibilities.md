# Module Responsibilities

> **Evidence basis:** `09-product-modules.md`, all feature audit files, `28-feature-inventory.md` (audit)
> **Purpose:** Define what each module is responsible for — and what it is NOT responsible for

---

## 1. Responsibility Definition Convention

Each module's responsibilities are documented as:
- **Owns** — what the module is responsible for
- **Does NOT own** — what the module delegates to other modules
- **Reads from** — what data the module consumes from other modules
- **Writes to** — what data the module produces
- **Exposes** — what interfaces the module provides to other modules

---

## 2. M-01: Overview Module

### Owns
- Screen health summary (online/offline counts)
- Quick action buttons (links to other modules)
- Recent activity feed (last 5-10 events)
- Workspace welcome state (no screens yet)

### Does NOT own
- Screen list or detail (M-02)
- Playlist list or detail (M-03)
- Schedule list or calendar (M-04)
- Analytics charts (M-05)
- Team list (M-06)
- Settings (M-07)

### Reads from
- Screen status (via SWR, workspace-scoped)
- Recent activity (via SWR, workspace-scoped)
- Active schedules (via SWR, workspace-scoped, upcoming only)

### Writes to
- None (Overview is read-only)

### Exposes
- Quick action links to other modules
- Screen health badge (clickable → navigates to screen detail)

---

## 3. M-02: Screens Module

### Owns
- Screen list (with search, filter, sort, bulk operations)
- Screen detail (status, current content, active schedules, quick actions)
- Screen pairing wizard
- Branch management (create, edit, delete — accessible from filter bar)
- Screen content override (emergency)
- Screen reboot (future)

### Does NOT own
- Playlist creation or editing (M-03)
- Schedule creation (M-04)
- Analytics (M-05)
- Team access to screens (M-06)
- Screen settings like display orientation (M-07)

### Reads from
- Playlist list (for content assignment dropdown)
- Active schedules (for schedule display on screen detail)
- Branch list (for filter)

### Writes to
- Screen entity (name, branch assignment, current playlist)
- Branch entity (create, edit, delete)

### Exposes
- Screen list data (consumed by Overview for health summary)
- Screen status (consumed by Overview, Analytics)
- Screen pairing wizard (invoked from Overview quick actions)

---

## 4. M-03: Content Module

### Owns
- Playlist library (list, search, filter)
- Playlist detail and preview
- Playlist creation (template picker + Studio)
- Studio canvas editor (Konva-based)
- Media library (list, search, filter by type)
- Media upload (multi-file, drag-drop, progress)
- Media detail (metadata, usage in playlists)
- Playlist templates (pre-built layouts)

### Does NOT own
- Screen assignment (M-02 handles assignment, Content provides the playlist)
- Schedule creation (M-04)
- Analytics on content performance (M-05)
- Storage limit management (M-07 Settings displays limits)

### Reads from
- Media list (for Studio media picker)
- Playlist templates (for template picker)

### Writes to
- Playlist entity (create, edit, delete, publish)
- Media entity (upload, delete, metadata)

### Exposes
- Playlist list (consumed by Screens for assignment, Scheduling for selection)
- Playlist preview (consumed by Screens for current content display)
- Media upload component (reusable within Studio)
- Template picker (invoked from Overview quick actions)

---

## 5. M-04: Scheduling Module

### Owns
- Schedule calendar (month/week/day views)
- Schedule creation (playlist selection, screen selection, time rules)
- Schedule list (alternative to calendar)
- Conflict detection (real-time during creation)
- Schedule activation/deactivation

### Does NOT own
- Playlist creation or editing (M-03)
- Screen management (M-02)
- Analytics (M-05)
- Immediate publish (this is a Content/Screens responsibility — scheduling is optional)

### Reads from
- Playlist list (for schedule creation form)
- Screen list (for schedule creation form)

### Writes to
- Schedule entity (create, edit, delete, activate, deactivate)

### Exposes
- Active schedules (consumed by Screens for display on screen detail)
- Upcoming schedules (consumed by Overview for upcoming activity)
- Schedule conflicts (consumed by Screens for conflict display)

---

## 6. M-05: Analytics Module

### Owns
- Screen health analytics (uptime, downtime, by period)
- Content performance analytics (play count, duration, by period)
- Period selection (7d, 30d, 90d, custom)
- Analytics export (future)

### Does NOT own
- Realtime screen status (M-02, Overview)
- Schedule performance (future)
- Team activity (M-06)

### Reads from
- Aggregated screen data (via SWR with period parameter)
- Aggregated content data (via SWR with period parameter)

### Writes to
- None (Analytics is read-only)

### Exposes
- None (Analytics is a terminal module — no other module consumes its output)

---

## 7. M-06: Team Module

### Owns
- Team member list (active + pending)
- Invite flow (email, role selection)
- Role change (Owner, Editor, Viewer)
- Member removal (with confirmation)
- Cancel/resend invite

### Does NOT own
- User profile settings (M-07)
- 2FA settings (M-07)
- Notification preferences (M-07)
- Custom roles (future enterprise feature — E-003)

### Reads from
- Team list (via SWR, workspace-scoped)

### Writes to
- Membership entity (invite, remove, role change)
- Invite entity (send, cancel, resend)

### Exposes
- Team member count (consumed by Overview if needed)
- Current user role (consumed by all modules for permission checks)

---

## 8. M-07: Settings Module

### Owns
- User profile (name, email, avatar)
- Workspace settings (name, branding, logo, colors)
- Billing (plan, invoices, payment method)
- Notification preferences (per-event, per-channel)
- Security (2FA, password change)
- API (documentation, API keys, webhooks)
- Islamic features configuration (prayer times, Hijri calendar, Ramadan mode)

### Does NOT own
- Team management (M-06)
- Screen configuration (M-02)
- Content settings (M-03)

### Reads from
- User profile (via SWR)
- Workspace settings (via SWR)
- Billing data (via SWR)
- API keys (via SWR)

### Writes to
- User entity (profile update, 2FA enable/disable)
- Workspace entity (name, branding)
- API key entity (create, revoke)
- Notification preferences (per-user)

### Exposes
- Workspace branding (consumed by Shell for logo/colors — BrandingProvider)
- User role (consumed by all modules for permission checks)
- Notification preferences (consumed by NotificationProvider)

---

## 9. M-08: Admin Module

### Owns
- Admin dashboard (system overview)
- Customer management (list, detail, impersonation)
- Staff management (list, create, remove)
- User management (list, detail)
- Workspace management (list, detail)
- Fleet overview (all screens across all customers)
- System health (service status)
- System logs (audit trail — future)
- Feature flags (toggle features per workspace)

### Does NOT own
- Client-side features (admin accesses via impersonation)
- Billing management (view only, not edit)
- Content management (view only via impersonation)

### Reads from
- All customer data (via admin APIs, not workspace-scoped)
- System health data (via admin APIs)
- Fleet data (via admin APIs)

### Writes to
- Staff entity (create, remove)
- Feature flag entity (toggle)
- Impersonation state (start, stop)

### Exposes
- Impersonation context (consumed by Shell for ImpersonationReturnButton)
- Feature flags (consumed by all modules for feature gating)

---

## 10. Cross-Module Responsibility Matrix

| Responsibility | Owner Module | Consumers |
|----------------|-------------|-----------|
| Screen health display | M-01 Overview | User |
| Screen list management | M-02 Screens | M-01, M-04, M-05 |
| Screen detail | M-02 Screens | User |
| Screen pairing | M-02 Screens | M-01 (quick action) |
| Playlist library | M-03 Content | M-02, M-04 |
| Playlist creation | M-03 Content | M-01 (quick action) |
| Media upload | M-03 Content | M-03 (Studio), User |
| Schedule calendar | M-04 Scheduling | User |
| Schedule creation | M-04 Scheduling | User |
| Conflict detection | M-04 Scheduling | M-02 (screen detail) |
| Analytics charts | M-05 Analytics | User |
| Team list | M-06 Team | User |
| Invite flow | M-06 Team | User |
| User profile | M-07 Settings | M-08 (admin view) |
| Workspace branding | M-07 Settings | Shell (BrandingProvider) |
| Billing | M-07 Settings | User |
| API keys | M-07 Settings | User |
| Feature flags | M-08 Admin | All modules (gating) |
| Impersonation | M-08 Admin | Shell (ImpersonationReturnButton) |

---

## Cross-References

- See `09-product-modules.md` for module definitions
- See `11-feature-ownership.md` for feature-to-module mapping
- See `12-module-boundaries.md` for boundaries between modules
- See `13-frontend-state-boundaries.md` for state boundaries per module
- See `14-frontend-responsibilities.md` for frontend responsibilities
