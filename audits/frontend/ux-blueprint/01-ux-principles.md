# UX Principles

> **Evidence basis:** `product-architecture/15-interaction-principles.md`, `product-architecture/17-product-rules.md`, `transformation/26-product-principles.md`, `information-architecture/05-navigation-architecture.md`
> **Purpose:** Define the foundational UX principles, visual hierarchy principles, interaction principles, and micro-interaction rules that govern every page

---

## 1. Overall UX Principles

### UP-01: Shortest Path to Value
Every page and flow must minimize the steps between the user's intent and the outcome. Optional complexity is never in the primary path.

**Evidence:** `product-architecture/15-interaction-principles.md` IP-01; 5-minute KPI (locked)

### UP-02: One Primary Action
Every page has exactly one primary action. It is visually dominant. Secondary actions are subordinate. Tertiary actions are in menus.

**Evidence:** `product-architecture/17-product-rules.md` PR-17; `transformation/26-product-principles.md` PP-08

### UP-03: Progressive Disclosure
Show essential information first. Reveal complexity only when needed or requested. Required fields first, optional fields collapsed.

**Evidence:** `product-architecture/15-interaction-principles.md` IP-03; `transformation/26-product-principles.md` PP-05

### UP-04: Immediate Feedback
Every user action receives visual feedback within 100ms. No action leaves the user wondering if it worked.

**Evidence:** `product-architecture/15-interaction-principles.md` IP-04; `transformation/12-usability-breakdown.md` H5

### UP-05: No Dead Ends
Every page provides a clear next action. Every empty state has a CTA. Every completed action has a next-step link.

**Evidence:** `product-architecture/17-product-rules.md` PR-18; `product-architecture/15-interaction-principles.md` IP-07

### UP-06: Recognition Over Recall
The interface makes options and actions visible. Users should not need to remember how to do something.

**Evidence:** `product-architecture/15-interaction-principles.md` IP-09; `transformation/26-product-principles.md` PP-04

### UP-07: Consistent Patterns
The same interaction pattern is used everywhere for the same type of action. Users learn a pattern once and apply it everywhere.

**Evidence:** `product-architecture/17-product-rules.md` PR-19; `transformation/26-product-principles.md` PP-03

### UP-08: Error Prevention Over Recovery
Prevent errors through UI design. Recovery is the fallback, not the primary strategy.

**Evidence:** `product-architecture/15-interaction-principles.md` IP-08; `transformation/12-usability-breakdown.md` H5

### UP-09: Safe Destructive Actions
Destructive actions require explicit confirmation. Confirmations state what will be lost and the impact.

**Evidence:** `product-architecture/17-product-rules.md` PR-20; `transformation/26-product-principles.md` PP-07

### UP-10: Graceful Degradation
When something fails, the product degrades gracefully — no crashes, no blank screens, no silent failures.

**Evidence:** `product-architecture/15-interaction-principles.md` IP-10; `product-architecture/17-product-rules.md` PR-51

### UP-11: Bilingual by Design
Every text element has EN and AR variants. RTL layout is a first-class concern, not an afterthought.

**Evidence:** `product-architecture/17-product-rules.md` PR-39 through PR-42; `transformation/22-i18n-and-localization.md`

### UP-12: Accessibility by Default
WCAG 2.1 AA compliance for all components. Keyboard navigable. Screen reader compatible. Touch targets ≥ 44px.

**Evidence:** `product-architecture/17-product-rules.md` PR-43 through PR-45; `transformation/25-design-constraints.md` ACC

### UP-13: Enterprise Scalability
Designs must work with 200+ screens, 100+ workspaces, 50+ team members without degradation.

**Evidence:** `product-architecture/19-scalability-considerations.md`; `transformation/25-design-constraints.md` SCL

### UP-14: Evolution Not Revolution
Improve existing patterns. No big-bang redesigns. Preserve user familiarity.

**Evidence:** Locked product decision; `product-architecture/17-product-rules.md` PR-02

---

## 2. Visual Hierarchy Principles

### VH-01: F-Pattern Reading
On list pages, the most important information is at the top-left (LTR) or top-right (RTL). Users scan in an F-pattern.

**Application:** Search bar at top, filter below, content grid below that.

### VH-02: Z-Pattern for Detail Pages
On detail pages, the eye moves in a Z-pattern: top-left (title) → top-right (actions) → bottom-left (content) → bottom-right (secondary actions).

**Application:** Page title top-start, primary action top-end, content below, secondary actions at bottom.

### VH-03: Size = Importance
Larger elements are more important. The primary action button is the largest interactive element on the page.

**Application:** Primary button `default` variant (solid). Secondary `outline`. Tertiary `ghost`.

### VH-04: Color = Status
Color communicates status, not decoration. Green = success/online. Red = error/offline/destructive. Amber = warning. Blue = info/active.

**Application:** Screen status badges, form validation, toast types.

### VH-05: Whitespace = Grouping
Related elements are grouped with less whitespace between them. Unrelated elements have more whitespace. Sections are separated by clear visual breaks.

**Application:** Card padding, section spacing, form field grouping.

### VH-06: Contrast = Attention
High-contrast elements draw attention. Low-contrast elements recede. Use contrast to guide the eye to the primary action.

**Application:** Primary button (high contrast), muted text (low contrast), active sidebar item (high contrast).

### VH-07: Progressive Visual Weight
Above the fold: highest visual weight (primary action, key data). Middle: medium weight (secondary content). Bottom: low weight (metadata, links).

**Application:** Overview widgets, screen detail sections.

### VH-08: Consistent Density
All pages use the same density (compact, comfortable, or spacious). Density toggle is global, not per-page.

**Evidence:** `04-layout-and-shell.md` §4.3 (density toggle in header)

---

## 3. Interaction Principles

### IN-01: Click
Single click activates buttons, links, and cards. No double-click actions anywhere in the product.

### IN-02: Hover
Hover shows visual feedback (background change, cursor pointer). Hover on cards shows a subtle elevation or border. Hover on buttons shows background change. No hover-only actions — everything is clickable.

### IN-03: Keyboard
All interactive elements are keyboard accessible. Tab order follows visual order. Enter activates buttons and links. Escape closes dialogs and drawers. Arrow keys navigate lists and tabs.

**Evidence:** `product-architecture/17-product-rules.md` PR-44; ACC-02

### IN-04: Touch
Touch targets minimum 44×44px. No hover-dependent actions on mobile. Long-press for context menus (future). Swipe to dismiss notifications (future).

**Evidence:** `product-architecture/17-product-rules.md` PR-45; MSC-02

### IN-05: Drag and Drop
Drag and drop for: media upload (drop zone), schedule calendar events (future: drag to reschedule), playlist reordering in Studio (timeline). No drag-and-drop for list reordering (use up/down buttons instead).

### IN-06: Selection
Single click selects a card/row. Ctrl+click (Cmd+click) adds to selection. Shift+click selects range. Click outside deselects. Escape deselects.

### IN-07: Bulk Selection
Checkbox in list header selects all. Individual checkboxes select items. Bulk action bar appears when ≥ 1 item selected. Bulk actions: assign, delete, activate, deactivate (context-dependent).

### IN-08: Right Click
Right-click context menus are not used. All actions are accessible via visible buttons or dropdown menus. (Enterprise users may expect right-click, but it's not a primary interaction pattern for this product.)

### IN-09: Search
Search is debounced (300ms). Search clears on Escape. Empty search shows all items. No-results shows "No results found" with clear button.

### IN-10: Filter
Filters are URL-addressable (query params). Active filters show as removable chips/badges. "Clear all" button removes all filters. Filter state persists across navigation within the same section.

---

## 4. Micro-Interaction Rules

### MI-01: Button Press
Button visually depresses on click (scale 0.97 or brightness change). Returns to normal on release. Duration: 100ms.

### MI-02: Card Hover
Card border intensifies or subtle shadow appears on hover. Duration: 150ms. Easing: ease-out.

### MI-03: Sidebar Item Hover
Background fades in. Icon scales 1.05. Duration: 150ms. Easing: ease-out.

**Evidence:** `05-navigation-analysis.md` §2.1 (existing: `group-hover:scale-105`)

### MI-04: Theme Toggle
Sun/Moon icon crossfades with rotation. Duration: 300ms. Easing: ease-in-out.

**Evidence:** `05-navigation-analysis.md` §2.1 (existing Framer Motion animation)

### MI-05: Toast Entrance
Toast slides in from bottom (LTR) or bottom (RTL). Duration: 300ms. Easing: spring. Auto-dismiss after 5s (success) or persistent (error).

### MI-06: Dialog Entrance
Dialog fades in + scales from 0.95 to 1.0. Backdrop fades in. Duration: 200ms. Easing: ease-out.

### MI-07: Drawer Slide
Mobile drawer slides in from start edge. Backdrop fades in. Duration: 250ms. Easing: ease-in-out.

**Evidence:** `05-navigation-analysis.md` §2.2 (existing: `translate-x-full` animation)

### MI-08: Tab Switch
Tab content fades in. No slide animation (prevents disorientation). Duration: 150ms. Easing: ease-out.

### MI-09: Loading Spinner
Spinner rotates continuously. Duration: 1s per rotation. Easing: linear.

### MI-10: Skeleton Pulse
Skeleton elements pulse (opacity 0.4 → 0.7 → 0.4). Duration: 1.5s. Easing: ease-in-out.

### MI-11: Success Checkmark
Checkmark draws in with stroke animation. Duration: 400ms. Easing: ease-out. Only for major successes (publish, pairing).

### MI-12: Delete Confirmation
Delete button in AlertDialog pulses red briefly on hover. Confirm button uses `destructive` variant.

### MI-13: Notification Badge
Badge scales in from 0 to 1 when count increases. Duration: 200ms. Easing: spring.

### MI-14: Page Transition
Page content fades in. No slide. Duration: 150ms. Easing: ease-out. Prevents disorientation during navigation.

### MI-15: Reduced Motion
All animations respect `prefers-reduced-motion`. When enabled: no scale, no slide, no rotation. Only opacity transitions (max 200ms).

**Evidence:** `transformation/27-design-system-governance.md` §11.2

---

## 5. Animation Duration Standards

| Duration | Use Case | Evidence |
|----------|----------|----------|
| 100ms | Button press, micro-feedback | — |
| 150ms | Hover, tab switch, page transition | — |
| 200ms | Dialog entrance, badge animation | — |
| 250ms | Drawer slide | — |
| 300ms | Toast entrance, theme toggle | — |
| 400ms | Success checkmark draw | — |
| 500ms+ | Only for complex multi-step animations | — |

---

## Cross-References

- See `02-state-guidelines.md` for empty/loading/error/confirmation state guidelines
- See `03-component-ux-standards.md` for form/table/search/filter UX standards
- See `04-feature-ux-standards.md` for notification/bulk/responsive/accessibility standards
- See `product-architecture/15-interaction-principles.md` for interaction principles
- See `transformation/26-product-principles.md` for permanent product principles
- See `transformation/27-design-system-governance.md` §11 for animation rules
