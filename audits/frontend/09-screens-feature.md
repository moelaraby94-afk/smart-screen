# 09 — Screens Feature

> **Source basis:** `src/features/screens/screens-client.tsx`, `src/features/screens/screen-detail-client.tsx`, `src/features/screens/screen-visual-card.tsx`, `src/features/screens/screen-setup-modal.tsx`, `src/features/screens/screen-dialogs.tsx`, `src/features/screens/screen-quick-edit-panel.tsx`, `src/features/screens/screen-fleet-status.tsx`, `src/features/screens/screen-analytics-panel.tsx`, `src/features/screens/useApiScreens.ts`, `src/features/screens/useScreenRealtime.ts`, `src/features/screens/use-screen-active-preview.ts`, `src/features/screens/api/screens-api.ts`  

---

## 9.1 Screens List Page (`src/features/screens/screens-client.tsx`)

### Route: `/{locale}/screens`

### Page Structure
- Server component renders header (kicker, title, description) then `ScreensClient`
- `ScreensClient` is a large client component (~27KB) handling the full screen fleet management UI

### Key Features
- **View modes:** Grid view and table view toggle
- **Search/filter:** Filter by name, serial number, location, status
- **Status filter:** Online, offline, maintenance
- **Bulk actions:** Select multiple screens for bulk operations
- **Add screen:** Opens `ScreenSetupModal`
- **Screen cards:** `ScreenVisualCard` components in grid view
- **Real-time updates:** `useScreenRealtime` hook for live status changes
- **Pagination:** Handles paginated API response

### Data Fetching
- `useApiScreens` hook fetches screens from `GET /screens?workspaceId={ws}`
- Returns `{ screens, loading, error, mutate }`
- Uses SWR under the hood (via global SWR provider config)

### Screen Fleet Status (`src/features/screens/screen-fleet-status.tsx`)
- Summary bar showing counts: online, offline, maintenance
- Visual indicators with colored dots/badges
- May show percentage health

---

## 9.2 ScreenVisualCard (`src/features/screens/screen-visual-card.tsx`)

### Purpose
Individual screen card for grid view.

### Content
- **Preview:** Live preview thumbnail (via `use-screen-active-preview` hook)
- **Status badge:** Online (emerald), Offline (amber), Maintenance (muted)
- **Screen name:** Truncated, bold
- **Serial number:** Monospace, muted
- **Location:** If set, with `MapPin` icon
- **Current playlist:** If assigned, with badge
- **Actions menu:** Dropdown with edit, delete, view details, restart, etc.
- **Click:** Navigates to `/{locale}/screens/{screenId}`

### Active Preview (`src/features/screens/use-screen-active-preview.ts`)
- Fetches current preview snapshot for the screen
- Returns preview URL or null
- Used to show what's currently displayed on the screen

---

## 9.3 Screen Detail Page (`src/features/screens/screen-detail-client.tsx`)

### Route: `/{locale}/screens/{screenId}`

### Layout
- Full screen detail view
- Back button to screens list (via header meta)
- Multiple panels: info, analytics, quick edit, dialogs

### Sections

**Info Panel:**
- Screen name, serial number, location
- Status indicator
- Current playlist assignment
- Pairing code/QR
- Last seen timestamp
- Screen metadata (resolution, orientation, model)

**Analytics Panel (`src/features/screens/screen-analytics-panel.tsx`):**
- Uptime percentage
- Online/offline history timeline
- Playback statistics
- Proof-of-play metrics
- Error/crash reports

**Quick Edit Panel (`src/features/screens/screen-quick-edit-panel.tsx`):**
- Inline editing of screen properties
- Name, location, description
- Playlist assignment
- Schedule assignment
- Volume, brightness controls (if supported)
- Orientation toggle
- Tags/categories

**Dialogs (`src/features/screens/screen-dialogs.tsx`):**
- Delete screen confirmation
- Restart screen confirmation
- Unpair screen confirmation
- Transfer screen to another workspace

---

## 9.4 Screen Setup Modal (`src/features/screens/screen-setup-modal.tsx`)

### Purpose
Multi-step modal for adding a new screen to the fleet. This is the largest single component (~54KB).

### Flow
1. **Step 1 — Screen Info:** Enter screen name, location, description
2. **Step 2 — Pairing:** Display pairing code/QR code for the screen device to scan
3. **Step 3 — Content Assignment:** Assign playlist and schedule
4. **Step 4 — Confirmation:** Review and confirm setup

### Pairing Process
- Screen device enters pairing mode
- Dashboard shows pairing code
- `pairing:started` Socket.IO event triggers `bumpPairingActivityEpoch` in workspace context
- Real-time feedback when pairing succeeds

### Validation
- Each step validates before allowing next
- Error messages via toasts

---

## 9.5 Screen Realtime (`src/features/screens/useScreenRealtime.ts`)

### Hook: `useScreenRealtime(workspaceId, screenId?)`

### Behavior
- Connects to Socket.IO `/realtime` namespace
- Listens for `screen:status` events
- Updates local screen data on status change
- Shows toast notifications for status changes (online/offline)
- Cleans up on unmount

### Events
| Event | Payload | Action |
|-------|---------|--------|
| `screen:status` | `{ screenId, serialNumber, status, lastSeenAt }` | Update screen status, show toast |

---

## 9.6 Screens API (`src/features/screens/api/screens-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchScreens(workspaceId)` | GET | `/screens?workspaceId={ws}` | List screens |
| `fetchScreen(screenId)` | GET | `/screens/{id}` | Get screen detail |
| `createScreen(data)` | POST | `/screens` | Create/pair screen |
| `updateScreen(id, data)` | PATCH | `/screens/{id}` | Update screen |
| `deleteScreen(id)` | DELETE | `/screens/{id}` | Delete screen |
| `restartScreen(id)` | POST | `/screens/{id}/restart` | Restart screen device |
| `unpairScreen(id)` | POST | `/screens/{id}/unpair` | Unpair screen device |

---

## 9.7 Screen Status Types

```typescript
type ScreenStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

type ScreenRow = {
  id: string;
  name: string;
  serialNumber: string;
  status: ScreenStatus;
  location?: string | null;
  playlistId?: string | null;
  lastSeenAt?: string | null;
  isOfflineCacheMode?: boolean;
};
```

---

## 9.8 UseApiScreens Hook (`src/features/screens/useApiScreens.ts`)

### Hook: `useApiScreens(workspaceId)`

Returns `{ screens, loading, error, mutate }`.

### Behavior
- Fetches screens via SWR
- Key: `['screens', workspaceId]`
- Returns empty array when no workspaceId
- Mutate function for manual refetch after mutations

### Test Coverage
`src/features/screens/useApiScreens.test.tsx` — Tests hook behavior with mocked API responses.

---

## 9.8 [V2] UX Analysis — Screens Feature

### Screen List — HCI Evaluation

**[V2] Visual Cards vs Table:**
The screens list uses `ScreenVisualCard` — a card-based layout rather than a table. This is good for visual identification (showing screen thumbnail/preview) but reduces information density. Enterprise users with 50+ screens may prefer a table view for scanning. There is no view toggle (card/table).

**[V2] No Bulk Actions:**
The screens list has no bulk selection capability. Users cannot select multiple screens to perform batch operations (e.g., assign playlist to 10 screens, delete 5 offline screens). Each action must be performed one screen at a time. This is a **significant enterprise UX gap** — bulk operations are essential for fleet management.

**[V2] No Filter/Search:**
There is no visible filter or search on the screens list. Users with many screens cannot filter by status (online/offline), branch, or playlist assignment. They must scroll through all screens to find specific ones.

**[V2] No Sort Options:**
The screens list has no sort controls. Users cannot sort by name, status, last seen, or branch. The default sort order is determined by the API.

### Screen Detail — UX Analysis

**[V2] Back Button Label Inconsistency:**
As identified in `03-routing-and-navigation.md` V2, the screen detail back button says "Back to Overview" but links to `/screens`. This is misleading.

**[V2] Screen Setup Modal:**
The `ScreenSetupModal` handles screen pairing and configuration. The pairing flow likely involves:
1. Display a pairing code on the physical screen
2. User enters the code in the modal
3. Backend validates and pairs the screen

This is a standard digital signage pairing pattern. The UX depends on the clarity of the pairing code display and the input form.

**[V2] Realtime Status:**
Screen status is updated via Socket.IO. When a screen goes offline, the detail page should reflect this in realtime. However, if the Socket.IO connection fails (see `07-workspace-management.md` V2), the status will be stale.

### Screen Status Types — Semantic Analysis

**[V2] Status Color Mapping:**
The screen status types likely map to badge variants:
- `online` → `online` badge (strong emerald)
- `offline` → `danger` badge (red)
- `pairing` → `warning` badge (amber)
- `error` → `danger` badge (red)

This follows the semantic color mapping established in the design system.

### [V2] Enterprise SaaS Evaluation

**[V2] Missing Fleet Management Features:**
- No screen grouping/folders
- No bulk operations
- No screen tags/labels
- No screen health history/timeline
- No screenshot preview (live capture from screen)
- No remote control (reboot, refresh, volume)
- No geographical map view
- No screen configuration templates
- No OTA update management

### Cross-References
- See `08-dashboard-and-overview.md` for screen health on dashboard
- See `13-branches-feature.md` for branch-level screen management
- See `25-responsive-audit.md` for screen list responsive behavior
- See `27-user-flows.md` for screen pairing user journey
