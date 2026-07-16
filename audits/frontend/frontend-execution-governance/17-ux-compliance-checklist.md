# 17 — UX Compliance Checklist

> **Status:** FINAL — UX rule verification per feature

---

## 1. Purpose

Verifies that every feature implementation complies with the UX Blueprint rules. This checklist is completed during self-audit and verified during PR review.

---

## 2. UX Principles Compliance

Reference: `ux-blueprint/01-ux-principles.md`

- [ ] **Clarity** — UI is clear and unambiguous; no jargon
- [ ] **Feedback** — Every user action provides immediate feedback
- [ ] **Efficiency** — Common tasks are fast (minimize clicks)
- [ ] **Consistency** — Same patterns used across the application
- [ ] **Error prevention** — Validation prevents errors before submission
- [ ] **Error recovery** — Errors have clear recovery paths
- [ ] **Progressive disclosure** — Complex options hidden until needed
- [ ] **Recognition over recall** — Options visible, not hidden in memory

---

## 3. State Guidelines Compliance

Reference: `ux-blueprint/02-state-guidelines.md`, `design-system-v2/09-interaction-states.md`

### 3.1 Loading States
- [ ] Loading state shows within 200ms of action
- [ ] Skeleton matches content layout (no layout shift)
- [ ] Spinner used for button loading
- [ ] Splash used for full-page loading (Studio)
- [ ] Loading state is visually distinct from content

### 3.2 Empty States
- [ ] Empty state has icon (48px)
- [ ] Empty state has title (specific, not "No data")
- [ ] Empty state has description (helpful, actionable)
- [ ] Empty state has CTA button (where applicable)
- [ ] Empty state variant correct (default, filtered, permission)

### 3.3 Error States
- [ ] Error state has icon
- [ ] Error state has title (specific, not "Error")
- [ ] Error state has description (user-friendly, no jargon)
- [ ] Error state has "Retry" button (for retryable errors)
- [ ] Error variant correct (default, notFound, permission, offline, server)

### 3.4 Success States
- [ ] Success feedback via Toast (not inline)
- [ ] Toast message is specific ("Screen deleted", not "Success")
- [ ] Toast variant correct (success)
- [ ] Toast auto-dismisses (3s for success, 5s for error)
- [ ] Toast has action button (where applicable, e.g., "Undo")

### 3.5 Interaction States
- [ ] Default state: correct appearance
- [ ] Hover state: visual feedback (150ms transition)
- [ ] Focus state: visible focus ring
- [ ] Active/Press state: scale or color change (100ms)
- [ ] Disabled state: opacity 50%, not-allowed cursor
- [ ] Selected state: visible selection indicator

---

## 4. Component UX Standards Compliance

Reference: `ux-blueprint/03-component-ux-standards.md`

### 4.1 Buttons
- [ ] Primary action uses `variant="default"`
- [ ] Secondary action uses `variant="outline"`
- [ ] Destructive action uses `variant="destructive"`
- [ ] Tertiary action uses `variant="ghost"`
- [ ] Only ONE primary button per section
- [ ] Button labels are action-oriented ("Save", not "OK")
- [ ] Icon-only buttons have `aria-label`

### 4.2 Forms
- [ ] Labels above inputs (not inline)
- [ ] Required fields marked with `*`
- [ ] Helper text below input (before error)
- [ ] Error messages are specific ("Enter a valid email", not "Invalid")
- [ ] Submit button shows loading state during submission
- [ ] Cancel button present (for non-trivial forms)
- [ ] Unsaved changes warning (for complex forms)
- [ ] Validation: on blur for fields, on submit for form

### 4.3 Tables
- [ ] Column headers are sortable (where applicable)
- [ ] Sort indicator visible
- [ ] Row hover highlights
- [ ] Row click navigates (where applicable)
- [ ] Bulk selection with checkboxes (where applicable)
- [ ] Pagination at bottom
- [ ] Empty state when no rows
- [ ] Loading skeleton when fetching

### 4.4 Dialogs
- [ ] Dialog title is descriptive
- [ ] Dialog has description (for complex dialogs)
- [ ] Cancel button on left, Confirm on right
- [ ] Confirm button uses correct variant (destructive for delete)
- [ ] Dialog closes on Escape
- [ ] Dialog closes on overlay click (except for unsaved changes)
- [ ] Focus trap active
- [ ] Focus returns to trigger on close

---

## 5. Page Type UX Rules Compliance

Reference: `ux-blueprint/05-page-type-ux-rules.md`

### 5.1 List Pages
- [ ] Page header with title and primary action
- [ ] Filter toolbar (search + filters + sort)
- [ ] Content grid or table
- [ ] Pagination (for server-side paginated data)
- [ ] Empty state when no data
- [ ] No results state when filtered to empty

### 5.2 Detail Pages
- [ ] Breadcrumbs back to list
- [ ] Page header with title and actions
- [ ] Content sections with clear headings
- [ ] Edit/Delete actions accessible
- [ ] Not found state for invalid IDs

### 5.3 Dashboard Pages
- [ ] Summary metrics at top
- [ ] Widgets in grid
- [ ] Quick actions accessible
- [ ] Recent activity visible
- [ ] Onboarding for first-time users

### 5.4 Settings Pages
- [ ] Tab navigation
- [ ] One form per tab
- [ ] Save button per form
- [ ] Success toast on save
- [ ] Unsaved changes warning

### 5.5 Wizard Pages
- [ ] Step indicator visible
- [ ] Next/Back buttons
- [ ] Validation per step
- [ ] Progress visible
- [ ] Cancel option

---

## 6. Feature UX Standards Compliance

Reference: `ux-blueprint/04-feature-ux-standards.md`

### 6.1 Screen Management
- [ ] Screen cards show: name, status, thumbnail, location
- [ ] Bulk actions bar appears on selection
- [ ] Pairing wizard has clear steps
- [ ] Screen detail has tabs (Overview, Content, Schedule, Settings)
- [ ] Real-time status updates visible

### 6.2 Content Management
- [ ] Playlists and Media in separate tabs
- [ ] Playlist cards show: name, status, media count, thumbnail
- [ ] Media cards show: thumbnail, filename, type, size
- [ ] Upload via drag-and-drop and browse
- [ ] Upload progress visible
- [ ] Template picker for new playlists

### 6.3 Studio
- [ ] Three-panel layout (Media | Canvas | Properties)
- [ ] Toolbar with Save, Preview, Undo/Redo
- [ ] Layer list/timeline
- [ ] Properties panel updates on selection
- [ ] Preview overlay for full-screen preview
- [ ] Desktop-only message on mobile

### 6.4 Scheduling
- [ ] Calendar grid with events
- [ ] Month navigation
- [ ] Click event to edit
- [ ] Create schedule dialog with playlist, screen, date/time
- [ ] Conflict detection and warning
- [ ] Color-coded by playlist

### 6.5 Team
- [ ] Member list with role, avatar, email
- [ ] Pending invites section
- [ ] Role change via dropdown
- [ ] Invite dialog with email and role
- [ ] Remove confirmation dialog

### 6.6 Settings
- [ ] Tab navigation (Profile, Workspace, Billing, Security, API, Notifications)
- [ ] Role-based tab visibility
- [ ] Form-based settings with Save
- [ ] 2FA setup flow
- [ ] API key creation with masked display

---

## 7. User Flow Compliance

Reference: `user-flow-architecture/01-flow-principles.md`

- [ ] Feature entry points match user flow
- [ ] Feature exit points match user flow
- [ ] Decision trees followed
- [ ] State machines followed
- [ ] Error paths handled
- [ ] Edge cases handled (per `user-flow-architecture/18-edge-cases.md`)
- [ ] No undocumented user paths added

---

## 8. Navigation Compliance

Reference: `information-architecture/05-navigation-architecture.md`

- [ ] Navigation matches IA sitemap
- [ ] Sidebar items match IA
- [ ] Breadcrumbs match page hierarchy
- [ ] Route structure matches IA
- [ ] No undocumented routes
- [ ] No undocumented navigation paths

---

## 9. Onboarding Compliance

Reference: `user-flow-architecture/17-onboarding-flows.md`, `ux-blueprint/07-overview-ux-blueprint.md`

- [ ] First-time user sees onboarding
- [ ] Onboarding card on empty workspace
- [ ] 5-minute KPI flow accessible
- [ ] Onboarding steps are clear and actionable
- [ ] Onboarding dismissible
- [ ] Onboarding progress tracked (future)

---

## 10. UX Compliance Sign-Off

- [ ] All UX principles verified
- [ ] All state guidelines verified
- [ ] All component UX standards verified
- [ ] All page type UX rules verified
- [ ] All feature UX standards verified
- [ ] User flow compliance verified
- [ ] Navigation compliance verified
- [ ] Onboarding compliance verified
- [ ] No UX deviations from documentation
- [ ] Ready for PR submission

---

## Cross-References

- See `16-screen-compliance-checklist.md` for screen compliance
- See `18-accessibility-compliance.md` for accessibility
- See `19-responsive-compliance.md` for responsive
- See `22-self-audit-process.md` for self-audit
- See `ux-blueprint/01-ux-principles.md` for UX principles
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
- See `ux-blueprint/03-component-ux-standards.md` for component UX
- See `ux-blueprint/04-feature-ux-standards.md` for feature UX
- See `ux-blueprint/05-page-type-ux-rules.md` for page type rules
