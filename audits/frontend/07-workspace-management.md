# 07 — Workspace Context & Management

> **Source basis:** `src/features/workspace/workspace-context.tsx`, `src/features/workspace/workspace-switcher.tsx`, `src/features/workspace/workspace-gate.tsx`, `src/features/workspace/workspace-welcome.tsx`, `src/features/workspace/workspace-create-dialog.tsx`, `src/features/workspace/onboarding-wizard.tsx`, `src/features/workspace/use-workspace-stats.ts`, `src/features/workspace/workspace-api.ts`  

---

## 7.1 WorkspaceProvider (`src/features/workspace/workspace-context.tsx`)

### Context Value

| Field | Type | Purpose |
|-------|------|---------|
| `workspaceId` | `string \| null` | Active workspace ID |
| `workspaces` | `WorkspaceSummary[]` | All workspaces user belongs to |
| `setWorkspaceId` | `(id: string) => void` | Set active workspace (persists to cookie) |
| `refreshWorkspaces` | `(preferredId?) => Promise<void>` | Re-fetch user + workspaces from API |
| `workspaceDataEpoch` | `number` | Incremented to trigger data refetch |
| `bumpWorkspaceDataEpoch` | `() => void` | Increment epoch |
| `isLoading` | `boolean` | Initial load in progress |
| `isAuthenticated` | `boolean` | User has valid session |
| `isSuperAdmin` | `boolean` | User is super-admin |
| `userEmail` | `string \| null` | User email |
| `userFullName` | `string \| null` | User full name |
| `businessName` | `string \| null` | Business name |
| `impersonatedBySuperAdminId` | `string \| null` | Impersonation session ID |
| `pairingActivityEpoch` | `number` | Bumped on `pairing:started` Socket.IO event |
| `bumpPairingActivityEpoch` | `() => void` | Increment pairing epoch |

### WorkspaceSummary Type
```typescript
type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  isPaused?: boolean;
  role?: string;
};
```

### Initialization Flow
1. On mount: reads `cs_workspace_id` cookie, sets as initial workspaceId
2. Calls `refreshWorkspaces()`:
   - `GET /auth/me` → returns user info + memberships
   - Maps memberships to `WorkspaceSummary[]` with role
   - Sets `isAuthenticated`, `isSuperAdmin`, user info
   - Workspace selection priority:
     1. `preferredWorkspaceId` argument (if valid)
     2. Single workspace → auto-select
     3. Cookie value (if valid)
     4. First workspace in list
   - If no workspaces: clears workspaceId and cookie
3. On 401/403: resets to logged-out state

### Workspace Cookie
- Key: `cs_workspace_id`
- Max-Age: 30 days
- SameSite: Lax
- Secure: if HTTPS

### Super-Admin Hint
- `cs_super_admin` in sessionStorage (not localStorage)
- Values: `'1'` (is super-admin), `'0'` (not), or removed
- Used as a hint for client-side guards; actual authority comes from API

---

## 7.2 Realtime Bridge (`WorkspaceSubscriptionRealtimeBridge`)

An invisible component rendered inside `WorkspaceProvider` that establishes a Socket.IO connection.

### Connection
- URL: `{NEXT_PUBLIC_REALTIME_URL}/realtime` (default: `http://localhost:4000/realtime`)
- Path: `/socket.io`
- Transports: `['websocket']` only (no polling fallback)
- Auth: `{ token }` if localStorage token exists
- Credentials: `withCredentials: true`
- Reconnection: `true`, infinite attempts, 1s initial delay, 15s max

### Events Handled

| Event | Action |
|-------|--------|
| `connect` | Emit `dashboard:subscribe` with `{ workspaceId }` |
| `workspace:subscription` | Bump `workspaceDataEpoch` (triggers refetch of subscription data) |
| `pairing:started` | Bump `pairingActivityEpoch` (triggers Add Screen UI update) |
| `disconnect` (server) | Reconnect |

### Lifecycle
- Connects when `isAuthenticated && workspaceId` are truthy
- Disconnects and cleans up on workspace change or unmount
- Removes all listeners on cleanup

---

## 7.3 WorkspaceSwitcher (`src/features/workspace/workspace-switcher.tsx`)

### UI
- Dropdown trigger button with `BriefcaseBusiness` icon in orange square
- Shows current workspace name (or "Choose work area" on overview/home)
- Chevron icon rotates 180° when open
- Disabled when no workspaces exist
- Max width: `min(100%, min(420px, calc(100vw - 8rem)))`

### Dropdown Content
- Label: "WORKSPACES" (uppercase, muted)
- List of workspace items with:
  - Workspace name (truncated)
  - Check icon for active workspace
  - Active item: `bg-primary/10`
- Selecting a workspace:
  1. `setWorkspaceId(id)` — updates context + cookie
  2. `bumpWorkspaceDataEpoch()` — triggers data refetch
  3. If not on branches page: navigate to `/{locale}/branches` and refresh
  4. Close dropdown

### Create Workspace Button
- Ghost icon button (`Plus`) next to switcher
- Opens `WorkspaceCreateDialog`

### Overview/Home Behavior
When on overview or home page (`/{locale}` or `/{locale}/overview`):
- Label shows "Choose work area" instead of workspace name
- Text is muted (not foreground)
- This signals to the user that they should select a workspace to navigate into

---

## 7.4 WorkspaceGate (`src/features/workspace/workspace-gate.tsx`)

### Purpose
Wraps all shell page content. Controls rendering based on auth and workspace state.

### Logic
1. **Auth pages** (login, register in pathname): Pass through
2. **Not authenticated**: Pass through (auth flow handles redirect)
3. **Loading** (`isLoading === true`): Show centered spinner
   ```
   <Loader2 className="h-10 w-10 animate-spin text-primary" />
   <p>{loadingText}</p>
   ```
4. **Authenticated, no workspaces, not super-admin**: Show `WorkspaceWelcome`
5. **Super-admin on client route**: Toast info + redirect to overview
6. **Default**: Render children

### Sovereign Mode Restriction
Super-admins cannot access client feature routes. The restricted set:
`media`, `screens`, `studio`, `playlists`, `schedules`, `team`, `branches`, `templates`, `ai`, `emergency`, `analytics`, `audit-log`, `notifications`, `api-docs`, `help`, `settings`

When a super-admin navigates to any of these, they see an info toast and are redirected to `/{locale}/overview`.

---

## 7.5 WorkspaceWelcome (`src/features/workspace/workspace-welcome.tsx`)

### Purpose
Shown when authenticated user has no workspaces and is not a super-admin.

### UI
- Centered card with decorative gradient orbs
- `Sparkles` icon in primary-tinted circle
- Title + description
- Two buttons:
  1. **Create First Workspace** (CTA): Opens `WorkspaceCreateDialog`
  2. **Create with Demo** (outline): Calls `POST /workspaces/bootstrap-demo`
    - On success: refreshes workspaces, sets workspace, navigates to overview
    - On failure: shows error toast

### Pending Workspace Create Recovery
On mount, checks `consumePendingWorkspaceCreate()` — if the user was in the middle of creating a workspace when their session expired, the dialog auto-opens and an info toast is shown.

---

## 7.6 WorkspaceCreateDialog (`src/features/workspace/workspace-create-dialog.tsx`)

### Props
| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Visibility control |

### Behavior
- Input field for workspace name
- Submit calls `POST /workspaces` with `{ name }`
- On success: refreshes workspaces with new ID, sets as active, bumps epoch, closes dialog, shows toast
- On failure: shows error toast via `useApiErrorToast`

---

## 7.7 OnboardingWizard (`src/features/workspace/onboarding-wizard.tsx`)

### Props
| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Visibility control |
| `workspaceId` | `string` | Workspace ID |
| `workspaceName` | `string` | Workspace display name |

### Steps

**Step 1 — Content Choice:**
- Shows success checkmark with "Workspace ready" message
- Two options:
  1. **Seed Demo Content:** Calls `POST /workspaces/{id}/seed-demo`, shows loading spinner, on success advances to step 2
  2. **Start Fresh:** Skips to step 2

**Step 2 — Next Steps:**
- Shows rocket icon with "Ready to go" message
- Quick links:
  1. Add Screen → `/{locale}/screens`
  2. Upload Media → `/{locale}/media`
  3. Invite Team → `/{locale}/team`
- "Back" button returns to step 1
- "Go to Dashboard" button: closes dialog, navigates to `/{locale}/overview`

### Progress Indicator
Two-step progress bar with numbered circles and connecting line. Completed steps show `CheckCircle2` icon.

### Animations
- Step transitions: `framer-motion` with RTL-aware direction (`x: 20 * dir` where `dir = locale === 'ar' ? -1 : 1`)
- `AnimatePresence mode="wait"` for smooth step changes

### Dialog Close
- Closing via X or overlay: navigates to `/{locale}/overview` and refreshes
- Does not force the user through both steps

---

## 7.8 Workspace Stats (`src/features/workspace/use-workspace-stats.ts`)

### Hook: `useWorkspaceStats(workspaceId, dataEpoch)`

Returns `{ media, screens, playlists }` counts.

### Fetching Strategy
- Makes 3 parallel API calls with `limit=1` to get `total` from paginated envelope
- Paths: `/media?workspaceId={ws}&page=1&limit=1`, `/screens?...`, `/playlists?...`
- Uses `readPage()` to extract `total` field
- Refetches on `workspaceId`, `dataEpoch`, or `pathname` change
- On error: returns zeros

### Performance Note
The code explicitly comments that this used to download entire collections and take `.length` — a full table scan. The current `limit=1` approach fetches one row to get the `total` field from the response envelope.

---

## 7.9 Workspace API (`src/features/workspace/workspace-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchCurrentUser()` | GET | `/auth/me` | Get user + memberships |
| `createWorkspace(name)` | POST | `/workspaces` | Create new workspace |
| `bootstrapDemoWorkspace()` | POST | `/workspaces/bootstrap-demo` | Create workspace with demo data |
| `seedDemoContent(workspaceId)` | POST | `/workspaces/{id}/seed-demo` | Seed demo content into existing workspace |
| `fetchWorkspaceDetails(workspaceId)` | GET | `/workspaces/{id}` | Get workspace details |
| `updateWorkspace(workspaceId, data)` | PATCH | `/workspaces/{id}` | Update name, isPaused, timezone, defaultLocale |

---

## 7.10 Workspace Data Flow

```
User logs in
  → WorkspaceProvider.refreshWorkspaces()
    → GET /auth/me
      → Sets isAuthenticated, isSuperAdmin, user info
      → Maps memberships to workspaces list
      → Selects active workspace (cookie/preferred/first)
  → WorkspaceSubscriptionRealtimeBridge connects
    → Socket.IO to /realtime namespace
    → Emits dashboard:subscribe with workspaceId
    → Listens for workspace:subscription, pairing:started

User switches workspace
  → setWorkspaceId(id) → updates state + cookie
  → bumpWorkspaceDataEpoch() → triggers sidebar counts refetch
  → Navigate to /branches (if not already there)
  → router.refresh()

User creates workspace
  → POST /workspaces
  → refreshWorkspaces(newId) → re-fetches /auth/me
  → setWorkspaceId(newId)
  → bumpWorkspaceDataEpoch()
  → OnboardingWizard opens (if triggered)

Super-admin impersonates
  → Backend mints JWT with impersonatedBy
  → /auth/me returns impersonatedBy field
  → WorkspaceProvider sets impersonatedBySuperAdminId
  → CrystalShell renders ImpersonationReturnButton

---

## 7.11 [V2] UX Analysis — Workspace Management

### Workspace Switcher — HCI Evaluation

**[V2] Navigation Destination — `/branches` not `/overview`:**
When a user switches workspaces via the `WorkspaceSwitcher`, the code navigates to `/{locale}/branches` (not `/overview`). This is an unusual choice — most SaaS products land users on the dashboard/overview after switching contexts. The branches page is the workspace's location management page. This means:
- Users switching workspaces are taken to branch management, not the dashboard
- If the user was already on `/branches`, no navigation occurs (only `router.refresh()`)
- The user must manually navigate to overview after switching

This is a **moderate UX issue** — the expected behavior after switching workspaces is to see the dashboard for that workspace, not the branch list.

**[V2] Switcher Disabled State:**
When `workspaces.length === 0`, the switcher trigger is disabled (`disabled` prop). The user sees a greyed-out "Select Workspace" button. This is correct — but the user is already on the `WorkspaceWelcome` page in this state, so the switcher is not visible in the header (it's behind the gate).

**[V2] Switcher Active State:**
The current workspace is highlighted with `bg-primary/10` in the dropdown menu. Other workspaces have no visual indicator. The check icon is not used — only background tint. This is a subtle indicator that may be missed by users scanning the list quickly.

**[V2] No Search in Switcher:**
The workspace dropdown lists all workspaces in a simple scrollable menu. For users with many workspaces (10+), there is no search/filter capability. Enterprise users with 50+ workspaces would find this unusable. The dropdown also has no virtualization — all items are rendered in DOM.

**[V2] No Workspace Metadata in Switcher:**
The switcher shows only the workspace name. There is no metadata (member count, screen count, last accessed, role). Users must rely on name alone to identify the correct workspace. For users with similarly-named workspaces (e.g., "Downtown Branch", "Downtown Mall"), this could cause confusion.

### WorkspaceGate — UX Analysis

**[V2] Sovereign Mode — No Preview Capability:**
Super-admins in sovereign mode are blocked from ALL client routes via `WorkspaceGate`. They cannot preview what a client sees without impersonating a specific user. This means:
- Admins cannot quickly check if a feature is working for clients
- Admins cannot test client-side bugs without impersonating
- The only way to see client UI is to impersonate a user

This is a **moderate enterprise UX gap** — admin tools should allow previewing client experiences without impersonation.

**[V2] Redirect Flash:**
The sovereign mode restriction is in a `useEffect`, which runs after render. The client page content briefly renders before the redirect fires. Users may see a flash of the client page before being redirected to overview. This is a visual glitch that could confuse users.

### WorkspaceWelcome — UX Analysis

**[V2] Demo Bootstrap — Good First-Time UX:**
The `WorkspaceWelcome` offers two paths:
1. "Create First Workspace" — opens `WorkspaceCreateDialog`
2. "Create with Demo" — calls `bootstrapDemoWorkspace()` which creates a workspace pre-filled with demo content

The demo bootstrap is an excellent first-time UX pattern — it lets users explore the product with real data without manual setup. The `Wand2` icon communicates "magic/automated" creation. The loading state shows `Loader2` spinner with the button disabled.

**[V2] Session Restoration:**
If the user was interrupted during workspace creation (e.g., session expired), `consumePendingWorkspaceCreate()` checks localStorage and auto-opens the create dialog with a toast: "Session restored." This is a thoughtful recovery mechanism.

**[V2] Visual Design:**
The welcome screen uses:
- `min-h-[calc(100vh-14rem)]` — fills viewport minus header/breadcrumbs
- `motion.div` with fade + slide up animation (450ms, custom easing)
- Decorative blur orbs (`bg-primary/10`, `bg-accent/10`) — subtle ambient glow
- `Sparkles` icon in `bg-primary/10` container with ring
- Two CTAs side by side on desktop, stacked on mobile

The visual design is welcoming and on-brand. The `variant="cta"` on the primary button (with glow shadow) creates clear visual hierarchy.

### OnboardingWizard — UX Analysis

**[V2] Two-Step Flow:**
Step 1 (Content): Choose between "Seed Demo Content" or "Start Fresh"
Step 2 (Next Steps): Quick links to Add Screen, Upload Media, Invite Team

The wizard is concise — only 2 steps, no overwhelming form fields. This is good for activation.

**[V2] Progress Indicator:**
The wizard has a visual progress indicator with numbered circles (1, 2) and a connecting line. The current step has `bg-primary text-primary-foreground`, completed steps show `CheckCircle2`, and future steps show `bg-muted text-muted-foreground`. This is a clear, standard progress pattern.

**[V2] RTL Animation Direction:**
The step transition uses `x: 20 * dir` where `dir = locale === 'ar' ? -1 : 1`. In RTL, the slide direction is reversed — content slides from left to right (instead of right to left in LTR). This is correct for RTL reading direction.

**[V2] Close Behavior — Always Goes to Overview:**
Both `handleFinish` and `handleClose` navigate to `/{locale}/overview`. If the wizard was opened from a different context (e.g., from the workspace welcome page), closing it still navigates to overview. This may be unexpected if the user opened the wizard from a specific page and expected to return there.

**[V2] Quick Links — No "Skip" Option:**
Step 2 presents three quick links but no "Skip" or "I'll do this later" option other than the "Go to Dashboard" button. The quick links are well-chosen (screen, media, team) but some users may want to explore other features first (e.g., playlists, schedules).

**[V2] Seed Demo — No Loading Detail:**
When seeding demo content, the button shows a spinner but no progress detail. For large demo datasets, the seeding could take 10+ seconds with no feedback beyond the spinner. Users may think the app is frozen.

### WorkspaceProvider — Technical UX Analysis

**[V2] `hasSuccessfulMeRef` — Silent Error Swallowing:**
At `workspace-context.tsx:135-137`, after the first successful `/auth/me` call, subsequent non-401 errors are silently swallowed (the ref prevents the error handler from running). This means:
- If the user's session is revoked server-side (not 401 but 403), the app continues as if authenticated
- If the API returns 500, the app shows stale data without indication
- The user may experience "ghost" state where the UI shows data but API calls fail

This is a **moderate reliability issue** — the `hasSuccessfulMeRef` optimization trades error visibility for reduced flicker.

**[V2] Socket.IO Transport — WebSocket Only:**
At `workspace-context.tsx:302`, the Socket.IO connection uses `transports: ['websocket']` — no polling fallback. This means:
- Users behind corporate proxies that block WebSocket will have no realtime updates
- Users on networks with aggressive HTTP upgrade blocking will lose realtime features
- The app degrades silently — no toast or indicator that realtime is unavailable

Best practice is to allow `['websocket', 'polling']` so Socket.IO can fall back to long-polling.

**[V2] Cookie-Based Workspace Persistence:**
The active workspace ID is stored in a cookie (`cs_workspace_id`) via `setCookie()`. This means:
- Workspace selection persists across tabs and sessions
- Server-side code can read the cookie to pre-render workspace-specific content
- The cookie has no `SameSite` or `Secure` attributes set by the frontend — these depend on the backend's cookie handling

**[V2] Super-Admin Hint in sessionStorage:**
The `cs_super_admin` sessionStorage hint is used to optimistically show the admin sidebar during loading. This prevents a flash of client sidebar before the admin check completes. However, sessionStorage is per-tab — opening a new tab loses the hint, causing a brief client sidebar flash before the admin sidebar appears.

### [V2] Enterprise SaaS Evaluation

**[V2] Multi-Workspace Scalability:**
- **Workspace list**: Fetched from `/auth/me` response — all workspaces in a single API call. This doesn't scale to 100+ workspaces.
- **Switcher UI**: Simple dropdown, no search, no virtualization — unusable beyond ~20 workspaces
- **No workspace folders/groups**: Cannot organize workspaces into folders or tag them
- **No workspace roles**: The user has a single role per workspace (from `memberships`), but the switcher doesn't display it
- **No recent workspaces**: No "recently accessed" list for quick switching

**[V2] Workspace Creation Flow:**
1. User clicks "Create First Workspace" or opens switcher → "Create Workspace"
2. `WorkspaceCreateDialog` opens (form with name, etc.)
3. `POST /workspaces` creates the workspace
4. `refreshWorkspaces(newId)` re-fetches `/auth/me`
5. `setWorkspaceId(newId)` sets active workspace
6. `bumpWorkspaceDataEpoch()` triggers sidebar count refetch
7. `OnboardingWizard` opens automatically

This flow is efficient — 1 click to open dialog, 1 form submission, then onboarding. The automatic onboarding wizard is a good activation pattern.

**[V2] Missing Enterprise Features:**
- No workspace deletion from the frontend (only from admin panel)
- No workspace rename from the switcher
- No workspace settings accessible from the switcher
- No workspace export/import
- No workspace duplication/cloning
- No workspace transfer (change owner)
- No SSO/SAML per workspace

### [V2] Nielsen Heuristic Evaluation — Workspace

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ⚠️ Medium | Socket.IO failures silent, seed demo no progress detail, `hasSuccessfulMeRef` swallows errors |
| Match between system and real world | ✅ Good | "Workspace" terminology is standard, "Branches" maps to locations |
| User control and freedom | ⚠️ Medium | Wizard close always goes to overview, switcher navigates to branches not overview |
| Consistency and standards | ⚠️ Medium | Switcher active state subtle, no check icon |
| Error prevention | ✅ Good | Disabled switcher when no workspaces, demo bootstrap with error toast |
| Recognition rather than recall | ⚠️ Medium | No workspace metadata in switcher, no recent workspaces |
| Flexibility and efficiency | ⚠️ Low | No search in switcher, no keyboard shortcut for workspace switching, no favorites |
| Aesthetic and minimalist design | ✅ Good | Welcome screen is visually appealing, wizard is concise |
| Help users recognize/recover from errors | ✅ Good | Session restoration for interrupted workspace creation |
| Help and documentation | ✅ Good | Onboarding wizard guides first steps |

### Cross-References
- See `04-layout-and-shell.md` for WorkspaceGate and switcher rendering in header
- See `06-auth-and-session.md` for session recovery and token refresh
- See `15-admin-panel.md` for admin-side workspace management
- See `25-responsive-audit.md` for mobile workspace switching gap
- See `27-user-flows.md` for workspace creation and switching user journeys
- See `28-feature-inventory.md` for enterprise feature gap analysis
