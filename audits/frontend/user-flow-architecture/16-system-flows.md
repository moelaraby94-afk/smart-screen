# System Flows

> **Evidence basis:** `ux-blueprint/03-component-ux-standards.md` §3 (search), §5 (command palette), `ux-blueprint/04-feature-ux-standards.md` §1 (notifications), `ux-blueprint/07-overview-ux-blueprint.md` §9 Section 2, `product-architecture/13-frontend-state-boundaries.md`
> **Purpose:** Complete user flow documentation for System Error Recovery, Global Search, Command Palette, and Quick Actions

---

## FL-SYS-01: System Error Recovery

| Field | Value |
|-------|-------|
| Flow ID | FL-SYS-01 |
| Flow Name | System Error Recovery |
| Purpose | Handle system-level errors (API, network, realtime) gracefully |
| Primary User | All users |
| Business Goal | Resilience; user trust |
| User Goal | Recover from errors without losing work |
| Starting Point | Any page (error occurs) |
| Ending Point | User recovers or retries |
| Success Criteria | User understands error and can retry or continue |
| Failure Criteria | Dead end; no recovery; data loss |
| Frequency | Occasional |
| Business Importance | High |
| Complexity | Medium |

### Happy Path (API Error Recovery)

**Step 1: Error occurs**
- Screen: Any page
- Trigger: API returns 500 or network request fails
- System Response: SWR error state; error boundary catches render errors
- UI: Inline error state in affected section: "Something went wrong." + "Retry" button
- State Transition: Loading → Error

**Step 2: User retries**
- User Action: Clicks "Retry" button
- System Response: SWR revalidates the failed request
- Loading: Skeleton or spinner in affected section
- State Transition: Error → Loading → (Success or Error again)

**Step 3: Retry success**
- System Response: API returns 200
- UI: Section renders with data
- State Transition: Loading → Idle (data cached)

### Alternative Paths

**AP-1: Network loss**
- Trigger: Browser loses internet connection
- UI: Toast: "Connection lost. Retrying..." (persistent until connection restored)
- System Response: SWR auto-retries when connection returns
- Recovery: Automatic — no user action needed

**AP-2: Session expired (401)**
- Trigger: API returns 401 (token expired)
- System Response: Clear session; redirect to login
- UI: Toast: "Your session has expired. Please log in again."
- Navigation: Current page → `/login`
- Recovery: User re-logs in; redirected back to previous page (future)

**AP-3: Realtime connection lost (Socket.IO)**
- Trigger: WebSocket disconnects
- UI: Toast: "Real-time connection lost. Reconnecting..."
- System Response: Socket.IO auto-reconnects
- Recovery: Automatic; toast disappears when reconnected

**AP-4: Page not found (404)**
- Trigger: User navigates to non-existent route
- UI: 404 page: "Page not found." + "Go to Overview" button
- Recovery: User clicks button → navigates to `/overview`

**AP-5: Render error (React error boundary)**
- Trigger: Component throws during render
- UI: Error boundary fallback: "Something went wrong." + "Reload" button
- Recovery: User clicks "Reload" → page reloads

### Failure Paths

**FP-1: Retry also fails**
- Trigger: "Retry" clicked but API still fails
- UI: Error state persists; "Retry" button remains
- Recovery: User can retry again or navigate to different page

**FP-2: All retries exhausted**
- Trigger: Multiple retries fail (future: max 3)
- UI: Error state: "Unable to load. Try again later." + "Contact Support" link
- Recovery: User waits and tries later, or contacts support

### Recovery Paths

| Error Type | Recovery | User Action |
|-----------|----------|-------------|
| API 500 | Retry button | Click "Retry" |
| Network loss | Auto-retry | None (automatic) |
| Session expired | Re-login | Log in again |
| Socket.IO disconnect | Auto-reconnect | None (automatic) |
| 404 | Navigate to Overview | Click "Go to Overview" |
| Render error | Reload page | Click "Reload" |

### UX Notes
- Every error has a recovery path — no dead ends (UP-05)
- Network loss is auto-recovered (SWR + Socket.IO auto-retry)
- Session expiry redirects to login with toast (not a dead end)
- Error states are localized to the affected section (not full page) when possible
- "Retry" is always available for API errors
- Error messages are user-friendly (not technical jargon)

---

## FL-SYS-02: Global Search

| Field | Value |
|-------|-------|
| Flow ID | FL-SYS-02 |
| Flow Name | Global Search |
| Purpose | Search across all entities in the workspace |
| Primary User | All users |
| Business Goal | Efficiency; findability |
| User Goal | Find a specific screen, playlist, media, or team member |
| Starting Point | Search input in header (future) |
| Ending Point | Navigate to found entity |
| Success Criteria | User finds target within 10 seconds |
| Failure Criteria | No results; search too slow |
| Frequency | Daily |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path (Future)

**Step 1: Open search**
- Screen: Header (search input)
- User Action: Clicks search input or presses Ctrl+K
- System Response: Search input focuses; dropdown opens
- Micro Interaction: Dropdown opens (MI-01, 150ms)

**Step 2: Type query**
- User Action: Types search query
- System Response: Debounced 300ms; API call to search across entities
- Loading: Spinner in dropdown
- Validation: Minimum 2 characters to trigger search

**Step 3: View results**
- System Response: Results grouped by type (Screens, Playlists, Media, Team)
- UI: Grouped results with icons, names, and type badges
- Micro Interaction: Results fade in (MI-08)

**Step 4: Select result**
- User Action: Clicks result or arrow keys + Enter
- System Response: Navigate to entity detail page
- Navigation: → `/screens/{id}`, `/content/playlists/{id}`, etc.

### Alternative Paths

**AP-1: No results**
- Trigger: Search returns 0 results
- UI: "No results found for '[query]'" + search tips

**AP-2: Search by type**
- (Future) User can filter results by type (tabs or filter chips)

### Failure Paths

**FP-1: Search API failure**
- UI: "Search failed. Try again." in dropdown
- Recovery: User retries

**FP-2: Search timeout**
- Trigger: API takes > 3s
- UI: "Search is taking longer than expected..." + spinner
- If timeout (10s): "Search timed out. Try again."

### Cancellation Path
- User clicks outside dropdown, presses Escape, or clears search → dropdown closes

### Power User Path
- Ctrl+K to open, type query, arrow keys to navigate, Enter to select
- Full keyboard navigation

---

## FL-SYS-03: Command Palette

| Field | Value |
|-------|-------|
| Flow ID | FL-SYS-03 |
| Flow Name | Command Palette |
| Purpose | Quick navigation and actions via keyboard |
| Primary User | Power users (all roles) |
| Business Goal | Efficiency; enterprise UX expectation |
| User Goal | Navigate or perform actions without mouse |
| Starting Point | Any authenticated page (Ctrl+K) |
| Ending Point | Navigate to page or perform action |
| Success Criteria | User finds command within 5 seconds |
| Failure Criteria | No matching commands; palette not responsive |
| Frequency | Daily (power users) |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path (Future)

**Step 1: Open command palette**
- Screen: Any authenticated page
- User Action: Presses Ctrl+K (or Cmd+K on Mac)
- System Response: Command palette overlay opens (centered, modal-style)
- Micro Interaction: Overlay scales in (MI-06, 200ms)
- UI: Search input auto-focused, recent commands shown

**Step 2: Type command or query**
- User Action: Types action name or page name
- System Response: Filters commands and navigation items in real-time
- UI: Grouped results: Navigation (pages), Actions (create, publish), Search (entities)

**Step 3: Select command**
- User Action: Arrow keys to navigate, Enter to select (or click)
- System Response: Execute command or navigate to page
- Navigation: → Selected page or action dialog

### Alternative Paths

**AP-1: Navigate to page**
- User types "screens" → selects "Screens" from Navigation group
- Navigation: → `/screens`

**AP-2: Quick action**
- User types "add screen" → selects "Add Screen" from Actions group
- Navigation: → `/screens/pair`

**AP-3: Search entity**
- User types entity name → selects from Search group
- Navigation: → Entity detail page

### Failure Paths

**FP-1: No matching commands**
- UI: "No commands found" in palette

### Cancellation Path
- User presses Escape or clicks outside → palette closes

### Power User Path
- Ctrl+K, type first few letters, Enter — all keyboard, no mouse
- This IS the power user path

### UX Notes
- Command palette is a power-user feature — not critical for basic flows
- Should include: page navigation, quick actions, and entity search
- Recent commands shown when palette opens with empty query
- Keyboard-first: full navigation without mouse

---

## FL-SYS-04: Quick Actions

| Field | Value |
|-------|-------|
| Flow ID | FL-SYS-04 |
| Flow Name | Quick Actions |
| Purpose | One-click access to primary workflows from Overview |
| Primary User | All users (Owner/Editor: actions; Viewer: read-only) |
| Business Goal | Drive user to action; 5-minute KPI |
| User Goal | Quickly access common actions |
| Starting Point | `/overview` (Quick Actions widget) |
| Ending Point | Navigate to action page |
| Success Criteria | User reaches action page in 1 click |
| Failure Criteria | N/A (navigation only) |
| Frequency | Daily |
| Business Importance | High |
| Complexity | Simple |

### Happy Path

**Step 1: View Overview**
- Screen: `/overview`
- UI: Quick Actions widget with context-aware buttons
- Permission Check: Owner/Editor see all actions; Viewer sees no actions

**Step 2: Click quick action**
- User Action: Clicks "Add Screen", "Create Playlist", or "View Schedule"
- System Response: Navigate to relevant page
- Navigation:
  - "Add Screen" → `/screens/pair` (FL-SC-01)
  - "Create Playlist" → `/content` (FL-PL-01)
  - "View Schedule" → `/scheduling`

### Alternative Paths

**AP-1: Context-aware actions**
- No screens: "Add Screen" is primary
- Has screens, no content: "Create Playlist" is primary
- Has screens and content: all actions shown equally

### UX Notes
- Quick actions are context-aware (depend on workspace state)
- Viewer role: no quick actions shown (read-only)
- Actions are the fastest path to primary workflows (1 click from Overview)

---

## Cross-References

- See `ux-blueprint/03-component-ux-standards.md` §3 for search UX, §5 for command palette UX
- See `ux-blueprint/07-overview-ux-blueprint.md` §9 Section 2 for quick actions
- See `product-architecture/13-frontend-state-boundaries.md` for state boundaries and error handling
- See `18-edge-cases.md` for edge cases including network loss, session expiry, and API failure
