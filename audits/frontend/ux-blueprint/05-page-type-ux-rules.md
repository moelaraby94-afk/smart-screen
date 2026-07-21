# Page Type UX Rules

> **Evidence basis:** `01-ux-principles.md` through `04-feature-ux-standards.md`, `information-architecture/06-page-catalog.md`, `product-architecture/09-product-modules.md`
> **Purpose:** Define UX rules for each page type — dashboard, list, detail, editor, wizard, settings, auth — that all pages of that type follow

---

## 1. Page Type Classification

| Type | Pages | Count | Evidence |
|------|-------|-------|----------|
| Dashboard | Overview, Analytics, Admin Dashboard | 3 | `06-page-catalog.md` |
| List | Screens, Playlists, Media, Team, Schedules, Admin lists | 8 | — |
| Detail | Screen detail, Playlist detail, Customer detail | 3 | — |
| Editor | Studio | 1 | — |
| Wizard | Screen pairing | 1 | — |
| Settings | Profile, Workspace, Billing, Notifications, Security, API | 6 | — |
| Auth | Login, Register, Forgot Password | 3 | — |
| History | Notifications | 1 | — |

---

## 2. Dashboard Page Type

### 2.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [Page Title]                          [Actions]   │
├─────────────────────┬────────────────────────────┤
│ Widget 1             │ Widget 2                   │
├─────────────────────┼────────────────────────────┤
│ Widget 3             │ Widget 4                   │
├─────────────────────┴────────────────────────────┤
│ Widget 5 (full width)                             │
└──────────────────────────────────────────────────┘
```

### 2.2 Dashboard Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| 2-column grid on desktop | Widgets side by side | `04-feature-ux-standards.md` §6 |
| 1-column on mobile | Widgets stacked | `04-feature-ux-standards.md` §3 |
| Max 5 widgets | Beyond 5, overload | `04-feature-ux-standards.md` §6.1 |
| Each widget has loading/empty/error | Self-contained | `04-feature-ux-standards.md` §6.2 |
| No primary action button in header | Dashboard is informational | UP-02 (exception: Overview has quick actions) |
| Period selector if time-based | Analytics has period selector | `06-page-catalog.md` P-AN-01 |

---

## 3. List Page Type

### 3.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [Page Title]                    [Primary Action]   │
├──────────────────────────────────────────────────┤
│ [🔍 Search...]                                    │
│ [Filter: Status ▾] [Filter: Branch ▾]  [Clear All]│
│ [Active filter chips: [Status: Offline ×] ...]    │
├──────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ Card │ │ Card │ │ Card │ │ Card │              │
│ └──────┘ └──────┘ └──────┘ └──────┘              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ Card │ │ Card │ │ Card │ │ Card │              │
│ └──────┘ └──────┘ └──────┘ └──────┘              │
├──────────────────────────────────────────────────┤
│              [Pagination: 1-20 of 156]            │
└──────────────────────────────────────────────────┘
```

### 3.2 List Page Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Search bar at top | Full width, above filters | `03-component-ux-standards.md` §3.1 |
| Filters below search | Dropdown filters with chips | `03-component-ux-standards.md` §4 |
| Primary action top-end | "Add Screen", "Create Playlist", etc. | UP-02, VH-02 |
| Card grid: 1 col mobile, 2 tablet, 3-4 desktop | Responsive | `04-feature-ux-standards.md` §3.2 |
| Pagination at bottom | Page size + page indicator | `03-component-ux-standards.md` §2.4 |
| Bulk selection via checkboxes | Checkbox on each card + header | `04-feature-ux-standards.md` §2 |
| Empty state when no items | Centered with CTA | `02-state-guidelines.md` §1 |
| Skeleton loading | 6-8 skeleton cards | `02-state-guidelines.md` §2.2 |
| Sort by column/field | Dropdown or column header click | `03-component-ux-standards.md` §2.2 |

### 3.3 Card Design Rules

| Element | Rule | Evidence |
|---------|------|----------|
| Thumbnail/Icon | Top section, 16:9 or square | — |
| Title | Entity name, `font-medium` | — |
| Status badge | Top-end of card, colored | VH-04 |
| Metadata | Below title, `text-sm text-muted-foreground` | — |
| Hover | Border intensifies or subtle shadow | MI-02 |
| Click | Navigates to detail page | IN-01 |
| Checkbox | Top-start, appears on hover or always (if bulk enabled) | IN-07 |
| Actions | "More" (⋮) button, top-end or bottom | — |

---

## 4. Detail Page Type

### 4.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [← Back] [Breadcrumb]              [Actions ▾]    │
├──────────────────────────────────────────────────┤
│ [Entity Title]                                    │
│ [Status Badge]  [Metadata]                        │
├──────────────────────────────────────────────────┤
│ [Primary Action Button]                           │
├──────────────────────────────────────────────────┤
│ Section 1: [Section Title]                        │
│   Content...                                      │
├──────────────────────────────────────────────────┤
│ Section 2: [Section Title]                        │
│   Content...                                      │
├──────────────────────────────────────────────────┤
│ Section 3: [Section Title]                        │
│   Content...                                      │
└──────────────────────────────────────────────────┘
```

### 4.2 Detail Page Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Back button in header | Descriptive label | NP-03 |
| Breadcrumb below header | Section / Entity Name | NP-07 |
| Title is entity name | Not ID | NP-02 |
| Status badge next to title | Colored, with icon | VH-04 |
| Primary action button | Below header, prominent | UP-02 |
| Sections are visually separated | Cards or dividers | VH-05 |
| Each section has a title | `text-sm font-medium uppercase` | — |
| Cross-navigation links in sections | "View Screen", "Edit Playlist" | `05-navigation-architecture.md` §7 |
| No dead ends | Every section has an action or link | UP-05 |

---

## 5. Editor Page Type (Studio)

### 5.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [← Back] Playlist Name / Studio    [Preview] [Save]│
├────────┬────────────────────────────┬─────────────┤
│        │                            │             │
│ Media  │       Canvas               │ Properties  │
│ Panel  │       (Konva)              │ Panel       │
│        │                            │             │
│        │                            │             │
├────────┴────────────────────────────┴─────────────┤
│ Timeline: [Layer 1] [Layer 2] [Layer 3]  [+]       │
└──────────────────────────────────────────────────┘
```

### 5.2 Editor Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Full-screen layout | No sidebar, minimal header | `10-playlists-and-studio.md` §10.12 |
| Three-panel layout | Media (start), Canvas (center), Properties (end) | — |
| Timeline at bottom | Layer management | — |
| Save button in header | Always visible | UP-04 |
| Back button in header | Returns to playlist detail | NP-03 |
| Preview button | Opens preview overlay | — |
| Desktop only | Not supported on mobile/tablet | `04-feature-ux-standards.md` §3.2 |
| Keyboard shortcuts | Delete (remove layer), Ctrl+Z (undo, future), Ctrl+S (save) | IN-03 |
| Auto-save (future) | Saves after 30s of inactivity | F-MP-14 |
| Loading | Splash screen with logo | `02-state-guidelines.md` §2.1 |

---

## 6. Wizard Page Type (Screen Pairing)

### 6.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [← Cancel]         Pair a Screen         [Step 2/3]│
├──────────────────────────────────────────────────┤
│                                                    │
│  ●───●───○                                        │
│ Code  Name  Branch                                 │
│                                                    │
│  ┌──────────────────────────────────┐             │
│  │  Step Content                     │             │
│  │                                   │             │
│  │  [Input fields, instructions]     │             │
│  │                                   │             │
│  └──────────────────────────────────┘             │
│                                                    │
├──────────────────────────────────────────────────┤
│              [Back]  [Next →]                      │
└──────────────────────────────────────────────────┘
```

### 6.2 Wizard Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Step indicator at top | Dots or numbered steps | Locked product decision |
| Cancel in header | Returns to screen list | — |
| Back and Next at bottom | Navigation between steps | — |
| 2-3 steps maximum | Pairing code → Name → Branch (optional) | Locked product decision |
| Optional steps are skippable | "Skip" button on optional steps | UP-01 |
| Progress is visual | Current step is highlighted | — |
| Final step button is "Pair Screen" | Not "Finish" or "Done" | — |
| Success state | Checkmark animation + next-step CTA | MI-11, UP-05 |
| No data loss between steps | Wizard state persists until cancel or complete | — |

---

## 7. Settings Page Type

### 7.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [Page Title]                                       │
├──────────────┬───────────────────────────────────┤
│              │                                    │
│  Profile     │  [Tab Content]                     │
│  Workspace   │                                    │
│  Billing     │  [Form fields]                     │
│  Notifications│                                   │
│  Security    │  [Save button at bottom]           │
│  API         │                                    │
│              │                                    │
└──────────────┴───────────────────────────────────┘
```

### 7.2 Settings Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Left tab navigation | Vertical tab list on start side | `14-settings-feature.md` §14.8 |
| Tab content on end side | Form or configuration | — |
| Each tab has its own save | No global save | PR-36 |
| Active tab is URL-addressable | `/settings/billing` | `05-navigation-architecture.md` §4.2 |
| Danger zone at bottom | Delete workspace, with distinct visual treatment | UP-09 |
| Tab order: Profile → Workspace → Billing → Notifications → Security → API | Priority order | `08-naming-and-conventions.md` §7.3 |
| Mobile: tabs become horizontal scroll | Vertical tabs don't work on mobile | `04-feature-ux-standards.md` §3.2 |
| Unsaved changes warning (future) | AlertDialog on tab switch with unsaved changes | `03-component-ux-standards.md` §1.5 |

---

## 8. Auth Page Type

### 8.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              [Smart Screen Logo]                   │
│                                                    │
│         ┌──────────────────────────┐               │
│         │  [Form Title]             │               │
│         │                           │               │
│         │  [Email input]            │               │
│         │  [Password input]         │               │
│         │                           │               │
│         │  [Primary Action Button]  │               │
│         │                           │               │
│         │  [Secondary link]         │               │
│         └──────────────────────────┘               │
│                                                    │
│              [Language Switcher]                   │
└──────────────────────────────────────────────────┘
```

### 8.2 Auth Page Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Centered card | No shell, no sidebar | `06-page-catalog.md` P-AUTH-01 |
| Logo at top | Brand identity | — |
| Single column form | One input per row | `03-component-ux-standards.md` §1.1 |
| Password visibility toggle | Eye icon in password field | `06-auth-and-session.md` §6.7 (to be added) |
| Language switcher at bottom | EN/AR toggle | UP-11 |
| No registration on login page | Link to register page, not inline | — |
| Error messages inline + toast | Field-level + toast for API errors | `02-state-guidelines.md` §3 |
| 2FA code input | 6-digit code, auto-submit on 6 digits | `14-settings-feature.md` §14.8 |
| Dev login (dev mode only) | Quick login button for development | `06-auth-and-session.md` §6.7 |
| Theme not applicable | Auth pages use default theme | — |

---

## 9. History Page Type (Notifications)

### 9.1 Layout Template

```
┌──────────────────────────────────────────────────┐
│ [Page Title]                    [Clear All]        │
├──────────────────────────────────────────────────┤
│ [Filter: Type ▾]                                  │
├──────────────────────────────────────────────────┤
│ ● Screen A went offline           2m ago  [Screen]│
│ ● Schedule "Lunch" started        5m ago  [Schedule]│
│   Team member invited             1h ago  [Team]  │
│   Screen B came online            2h ago  [Screen]│
│   Playlist "Promo" updated        3h ago  [Content]│
├──────────────────────────────────────────────────┤
│              [Load More]                           │
└──────────────────────────────────────────────────┘
```

### 9.2 History Page Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Paginated list | "Load More" button, not infinite scroll | `17-notifications.md` §17.7 |
| Filter by type | Screen, Schedule, Team, System | `04-feature-ux-standards.md` §4.2 |
| Unread indicator | Blue dot on start side | `04-feature-ux-standards.md` §1.2 |
| Relative timestamp | "2m ago", "1h ago" | `04-feature-ux-standards.md` §1.2 |
| Click navigates to related page | Screen detail, schedule, etc. | `04-feature-ux-standards.md` §1.2 |
| "Clear All" button | Marks all as read | — |
| No sidebar item | Accessed via bell dropdown "View All" | `05-navigation-architecture.md` §1.1 |
| Max 50 in-memory, paginated beyond | SCL-03 | `product-architecture/18-product-constraints.md` |

---

## Cross-References

- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `03-component-ux-standards.md` for component UX
- See `04-feature-ux-standards.md` for feature UX
- See `06-auth-overview-ux-blueprint.md` through `15-admin-ux-blueprint.md` for per-page blueprints
- See `information-architecture/06-page-catalog.md` for page catalog
