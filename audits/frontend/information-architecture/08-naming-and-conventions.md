# Naming and Conventions

> **Evidence basis:** `04-final-ia-sitemap.md`, `05-navigation-architecture.md`, `product-architecture/16-navigation-principles.md`, `transformation/28-documentation-index.md` §5 (terminology)
> **Purpose:** Define naming rules, URL rules, route naming convention, breadcrumb convention, sidebar convention, page naming convention, menu ordering rules, expansion rules, future feature rules

---

## 1. Terminology Standardization

### 1.1 Canonical Terms

| Canonical Term | Do Not Use | Context | Evidence |
|---------------|-----------|---------|----------|
| Screen | Display, Monitor, Device | Product entity — physical display device | `transformation/28-documentation-index.md` §5 |
| Playlist | Slideshow, Presentation, Deck | Product entity — sequence of media items | `10-playlists-and-studio.md` §10.3 |
| Media | Asset, File, Content Item | Product entity — uploaded file (image/video) | `11-media-library.md` §11.3 |
| Schedule | Timetable, Program | Product entity — time-based playlist assignment | `12-schedules-feature.md` §12.3 |
| Workspace | Account, Tenant, Organization | Product entity — tenant boundary | `07-workspace-management.md` §7.3 |
| Branch | Location, Store, Venue | Product entity — optional location grouping | `13-branches-feature.md` §13.3 |
| Team | Members, Users, Staff | Product entity — workspace members | `16-team-feature.md` §16.3 |
| Content | (Used for the combined Playlists + Media section) | Navigation section name | Locked sidebar decision |
| Scheduling | Schedule, Schedules (noun) | Navigation section name (verb form preferred) | `04-product-hierarchy.md` §4 |
| Studio | Editor, Canvas, Designer | Tool name — canvas editor for playlists | `10-playlists-and-studio.md` §10.12 |
| Overview | Dashboard, Home | Navigation section name — status at a glance | Locked product decision |
| Pairing | Setup, Registration, Activation | Screen onboarding process | Locked product decision |

### 1.2 Bilingual Term Mapping

| English | Arabic | Notes |
|---------|--------|-------|
| Overview | نظرة عامة | — |
| Screens | الشاشات | Plural |
| Content | المحتوى | — |
| Playlists | قوائم التشغيل | — |
| Media | الوسائط | — |
| Scheduling | الجدولة | Verb form (verbal noun) |
| Analytics | التحليلات | — |
| Team | الفريق | — |
| Settings | الإعدادات | — |
| Studio | الاستوديو | Transliteration |
| Overview | نظرة عامة | — |
| Pair | إقران | — |
| Publish | نشر | — |
| Schedule | جدولة / جدول | Verb / noun |
| Invite | دعوة | — |

---

## 2. URL Rules

| Rule | Pattern | Example | Evidence |
|------|---------|---------|----------|
| Locale prefix | `/{locale}/...` | `/en/screens`, `/ar/screens` | LC-02 |
| Entity plural for lists | `/{entity}` | `/screens`, `/content` | RESTful |
| Entity ID for detail | `/{section}/{id}` | `/screens/abc-123` | RESTful |
| Action as sub-path | `/{section}/{action}` | `/screens/pair` | Action pages |
| Tab as sub-path | `/{section}/{tab}` | `/settings/billing` | Tab navigation |
| Kebab-case for multi-word | `{word}-{word}` | `/feature-flags` | URL convention |
| No trailing slashes | `/screens` | Not `/screens/` | Next.js |
| No file extensions | `/screens` | Not `/screens.html` | Next.js |
| No query params for navigation | `/settings/billing` | Not `/settings?tab=billing` | RESTful, bookmarkable |
| Query params for filters only | `/screens?status=offline&branch=brn_123` | Filters are ephemeral | — |

---

## 3. Route Naming Convention

### 3.1 Route Segment Rules

| Segment Type | Rule | Example |
|-------------|------|---------|
| Section (sidebar) | Single word, plural for entities | `/screens`, `/content`, `/team` |
| Entity ID | UUID or slug | `/screens/{id}` |
| Action | Verb, imperative | `/screens/pair` |
| Tab | Noun, singular | `/settings/billing` |
| Sub-entity | Nested under parent entity | `/content/playlists/{id}` |

### 3.2 Route Segment Inventory

| Segment | Type | Used In | Evidence |
|---------|------|---------|----------|
| `overview` | Section | `/overview` | M-01 |
| `screens` | Section (entity) | `/screens`, `/screens/{id}`, `/screens/pair` | M-02 |
| `content` | Section (combined) | `/content`, `/content/playlists/{id}`, `/content/media` | M-03 |
| `playlists` | Sub-entity | `/content/playlists/{id}`, `/content/playlists/{id}/studio` | M-03 |
| `media` | Sub-entity | `/content/media` | M-03 |
| `studio` | Action (tool) | `/content/playlists/{id}/studio` | M-03, DD-02 |
| `scheduling` | Section | `/scheduling` | M-04 |
| `analytics` | Section | `/analytics` | M-05 |
| `team` | Section | `/team` | M-06 |
| `settings` | Section | `/settings`, `/settings/{tab}` | M-07 |
| `notifications` | Section (non-sidebar) | `/notifications` | Shell |
| `admin` | Section (admin mode) | `/admin`, `/admin/{section}` | M-08 |

---

## 4. Breadcrumb Convention

| Rule | Description | Example | Evidence |
|------|-------------|---------|----------|
| Format | `Section / Entity Name` | `Screens / Screen A` | NP-07 |
| Separator | `ChevronRight` icon | `Screens › Screen A` | NP-07 |
| RTL separator | `ChevronRight` with `rtl:rotate-180` | `الشاشات ‹ الشاشة أ` | RTC-02 |
| Last item | Current page name, not clickable | `Screens / Screen A` (Screen A not clickable) | NP-07 |
| Previous items | Clickable, navigate to parent | `Screens` → `/screens` | NP-07 |
| Maximum depth | 3 levels | `Content / Playlist A / Studio` | NP-07, PC-23 |
| No breadcrumb on list pages | Top-level lists don't need breadcrumbs | `/screens` — no breadcrumb | NP-07 |
| No breadcrumb on Overview | Top-level, no parent | `/overview` — no breadcrumb | NP-07 |
| Use entity name, not ID | User-readable | `Screens / Screen A` not `Screens / abc-123` | NP-07 |

---

## 5. Sidebar Convention

### 5.1 Item Naming

| Rule | Description | Evidence |
|------|-------------|----------|
| Noun, not verb | "Screens" not "Manage Screens" | Naming convention |
| Plural for entities | "Screens", "Playlists" (within Content) | Entity convention |
| Singular for concepts | "Overview", "Analytics", "Scheduling", "Team", "Settings" | Concept convention |
| Max 12 characters (EN) | Prevents text overflow | Visual constraint |
| Both languages required | EN and AR translations | PR-39, PR-40 |

### 5.2 Item Ordering

| Position | Item | Rationale | Evidence |
|----------|------|-----------|----------|
| 1 | Overview | Landing page, status | NP-04 |
| 2 | Screens | Entity priority #2 | Entity priority |
| 3 | Content | Entity priority #3, #4 | Entity priority |
| 4 | Scheduling | Entity priority #5 | Entity priority |
| 5 | Analytics | Entity priority #7 | Entity priority |
| 6 | Team | Entity priority #6 | Entity priority |
| 7 | Settings | Configuration, least frequent | Task hierarchy |

### 5.3 Item Icons

| Item | Icon (Lucide) | Rationale |
|------|--------------|-----------|
| Overview | LayoutDashboard | Dashboard concept |
| Screens | Monitor | Display device |
| Content | Clapperboard | Content/media concept |
| Scheduling | CalendarClock | Time-based scheduling |
| Analytics | BarChart3 | Charts/analytics |
| Team | Users | People/team |
| Settings | Settings | Gear/configuration |

### 5.4 Active State

| Element | Active | Inactive | Evidence |
|---------|--------|----------|----------|
| Background | `bg-primary/8` | Transparent | NP-09 |
| Text | `text-primary` | `text-muted-foreground` | NP-09 |
| Weight | `font-medium` | `font-normal` | NP-09 |
| Hover | — | `hover:bg-muted/40` | NP-09 |
| Focus | `ring-2 ring-primary/30` | Same | NP-09 |
| Icon stroke | 1.5 | 1.5 | F-MP-02 |

---

## 6. Page Naming Convention

### 6.1 Page Title Rules

| Rule | Description | Example | Evidence |
|------|-------------|---------|----------|
| Derived from route | Via `useShellHeaderMeta` hook | `/screens/abc` → "Screen A" | NP-02 |
| Entity name for detail pages | User-given name, not ID | "Screen A" not "abc-123" | NP-02 |
| Section name for list pages | Sidebar label | "Screens" | NP-02 |
| Tab name for tabbed pages | Tab label | "Billing" (within Settings) | NP-02 |
| Both languages | EN and AR | "Screens" / "الشاشات" | PR-39 |

### 6.2 Kicker Rules

| Page | Kicker (EN) | Kicker (AR) | Evidence |
|------|------------|------------|----------|
| Overview | (none) | (none) | Top-level |
| Screen list | (none) | (none) | Top-level |
| Screen detail | "Screens" | "الشاشات" | Section context |
| Content (Playlists) | (none) | (none) | Top-level |
| Playlist detail | "Content" | "المحتوى" | Section context |
| Studio | "Content" | "المحتوى" | Section context |
| Scheduling | (none) | (none) | Top-level |
| Analytics | (none) | (none) | Top-level |
| Team | (none) | (none) | Top-level |
| Settings (Profile) | (none) | (none) | Top-level |
| Settings (Billing) | "Settings" | "الإعدادات" | Section context |
| Notifications | (none) | (none) | Non-sidebar |

---

## 7. Menu Ordering Rules

### 7.1 Sidebar Order (Client)

1. Overview
2. Screens
3. Content
4. Scheduling
5. Analytics
6. Team
7. Settings

### 7.2 Sidebar Order (Admin)

**Management:**
1. Customers
2. Staff
3. Users

**System:**
4. Workspaces
5. Fleet
6. Health
7. Logs
8. Feature Flags

### 7.3 Settings Tab Order

1. Profile (default)
2. Workspace
3. Billing
4. Notifications
5. Security
6. API

### 7.4 Content Tab Order

1. Playlists (default)
2. Media

### 7.5 Ordering Principles

| Principle | Description | Evidence |
|-----------|-------------|----------|
| Frequency-based | Most frequently used first | Task hierarchy |
| Entity priority | Higher priority entities first | Locked entity priority |
| Concept before configuration | Management sections before Settings | NP-01 |
| Default tab is most common | Profile (Settings), Playlists (Content) | — |

---

## 8. Expansion Rules

### 8.1 When to Add a Tab

| Condition | Action | Example |
|-----------|--------|---------|
| New feature within existing module | Add tab to module page | Analytics → "Proof of Play" tab |
| New settings category | Add tab to Settings | Settings → "SSO" tab |
| New content type | Add tab to Content | Content → "Templates" tab |
| Maximum 6 tabs per page | If at limit, use sub-navigation or restructure | Settings at 6 tabs (limit) |

### 8.2 When to Add a Sub-Section

| Condition | Action | Example |
|-----------|--------|---------|
| Feature needs its own page but belongs to a module | Add sub-route | `/content/templates` |
| Feature has list + detail pattern | Add list + detail routes | `/analytics/proof-of-play` |
| Feature is accessed from a parent page | Add as sub-route, not sidebar item | `/screens/map` (from Screens) |

### 8.3 When NOT to Expand

| Condition | Action | Rationale |
|-----------|--------|-----------|
| Feature would require 8th sidebar item | REJECT or find home in existing 7 | PC-04 (locked) |
| Feature would exceed 3-level depth | RESTRUCTURE or use dialog/tab | PC-23 |
| Feature is developer-only | Place in Settings → API | NP-01 |
| Feature is optional | Place in existing section, not new section | PR-08 |

---

## 9. Future Feature Rules

### 9.1 Feature Placement Rules

| Feature | Placement | Route | Evidence |
|---------|-----------|-------|----------|
| Playlist templates | Content → Templates tab | `/content/templates` | F-MP-13 |
| Multi-zone layouts | Studio extension (zones) | (within Studio) | F-FU-05 |
| Content approval workflow | Team module + Content status | (within existing pages) | F-FU-06 |
| Playlist versioning | Playlist detail → Versions tab | `/content/playlists/{id}/versions` | F-FU-07 |
| A/B testing | Analytics + Content variant | `/analytics` + `/content` | F-FU-08 |
| Remote screen reboot | Screen detail quick action | (within `/screens/{id}`) | F-FU-01 |
| Live screenshot | Screen detail widget | (within `/screens/{id}`) | F-FU-02 |
| Map view | Screens section toggle | `/screens/map` | F-FU-03 |
| OTA updates | Settings or Admin fleet | (within existing pages) | F-FU-04 |
| Calendar drag-reschedule | Scheduling calendar extension | (within `/scheduling`) | F-FU-09 |
| Nested playlists | Playlist entity extension | (within existing pages) | F-FU-10 |
| Content expiry | Schedule rule extension | (within schedule form) | F-FU-11 |
| Proof-of-play reports | Analytics → PoP tab | `/analytics/proof-of-play` | F-FU-12 |
| Device crash reports | Analytics → Devices tab | `/analytics/devices` | F-FU-13 |
| Custom roles (RBAC) | Team module extension | (within `/team`) | F-HP-08 |
| Audit log | Settings → Audit tab or Admin | `/settings/audit` or `/admin/audit-log` | F-HP-10 |
| SSO/SAML | Settings → Security tab extension | (within `/settings/security`) | F-HP-11 |
| Plan selection | Settings → Billing tab | (within `/settings/billing`) | F-LP-05 |
| API key management | Settings → API tab | (within `/settings/api`) | F-LP-07 |
| Webhook configuration | Settings → API tab extension | (within `/settings/api`) | F-LP-08 |

### 9.2 Feature Flag Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| New features are flag-gated | Controlled rollout | M-08 (Admin → Feature Flags) |
| Flag OFF = feature hidden | Not visible in UI | NP-08 |
| Flag ON = feature visible | Normal UI | — |
| Flag check is frontend-only | Backend enforces separately | PC-32 |
| Flag state is per-workspace | Different customers have different features | M-08 |

---

## Cross-References

- See `04-final-ia-sitemap.md` for the complete sitemap
- See `05-navigation-architecture.md` for navigation architecture
- See `06-page-catalog.md` for page definitions
- See `product-architecture/16-navigation-principles.md` for navigation principles
- See `product-architecture/20-future-extensibility.md` for extensibility patterns
- See `transformation/28-documentation-index.md` §5 for terminology standardization
