# 13 — Branches Feature

> **Source basis:** `src/features/branches/branches-page-client.tsx`, `src/features/branches/branch-detail-client.tsx`, `src/features/branches/branch-tab-sections.tsx`, `src/features/branches/branch-pairing-dialog.tsx`, `src/features/branches/branch-playlist-dialogs.tsx`, `src/features/branches/branch-review-section.tsx`, `src/features/branches/branch-workspace-toolbar.tsx`, `src/features/branches/create-screen-dialog.tsx`, `src/features/branches/playlist-screens-client.tsx`, `src/features/branches/branches-api.ts`, `src/features/branches/branch-stats.ts`, `src/features/branches/use-branch-media.ts`, `src/features/branches/use-branch-playlists.ts`, `src/features/branches/use-player-pairing.ts`, `src/features/branches/use-screen-playback-assignment.ts`  

---

## 13.1 Branches Page Client (`src/features/branches/branches-page-client.tsx`)

### Route: `/{locale}/branches`

### Purpose
Lists all branches (locations) within the active workspace. Each branch corresponds to a workspace in the context of the branches feature.

### Features
- Grid of branch cards
- Each card: branch name, location, screen count, status
- Search/filter branches
- Create new branch
- Click branch → navigates to `/{locale}/branches/{branchId}`

---

## 13.2 Branch Detail Client (`src/features/branches/branch-detail-client.tsx`)

### Route: `/{locale}/branches/{branchId}`

### Purpose
Detailed view of a single branch with tabbed sections.

### Layout
- Branch workspace toolbar at top
- Tab navigation: Overview, Screens, Playlists, Media, Settings
- Each tab renders different content from `branch-tab-sections.tsx`

### Back button
Header meta shows "Branch Detail" with back to overview.

---

## 13.3 Branch Tab Sections (`src/features/branches/branch-tab-sections.tsx`)

### Purpose
The largest file in the branches feature (~31KB). Contains all tab content components.

### Tabs

**Overview Tab:**
- Branch statistics (screens, playlists, media counts)
- Screen health summary
- Recent activity
- Quick actions

**Screens Tab:**
- List of screens in this branch
- Add screen button → `CreateScreenDialog`
- Screen cards with status, name, serial
- Click screen → screen detail page
- Pair screen → `BranchPairingDialog`

**Playlists Tab:**
- List of playlists assigned to this branch
- Assign playlist → `BranchPlaylistDialogs`
- Unassign playlist
- Playlist preview
- `PlaylistScreensClient` — shows which screens are playing which playlist

**Media Tab:**
- Media items available for this branch
- Uses `use-branch-media` hook
- Upload, preview, delete

**Settings Tab:**
- Branch name, location, timezone
- Branch-specific settings
- Delete branch option

---

## 13.4 Branch Pairing Dialog (`src/features/branches/branch-pairing-dialog.tsx`)

### Purpose
Dialog for pairing a new screen device to a branch.

### Flow
1. Display pairing code/QR
2. Wait for device to pair (Socket.IO `pairing:started` event)
3. On success: show confirmation, refresh screen list
4. Option to name the screen after pairing

### Player Pairing Hook (`src/features/branches/use-player-pairing.ts`)
- Generates pairing code
- Listens for pairing events via Socket.IO
- Returns `{ pairingCode, isPairing, pairDevice, cancelPairing }`
- Integrates with `pairingActivityEpoch` from workspace context

---

## 13.5 Branch Playlist Dialogs (`src/features/branches/branch-playlist-dialogs.tsx`)

### Dialogs
- **Assign Playlist Dialog:** Select playlist to assign to branch screens
- **Unassign Confirmation:** Confirm removing playlist from branch
- **Schedule Playlist:** Set schedule for playlist on branch screens

---

## 13.6 Create Screen Dialog (`src/features/branches/create-screen-dialog.tsx`)

### Purpose
Dialog for creating/adding a new screen to a branch.

### Fields
- Screen name
- Location/description
- Screen type (optional)
- Orientation (landscape/portrait)

### Behavior
- Calls `POST /screens` with workspace/branch ID
- On success: refreshes screen list, shows toast
- Can transition to pairing flow

---

## 13.7 Playlist Screens Client (`src/features/branches/playlist-screens-client.tsx`)

### Purpose
Shows the mapping between playlists and screens within a branch.

### Features
- Table: playlist name, assigned screens, status
- Assign/unassign screens to playlists
- Real-time status of each screen
- Quick edit assignments

---

## 13.8 Branch Workspace Toolbar (`src/features/branches/branch-workspace-toolbar.tsx`)

### Purpose
Toolbar shown at the top of branch detail page.

### Content
- Branch name and location
- Edit branch button
- Back to branches list
- Tab navigation (if not using separate tab component)
- Quick stats (screen count, online count)

---

## 13.9 Branch Review Section (`src/features/branches/branch-review-section.tsx`)

### Purpose
Review/audit section for branch content.

### Features
- Content review checklist
- Approval workflow indicators
- Screenshot previews of current screen content
- Last reviewed timestamp

---

## 13.10 Branches API (`src/features/branches/branches-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchBranches(workspaceId)` | GET | `/workspaces/{ws}/branches` | List branches |
| `fetchBranch(branchId)` | GET | `/branches/{id}` | Get branch detail |
| `createBranch(data)` | POST | `/branches` | Create branch |
| `updateBranch(id, data)` | PATCH | `/branches/{id}` | Update branch |
| `deleteBranch(id)` | DELETE | `/branches/{id}` | Delete branch |

---

## 13.11 Branch Hooks

### use-branch-media (`use-branch-media.ts`)
- Fetches media items for a specific branch
- SWR-based
- Returns `{ media, loading, error, mutate }`

### use-branch-playlists (`use-branch-playlists.ts`)
- Fetches playlists assigned to a branch
- Manages playlist assignments (assign, unassign, reorder)
- SWR-based with mutation support
- Returns `{ playlists, loading, error, assignPlaylist, unassignPlaylist, mutate }`

### use-screen-playback-assignment (`src/features/branches/use-screen-playback-assignment.ts`)
- Manages which playlist is playing on which screen
- Assign/unassign playlist to screen
- Returns `{ assignments, assign, unassign, loading }`

---

## 13.12 Branch Stats (`src/features/branches/branch-stats.ts`)

### Type
```typescript
type BranchStats = {
  screenCount: number;
  onlineCount: number;
  offlineCount: number;
  playlistCount: number;
  mediaCount: number;
};
```

Utility functions for computing branch statistics from raw data.

---

## 13.13 [V2] UX Analysis — Branches Feature

### Branch List — IA Evaluation

**[V2] Branches as Workspace Equivalent:**
In the Smart Screen architecture, "branches" are equivalent to workspaces — each branch is a separate workspace with its own screens, playlists, media, and team. The branch list is the workspace list, and the branch detail is the workspace dashboard.

**[V2] Branch Stats Display:**
The `BranchStats` type provides `screenCount`, `onlineCount`, `offlineCount`, `playlistCount`, `mediaCount`. These stats give users a quick overview of each branch's health and content volume. The online/offline count is particularly valuable for fleet health monitoring.

**[V2] No Branch Search/Filter:**
For organizations with many branches (e.g., 50+ retail locations), there is no search or filter on the branch list. Users must scroll through all branches to find a specific one. This is the same scalability issue as the workspace switcher.

### Branch Detail — UX Analysis

**[V2] Tab-Based Navigation:**
Branch detail uses tabs for organizing content (screens, playlists, media, etc.). Tab-based navigation is appropriate for detail pages — it keeps related content grouped while allowing quick switching.

**[V2] Header Inset — Branch Toolbar:**
The branch detail page likely uses `ShellHeaderInsetSetterContext` to inject a branch-specific toolbar into the shell header. This is a good pattern — it keeps branch context visible while scrolling through tab content.

**[V2] Back Button — Correct Behavior:**
The branch detail back button says "Back to Overview" and links to `overview` — this is correct (unlike the screen detail back button which has a misleading label).

### Branch Pairing — UX Analysis

**[V2] Pairing Dialog:**
The `BranchPairingDialog` handles the pairing flow for connecting screens to a branch. The pairing process is a critical onboarding step for new screens.

**[V2] Pairing Activity Tracking:**
The `WorkspaceProvider` tracks pairing activity epochs — this suggests the UI shows realtime pairing status. When a screen is being paired, the UI should show a pending state and transition to success when pairing completes.

### [V2] Enterprise SaaS Evaluation

**[V2] Missing Branch Features:**
- No branch grouping (e.g., by region, brand, franchise)
- No branch templates (apply same settings to multiple branches)
- No branch comparison view
- No branch-level analytics aggregation
- No branch-level user roles (different roles per branch)
- No branch cloning/duplication
- No branch import/export
- No batch branch operations

### Cross-References
- See `07-workspace-management.md` for workspace context
- See `09-screens-feature.md` for screen management within branches
- See `10-playlists-and-studio.md` for playlist management within branches
- See `03-routing-and-navigation.md` for branch route navigation
- See `27-user-flows.md` for branch management user journey
