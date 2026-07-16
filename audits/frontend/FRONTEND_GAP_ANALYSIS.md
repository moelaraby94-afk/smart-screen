# Frontend Gap Analysis

> **Phase:** Analysis Only — No code modifications
> **Date:** July 2026
> **Scope:** Entire dashboard frontend

---

## 1. Information Architecture

### IA-01: Duplicated Content Routes
- **Severity:** Critical
- **Category:** IA
- **Screen:** /content, /playlists, /media, /studio, /templates
- **Current Behavior:** `/content` is a tabbed page with Playlists, Media, Studio, Templates tabs. But `/playlists`, `/media`, `/studio`, `/templates` also exist as standalone routes rendering the same components.
- **Expected Behavior:** Single canonical route per entity.
- **Business Impact:** SEO confusion, analytics dilution, maintenance burden
- **User Impact:** Same page looks different depending on entry point
- **Technical Impact:** Double maintenance, inconsistent headers
- **Recommended Solution:** Redirect standalone routes to `/content?tab=X` or remove `/content` and keep standalone routes
- **Estimated Effort:** 4h
- **Priority:** P1

### IA-02: Settings Tab Count Mismatch
- **Severity:** High
- **Category:** IA
- **Screen:** /settings/*
- **Current Behavior:** 3 tabs (Profile, Workspace, Billing). IA spec defines 6 (Profile, Workspace, Billing, Security, API Keys, Notifications). 2FA and Notification Preferences embedded in Profile. API Keys in /api-docs.
- **Expected Behavior:** 6 separate settings tabs per IA spec
- **Business Impact:** Security settings hidden; API keys hard to find
- **User Impact:** Can't find 2FA or API keys in settings
- **Technical Impact:** Profile page overloaded
- **Recommended Solution:** Add Security, Notifications, API Keys tabs
- **Estimated Effort:** 6h
- **Priority:** P1

### IA-03: Onboarding Links Use Old Routes
- **Severity:** Medium
- **Category:** IA
- **Screen:** Onboarding widget
- **Current Behavior:** Step links point to `/media`, `/playlists`, `/schedules` — old routes that redirect
- **Expected Behavior:** Links to canonical routes
- **Business Impact:** Extra redirects
- **User Impact:** Confusing redirects during onboarding
- **Technical Impact:** Relies on redirect chains
- **Recommended Solution:** Update hrefs to canonical routes
- **Estimated Effort:** 1h
- **Priority:** P2

### IA-04: Emergency and AI Pages Not Discoverable
- **Severity:** Medium
- **Category:** IA
- **Screen:** /emergency, /ai
- **Current Behavior:** Routes exist but not in 7-item sidebar. Old nav arrays (FLEET_NAV, INSIGHTS_NAV) reference them but aren't rendered.
- **Expected Behavior:** Accessible from Screens page or Overview
- **Business Impact:** Features exist but undiscoverable
- **User Impact:** Can't access emergency broadcast or AI tools
- **Technical Impact:** Dead nav arrays in code
- **Recommended Solution:** Add as quick-actions or tabs
- **Estimated Effort:** 4h
- **Priority:** P2

### IA-05: Branches Page Outside IA Spec
- **Severity:** Medium
- **Category:** IA
- **Screen:** /branches
- **Current Behavior:** Exists and linked from Overview. IA spec says branches are a filter within Screens (DD-03).
- **Expected Behavior:** Branch management integrated into Screens
- **Business Impact:** Inconsistent with IA decision
- **User Impact:** Two places for branch info
- **Technical Impact:** Extra route maintenance
- **Recommended Solution:** Integrate into Screens or document as exception
- **Estimated Effort:** 8h
- **Priority:** P3

### IA-06: Dead Navigation Arrays
- **Severity:** Low
- **Category:** Code Quality
- **Screen:** ShellSidebar
- **Current Behavior:** OVERVIEW_NAV, FLEET_NAV, CONTENT_NAV, PLAYBACK_NAV, INSIGHTS_NAV, MANAGEMENT_NAV defined but unused
- **Expected Behavior:** Remove dead code
- **Business Impact:** None
- **User Impact:** None
- **Technical Impact:** Developer confusion
- **Recommended Solution:** Remove unused arrays
- **Estimated Effort:** 1h
- **Priority:** P3

---

## 2. User Journey

### UJ-01: Pair Screen — No Feedback During Wait
- **Severity:** High
- **Category:** User Journey
- **Screen:** Screen Setup Modal
- **Current Behavior:** After entering pairing code, user waits with progress banner but no estimated time or troubleshooting
- **Expected Behavior:** Show estimated wait, troubleshooting tips, cancel button
- **Business Impact:** Support tickets from confused users
- **User Impact:** Anxiety during pairing wait
- **Technical Impact:** None
- **Recommended Solution:** Add progressive feedback with tips
- **Estimated Effort:** 4h
- **Priority:** P1

### UJ-02: Upload Media — No Storage Limit Warning
- **Severity:** High
- **Category:** User Journey
- **Screen:** Media Library
- **Current Behavior:** Upload accepts files without checking storage limits
- **Expected Behavior:** Pre-upload storage check; warn when approaching limit
- **Business Impact:** Failed uploads waste bandwidth
- **User Impact:** Frustration from failed uploads
- **Technical Impact:** Client-side pre-validation needed
- **Recommended Solution:** Add pre-upload storage check and usage indicator
- **Estimated Effort:** 4h
- **Priority:** P1

### UJ-03: Create Playlist — Empty Studio Confusion
- **Severity:** Medium
- **Category:** User Journey
- **Screen:** Playlist Studio Editor
- **Current Behavior:** New playlist opens empty editor with no guidance
- **Expected Behavior:** Empty state with "Drag media to start" guidance
- **Business Impact:** Users abandon playlist creation
- **User Impact:** Don't know how to add content
- **Technical Impact:** None
- **Recommended Solution:** Add empty-state onboarding tooltip
- **Estimated Effort:** 2h
- **Priority:** P2

### UJ-04: Schedule Creation — No Conflict Preview
- **Severity:** Medium
- **Category:** User Journey
- **Screen:** Scheduling
- **Current Behavior:** No conflict detection during form fill; only after save
- **Expected Behavior:** Real-time conflict preview
- **Business Impact:** Users create conflicting schedules
- **User Impact:** Content doesn't play as expected
- **Technical Impact:** Needs client-side overlap calculation
- **Recommended Solution:** Add live conflict preview
- **Estimated Effort:** 6h
- **Priority:** P2

### UJ-05: Team Invite — No Role Explanation
- **Severity:** Medium
- **Category:** User Journey
- **Screen:** Team
- **Current Behavior:** Role dropdown shows names but no descriptions
- **Expected Behavior:** Role descriptions or tooltip
- **Business Impact:** Wrong role assignments; security issues
- **User Impact:** Uncertainty about permissions granted
- **Technical Impact:** None
- **Recommended Solution:** Add role description tooltip
- **Estimated Effort:** 2h
- **Priority:** P2

### UJ-06: Billing — No Upgrade Guidance
- **Severity:** Low
- **Category:** User Journey
- **Screen:** Settings → Billing
- **Current Behavior:** Shows current plan but upgrade path unclear
- **Expected Behavior:** Clear upgrade CTA with plan comparison
- **Business Impact:** Lost upgrade revenue
- **User Impact:** Can't easily upgrade
- **Technical Impact:** None
- **Recommended Solution:** Add plan comparison and upgrade CTA
- **Estimated Effort:** 4h
- **Priority:** P3

---

## 3. Screen-by-Screen

### SC-01: Overview — Hardcoded Color Classes
- **Severity:** Medium | **Category:** Design System | **Screen:** /overview
- **Current Behavior:** TotalsSection uses `from-violet-600/20`, `bg-blue-500/15`, `text-emerald-400` instead of semantic tokens
- **Expected Behavior:** Use semantic tokens (`text-primary`, `bg-success/15`)
- **Business Impact:** Inconsistent theming | **User Impact:** Visual inconsistency in dark mode
- **Technical Impact:** Can't retheme | **Estimated Effort:** 3h | **Priority:** P2

### SC-02: Overview — Non-Brand Gradient Colors
- **Severity:** Low | **Category:** Design System | **Screen:** /overview
- **Current Behavior:** Hero uses `bg-violet-500/10`, `bg-cyan-500/8`, `bg-pink-500/5`
- **Expected Behavior:** Brand-aligned blue/primary gradients
- **Business Impact:** Brand inconsistency | **User Impact:** Subtle visual disconnect
- **Technical Impact:** None | **Estimated Effort:** 1h | **Priority:** P3

### SC-03: Screens List — No Virtualization
- **Severity:** Medium | **Category:** Performance | **Screen:** /screens
- **Current Behavior:** All screen cards render at once. 200+ screens causes lag.
- **Expected Behavior:** Virtualized list or pagination for 50+ items
- **Business Impact:** Enterprise customers experience lag | **User Impact:** Slow page load
- **Technical Impact:** DOM overload | **Estimated Effort:** 6h | **Priority:** P2

### SC-04: Screen Detail — Native Select Instead of Design System
- **Severity:** Medium | **Category:** Component Consistency | **Screen:** /screens/[screenId]
- **Current Behavior:** Branch dropdown uses raw `<select>` with custom classes
- **Expected Behavior:** Use `@/components/ui/select`
- **Business Impact:** Visual inconsistency | **User Impact:** Different dropdown behavior
- **Technical Impact:** Bypasses design system | **Estimated Effort:** 2h | **Priority:** P2

### SC-05: Analytics — Hardcoded Status Colors
- **Severity:** Medium | **Category:** Design System | **Screen:** /analytics
- **Current Behavior:** STATUS_COLORS/STATUS_TEXT use `bg-emerald-500`, `text-red-600` instead of semantic tokens
- **Expected Behavior:** Use `bg-success`, `text-destructive`, `bg-warning`
- **Business Impact:** Inconsistent theming | **User Impact:** Dark mode mismatch
- **Technical Impact:** Can't retheme | **Estimated Effort:** 2h | **Priority:** P2

### SC-06: Team — No Empty State
- **Severity:** Medium | **Category:** UX | **Screen:** /team
- **Current Behavior:** Empty table with no guidance when no members
- **Expected Behavior:** Empty state with "Invite your first team member" CTA
- **Business Impact:** Low team adoption | **User Impact:** Don't know what to do
- **Technical Impact:** None | **Estimated Effort:** 2h | **Priority:** P2

### SC-07: Settings Profile — Page Too Long
- **Severity:** Medium | **Category:** UX | **Screen:** /settings/profile
- **Current Behavior:** Profile, password, 2FA, notifications, GDPR all on one page
- **Expected Behavior:** Separate into tabs or sections
- **Business Impact:** Settings discoverability | **User Impact:** Hard to find settings
- **Technical Impact:** Large component | **Estimated Effort:** 6h | **Priority:** P2

### SC-08: Content Tabs — No URL Sync
- **Severity:** Medium | **Category:** UX | **Screen:** /content
- **Current Behavior:** Tab selection not synced to URL; refresh returns to Playlists
- **Expected Behavior:** URL reflects active tab for bookmarking
- **Business Impact:** Can't share direct links | **User Impact:** Lose context on refresh
- **Technical Impact:** None | **Estimated Effort:** 2h | **Priority:** P2

---

## 4. Components

### CP-01: No Pagination Component
- **Severity:** Medium | **Category:** Missing Component | **Screen:** All lists
- **Current Behavior:** No reusable Pagination in `components/ui/`. Media has own "Load More". Screens has none.
- **Expected Behavior:** Reusable Pagination component
- **Business Impact:** Inconsistent list navigation | **User Impact:** Different patterns per page
- **Technical Impact:** Duplicated logic | **Estimated Effort:** 4h | **Priority:** P2

### CP-02: No Search/Filter Bar Component
- **Severity:** Medium | **Category:** Missing Component | **Screen:** All lists
- **Current Behavior:** Each list page implements own search/filter with different styling
- **Expected Behavior:** Reusable `ListToolbar` component
- **Business Impact:** Inconsistent filter UX | **User Impact:** Different behavior per page
- **Technical Impact:** Duplicated code | **Estimated Effort:** 6h | **Priority:** P2

### CP-03: No Chart Component
- **Severity:** Low | **Category:** Missing Component | **Screen:** Analytics
- **Current Behavior:** Uses static divs for bars. No charting library.
- **Expected Behavior:** Reusable chart components
- **Business Impact:** Limited analytics | **User Impact:** Basic visualization
- **Technical Impact:** Custom div charts | **Estimated Effort:** 8h | **Priority:** P3

### CP-04: EmptyState Underutilized
- **Severity:** Medium | **Category:** Consistency | **Screen:** Multiple
- **Current Behavior:** Component exists but many pages use ad-hoc empty messages
- **Expected Behavior:** All empty states use shared component
- **Business Impact:** Inconsistent UX | **User Impact:** Different appearance
- **Technical Impact:** Duplicated logic | **Estimated Effort:** 3h | **Priority:** P2

### CP-05: Skeleton Patterns Underutilized
- **Severity:** Medium | **Category:** Consistency | **Screen:** Multiple
- **Current Behavior:** `CardGridSkeleton` and `TableSkeleton` exist but many pages use text loading
- **Expected Behavior:** All loading states use skeleton patterns
- **Business Impact:** Inconsistent loading UX | **User Impact:** Different appearance
- **Technical Impact:** Duplicated logic | **Estimated Effort:** 4h | **Priority:** P2

---

## 5. Design System

### DS-01: Duplicate --accent Token
- **Severity:** Medium | **Category:** Design System | **Screen:** Global
- **Current Behavior:** `--accent` defined twice in `:root` — line 46 as Blue-600, line 56 as Blue-50. Second overrides first.
- **Expected Behavior:** Single definition
- **Business Impact:** Unpredictable accent color | **User Impact:** Visual inconsistency
- **Technical Impact:** CSS cascade bug | **Estimated Effort:** 0.5h | **Priority:** P1

### DS-02: Legacy CSS Classes
- **Severity:** Low | **Category:** Design System | **Screen:** Global
- **Current Behavior:** `.vc-btn-primary`, `.vc-table-row`, `.vc-glass` etc. alongside Tailwind design system
- **Expected Behavior:** Remove or deprecate
- **Business Impact:** None | **User Impact:** None
- **Technical Impact:** CSS bloat | **Estimated Effort:** 3h | **Priority:** P3

### DS-03: No Responsive Typography Scale
- **Severity:** Medium | **Category:** Design System | **Screen:** Global
- **Current Behavior:** Fixed font sizes; only `.vc-page-title` uses clamp()
- **Expected Behavior:** Responsive font scale
- **Business Impact:** None | **User Impact:** Suboptimal on extreme viewports
- **Technical Impact:** None | **Estimated Effort:** 3h | **Priority:** P3

### DS-04: Inconsistent Kicker Typography
- **Severity:** Low | **Category:** Design System | **Screen:** Multiple
- **Current Behavior:** Some pages `text-xs font-semibold uppercase tracking-wide`, others `text-[10px] tracking-[0.2em]`
- **Expected Behavior:** Single `.vc-page-kicker` class
- **Business Impact:** None | **User Impact:** Inconsistent headers
- **Technical Impact:** None | **Estimated Effort:** 1h | **Priority:** P3

---

## 6. Responsive

### RS-01: No Tablet Layout for Studio
- **Severity:** High | **Category:** Responsive | **Screen:** /studio
- **Current Behavior:** 3-panel layout doesn't collapse on tablet
- **Expected Behavior:** Panels collapse to drawers on tablet
- **Business Impact:** Studio unusable on tablets | **User Impact:** Can't edit on tablet
- **Technical Impact:** None | **Estimated Effort:** 8h | **Priority:** P1

### RS-02: Schedules Calendar Overflow on Mobile
- **Severity:** Medium | **Category:** Responsive | **Screen:** /scheduling
- **Current Behavior:** 7-column grid cramped on mobile
- **Expected Behavior:** Day-view or agenda on mobile
- **Business Impact:** None | **User Impact:** Can't read calendar on mobile
- **Technical Impact:** None | **Estimated Effort:** 6h | **Priority:** P2

### RS-03: Settings Tabs Overflow on Mobile
- **Severity:** Low | **Category:** Responsive | **Screen:** /settings/*
- **Current Behavior:** Inline-flex tabs may overflow on small screens
- **Expected Behavior:** Scrollable tabs on mobile
- **Business Impact:** None | **User Impact:** May not see all tabs
- **Technical Impact:** None | **Estimated Effort:** 1h | **Priority:** P3

### RS-04: No Ultra-Wide Optimization
- **Severity:** Low | **Category:** Responsive | **Screen:** Global
- **Current Behavior:** Max-width 1600px leaves large margins on 2560px+ monitors
- **Expected Behavior:** Multi-column layouts for ultra-wide
- **Business Impact:** None | **User Impact:** Wasted space
- **Technical Impact:** None | **Estimated Effort:** 4h | **Priority:** P3

---

## 7. Accessibility

### A11Y-01: No Reduced Motion Support
- **Severity:** Medium | **Category:** Accessibility | **Screen:** Global
- **Current Behavior:** Framer Motion animations throughout, no `prefers-reduced-motion`
- **Expected Behavior:** Respect reduced motion preference
- **Business Impact:** WCAG 2.3.3 | **User Impact:** Motion-sensitive users affected
- **Technical Impact:** None | **Estimated Effort:** 3h | **Priority:** P2

### A11Y-02: Color Contrast — Muted Foreground
- **Severity:** Medium | **Category:** Accessibility | **Screen:** Global
- **Current Behavior:** `--muted-foreground` (#6b7280) on `--background` (#f9fafb) = ~4.3:1, fails WCAG AA (4.5:1)
- **Expected Behavior:** Minimum 4.5:1 contrast
- **Business Impact:** WCAG AA risk | **User Impact:** Hard to read for visually impaired
- **Technical Impact:** None | **Estimated Effort:** 1h | **Priority:** P2

### A11Y-03: No ARIA Live for Dynamic Updates
- **Severity:** Medium | **Category:** Accessibility | **Screen:** Screen Detail, Notifications
- **Current Behavior:** Realtime status updates don't use aria-live regions
- **Expected Behavior:** `aria-live="polite"` for dynamic content
- **Business Impact:** WCAG 4.1.3 | **User Impact:** Screen reader users miss updates
- **Technical Impact:** None | **Estimated Effort:** 3h | **Priority:** P2

### A11Y-04: Form Control Labeling Gaps
- **Severity:** Medium | **Category:** Accessibility | **Screen:** Multiple
- **Current Behavior:** Some native selects lack proper label association
- **Expected Behavior:** All controls have label or aria-label
- **Business Impact:** WCAG compliance | **User Impact:** Screen reader users can't identify controls
- **Technical Impact:** None | **Estimated Effort:** 3h | **Priority:** P2

---

## 8. Performance UX

### PX-01: Overview — Full Reload on Every Action
- **Severity:** Medium | **Category:** Performance UX | **Screen:** /overview
- **Current Behavior:** Rename/pause/delete calls `load()` refetching all data
- **Expected Behavior:** Optimistic updates or targeted refetch
- **Business Impact:** Sluggish feel | **User Impact:** UI flashes
- **Technical Impact:** Unnecessary API calls | **Estimated Effort:** 6h | **Priority:** P2

### PX-02: Screens List — SWR Cache on Workspace Switch
- **Severity:** Medium | **Category:** Performance UX | **Screen:** /screens
- **Current Behavior:** May show stale data on workspace switch
- **Expected Behavior:** Immediate refetch on workspace change
- **Business Impact:** Confusing stale data | **User Impact:** Wrong workspace screens briefly
- **Technical Impact:** Cache key issue | **Estimated Effort:** 2h | **Priority:** P2

### PX-03: Playlist Search — No Debounce
- **Severity:** Low | **Category:** Performance UX | **Screen:** /content?tab=playlists
- **Current Behavior:** Filters on every keystroke
- **Expected Behavior:** Debounced search (200ms)
- **Business Impact:** None | **User Impact:** Laggy with many playlists
- **Technical Impact:** Excessive re-renders | **Estimated Effort:** 1h | **Priority:** P3

---

## 9. Product Consistency

### PC-01: Studio as Standalone Route vs IA Spec
- **Severity:** Medium | **Category:** Product Consistency | **Screen:** /studio
- **Current Behavior:** IA spec says Studio accessed via playlist edit only (DD-02). Implementation has standalone route AND Content tab.
- **Expected Behavior:** Studio only from playlist editor
- **Business Impact:** Conflicts with design decision | **User Impact:** Studio without playlist context is confusing
- **Technical Impact:** None | **Estimated Effort:** 4h | **Priority:** P2

### PC-02: Sidebar Matches IA Spec (7 items)
- **Severity:** N/A | **Category:** Product Consistency | **Screen:** Sidebar
- **Current Behavior:** ✅ 7 items: Overview, Screens, Content, Scheduling, Analytics, Team, Settings
- **Expected Behavior:** Matches spec
- **No action needed**

---

## 10. Feature Completeness

| Feature | Status | Completion % | Notes |
|---------|--------|-------------|-------|
| Authentication (Login/Register/Forgot) | ✅ Implemented | 95% | Missing: SSO/SAML reserved |
| Onboarding Progress | ✅ Implemented | 90% | Links use old routes |
| Workspace Switcher | ✅ Implemented | 95% | Search for 100+ workspaces |
| Screens List | ✅ Implemented | 85% | No virtualization, no pagination |
| Screen Detail | ✅ Implemented | 90% | Native select, realtime socket fixed |
| Screen Pairing | ✅ Implemented | 85% | No troubleshooting guidance during wait |
| Media Library | ✅ Implemented | 85% | No drag-to-folder, no infinite scroll |
| Playlist Studio | ✅ Implemented | 90% | No tablet layout, no empty state guidance |
| Content Tabs | ⚠️ Partial | 70% | No URL sync, duplicated routes |
| Scheduling | ✅ Implemented | 85% | No conflict preview, calendar overflow on mobile |
| Analytics | ⚠️ Partial | 75% | Hardcoded colors, no charts, no tabs |
| Team Management | ✅ Implemented | 85% | No role descriptions, no empty state |
| Settings — Profile | ⚠️ Partial | 70% | Too long, mixes 2FA + notifications + GDPR |
| Settings — Workspace | ✅ Implemented | 90% | — |
| Settings — Billing | ⚠️ Partial | 75% | No upgrade guidance |
| Settings — Security | ❌ Missing | 0% | 2FA embedded in Profile, no separate tab |
| Settings — API Keys | ❌ Missing | 0% | In /api-docs, not in Settings |
| Settings — Notifications | ❌ Missing | 0% | Embedded in Profile |
| Emergency Broadcast | ⚠️ Partial | 60% | Not discoverable from sidebar |
| AI Tools | ⚠️ Partial | 60% | Not discoverable from sidebar |
| Templates | ⚠️ Partial | 70% | Basic implementation, no template gallery |
| Admin Panel | ✅ Implemented | 90% | Full admin with customers, staff, fleet, logs |
| Notifications Bell | ✅ Implemented | 90% | — |
| Global Search | ✅ Implemented | 85% | — |
| Dark Mode | ✅ Implemented | 90% | Some hardcoded colors |
| RTL Support | ✅ Implemented | 90% | — |
| Density Toggle | ✅ Implemented | 95% | — |
