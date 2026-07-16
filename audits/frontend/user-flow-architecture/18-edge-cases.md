# Edge Cases

> **Evidence basis:** `01-flow-principles.md` FP-03, FP-07, `02-flow-matrix.md` §4 (risk matrix), `04-state-machines.md`, `16-system-flows.md` FL-SYS-01, `product-architecture/13-frontend-state-boundaries.md`
> **Purpose:** Document every edge case with handling strategy, recovery path, and cross-references to affected flows

---

## 1. No Workspace

| Aspect | Detail |
|--------|--------|
| **Trigger** | User registered but workspace creation failed; user's workspace was deleted |
| **Affected Flows** | All authenticated flows |
| **UI Behavior** | Redirect to `/welcome` with "Setting up your workspace..." message; polling until workspace ready |
| **Recovery** | System auto-creates workspace on next login; if persistent, contact support |
| **State** | AUTHENTICATED but no workspace context |
| **Evidence** | `07-workspace-flows.md` FL-WS-01 FP-1 |

### Handling
1. Frontend detects no workspace in user profile
2. Redirect to `/welcome` (loading state)
3. Poll workspace creation API every 3s
4. When workspace ready: set cookie, redirect to `/overview`
5. If polling fails after 60s: Error page "Unable to set up workspace. Contact support."

---

## 2. No Screens

| Aspect | Detail |
|--------|--------|
| **Trigger** | Workspace has 0 screens (new workspace or all deleted) |
| **Affected Flows** | FL-OB-05, FL-PUB-01, FL-SCH-01, FL-AN-01 |
| **UI Behavior** | Overview shows onboarding state; Screens page shows empty state; Publishing dialog shows "No screens"; Analytics shows empty state |
| **Recovery** | User pairs a screen (FL-SC-01) |
| **State** | Normal (workspace is active, just empty) |
| **Evidence** | `07-workspace-flows.md` FL-WS-03, `17-onboarding-flows.md` FL-OB-05 |

### Handling per Page

| Page | Empty State | CTA |
|------|------------|-----|
| Overview | Onboarding 3-step guide | "Add Your First Screen" |
| Screens | "No screens paired yet" | "Add Screen" |
| Content → Publish | "No screens available" | "Add Screen" link |
| Scheduling | "No screens to schedule" | "Add Screen" link |
| Analytics | "No analytics data. Add screens and publish content." | "Add Screen" |

---

## 3. No Media

| Aspect | Detail |
|--------|--------|
| **Trigger** | Workspace has 0 media files (new or all deleted) |
| **Affected Flows** | FL-PL-02 (Studio), FL-MED-01 |
| **UI Behavior** | Media tab shows empty state; Studio media panel shows empty state with "Upload" CTA |
| **Recovery** | User uploads media (FL-MED-01) or uses template with stock media |
| **State** | Normal |
| **Evidence** | `09-media-flows.md`, `17-onboarding-flows.md` FL-OB-03 |

### Handling
- Media tab: "No media uploaded yet" + "Upload Media" button
- Studio media panel: "No media in library" + "Upload" tab
- Playlist creation: Templates can use stock media (user doesn't need own media)

---

## 4. No Playlist

| Aspect | Detail |
|--------|--------|
| **Trigger** | Workspace has 0 playlists (new or all deleted) |
| **Affected Flows** | FL-PUB-01, FL-SCH-01 |
| **UI Behavior** | Playlists tab shows empty state; Publishing from screen shows "No playlists" |
| **Recovery** | User creates a playlist (FL-PL-01) |
| **State** | Normal |
| **Evidence** | `10-playlist-flows.md` |

### Handling
- Playlists tab: "No playlists created yet" + "Create Playlist" button
- Screen detail → "Assign Content": "No playlists available" + "Create Playlist" link
- Scheduling: "No playlists to schedule" + "Create Playlist" link

---

## 5. Offline Screen

| Aspect | Detail |
|--------|--------|
| **Trigger** | Screen loses connection (power off, network loss, player app crash) |
| **Affected Flows** | FL-SC-02, FL-PUB-01, FL-NT-01 |
| **UI Behavior** | Screen status badge → red "Offline"; toast notification; bell notification |
| **Recovery** | Screen reconnects automatically; content syncs on reconnect |
| **State** | ONLINE → OFFLINE |
| **Evidence** | `04-state-machines.md` §1, `08-screen-flows.md` FL-SC-02 |

### Handling
1. Socket.IO detects screen disconnect
2. Screen state: ONLINE → OFFLINE
3. UI: Status badge updates to red; toast: "[Screen Name] went offline"
4. Bell notification: "Screen offline: [Name]"
5. If publishing to offline screen: Warning in dialog: "Offline screens will receive content when they reconnect"
6. When screen reconnects: OFFLINE → ONLINE; content syncs automatically; bell notification (no toast)

---

## 6. Deleted Playlist Referenced by Schedule

| Aspect | Detail |
|--------|--------|
| **Trigger** | User deletes a playlist that has active schedules |
| **Affected Flows** | FL-PL-04, FL-SCH-01, FL-SCH-03 |
| **UI Behavior** | Delete dialog warns: "[N] active schedules will be affected"; after deletion, schedules show "Playlist unavailable" |
| **Recovery** | User creates new playlist and updates schedules, or deletes affected schedules |
| **State** | Playlist → DELETED; Schedule → ACTIVE (but references deleted playlist) |
| **Evidence** | `10-playlist-flows.md` FL-PL-04 |

### Handling
1. User initiates playlist delete
2. AlertDialog: "Delete [Playlist Name]? [N] active schedules will be affected. Screens will stop playing this content."
3. User confirms → playlist deleted
4. Affected schedules: Show "Playlist unavailable" in calendar and schedule list
5. User must update or delete affected schedules

---

## 7. Deleted Media Referenced by Playlist

| Aspect | Detail |
|--------|-------|
| **Trigger** | User deletes media that is used in one or more playlists |
| **Affected Flows** | FL-MED-02, FL-PL-02 |
| **UI Behavior** | Delete dialog warns: "Used in [N] playlist(s). Those playlists will show a blank space." |
| **Recovery** | User replaces media in affected playlists or re-creates media |
| **State** | Media → DELETED; Playlist references broken media ID |
| **Evidence** | `09-media-flows.md` FL-MED-02 |

### Handling
1. User initiates media delete
2. AlertDialog: "Delete [filename]? This file is used in [N] playlist(s). Those playlists will show a blank space where this media was."
3. User confirms → media deleted
4. Affected playlists: Show placeholder "Media unavailable" in Studio and preview
5. User must replace media in affected playlists (future: FL-MED-03 replace)

---

## 8. Conflict Schedule

| Aspect | Detail |
|--------|--------|
| **Trigger** | New schedule overlaps with existing schedule on same screen |
| **Affected Flows** | FL-SCH-01, FL-SCH-02 |
| **UI Behavior** | API returns 409; conflict details shown; user adjusts or overrides |
| **Recovery** | Adjust time, change screen, or override existing schedule |
| **State** | CREATING → CONFLICT → (resolve) → ACTIVE |
| **Evidence** | `11-publishing-scheduling-flows.md` FL-SCH-02 |

### Handling
1. User submits schedule
2. API returns 409 with conflict details (existing schedule name, screen, time overlap)
3. UI: Conflict warning in dialog with details
4. User options:
   - Adjust time range → re-submit
   - Select different screen → re-submit
   - Override (replace existing schedule) → confirm dialog → API replaces
   - Cancel → abort

---

## 9. Permission Lost During Session

| Aspect | Detail |
|--------|--------|
| **Trigger** | User's role was changed (e.g., Owner → Viewer) by another Owner while user is active |
| **Affected Flows** | All flows with permission checks |
| **UI Behavior** | API returns 403 on next action; UI reverts; SWR revalidates user role; unauthorized actions hide |
| **Recovery** | UI adapts to new role; user sees appropriate actions only |
| **State** | Role changes from higher to lower (or vice versa) |
| **Evidence** | `12-team-flows.md` FL-TM-03 AP-2 |

### Handling
1. User attempts action (e.g., clicks "Publish")
2. API returns 403 (permission denied)
3. UI: Toast: "You don't have permission to do that"
4. SWR revalidates user profile → new role fetched
5. UI re-renders with role-appropriate actions (unauthorized actions hidden)
6. (Future) Socket.IO pushes role change → realtime UI update without API 403

---

## 10. Session Expired

| Aspect | Detail |
|--------|--------|
| **Trigger** | JWT token expires (typically 24h) |
| **Affected Flows** | All authenticated flows |
| **UI Behavior** | API returns 401; redirect to login; toast: "Session expired" |
| **Recovery** | User re-logs in; redirected to previous page (future) or Overview |
| **State** | AUTHENTICATED → EXPIRED → UNAUTHENTICATED |
| **Evidence** | `04-state-machines.md` §7, `16-system-flows.md` FL-SYS-01 AP-2 |

### Handling
1. Any API call returns 401
2. Frontend clears session (cookie, SWR cache)
3. Redirect to `/login`
4. Toast: "Your session has expired. Please log in again."
5. User logs in → redirect to Overview (or previous page — future)
6. If user was in Studio with unsaved changes: changes are lost (FR-07)

---

## 11. API Failure

| Aspect | Detail |
|--------|--------|
| **Trigger** | API returns 500, 502, 503, or is unreachable |
| **Affected Flows** | All data-fetching flows |
| **UI Behavior** | Inline error state in affected section + "Retry" button |
| **Recovery** | User clicks "Retry"; SWR revalidates |
| **State** | Loading → Error → (retry) → Loading → Success/Error |
| **Evidence** | `16-system-flows.md` FL-SYS-01 |

### Handling
1. SWR catches API error
2. Affected section shows error state: "Something went wrong." + "Retry" button
3. Error is localized to affected section (not full page) when possible
4. User clicks "Retry" → SWR revalidates
5. If retry fails: error persists; user can retry again or navigate away
6. If multiple retries fail: "Unable to load. Try again later." (future)

---

## 12. Realtime Failure (Socket.IO)

| Aspect | Detail |
|--------|--------|
| **Trigger** | WebSocket disconnects (network issue, server restart) |
| **Affected Flows** | FL-NT-01, FL-SC-02 (screen status), all realtime-dependent UI |
| **UI Behavior** | Toast: "Real-time connection lost. Reconnecting..." |
| **Recovery** | Socket.IO auto-reconnects; toast disappears on reconnect |
| **State** | Realtime: CONNECTED → DISCONNECTED → CONNECTED |
| **Evidence** | `16-system-flows.md` FL-SYS-01 AP-3 |

### Handling
1. Socket.IO detects disconnect
2. Toast: "Real-time connection lost. Reconnecting..." (persistent, non-blocking)
3. Socket.IO auto-reconnects (exponential backoff)
4. On reconnect: toast disappears; missed events fetched via REST API (SWR revalidation)
5. If reconnect fails after 60s: "Unable to reconnect. Some data may be outdated. Refresh the page."

---

## 13. Browser Refresh

| Aspect | Detail |
|--------|--------|
| **Trigger** | User presses F5 or Ctrl+R |
| **Affected Flows** | All flows (state is lost) |
| **UI Behavior** | Page reloads; SWR cache revalidates; form data lost |
| **Recovery** | User re-navigates and re-enters data |
| **State** | All in-memory state lost; SWR cache persists (IndexedDB) |
| **Evidence** | FR-12 |

### Handling per Context

| Context | Behavior | Data Loss |
|---------|----------|-----------|
| Reading (list, detail) | Page reloads; data re-fetched | None |
| Form editing (Settings, Schedule) | Page reloads; form data lost | Form inputs lost |
| Studio editing | Page reloads; unsaved changes lost | Canvas changes lost (FR-01) |
| Dialog open | Page reloads; dialog closed | Dialog inputs lost |
| Upload in progress | Page reloads; upload cancelled | Upload progress lost |

### Future Mitigations
- Form state persistence (localStorage/sessionStorage)
- Studio auto-save (F-MP-14)
- Upload resume (future)

---

## 14. Network Loss

| Aspect | Detail |
|--------|--------|
| **Trigger** | Browser loses internet connection |
| **Affected Flows** | All network-dependent flows |
| **UI Behavior** | Toast: "Connection lost. Retrying..." (persistent until restored) |
| **Recovery** | Auto-retry when connection restored (SWR + Socket.IO) |
| **State** | ONLINE → OFFLINE → ONLINE |
| **Evidence** | `16-system-flows.md` FL-SYS-01 AP-1 |

### Handling
1. Browser `navigator.onLine` becomes false OR API request fails
2. Toast: "Connection lost. Retrying..." (persistent, non-blocking)
3. SWR pauses revalidation; Socket.IO enters reconnect mode
4. When connection restored: SWR revalidates all queries; Socket.IO reconnects
5. Toast disappears; data refreshes
6. If user was submitting form: auto-retry on reconnect (if within 30s)

---

## 15. Duplicate Action (Double Click)

| Aspect | Detail |
|--------|--------|
| **Trigger** | User clicks submit button twice rapidly |
| **Affected Flows** | All form submission flows |
| **UI Behavior** | Button disabled after first click; spinner shows |
| **Recovery** | N/A (prevented) |
| **State** | N/A (idempotent) |
| **Evidence** | FR-09, `01-flow-principles.md` FP-07 |

### Handling
1. User clicks submit button
2. Button immediately disabled + spinner shows
3. Second click has no effect (button is disabled)
4. API call completes
5. Button re-enabled (on error) or page navigates away (on success)
6. Backend also enforces idempotency (duplicate checks for invitations, etc.)

---

## 16. Concurrent Editing

| Aspect | Detail |
|--------|--------|
| **Trigger** | Two users edit the same playlist in Studio simultaneously |
| **Affected Flows** | FL-PL-02 (Studio) |
| **UI Behavior** | (Current) Last save wins; (Future) Conflict warning |
| **Recovery** | (Current) User who saved last overwrites; (Future) Optimistic locking |
| **State** | Both users in EDITING state; last save persists |
| **Evidence** | FR-11 |

### Handling (Current)
1. User A and User B both open Studio for same playlist
2. Both make changes
3. User A saves → API updates playlist
4. User B saves → API updates playlist (overwrites User A's changes)
5. User A's changes are lost
6. No warning (current limitation)

### Handling (Future)
1. User A and User B both open Studio
2. Socket.IO detects concurrent editing → warning: "Another user is editing this playlist"
3. User A saves → API updates with version hash
4. User B saves → API detects version mismatch → 409 conflict
5. User B sees: "This playlist was modified by another user. Reload to see their changes."
6. User B reloads → gets latest version

---

## 17. Screen Pairing Code Expired

| Aspect | Detail |
|--------|--------|
| **Trigger** | Pairing code on physical screen has expired (time-based or screen rebooted) |
| **Affected Flows** | FL-SC-01 |
| **UI Behavior** | API returns 404 or 400; inline error: "This pairing code has expired. Generate a new code on your screen." |
| **Recovery** | User gets new code from physical screen and re-enters |
| **State** | N/A (code is invalid) |

---

## 18. Storage Limit Reached

| Aspect | Detail |
|--------|--------|
| **Trigger** | Workspace storage is at 100% of plan limit |
| **Affected Flows** | FL-MED-01 |
| **UI Behavior** | Upload error: "Storage limit reached. Upgrade your plan or delete old media." + "Upgrade" link |
| **Recovery** | User upgrades plan (FL-ST-04) or deletes media (FL-MED-02) |
| **State** | Storage: 100% used |
| **Evidence** | `09-media-flows.md` FL-MED-01 FP-3 |

### Handling
1. User attempts upload
2. API returns 402 or 409 (storage limit)
3. UI: Error: "Storage limit reached. Upgrade your plan or delete old media."
4. "Upgrade" link → navigates to `/settings/billing`
5. User upgrades plan → storage limit increases → retry upload
6. Or user deletes old media → storage freed → retry upload

---

## 19. Invitation Token Invalid

| Aspect | Detail |
|--------|--------|
| **Trigger** | User clicks accept link but token is invalid, expired, or already used |
| **Affected Flows** | FL-TM-01, FL-AUTH-02 |
| **UI Behavior** | Error page: "This invitation is no longer valid." + "Contact your workspace owner" |
| **Recovery** | Owner resends invitation |
| **State** | INVITED → EXPIRED or REMOVED |

---

## 20. Large Dataset Performance

| Aspect | Detail |
|--------|--------|
| **Trigger** | Workspace has 100+ screens, 500+ media files, or 1000+ notifications |
| **Affected Flows** | FL-SC-02 (list), FL-MED-01 (grid), FL-NT-01 (list) |
| **UI Behavior** | Server-side pagination (20 per page); search is server-side; virtualization (future) |
| **Recovery** | N/A (handled by pagination) |
| **State** | Normal (just large) |
| **Evidence** | `ux-blueprint/03-component-ux-standards.md` §2, SCL-03 |

### Handling
- Screens list: Server-side pagination (20 per page) + search
- Media grid: Server-side pagination (24 per page) + search
- Notifications: "Load More" pagination (max 50 in memory — SCL-03)
- Admin tables: Server-side pagination + search
- (Future) Virtual scrolling for very large lists

---

## Cross-References

- See `01-flow-principles.md` FP-03 (every failure has recovery), FP-07 (idempotent actions)
- See `02-flow-matrix.md` §4 for risk matrix
- See `04-state-machines.md` for entity states
- See `16-system-flows.md` FL-SYS-01 for system error recovery
- See `product-architecture/13-frontend-state-boundaries.md` for state architecture
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
