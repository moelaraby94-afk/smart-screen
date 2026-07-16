# 08 — Dashboard & Overview Pages

> **Source basis:** `src/features/dashboard/overview-page-client.tsx`, `src/features/dashboard/home-overview.tsx`, `src/features/dashboard/client-home-dashboard.tsx`, `src/features/dashboard/admin-overview.tsx`, `src/features/dashboard/quick-actions-section.tsx`, `src/features/dashboard/home-dashboard-sections.tsx`, `src/features/dashboard/recent-activity-feed.tsx`, `src/features/dashboard/screen-health-section.tsx`, `src/features/dashboard/subscription-summary-section.tsx`, `src/features/dashboard/home-dashboard-dialogs.tsx`, `src/features/dashboard/home-dashboard-types.ts`, `src/features/dashboard/dashboard-api.ts`, `src/features/dashboard/templates-client.tsx`, `src/features/dashboard/ai-tools-client.tsx`, `src/features/dashboard/emergency-client.tsx`, `src/features/dashboard/emergency-overlay.ts`, `src/features/onboarding/onboarding-progress-widget.tsx`  

---

## 8.1 Overview Page Architecture

### Route: `/{locale}` and `/{locale}/overview`

Both routes render the same component chain:
```
OverviewPage (server) → OverviewPageClient (client) → HomeOverview | AdminOverview
```

### `OverviewPageClient` (`src/features/dashboard/overview-page-client.tsx`)

**Props:** `appTitle`, `headline`, `description` (translated strings from server)

**Logic:**
1. If `isLoading` (workspace context): Show skeleton (pulse blocks + `CardGridSkeleton`)
2. If `isSuperAdmin`: Render `AdminOverview`
3. Otherwise: Render `HomeOverview`

---

## 8.2 HomeOverview (`src/features/dashboard/home-overview.tsx`)

### Hero Section
- **Animation:** Framer-motion `initial={{ opacity: 0, y: 14 }}` → `animate={{ opacity: 1, y: 0 }}`
- **Background:** Gradient `from-card via-card to-primary/[0.06]` with decorative blurred orbs (violet, cyan, pink)
- **Content:**
  - `Sparkles` icon in primary-tinted rounded square
  - Kicker text (uppercase, tracked)
  - Headline: "Welcome, {firstName}" (or fallback headline if no name)
  - Description text
  - Badges:
    - App title badge (primary tint with dot)
    - Workspaces count badge (emerald tint with `Zap` icon)
    - Tagline text

### Dashboard Content
- `AnimatePresence mode="wait"` wrapping `ClientHomeDashboard`
- Animation: `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}` → `exit={{ opacity: 0, y: -8 }}`

---

## 8.3 ClientHomeDashboard (`src/features/dashboard/client-home-dashboard.tsx`)

### Data Loading
- Fetches `GET /dashboard/account-insights` on mount
- Returns `InsightsPayload` with: `totals`, `branches` (workspace insights), `account` (subscription info)
- Loading state: text "Loading..."
- Error state: text with retry button
- No SWR — uses manual `useCallback` + `useEffect` pattern

### Sections (top to bottom)

1. **OnboardingProgressWidget** — Progress checklist (see §8.9)
2. **QuickActionsSection** — Quick action buttons (see §8.4)
3. **TotalsSection** — Summary stat cards (screens, playlists, media, branches)
4. **WorkspaceCardsSection** — Branch/workspace cards with actions (see §8.5)
5. **ScreenHealthSection + RecentActivityFeed** — Two-column grid on lg
6. **SubscriptionSummarySection** — Subscription status card
7. **PrayerTimesWidget + HijriDateWidget** — Islamic widgets grid
8. **Dialogs** — Rename and delete workspace dialogs

### Workspace Card Actions
Each workspace card supports:
- **Open** — Sets workspace, navigates to `/{locale}/branches`
- **Rename** — Opens dialog, calls `PATCH /workspaces/{id}` with new name
- **Pause/Resume** — Calls `PATCH /workspaces/{id}` with `isPaused` toggle
- **Seed Demo** — Calls `POST /workspaces/{id}/seed-demo`
- **Delete** — Opens confirmation dialog, calls `DELETE /workspaces/{id}`

### Toast Feedback
All actions show success/error toasts via `sonner`:
- `toast.success()` on success
- `toast.error()` on failure
- `toastResponseError()` for API error envelope handling

---

## 8.4 QuickActionsSection (`src/features/dashboard/quick-actions-section.tsx`)

Renders a grid of quick action buttons that link to key features:
- Add Screen → `/{locale}/screens`
- Upload Media → `/{locale}/media`
- Create Playlist → `/{locale}/playlists`
- Create Schedule → `/{locale}/schedules`
- Open Studio → `/{locale}/studio`
- View Analytics → `/{locale}/analytics`

Each action is a card-like button with icon and label, linking via `next/link`.

---

## 8.5 HomeDashboardSections (`src/features/dashboard/home-dashboard-sections.tsx`)

### TotalsSection
- Grid of stat cards showing: total screens, total playlists, total media, total branches
- Each card: icon, count, label
- Days remaining in subscription (if applicable)

### WorkspaceCardsSection
- Grid of workspace cards
- Each card shows: workspace name, role, screen count, status badges
- Actions: open, rename, pause/resume, seed demo, delete
- Loading states with skeleton
- Pause/seed buttons show loading spinners during operations

---

## 8.6 ScreenHealthSection (`src/features/dashboard/screen-health-section.tsx`)

- Shows health summary of all screens across workspaces
- Displays: online count, offline count, maintenance count
- Visual indicators with colored badges
- May show individual screen status items

---

## 8.7 RecentActivityFeed (`src/features/dashboard/recent-activity-feed.tsx`)

- Shows recent activity items (screen status changes, uploads, schedule changes)
- Each item: icon, message, timestamp
- Timestamps formatted relative to now (e.g., "5 minutes ago")
- Empty state when no activity

---

## 8.8 SubscriptionSummarySection (`src/features/dashboard/subscription-summary-section.tsx`)

- Shows current subscription plan, status, renewal date
- Days remaining indicator
- Usage indicators (screens used/limit, storage used/limit)
- Link to billing settings

---

## 8.9 OnboardingProgressWidget (`src/features/onboarding/onboarding-progress-widget.tsx`)

### Purpose
Shows onboarding completion progress for new users.

### Behavior
- Fetches onboarding status from API
- Displays checklist items:
  - Create workspace ✅
  - Add screen
  - Upload media
  - Create playlist
  - Create schedule
  - Invite team member
- Progress bar showing percentage complete
- Each item links to the relevant page when incomplete
- Dismissible when complete

### Tooltip Context
Uses `TooltipContext` (`src/features/onboarding/tooltip-context.tsx`) for contextual help tooltips during onboarding.

---

## 8.10 AdminOverview (`src/features/dashboard/admin-overview.tsx`)

### Purpose
Dashboard overview for super-admins. Shown instead of `HomeOverview` when `isSuperAdmin` is true.

### Content
- System-wide statistics: total customers, total workspaces, total screens, total users
- Fleet status overview
- System health indicators
- Recent system activity
- Quick links to admin sections

---

## 8.11 TemplatesClient (`src/features/dashboard/templates-client.tsx`)

### Route: `/{locale}/templates`

### Purpose
Gallery of pre-built content templates that users can browse and apply.

### Features
- Grid of template cards with preview thumbnails
- Category filtering
- Template preview on click
- "Use Template" action that creates a new playlist/screen from template

---

## 8.12 AiToolsClient (`src/features/dashboard/ai-tools-client.tsx`)

### Route: `/{locale}/ai`

### Purpose
AI-powered content generation tools.

### Features
- Text generation for screen content
- Image generation prompts
- Template suggestions
- Content optimization suggestions
- History of AI-generated content

---

## 8.13 EmergencyClient (`src/features/dashboard/emergency-client.tsx`)

### Route: `/{locale}/emergency`

### Purpose
Emergency broadcast overlay management.

### Features
- Create emergency overlay with custom message
- Select target screens (all or specific)
- Set duration and priority
- Activate/deactivate emergency broadcast
- Preview overlay appearance

### Emergency Overlay (`src/features/dashboard/emergency-overlay.ts`)
Defines overlay types and configuration:
- Full-screen takeover
- Banner overlay (top/bottom)
- Custom text, background color, text color
- Duration settings
- Priority levels

---

## 8.14 Dashboard API (`src/features/dashboard/dashboard-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchAccountInsights()` | GET | `/dashboard/account-insights` | Get overview data (totals, branches, account) |
| `updateWorkspace(id, data)` | PATCH | `/workspaces/{id}` | Update workspace (name, isPaused) |
| `deleteWorkspace(id)` | DELETE | `/workspaces/{id}` | Delete workspace |

---

## 8.15 Home Dashboard Types (`src/features/dashboard/home-dashboard-types.ts`)

### InsightsPayload
```typescript
type InsightsPayload = {
  totals: { screens: number; playlists: number; media: number; branches: number };
  branches: InsightsBranch[];
  account: {
    subscriptionPlan: string;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    screenLimit: number;
    storageLimit: number;
  };
};
```

### InsightsBranch
```typescript
type InsightsBranch = {
  workspaceId: string;
  name: string;
  isPaused: boolean;
  screenCount: number;
  role: string;
};
```

---

## 8.16 Home Dashboard Dialogs (`src/features/dashboard/home-dashboard-dialogs.tsx`)

### RenameBranchDialog
- Input for new workspace name
- Min length validation (2 characters)
- Submit calls `updateWorkspace` with new name
- Loading state on submit button

### DeleteBranchDialog
- Confirmation dialog with destructive action
- Shows workspace name
- Submit calls `deleteWorkspace`
- Loading state on confirm button

---

## 8.17 [V2] UX Analysis — Dashboard & Overview

### Dashboard Layout — HCI Evaluation

**[V2] Two Dashboard Variants:**
The application has two distinct dashboard experiences:
1. **Admin Overview** (`AdminOverview`) — For super-admins, shows platform-wide stats, customer list, system health
2. **Client Home Dashboard** (`ClientHomeDashboard`) — For workspace users, shows workspace stats, quick actions, screen health, recent activity, subscription summary

This bifurcation is good — different user roles need different information. However, the transition between them is implicit (based on `isSuperAdmin`), not explicit. Users don't know they're seeing a different dashboard variant — they just see "the dashboard."

**[V2] Dashboard Loading — Inconsistent Patterns:**
- `OverviewPageClient`: Shows `CardGridSkeleton` (animated pulse blocks)
- `ClientHomeDashboard`: Shows text "Loading..." with retry button
- `AdminOverview`: Likely uses its own loading pattern

The inconsistency between skeleton loading (visual placeholder) and text loading ("Loading...") creates an inconsistent experience. Users on the client dashboard see a less polished loading state than the overview page.

**[V2] Dashboard Data Fetching — SWR with Error Retry:**
`ClientHomeDashboard` uses SWR for data fetching. The global SWR config disables `revalidateOnFocus` and `errorRetryCount`. This means:
- Data doesn't refresh when the user returns to the tab (no `revalidateOnFocus`)
- Failed fetches don't automatically retry (no `errorRetryCount`)
- Users must manually click "Retry" on error

For a dashboard that shows realtime screen status, the lack of `revalidateOnFocus` means users may see stale data after switching tabs. The realtime Socket.IO connection partially compensates, but only for events the server pushes.

### Quick Actions — UX Analysis

**[V2] Quick Actions as Navigation Shortcuts:**
Quick actions provide 1-click access to common tasks (add screen, create playlist, upload media, etc.). They function as navigation shortcuts to pages where the actual action is performed — they don't open dialogs or forms directly.

This is a **minor UX issue** — clicking "Add Screen" should either open the add screen dialog directly or navigate to the screens page with the dialog pre-opened. Instead, the user navigates to the screens page and must find the "Add" button themselves.

**[V2] Quick Actions Layout:**
Quick actions are displayed as a grid of cards/buttons. The visual hierarchy is good — each action has an icon, label, and description. The grid is responsive (2 columns on mobile, 3-4 on desktop).

### Screen Health Section — UX Analysis

**[V2] Screen Health Visibility:**
The dashboard shows screen health status — this is critical for a digital signage product. Users need to know at a glance if any screens are offline or having issues.

**[V2] Realtime Updates:**
Screen health is updated via Socket.IO events. When a screen goes offline, the dashboard should reflect this in realtime. However, if the Socket.IO connection fails (see `07-workspace-management.md` V2 analysis), the dashboard will show stale health data without any indication.

**[V2] Missing Health Summary:**
The dashboard shows individual screen status but may lack an aggregate health summary (e.g., "23/25 screens online"). An aggregate view would help users quickly assess overall system health without scanning individual entries.

### Recent Activity Feed — UX Analysis

**[V2] Activity Feed — Information Density:**
The recent activity feed shows recent events (screen paired, playlist published, media uploaded, etc.). The feed is typically a list with timestamp, actor, and action description.

**[V2] No Filter/Search:**
The activity feed likely shows all recent events without filtering. For active workspaces with many events, users cannot filter by event type, actor, or time range. This limits the feed's usefulness for auditing specific actions.

**[V2] No Pagination/Load More:**
The feed likely loads a fixed number of recent events. Users cannot load more or paginate to older events. For auditing purposes, this limits the ability to investigate past actions from the dashboard.

### Subscription Summary — UX Analysis

**[V2] Subscription Visibility:**
The subscription summary shows the current plan, usage, and limits. This is important for users to understand their plan constraints (e.g., "15/25 screens used").

**[V2] No Upgrade Prompt:**
When users approach their plan limits (e.g., 90% screen usage), there is no visible upgrade prompt on the dashboard. The subscription summary shows the numbers but doesn't proactively suggest upgrading. This is a missed revenue opportunity and a UX gap — users should be warned before they hit limits.

### Onboarding Progress Widget — UX Analysis

**[V2] Progress Tracking:**
The onboarding progress widget shows completion status for key setup steps (e.g., "Add your first screen", "Create your first playlist"). This is a good activation pattern — it guides users through essential setup without forcing a linear wizard.

**[V2] Progress Persistence:**
The widget likely tracks progress via API (checking if screens, playlists, media exist). This means progress is based on actual state, not self-reported completion — users can't mark steps as "done" without actually doing them. This is correct for onboarding.

**[V2] Dismissal:**
The widget may or may not be dismissible. If it's not dismissible, users who have completed onboarding will continue to see it (potentially with all steps checked). If it auto-hides when all steps are complete, that's the ideal behavior.

### Emergency Overlay — UX Analysis

**[V2] Emergency Feature — Critical Safety Pattern:**
The emergency feature allows users to broadcast an override message to all screens. This is a safety-critical feature for digital signage in public spaces.

**[V2] Emergency Confirmation:**
The emergency overlay should require explicit confirmation before broadcasting — this is a destructive/irreversible action that affects all screens. The `EmergencyClient` component likely has a confirmation dialog.

**[V2] Emergency Duration:**
The emergency override likely has a configurable duration. Users need to know how long the override will last and how to cancel it early. Without a clear duration indicator, users may not know when their screens will return to normal content.

**[V2] Emergency Visual Design:**
Emergency features should use alarming visual design (red/destructive colors, warning icons). The `AlertTriangle` icon in the sidebar is correct. The emergency page should use `variant="destructive"` for the activate button.

### RenameBranchDialog — UX Analysis

**[V2] Min Length Validation:**
The rename dialog validates minimum 2 characters. This prevents empty or single-character names. However, there is no maximum length validation — users could enter very long names that break UI layouts (e.g., sidebar workspace switcher, header title).

**[V2] No Inline Validation Feedback:**
The validation likely only triggers on submit. Users don't get real-time feedback as they type. Best practice is to show validation state (valid/invalid) as the user types, not after submission.

### DeleteBranchDialog — UX Analysis

**[V2] Destructive Action — No Undo:**
The delete workspace dialog is a confirmation dialog with a destructive action. Once confirmed, the workspace is permanently deleted. There is no undo capability — no soft delete, no recovery period, no trash bin.

This is a **high-severity UX issue** for enterprise users. Accidental workspace deletion would lose all screens, playlists, media, schedules, and team members. Best practice for enterprise SaaS is either:
1. Soft delete with a recovery period (e.g., 30 days)
2. Type-to-confirm (user must type the workspace name to confirm)
3. Undo toast that appears for 10-30 seconds after deletion

**[V2] Confirmation Dialog Design:**
The dialog shows the workspace name — this is good for preventing accidental deletion of the wrong workspace. However, it doesn't require the user to type the name to confirm. A simple "Delete" button click is sufficient.

### [V2] Product Analysis — Dashboard Purpose

**[V2] Dashboard Job-To-Be-Done:**
The dashboard's primary jobs:
1. **Status check**: "Are all my screens working?" (screen health)
2. **Quick action**: "I need to do something quickly" (quick actions)
3. **Activity awareness**: "What happened recently?" (recent activity)
4. **Plan awareness**: "Am I within my limits?" (subscription summary)
5. **Onboarding**: "What should I do next?" (onboarding widget)

The dashboard serves these jobs well for new users (onboarding widget, quick actions) but less well for power users (no custom widgets, no saved views, no widget rearrangement).

**[V2] Missing Dashboard Features for Enterprise:**
- No custom dashboard layout (users can't rearrange or hide widgets)
- No saved views (users can't create multiple dashboard views)
- No widget configuration (users can't choose which widgets to show)
- No date range selector for activity feed
- No export/dashboard reporting
- No dashboard sharing (link to current dashboard state)

### [V2] Nielsen Heuristic Evaluation — Dashboard

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ⚠️ Medium | Screen health visible but no aggregate summary, stale data risk if Socket.IO fails |
| User control and freedom | ⚠️ Medium | Quick actions navigate instead of acting, no widget customization |
| Consistency and standards | ⚠️ Medium | Loading states inconsistent (skeleton vs text), two dashboard variants without explicit switch |
| Error prevention | ⚠️ Medium | Delete workspace has no undo, no type-to-confirm |
| Recognition rather than recall | ✅ Good | Quick actions with icons, activity feed with timestamps |
| Flexibility and efficiency | ⚠️ Low | No custom layout, no saved views, no keyboard shortcuts |
| Aesthetic and minimalist design | ✅ Good | Clean card-based layout, responsive grid |
| Help users recognize/recover from errors | ⚠️ Medium | Retry button on error, but no automatic retry |
| Help and documentation | ✅ Good | Onboarding widget guides new users |

### Cross-References
- See `07-workspace-management.md` for workspace context and onboarding wizard
- See `09-screens-feature.md` for screen health details
- See `17-notifications.md` for realtime notification system
- See `23-error-handling-and-states.md` for loading state patterns
- See `27-user-flows.md` for dashboard user journey
- See `28-feature-inventory.md` for dashboard feature inventory
