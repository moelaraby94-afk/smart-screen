# 13 — UX Review

> **Document Type:** UX Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** UX per persona, navigation patterns, interaction design, accessibility, RTL

---

## 1. Personas

### 1.1 Platform Personas

#### Persona: Platform Owner (SUPER_ADMIN)
- **Profile:** Business owner, technical, makes strategic decisions
- **Goals:** Monitor business health, manage staff, oversee all customers
- **Pain points:** Too much data, hard to find actionable insights
- **Device:** Desktop (1440px+), occasionally tablet
- **Frequency:** Daily (15-30 min)
- **Key flows:** Dashboard → Revenue → Tenants → Staff

#### Persona: Support Specialist (SUPPORT)
- **Profile:** Customer-facing, empathetic, problem-solver
- **Goals:** Resolve tickets fast, impersonate to debug, keep customers happy
- **Pain points:** Context switching between tickets and customer workspace
- **Device:** Desktop (1440px+), dual monitor
- **Frequency:** All day (continuous)
- **Key flows:** Support queue → Ticket detail → Impersonation → Resolution

#### Persona: Billing Manager (BILLING)
- **Profile:** Finance-focused, detail-oriented, process-driven
- **Goals:** Track revenue, manage invoices, handle payment failures
- **Pain points:** Disconnected billing data, manual invoice generation
- **Device:** Desktop (1440px+)
- **Frequency:** Daily (30-60 min), end of month (full day)
- **Key flows:** Billing center → Invoices → Failed payments → Reports

#### Persona: Operations Engineer (OPERATIONS)
- **Profile:** Technical, infrastructure-focused, proactive
- **Goals:** Keep system healthy, deploy updates, respond to incidents
- **Pain points:** Lack of visibility into system internals
- **Device:** Desktop (1440px+), terminal
- **Frequency:** Daily (continuous monitoring)
- **Key flows:** Monitoring → Alerts → Jobs → Backups

#### Persona: Security Analyst (SECURITY)
- **Profile:** Risk-focused, audit-minded, compliance-driven
- **Goals:** Ensure security posture, audit access, manage compliance
- **Pain points:** Scattered audit data, manual compliance reports
- **Device:** Desktop (1440px+)
- **Frequency:** Weekly (2-4 hours), quarterly (full review)
- **Key flows:** Security center → Audit log → Sessions → Compliance

### 1.2 Customer Personas

#### Persona: Customer Owner (OWNER)
- **Profile:** Business owner or manager, non-technical, decision-maker
- **Goals:** Manage digital signage, control spending, oversee team
- **Pain points:** Complex setup, unclear pricing, team management overhead
- **Device:** Desktop (1280px+), occasionally mobile
- **Frequency:** Daily (10-20 min), weekly review (30 min)
- **Key flows:** Overview → Screens → Billing → Team

#### Persona: Customer Admin (ADMIN)
- **Profile:** Operations manager, semi-technical, coordinator
- **Goals:** Manage content, assign screens, oversee schedules
- **Pain points:** Content organization, schedule conflicts, team coordination
- **Device:** Desktop (1280px+), tablet
- **Frequency:** Daily (30-60 min)
- **Key flows:** Overview → Playlists → Schedules → Campaigns

#### Persona: Customer Editor (EDITOR)
- **Profile:** Content creator, creative, detail-oriented
- **Goals:** Create content, design canvases, build playlists
- **Pain points:** Editor complexity, slow rendering, limited templates
- **Device:** Desktop (1440px+), large screen preferred
- **Frequency:** Daily (1-3 hours)
- **Key flows:** Studio → Media → Playlists → Templates

#### Persona: Customer Viewer (VIEWER)
- **Profile:** Executive or stakeholder, read-only access
- **Goals:** Monitor performance, view analytics, check status
- **Pain points:** Too much detail, wants summary view
- **Device:** Desktop (1280px+), tablet, mobile
- **Frequency:** Weekly (10-15 min)
- **Key flows:** Overview → Analytics → Proof of Play

### 1.3 Player Persona

#### Persona: Screen Player
- **Profile:** Kiosk device, no human interaction, always-on
- **Goals:** Display content, stay connected, receive commands
- **Pain points:** Network instability, offline scenarios, content sync
- **Device:** Android/iOS kiosk, Raspberry Pi, or web browser
- **Frequency:** 24/7 (always running)
- **Key flows:** Bootstrap → Canvas fetch → Playback → Heartbeat

---

## 2. Control Panel UX

### 2.1 Information Architecture

```
Control Panel (admin.cloudsignage.com)
│
├── Dashboard
│   ├── Revenue summary
│   ├── Growth charts
│   ├── System health
│   └── Quick actions
│
├── Tenants
│   ├── List (searchable, filterable)
│   ├── Detail (profile, subscription, usage, timeline)
│   └── Lifecycle (funnel view)
│
├── Workspaces (oversight)
│   └── List (all workspaces across all tenants)
│
├── Billing
│   ├── Subscriptions (list, detail, change plan)
│   ├── Plans (CRUD, features, pricing)
│   ├── Invoices (list, detail, PDF)
│   ├── Coupons (CRUD, analytics)
│   └── Tax rates (CRUD)
│
├── Fleet
│   ├── Global screen list
│   ├── Stats (online/offline, versions)
│   └── Force update
│
├── Monitoring
│   ├── System status
│   ├── Metrics
│   ├── Alerts
│   └── Incidents
│
├── Insights
│   ├── Platform analytics
│   └── Revenue analytics
│
├── Support
│   ├── Ticket queue
│   ├── Ticket detail
│   └── Analytics
│
├── Staff
│   ├── List
│   ├── Create
│   └── Activity
│
├── Security
│   ├── Sessions
│   ├── Access logs
│   ├── Threats
│   ├── Scorecard
│   └── IP allowlist
│
├── Audit
│   ├── Event log
│   ├── Export
│   └── Alerts
│
├── Config
│   ├── Settings
│   ├── Branding
│   ├── Feature flags
│   ├── Backups
│   ├── Jobs
│   ├── Automation
│   └── Maintenance
│
├── Marketplace (future)
│   └── App catalog
│
└── Developer (future)
    ├── API keys
    └── OAuth clients
```

### 2.2 Control Panel Interaction Patterns

| Pattern | Usage |
|---|---|
| **Data table** | Tenant list, invoice list, audit log, staff list |
| **Detail panel** | Tenant profile, ticket detail, invoice detail |
| **Chart** | Revenue, growth, analytics, usage |
| **Form** | Plan editor, settings, branding |
| **Modal** | Confirm actions (suspend, terminate, refund) |
| **Banner** | Maintenance mode, system alerts |
| **Toast** | Action success/failure |
| **Empty state** | No tenants, no tickets, no alerts |
| **Loading state** | Skeleton tables, spinner charts |
| **Error state** | API failure, data unavailable |

### 2.3 Control Panel Design Principles

1. **Data density** — Platform staff need maximum information per screen
2. **Quick actions** — Common actions accessible in 1-2 clicks
3. **Search-first** — Search is the primary navigation method for finding tenants
4. **Audit visibility** — Every action shows audit trail
5. **Role-appropriate** — Sidebar and pages adapt to staff role
6. **Keyboard navigation** — Power users navigate via keyboard
7. **Dark mode** — Platform staff prefer dark mode (reduced eye strain)

---

## 3. Customer Workspace UX

### 3.1 Information Architecture

```
Customer Workspace (app.cloudsignage.com)
│
├── Overview
│   ├── Workspace summary
│   ├── Recent activity
│   ├── Quick actions
│   └── Onboarding (if incomplete)
│
├── Content
│   ├── Screens (list, detail, pairing)
│   ├── Playlists (list, detail, preview)
│   ├── Media Library (grid, folders, upload)
│   ├── Studio (canvas editor)
│   └── Templates (gallery)
│
├── Scheduling
│   ├── Calendar (day/week/month)
│   └── Campaigns (list, detail, lifecycle)
│
├── Insights
│   ├── Analytics (overview, screen, content)
│   ├── Proof of Play
│   └── Usage
│
├── Team
│   └── Members (list, invite, roles)
│
├── Configuration
│   ├── Settings (workspace, timezone, language)
│   ├── Billing (plan, invoices, payment)
│   ├── API Keys
│   ├── Webhooks
│   └── Integrations
│
└── Account
    ├── Profile
    ├── Security (password, 2FA)
    └── Workspaces (switcher)
```

### 3.2 Customer Workspace Interaction Patterns

| Pattern | Usage |
|---|---|
| **Card grid** | Media library, templates, screens |
| **Data table** | Playlists, schedules, team members |
| **Calendar** | Schedule view (day/week/month) |
| **Canvas editor** | Studio (drag-and-drop, Konva) |
| **Wizard** | Onboarding, screen pairing |
| **Form** | Settings, billing, API keys |
| **Modal** | Confirm actions, invite member, create |
| **Banner** | Trial warning, impersonation, maintenance |
| **Toast** | Action success/failure |
| **Empty state** | No screens, no media, no playlists |
| **Loading state** | Skeleton cards, spinner |
| **Error state** | API failure, quota exceeded |
| **Offline state** | Screen offline indicator |
| **Permission state** | Action hidden for insufficient role |

### 3.3 Customer Workspace Design Principles

1. **Simplicity** — Non-technical users should succeed without training
2. **Visual-first** — Content is visual; UI should showcase content
3. **Onboarding** — Guided setup reduces time-to-value
4. **Role-appropriate** — UI adapts: EDITOR sees content tools, OWNER sees billing
5. **Feedback** — Every action has immediate visual feedback
6. **Mobile-aware** — Key views (overview, analytics) work on mobile
7. **RTL support** — Full Arabic RTL layout

---

## 4. Navigation Patterns

### 4.1 Control Panel Navigation

```
Login → 2FA → Dashboard
                    │
                    ├── Sidebar (always visible on desktop)
                    │   ├── Collapsible sections
                    │   ├── Role-based visibility
                    │   └── Active state indicator
                    │
                    ├── Header
                    │   ├── Page title
                    │   ├── Breadcrumbs
                    │   ├── Notifications bell
                    │   ├── User menu (profile, logout)
                    │   └── Language toggle (EN | AR)
                    │
                    └── Content area
                        ├── Page header (title + actions)
                        ├── Data table / chart / form
                        └── Pagination
```

### 4.2 Customer Workspace Navigation

```
Login → Workspace selection → Overview
                                  │
                                  ├── Sidebar (always visible on desktop)
                                  │   ├── Workspace switcher (top)
                                  │   ├── Content section
                                  │   ├── Scheduling section
                                  │   ├── Insights section
                                  │   ├── Team section
                                  │   ├── Configuration section
                                  │   └── Footer (language, theme, logout)
                                  │
                                  ├── Header
                                  │   ├── Back button (if nested)
                                  │   ├── Page title
                                  │   ├── Breadcrumbs
                                  │   ├── Notifications bell
                                  │   ├── User menu
                                  │   └── Language toggle
                                  │
                                  ├── Impersonation banner (if impersonated)
                                  │
                                  └── Content area
                                      ├── Page header (title + actions)
                                      ├── Content (cards, table, editor)
                                      └── Pagination / infinite scroll
```

---

## 5. Key User Flows

### 5.1 Platform: Support Impersonation Flow

```
Support specialist logs into Control Panel
  │
  ├── Navigates to Tenants → selects customer
  ├── Clicks "Impersonate" button
  ├── Enters reason (free text, required)
  ├── Clicks "Start Impersonation"
  │
  ▼
Backend generates exchange token → redirects to app.cloudsignage.com/auth/impersonate?token=...
  │
  ▼
Customer Workspace receives token
  │
  ├── POST /auth/exchange-impersonation
  ├── Backend validates token (Redis, one-time)
  ├── Issues customer JWT with impersonatedBy claim
  ├── Sets __dash_access cookie
  ├── Redirects to /overview
  │
  ▼
Customer Workspace shows impersonation banner
  │
  ├── "You are impersonating this customer. All actions are logged."
  ├── "Return to Control Panel" button
  │
  ▼
Support specialist debugs customer issue
  │
  ├── Navigates workspace as customer
  ├── All actions logged with impersonatedBy
  │
  ▼
Support specialist clicks "Return to Control Panel"
  │
  ├── POST /auth/exit-impersonation
  ├── Backend issues platform exchange token
  ├── Redirects to admin.cloudsignage.com
  ├── Control Panel restores admin session
  └── Support specialist returns to ticket
```

### 5.2 Customer: Screen Pairing Flow

```
Customer navigates to Screens
  │
  ├── Clicks "Add Screen"
  ├── Modal: "Pair a new screen"
  │   ├── Instructions: "On your screen device, open the Cloud-Screen Player app"
  │   ├── Instructions: "Enter this pairing code: ABC123"
  │   ├── Pairing code displayed (large, readable)
  │   ├── Countdown timer (10:00)
  │   └── "Waiting for screen..." spinner
  │
  ▼
Player device enters pairing code
  │
  ├── Player calls POST /player/pairing/sessions with code
  ├── Backend validates code, links screen to player
  ├── Backend notifies Customer Workspace via WebSocket
  │
  ▼
Customer Workspace shows "Screen paired!"
  │
  ├── Form: Screen name, location, tags
  ├── Clicks "Save"
  ├── Screen created and assigned to workspace
  ├── Screen starts playing default content
  └── Success toast: "Screen added successfully"
```

### 5.3 Customer: Content Creation Flow

```
Customer navigates to Templates
  │
  ├── Browses template gallery (category filters, search)
  ├── Clicks template card → preview modal
  ├── Clicks "Use This Template"
  │
  ▼
Redirects to Studio with ?template={id}
  │
  ├── Studio auto-creates canvas from template
  ├── Canvas loads in editor
  ├── Customer edits: text, images, colors, layout
  ├── Auto-save indicator (saving... / saved)
  │
  ▼
Customer clicks "Save & Close"
  │
  ├── Canvas saved with version snapshot
  ├── Redirects to canvas list
  └── Success toast: "Canvas saved"
  │
  ▼
Customer creates playlist
  │
  ├── Navigates to Playlists → "Create Playlist"
  ├── Adds canvas to playlist
  ├── Sets duration (10 seconds)
  ├── Adds transition (fade)
  ├── Saves playlist
  │
  ▼
Customer assigns playlist to screen
  │
  ├── Navigates to Screens → selects screen
  ├── Clicks "Assign Playlist"
  ├── Selects playlist
  ├── Saves assignment
  └── Screen starts playing new content
```

### 5.4 Customer: Trial to Paid Flow

```
Customer on trial (Day 12)
  │
  ├── Trial banner: "Trial expires in 2 days. Upgrade now."
  ├── Clicks "Upgrade"
  │
  ▼
Billing page
  │
  ├── Current plan: PRO Trial (expires in 2 days)
  ├── Plan comparison table
  ├── Clicks "Continue with PRO"
  │
  ▼
Stripe checkout
  │
  ├── Enters payment details (Stripe-hosted)
  ├── Completes payment
  │
  ▼
Backend processes payment
  │
  ├── Subscription updated (TRIALING → ACTIVE)
  ├── Invoice generated
  ├── Welcome email sent
  ├── Trial banner removed
  └── Success toast: "You're on PRO! 🎉"
```

---

## 6. Accessibility

### 6.1 WCAG 2.1 AA Compliance

| Principle | Implementation |
|---|---|
| **Perceivable** | Alt text on images, ARIA labels, color contrast 4.5:1, resizable text |
| **Operable** | Keyboard navigation, focus indicators, no keyboard traps, skip links |
| **Understandable** | Clear labels, error messages, consistent navigation, help text |
| **Robust** | Semantic HTML, ARIA roles, screen reader tested |

### 6.2 Keyboard Navigation

| Component | Key | Action |
|---|---|---|
| Sidebar | Tab | Move to next item |
| Sidebar | Enter/Space | Activate item |
| Data table | Tab | Move to next cell |
| Data table | Enter | Open detail |
| Modal | Escape | Close modal |
| Modal | Tab | Cycle within modal (focus trap) |
| Canvas editor | Tab | Move between elements |
| Canvas editor | Delete | Delete selected element |
| Canvas editor | Ctrl+S | Save canvas |
| Search | / | Focus search input |
| Anywhere | ? | Show keyboard shortcuts (future) |

### 6.3 Screen Reader Support

| Element | ARIA |
|---|---|
| Sidebar nav | `role="navigation"`, `aria-label="Main navigation"` |
| Nav item | `role="menuitem"`, `aria-current="page"` (if active) |
| Data table | `role="table"`, column headers `role="columnheader"` |
| Loading | `role="status"`, `aria-live="polite"` |
| Error | `role="alert"`, `aria-live="assertive"` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Toast | `role="status"`, `aria-live="polite"` |
| Tab list | `role="tablist"`, tabs `role="tab"`, panels `role="tabpanel"` |
| Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |

---

## 7. RTL (Right-to-Left) Support

### 7.1 RTL Implementation

| Aspect | LTR (English) | RTL (Arabic) |
|---|---|---|
| Text direction | `dir="ltr"` | `dir="rtl"` |
| Sidebar position | Left | Right |
| Icon direction | → | ← |
| Margin/padding | `ml-4` (margin-left) | `mr-4` (margin-right) |
| Flex direction | `flex-row` | `flex-row-reverse` |
| Number alignment | Left | Right (numbers stay LTR within RTL) |
| Scrollbar | Right | Left |

### 7.2 RTL Rules

1. **Use logical properties** — `ms-4` (margin-inline-start) instead of `ml-4` (margin-left)
2. **Flip directional icons** — Arrows, chevrons, back/forward icons
3. **Keep numbers LTR** — Phone numbers, dates, currency stay LTR within RTL text
4. **Mirror layout** — Sidebar, header, breadcrumbs mirror positions
5. **Test with Arabic content** — Not just flipped English, actual Arabic text
6. **Font support** — Use fonts that support Arabic (Cairo, Tajawal, or system fonts)

### 7.3 RTL Testing Checklist

- [ ] Sidebar on right side
- [ ] Text aligned right
- [ ] Icons flipped (arrows, chevrons)
- [ ] Modals open from right
- [ ] Tooltips appear on left
- [ ] Breadcrumbs flow right to left
- [ ] Data tables: first column on right
- [ ] Calendar: weeks start on Saturday (Arabic locale)
- [ ] Number inputs: numbers LTR within RTL
- [ ] Mixed content: Arabic + English numbers display correctly

---

## 8. Responsive Design

### 8.1 Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### 8.2 Control Panel Responsive Behavior

| Component | Mobile (< 768px) | Tablet (768-1024px) | Desktop (> 1024px) |
|---|---|---|---|
| Sidebar | Hidden (drawer) | Collapsible (icons) | Full (expanded) |
| Header | Compact (hamburger) | Full | Full |
| Data table | Horizontal scroll | Horizontal scroll | Full width |
| Charts | Stacked | Side by side | Side by side |
| Forms | Single column | Single column | Two columns |

**Note:** Control Panel is primarily desktop-first. Mobile is supported but not optimized.

### 8.3 Customer Workspace Responsive Behavior

| Component | Mobile (< 768px) | Tablet (768-1024px) | Desktop (> 1024px) |
|---|---|---|---|
| Sidebar | Hidden (drawer) | Collapsible (icons) | Full (expanded) |
| Header | Compact (hamburger + bell) | Full | Full |
| Overview cards | Stacked | 2-column grid | 4-column grid |
| Media library | 2-column grid | 3-column grid | 5-column grid |
| Studio editor | Not supported | Simplified | Full |
| Schedule calendar | Day view only | Week view | Month view |
| Data table | Card view | Compact table | Full table |
| Forms | Single column | Single column | Two columns |

**Note:** Customer Workspace is mobile-aware. Key flows (overview, analytics, screen status) work on mobile. Studio editor requires desktop.

---

## 9. Empty States

### 9.1 Control Panel Empty States

| Screen | Empty State |
|---|---|
| Tenants | "No tenants yet. New registrations will appear here." |
| Support tickets | "No open tickets. You're all caught up!" |
| Audit log | "No audit events for this filter." |
| Alerts | "No active alerts. System is healthy." |
| Staff | "No staff members. Add your first team member." |

### 9.2 Customer Workspace Empty States

| Screen | Empty State |
|---|---|
| Overview (no screens) | "Welcome! Start by adding your first screen." + CTA button |
| Screens | "No screens yet. Pair your first screen to get started." + video link |
| Media | "No media uploaded. Upload images and videos to create content." + upload button |
| Playlists | "No playlists. Create a playlist to organize your content." + create button |
| Schedules | "No schedules. Create a schedule to control when content plays." + create button |
| Campaigns | "No campaigns. Create a campaign to coordinate content across screens." |
| Analytics | "No data yet. Analytics will appear once your screens start playing content." |
| Team | "No team members. Invite your team to collaborate." + invite button |

---

## 10. Loading States

| Component | Loading Pattern |
|---|---|
| Data table | Skeleton rows (5-10 placeholder rows) |
| Card grid | Skeleton cards (placeholder shapes) |
| Charts | Spinner + "Loading data..." |
| Detail page | Skeleton layout (header + body blocks) |
| Form | Disabled inputs + spinner on submit button |
| Modal | Spinner center + "Loading..." |
| Full page | Centered spinner + brand logo |

---

## 11. Error States

| Error Type | UI Pattern |
|---|---|
| API 400 | Inline form error with message |
| API 401 | Redirect to login |
| API 403 | "You don't have permission to access this page." + contact support |
| API 404 | "Page not found" or "Resource not found" + back button |
| API 402 | "Plan limit reached. Upgrade to continue." + upgrade button |
| API 429 | "Too many requests. Please wait a moment." + retry timer |
| API 500 | "Something went wrong. We've been notified." + retry button |
| API 503 | Maintenance page with message + estimated time |
| Network error | "Connection lost. Retrying..." + auto-retry |
| WebSocket disconnect | "Real-time updates paused. Reconnecting..." |

---

## 12. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Desktop-first (Control Panel) | Yes | Platform staff work on desktop, data density needed |
| Mobile-aware (Customer Workspace) | Yes | Customers check status on mobile, but create on desktop |
| RTL support | Full | MENA market is primary, Arabic is first-class |
| WCAG 2.1 AA | Target | Enterprise customers require accessibility compliance |
| Keyboard navigation | Full | Power users (platform staff) expect keyboard support |
| Dark mode | Both | Platform staff prefer dark, customers prefer light (default) |
| Skeleton loading | Yes | Better perceived performance than spinners |
| Empty states with CTA | Yes | Guide users to next action, reduce dead ends |
| Role-based UI | Yes | Show only what each role can do (no disabled actions) |
| Impersonation banner | Always visible | Security transparency, easy exit |
