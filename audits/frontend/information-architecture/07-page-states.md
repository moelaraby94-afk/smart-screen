# Page States

> **Evidence basis:** `06-page-catalog.md`, `transformation/23-error-handling-and-states.md`, `product-architecture/15-interaction-principles.md`, `transformation/26-product-principles.md`
> **Purpose:** Define every state for every page — empty, loading, error, permission denied, no data, first-time user

---

## 1. State Types

| State | When | Duration | Evidence |
|-------|------|----------|----------|
| Loading | Data fetching in progress | < 2s (skeleton) | DD-06, IP-04 |
| Empty | Data fetched successfully, no results | Persistent | IP-07 |
| Error | API call failed | Persistent (with retry) | IP-10, PR-49 |
| Permission Denied | User lacks role for action | Persistent | PC-32 |
| No Data | Entity doesn't exist (404) | Persistent | IP-10 |
| First-Time User | New workspace, no entities yet | Persistent (until setup) | IP-07 |

---

## 2. Loading States

### 2.1 Loading Pattern Rules

| Page Type | Loading Pattern | Evidence |
|-----------|----------------|----------|
| Dashboard | Skeleton widgets (card-shaped blocks) | DD-06 |
| List | Skeleton cards (matching grid layout) | DD-06 |
| Detail | Skeleton sections (header + content blocks) | DD-06 |
| Settings | Skeleton form fields | DD-06 |
| Calendar | Skeleton calendar grid | DD-06 |
| Studio | Splash/loading screen (heavy component) | — |

### 2.2 Per-Page Loading States

| Page | Loading Element | Pattern |
|------|----------------|---------|
| Overview | Screen health widget, activity feed, quick actions | 3 skeleton cards in grid layout |
| Screen list | Screen cards | 6-8 skeleton cards in grid |
| Screen detail | Header, status, content, schedules | Skeleton header + 3 skeleton sections |
| Content (Playlists) | Playlist cards | 6-8 skeleton cards in grid |
| Content (Media) | Media thumbnails | 8-12 skeleton cards in grid |
| Playlist detail | Preview, metadata, actions | Skeleton preview + skeleton metadata |
| Studio | Canvas, panels | Splash screen with logo + spinner |
| Scheduling | Calendar grid | Skeleton calendar with skeleton events |
| Analytics | Charts, metrics | Skeleton chart placeholders |
| Team | Member rows | 3-5 skeleton rows |
| Settings (each tab) | Form fields | Skeleton form matching layout |
| Notifications | Notification items | 5-8 skeleton rows |
| Admin (each page) | Tables, stats | Skeleton table rows + skeleton stat cards |

### 2.3 Action Loading States

| Action | Loading Pattern | Evidence |
|------|----------------|---------|
| Button click (submit) | Button shows spinner, text changes to "Saving..." | IP-04 |
| Dialog submit | Button shows spinner, dialog stays open | IP-04 |
| Upload | Progress bar per file | F-MP-16 |
| Delete (confirm) | Button shows spinner during API call | IP-05 |
| Search | Search bar shows spinner, results area shows skeleton | — |

---

## 3. Empty States

### 3.1 Empty State Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Every empty state has a CTA | No dead ends | IP-07, PR-18 |
| CTA is the primary action for that page | Matches page purpose | IP-02 |
| Empty state includes icon | Visual communication | `05-ui-component-library.md` §6.7 |
| Empty state includes message | Explains why it's empty and what to do | IP-07 |
| Empty state is not an error | Different visual treatment from errors | — |

### 3.2 Per-Page Empty States

| Page | Empty Condition | Icon | Message (EN) | CTA (EN) | CTA Destination |
|------|----------------|------|-------------|----------|-----------------|
| Overview | No screens | MonitorOff | "No screens connected yet. Add your first screen to get started." | "Add Screen" | `/screens/pair` |
| Overview | No content | Clapperboard | "No content created yet. Create your first playlist." | "Create Playlist" | `/content` |
| Screen list | No screens | Monitor | "No screens in this workspace. Pair your first screen to start displaying content." | "Add Screen" | `/screens/pair` |
| Screen list | No screens (filtered) | Filter | "No screens match your filters. Try adjusting your search or filters." | "Clear Filters" | (clear filters) |
| Content (Playlists) | No playlists | Clapperboard | "No playlists yet. Create your first playlist from a template or start from scratch." | "Create Playlist" | (template picker) |
| Content (Media) | No media | Image | "No media uploaded yet. Upload images or videos to use in your playlists." | "Upload Media" | (upload dialog) |
| Scheduling | No schedules | CalendarClock | "No schedules created. Scheduling is optional — you can publish immediately or schedule for later." | "Create Schedule" | (schedule dialog) |
| Analytics | No data | BarChart3 | "No analytics data yet. Add screens and publish content to see performance metrics." | "Add Screen" | `/screens/pair` |
| Team | No members (solo) | User | "You're the only member. Invite team members to help manage your screens and content." | "Invite Member" | (invite dialog) |
| Team | No pending invites | — | (No empty state — section hidden if no pending invites) | — | — |
| Notifications | No notifications | Bell | "No notifications. You'll see screen status changes, schedule updates, and team activity here." | — | — |
| Admin customers | No customers | Building2 | "No customers registered yet." | — | — |

---

## 4. Error States

### 4.1 Error State Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Every API error shows a toast | No silent failures | PR-49 |
| Page-level errors show error boundary | Graceful degradation | IP-10, PR-51 |
| Error boundary has "Try Again" button | Recovery action | IP-10 |
| 404 shows branded not-found page | No generic 404 | PR-51 |
| Error messages are localized | No raw error strings | PR-50 |
| Network errors show retry option | Recovery action | IP-10 |

### 4.2 Per-Page Error States

| Page | Error Condition | UI | Recovery |
|------|----------------|-----|----------|
| Any page | Page crash (unhandled error) | Error boundary: "Something went wrong. Please try again." | "Try Again" button → reload |
| Any page | 404 (page not found) | Not found: "This page doesn't exist." | "Go to Overview" link |
| Any list | API fetch error | Error state in list area: "Failed to load [entity]. Please try again." | "Retry" button → refetch |
| Any detail | Entity not found (404) | Not found: "This [entity] doesn't exist or has been deleted." | "Back to [Section]" link |
| Any form | Submit error | Toast: "Failed to save. [Error message]" | Form stays open, user can retry |
| Studio | Save error | Toast: "Failed to save playlist. Your changes are not lost — try saving again." | "Save" button remains active |
| Upload | Upload error | Per-file error indicator + toast | "Retry Upload" button |
| Auth | Login error | Toast: "Invalid email or password" | Form stays open |
| Auth | Session expired | Redirect to login + toast: "Your session has expired. Please log in again." | Login form |

---

## 5. Permission Denied States

### 5.1 Permission Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Frontend gates UI, backend enforces | Frontend hiding is UX, not security | PC-32 |
| Viewer role sees read-only | No create/edit/delete buttons | PR-33 |
| Permission-denied actions are hidden, not disabled | Cleaner UI than disabled buttons everywhere | — |
| If user accesses restricted route directly | Redirect to Overview with toast | NP-10 |

### 5.2 Per-Role Visibility

| Action | Owner | Editor | Viewer | Evidence |
|--------|-------|--------|--------|----------|
| Add Screen | ✅ | ✅ | ❌ hidden | M-02 |
| Assign Content | ✅ | ✅ | ❌ hidden | M-02 |
| Override Content | ✅ | ✅ | ❌ hidden | M-02 |
| Create Playlist | ✅ | ✅ | ❌ hidden | M-03 |
| Upload Media | ✅ | ✅ | ❌ hidden | M-03 |
| Edit in Studio | ✅ | ✅ | ❌ hidden | M-03 |
| Publish | ✅ | ✅ | ❌ hidden | M-03 |
| Create Schedule | ✅ | ✅ | ❌ hidden | M-04 |
| Invite Member | ✅ | ❌ hidden | ❌ hidden | M-06 |
| Change Role | ✅ | ❌ hidden | ❌ hidden | M-06 |
| Remove Member | ✅ | ❌ hidden | ❌ hidden | M-06 |
| Manage Billing | ✅ | ❌ hidden | ❌ hidden | M-07 |
| Manage Workspace Settings | ✅ | ❌ hidden | ❌ hidden | M-07 |
| Manage API Keys | ✅ | ❌ hidden | ❌ hidden | M-07 |
| Edit Profile | ✅ | ✅ | ✅ | M-07 (own profile) |
| Edit Notifications | ✅ | ✅ | ✅ | M-07 (own preferences) |
| Edit Security/2FA | ✅ | ✅ | ✅ | M-07 (own security) |
| Delete Workspace | ✅ | ❌ hidden | ❌ hidden | M-07 |

---

## 6. First-Time User States

### 6.1 First-Time User Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| First-time user sees Overview with onboarding CTAs | Not an empty grid | IP-07 |
| CTAs guide through the primary journey | 5-minute KPI | `05-primary-user-journey.md` |
| No assumption of existing data | Every section has empty state | IP-07 |
| Post-action CTAs guide to next step | No dead ends | PR-20 |

### 6.2 First-Time User Flow States

```
State 1: New workspace, no screens
  └── Overview shows: "Welcome! Let's connect your first screen."
       CTA: "Add Screen" → /screens/pair

State 2: Has 1 screen, no content
  └── Overview shows: "Great! Your screen is connected. Now let's create content."
       CTA: "Create Playlist" → /content (template picker)

State 3: Has 1 screen, 1 playlist, not published
  └── Playlist detail shows: "Ready to publish! Click 'Publish to Screens'."
       CTA: "Publish to Screens" → immediate publish

State 4: Has 1 screen, 1 playlist, published
  └── Overview shows: "You're live! Your content is playing on [Screen Name]."
       CTAs: "Add Another Screen", "Create More Content", "Invite Team Member"
```

---

## 7. No Data States (vs. Empty States)

### 7.1 Distinction

| State | Cause | Visual | Evidence |
|-------|-------|--------|----------|
| Empty | No entities exist yet | Friendly, with CTA | IP-07 |
| No Data | Entities exist but no data for current filter/period | Informational, with filter reset | — |

### 7.2 No Data Examples

| Page | No Data Condition | Message | Action |
|------|-------------------|---------|--------|
| Screen list | Filter returns no results | "No screens match your filters." | "Clear Filters" |
| Content (Playlists) | Search returns no results | "No playlists found for '[query]'." | "Clear Search" |
| Content (Media) | Type filter returns no videos | "No videos uploaded yet." | "Upload Videos" or "Clear Filter" |
| Scheduling | No schedules in selected month | "No schedules for this month." | "Navigate to different month" |
| Analytics | No data for selected period | "No data available for this period." | "Try a different period" |
| Team | Search returns no results | "No team members found for '[query]'." | "Clear Search" |
| Notifications | No notifications of selected type | "No [type] notifications." | "Clear Filter" |

---

## Cross-References

- See `06-page-catalog.md` for page definitions
- See `08-naming-and-conventions.md` for naming rules
- See `product-architecture/15-interaction-principles.md` for interaction principles
- See `transformation/23-error-handling-and-states.md` for error handling strategy
- See `transformation/26-product-principles.md` PP-07 (safe destructive), PP-08 (one primary action)
