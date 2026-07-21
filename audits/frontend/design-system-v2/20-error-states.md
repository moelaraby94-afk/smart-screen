# 20 — Error States

> **Evidence basis:** `01-foundations.md`, `06-illustration-rules.md`, `05-iconography.md`, `09-interaction-states.md`, `ux-blueprint/02-state-guidelines.md`, `screen-specifications/02-auth-error-specs.md`, `screen-specifications/` (all files have error states)

---

## 1. Error Philosophy

Errors are inevitable. Smart Screen handles errors gracefully with clear messaging, actionable guidance, and easy recovery. Every error state tells the user: **what happened, why, and what to do next.**

---

## 2. Error Components

### Component: ErrorState

#### Purpose
Display error message with recovery action when data fails to load.

#### Usage
- API failure on page load
- Section-level error (widget, table, list)
- Entity not found

#### When to Use
- Data fetch fails (network error, server error)
- Entity not found (404 for specific resource)
- Permission denied (403)

#### When NOT to Use
- Form validation errors (use inline FormError)
- Action failures (use Toast)
- Loading state (use Skeleton)

#### Variants

| Variant | Usage |
|---------|-------|
| `default` | Generic error (API failure) |
| `notFound` | Entity not found (404) |
| `permission` | Permission denied (403) |
| `offline` | Network offline |
| `server` | Server error (500) |

#### Structure

```
<ErrorState>
  <ErrorStateIcon icon={AlertCircle} />
  <ErrorStateTitle>Failed to load screens</ErrorStateTitle>
  <ErrorStateDescription>Something went wrong. Try again.</ErrorStateDescription>
  <ErrorStateAction>
    <Button variant="outline" onClick={retry}>Retry</Button>
  </ErrorStateAction>
</ErrorState>
```

#### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Container | Centered, `py-12` | — |
| Icon | 48px (`--icon-3xl`), `--destructive` or `--warning` | `06-illustration-rules.md` |
| Title | `--text-lg --font-semibold --foreground` | — |
| Description | `--text-sm --font-normal --muted-foreground` | — |
| Action | "Retry" button (outline variant) | `12-button-specifications.md` |
| Gap | `--space-3` between elements | — |

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | `AlertCircle` | Icon component |
| `title` | `string` | — | Error title (required) |
| `description` | `string` | — | Error description |
| `action` | `ReactNode` | — | Recovery action (Retry button) |
| `variant` | `default \| notFound \| permission \| offline \| server` | `default` | Error type |

#### Variant Details

##### `default` (API failure)
- **Icon:** `AlertCircle` (48px, `--destructive`)
- **Title:** "Failed to load [items]"
- **Description:** "Something went wrong. Try again."
- **Action:** "Retry" button (outline)

##### `notFound` (404)
- **Icon:** None (large "404" text instead, `--text-4xl --muted-foreground`)
- **Title:** "Page not found"
- **Description:** "The page you're looking for doesn't exist or has been moved."
- **Action:** "Go Home" button (default)

##### `permission` (403)
- **Icon:** `Lock` (48px, `--muted-foreground`)
- **Title:** "You don't have permission to view this"
- **Description:** "Contact your workspace owner for access."
- **Action:** "Go Back" button (outline)

##### `offline`
- **Icon:** `CloudOff` (48px, `--muted-foreground`)
- **Title:** "You're offline"
- **Description:** "Check your internet connection and try again."
- **Action:** "Retry" button (outline)

##### `server` (500)
- **Icon:** `AlertTriangle` (48px, `--warning`)
- **Title:** "Server error"
- **Description:** "Something went wrong on our end. We're working on it."
- **Action:** "Retry" button (outline)

#### Catalog of Error States

| Screen | Title | Description | Action | Evidence |
|--------|-------|-------------|--------|----------|
| Screens List | "Failed to load screens" | "Something went wrong. Try again." | "Retry" | `04-screens-specs.md` |
| Screen Detail (not found) | "Screen not found" | "This screen doesn't exist or has been deleted." | "Back to Screens" | `04-screens-specs.md` |
| Playlists | "Failed to load playlists" | "Something went wrong. Try again." | "Retry" | `05-content-specs.md` |
| Media | "Failed to load media" | "Something went wrong. Try again." | "Retry" | `05-content-specs.md` |
| Playlist Detail (not found) | "Playlist not found" | "This playlist doesn't exist or has been deleted." | "Back to Content" | `05-content-specs.md` |
| Studio (load failure) | "Studio failed to load" | "Try refreshing the page." | "Reload" | `06-studio-spec.md` |
| Scheduling | "Failed to load schedules" | "Something went wrong. Try again." | "Retry" | `07-scheduling-analytics-specs.md` |
| Analytics | "Failed to load analytics" | "Something went wrong. Try again." | "Retry" | `07-scheduling-analytics-specs.md` |
| Team | "Failed to load team" | "Something went wrong. Try again." | "Retry" | `08-team-spec.md` |
| Settings | "Failed to load settings" | "Something went wrong. Try again." | "Retry" | `09/10-settings-specs.md` |
| Admin (all) | "Failed to load [items]" | "Something went wrong. Try again." | "Retry" | `11/12-admin-specs.md` |
| 404 page | "Page not found" | "The page you're looking for doesn't exist." | "Go Home" | `02-auth-error-specs.md` |
| Permission Denied | "Access denied" | "You don't have permission to view this page." | "Go Back" | `02-auth-error-specs.md` |
| Error Boundary | "Something went wrong" | "An unexpected error occurred. Try refreshing." | "Reload" | `02-auth-error-specs.md` |

#### Accessibility
- Container: `role="alert"` (announces to screen readers)
- Icon: `aria-hidden="true"` (decorative)
- Title: Semantic heading (`<h2>`) in page context
- Action: Standard button accessibility

#### Animations
- Mount: MI-08 (300ms, fade in up)
- No loop animations

#### Anti-Patterns
- **Error without recovery** — always provide "Retry" or navigation action
- **Technical error message** — never show stack traces or HTTP codes to users
- **Error as toast for page load** — page-level errors need page-level error state
- **Blank screen on error** — always show ErrorState
- **Error without icon** — visual indicator helps quick recognition

#### Acceptance Criteria
- [ ] All 5 variants render with correct icon and colors
- [ ] Title uses `--text-lg --font-semibold`
- [ ] Description uses `--text-sm --muted-foreground`
- [ ] "Retry" button present (where applicable)
- [ ] `role="alert"` on container
- [ ] Icon has `aria-hidden="true"`
- [ ] Mount animation: MI-08 (fade in up, 300ms)
- [ ] No technical jargon in error messages

---

### Component: ErrorBoundary

#### Purpose
Catch React render errors and display fallback UI.

#### Usage
- App-level error boundary (catches all uncaught render errors)
- Widget-level error boundaries (future — isolates widget errors)

#### Fallback UI
- Full-page: "Something went wrong" + "Reload" button
- Widget-level: "This widget failed to load" + "Retry" (future)

#### Evidence
`screen-specifications/02-auth-error-specs.md` — Error Boundary

---

### Component: OfflineBanner

#### Purpose
Banner shown when network connectivity is lost.

#### Visual
- Position: Top of main content (below header)
- Background: `--warning/10`
- Border: `--warning` (bottom, 1px)
- Text: "You're offline. Some features may be unavailable."
- Icon: `CloudOff` (16px, `--warning`)

#### Behavior
- Shows when `navigator.onLine` is `false`
- Hides when connection restored
- Animation: Slide down (MI-15, 200ms)

---

## 3. Error Handling Rules

| Error Type | Display | Recovery | Evidence |
|------------|---------|----------|----------|
| Page load failure | ErrorState (full section) | "Retry" button | All specs |
| Entity not found | ErrorState (notFound) | "Back to [section]" | Detail pages |
| Permission denied | ErrorState (permission) | "Go Back" | All specs |
| Form validation | Inline FormError | User corrects field | `14-form-standards.md` |
| Action failure | Toast (destructive) | Manual retry | `24-toast-standards.md` |
| Network offline | OfflineBanner | Auto-recover on reconnect | — |
| Render error | ErrorBoundary fallback | "Reload" button | `02-auth-error-specs.md` |
| API 401 | Redirect to Login | Auto-redirect | `02-auth-error-specs.md` |
| API 429 | Toast: "Too many requests" | Wait and retry | — |

---

## Cross-References

- See `01-foundations.md` for color tokens
- See `06-illustration-rules.md` for illustration style
- See `09-interaction-states.md` for error state styling
- See `18-empty-states.md` for empty (not error) states
- See `21-success-states.md` for success states
- See `24-toast-standards.md` for error toast
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
- See `screen-specifications/02-auth-error-specs.md` for error page specs
