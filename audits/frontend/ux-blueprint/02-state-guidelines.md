# State Guidelines

> **Evidence basis:** `information-architecture/07-page-states.md`, `transformation/23-error-handling-and-states.md`, `product-architecture/15-interaction-principles.md`, `01-ux-principles.md`
> **Purpose:** Define UX guidelines for empty states, loading experience, error experience, and confirmation dialogs

---

## 1. Empty State Guidelines

### 1.1 Empty State Anatomy

Every empty state includes:

| Element | Purpose | Required? |
|---------|---------|-----------|
| Icon | Visual communication of what's missing | Yes |
| Title | What is empty (1-2 words) | Yes |
| Description | Why it's empty and what to do (1-2 sentences) | Yes |
| Primary CTA | Next action to take | Yes (if action exists) |
| Secondary CTA | Alternative action | Optional |
| Illustration | Decorative visual | No (icon suffices) |

### 1.2 Empty State Design Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Centered vertically and horizontally | Consistent placement | — |
| Icon is 48-64px, muted color | Visual but not dominant | — |
| Title is `text-lg font-medium` | Readable but not screaming | — |
| Description is `text-sm text-muted-foreground` | Subordinate to title | — |
| CTA is `default` button variant | Matches primary action pattern | UP-02 |
| No more than 2 CTAs | Prevents choice paralysis | UP-02 |
| Empty state is not an error | Different visual treatment (no red, no warning icon) | `07-page-states.md` §3.1 |

### 1.3 Empty State Variants

| Variant | When | CTA | Example |
|---------|------|-----|---------|
| First-time empty | New workspace, no entities | Create/Add | "No screens yet. Add your first screen." |
| Filtered empty | Filters return no results | Clear filters | "No screens match your filters." |
| Search empty | Search returns no results | Clear search | "No playlists found for 'promo'." |
| Permission empty | User lacks permission to see data | — (no CTA) | "You don't have access to this section." |
| Section empty | Tab/section has no data while others do | Add/Create | "No pending invites." |

### 1.4 Per-Section Empty States

| Section | First-Time Empty | CTA | Filtered Empty | CTA |
|---------|-----------------|-----|----------------|-----|
| Overview | "Welcome! Let's connect your first screen." | "Add Screen" → `/screens/pair` | N/A | N/A |
| Screens | "No screens in this workspace." | "Add Screen" → `/screens/pair` | "No screens match your filters." | "Clear Filters" |
| Content (Playlists) | "No playlists yet. Create your first." | "Create Playlist" | "No playlists found." | "Clear Search" |
| Content (Media) | "No media uploaded yet." | "Upload Media" | "No media found." | "Clear Search" |
| Scheduling | "No schedules created. Scheduling is optional." | "Create Schedule" | "No schedules for this period." | "Navigate to different month" |
| Analytics | "No analytics data yet." | "Add Screen" → `/screens/pair` | "No data for this period." | "Try a different period" |
| Team | "You're the only member." | "Invite Member" | "No members found." | "Clear Search" |
| Notifications | "No notifications." | — | "No [type] notifications." | "Clear Filter" |

**Evidence:** `information-architecture/07-page-states.md` §3.2

---

## 2. Loading Experience Guidelines

### 2.1 Loading Types

| Type | When | Duration | Pattern | Evidence |
|------|------|----------|---------|----------|
| Page loading | Initial page load | < 2s | Skeleton matching page layout | DD-06 |
| Action loading | Button/form submit | < 5s | Button spinner + text change | IP-04 |
| Background refresh | SWR revalidation | < 2s | Subtle indicator (opacity pulse) | — |
| Upload progress | File upload | Variable | Progress bar per file | F-MP-16 |
| Heavy component | Studio load | < 3s | Splash screen with logo | — |

### 2.2 Skeleton Design Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Skeleton matches final layout | No layout shift when data loads | DD-06 |
| Skeleton uses `bg-muted/40` with pulse animation | MI-10 | — |
| Skeleton count matches expected items | 6-8 for grids, 3-5 for lists | — |
| Skeleton includes header/toolbar area | Complete page representation | — |
| No text in skeletons | Just shapes | — |

### 2.3 Action Loading Rules

| Action | Loading UI | Duration | Evidence |
|--------|-----------|----------|----------|
| Form submit | Button: spinner + "Saving..." | Until response | IP-04 |
| Delete confirm | Button: spinner + "Deleting..." | Until response | IP-05 |
| Publish | Button: spinner + "Publishing..." | Until response | — |
| Upload | Per-file progress bar | Until complete | F-MP-16 |
| Search | Search icon → spinner, results area → skeleton | 300ms debounce + fetch | — |
| Pair screen | Wizard: step spinner + "Pairing..." | Until response | — |

### 2.4 Stale Data Indicators

| Scenario | Indicator | Evidence |
|----------|-----------|----------|
| SWR revalidating in background | Subtle opacity pulse on affected area | — |
| Data is stale (revalidateOnFocus for Overview) | No visible indicator (silent refresh) | PC-28 |
| WebSocket reconnected | Toast: "Reconnected" (brief) | DD-07 |
| WebSocket disconnected | Toast: "Connection lost. Retrying..." | DD-07 |

---

## 3. Error Experience Guidelines

### 3.1 Error Types

| Type | When | UI | Recovery | Evidence |
|------|------|-----|----------|----------|
| Toast error | API call fails (non-critical) | Toast (red, 5s or persistent) | "Retry" button in toast | PR-49 |
| Inline error | Form validation fails | Red text below field | User corrects field | IP-08 |
| Page error | Page crash (unhandled) | Error boundary: "Something went wrong" | "Try Again" button | PR-51 |
| 404 error | Page or entity not found | "This page doesn't exist" or "Not found" | "Go to Overview" link | PR-51 |
| 403 error | Permission denied | "You don't have access" | "Go to Overview" link | PC-32 |
| Network error | API unreachable | Toast: "Network error. Check your connection." | "Retry" button | IP-10 |
| Session expired | 401 response | Redirect to login + toast | Login form | `07-workspace-management.md` |

### 3.2 Error Message Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Messages are localized | `toastResponseError` maps codes to EN/AR strings | PR-50 |
| Messages are human-readable | No raw error codes or stack traces | PR-50 |
| Messages are actionable | Tell user what to do, not just what went wrong | IP-10 |
| No blame language | "Something went wrong" not "You made an error" | — |
| Errors are not scary | Red is used sparingly; not full-screen red | — |

### 3.3 Error Recovery Patterns

| Error | Recovery Action | Evidence |
|-------|----------------|----------|
| API fetch error | "Retry" button → SWR refetch | IP-10 |
| Form submit error | Toast + form stays open + user can retry | — |
| Upload error | Per-file error indicator + "Retry Upload" | — |
| Studio save error | Toast: "Failed to save. Try again." + Save button stays active | — |
| Page crash | "Try Again" → page reload | PR-51 |
| 404 | "Go to Overview" link | PR-51 |
| Session expired | Auto-redirect to login | — |

### 3.4 Error Boundary Design

```
┌──────────────────────────────────────┐
│                                      │
│         [Alert Triangle Icon]         │
│                                      │
│      Something went wrong             │
│                                      │
│   An unexpected error occurred.       │
│   Your data is safe.                  │
│                                      │
│      [Try Again]  [Go to Overview]    │
│                                      │
└──────────────────────────────────────┘
```

- Icon: `AlertTriangle` (Lucide), 48px, `text-destructive`
- Title: `text-lg font-medium`
- Description: `text-sm text-muted-foreground`
- Buttons: `default` (Try Again) + `outline` (Go to Overview)
- Centered in available space
- No error details visible to user (logged to Sentry)

---

## 4. Confirmation Dialog Guidelines

### 4.1 When to Use Confirmation

| Action | Confirm? | Dialog Type | Evidence |
|--------|----------|-------------|----------|
| Delete entity | Yes | AlertDialog | PR-20, UP-09 |
| Remove team member | Yes | AlertDialog | PR-20 |
| Emergency override | Yes | AlertDialog | — |
| Delete workspace | Yes (double confirm) | AlertDialog | — |
| Publish playlist | No (immediate action) | — | PR-25 |
| Create entity | No (immediate action) | — | — |
| Save form | No (immediate action) | — | — |
| Cancel form with unsaved changes | Yes (future) | AlertDialog | — |
| Logout | No | — | — |
| Switch workspace | No (immediate) | — | DD-04 |

### 4.2 Confirmation Dialog Anatomy

```
┌──────────────────────────────────────┐
│  Delete Screen A?                     │
│                                      │
│  This will remove Screen A from all   │
│  schedules. 3 schedules will be       │
│  affected. This action cannot be      │
│  undone.                              │
│                                      │
│         [Cancel]  [Delete]            │
└──────────────────────────────────────┘
```

| Element | Rule | Evidence |
|---------|------|----------|
| Title | Question format: "Delete [Name]?" | UP-09 |
| Description | What will be lost + impact count + "cannot be undone" | UP-09 |
| Cancel button | `outline` variant, left (LTR) / start | — |
| Confirm button | `destructive` variant (red), right (LTR) / end | UP-09 |
| No "Don't show again" option | Confirmations are always required for destructive actions | — |
| Focus | Cancel button receives initial focus (safe default) | ACC-02 |

### 4.3 Double Confirmation (Workspace Delete)

For extremely destructive actions (workspace deletion):

1. First dialog: "Delete [Workspace Name]? ALL data will be permanently lost."
2. User types workspace name to confirm: "Type '[Workspace Name]' to confirm"
3. Second dialog: "Are you absolutely sure? This cannot be undone."
4. Confirm button enabled only when typed name matches

---

## 5. Success Feedback Guidelines

### 5.1 Success Toast Rules

| Action | Toast Message (EN) | Duration | Evidence |
|--------|-------------------|----------|----------|
| Create entity | "[Entity] created successfully" | 5s | IP-04 |
| Update entity | "[Entity] updated successfully" | 5s | — |
| Delete entity | "[Entity] deleted successfully" | 5s | — |
| Publish playlist | "Playlist published to [N] screens" | 5s | — |
| Pair screen | "Screen paired successfully" | 5s | — |
| Invite member | "Invitation sent to [email]" | 5s | — |
| Upload media | "[N] files uploaded successfully" | 5s | — |
| Save settings | "Settings saved" | 3s | — |

### 5.2 Success with Next-Step CTA

After major successes, the toast or page includes a next-step CTA:

| Success | Next-Step CTA | Evidence |
|---------|--------------|----------|
| Screen paired | "Assign content to your screen" → `/content` | PR-20, IP-07 |
| Playlist created | "Publish to screens" → playlist detail | PR-20 |
| Playlist published | "View on screen" → `/screens/{id}` | PR-20 |
| Member invited | "Invite another" → invite dialog | — |

---

## Cross-References

- See `01-ux-principles.md` for UX principles
- See `03-component-ux-standards.md` for component UX
- See `information-architecture/07-page-states.md` for per-page state definitions
- See `transformation/23-error-handling-and-states.md` for error handling strategy
- See `product-architecture/15-interaction-principles.md` for interaction principles
