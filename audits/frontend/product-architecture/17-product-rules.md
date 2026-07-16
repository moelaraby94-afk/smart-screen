# Product Rules

> **Evidence basis:** All product architecture documents 01–16, locked product decisions, `26-product-principles.md` (transformation), `24-design-decisions.md` (transformation)
> **Purpose:** Define the immutable rules that govern the product — what must always be true, what must never happen

---

## 1. Rule Categories

| Category | Count | Description |
|----------|-------|-------------|
| Product Identity Rules | 5 | What the product IS and IS NOT |
| Entity Priority Rules | 4 | How entities are prioritized |
| Navigation Rules | 6 | How navigation works |
| Workflow Rules | 5 | How workflows are structured |
| Content Rules | 4 | How content is managed |
| Scheduling Rules | 4 | How scheduling works |
| Screen Rules | 4 | How screens are managed |
| Team Rules | 3 | How team management works |
| Settings Rules | 3 | How settings are organized |
| i18n Rules | 4 | How internationalization works |
| Accessibility Rules | 3 | How accessibility is ensured |
| Realtime Rules | 3 | How realtime updates work |
| Error Handling Rules | 3 | How errors are handled |

---

## 2. Product Identity Rules

### PR-01: Product is a Fast-to-Value Signage Platform
The product's primary differentiator is speed to value, not feature count. Every feature addition must be justified against the 5-minute KPI.

### PR-02: Evolution, Not Revolution
The product improves the existing experience. No big-bang rewrites. No replacement of the core stack (Next.js, React, Tailwind, Radix, SWR, Socket.IO, Konva).

### PR-03: Enterprise Restaurant Focus
The product is designed for enterprise restaurants. Features must serve this market first. General-purpose signage features are secondary.

### PR-04: Bilingual by Default
The product is bilingual (EN/AR) with RTL support. No feature ships without both languages. No English-only or Arabic-only features.

### PR-05: No Marketing Page Until Core is Complete
The marketing/landing page (`apps/marketing`) is not developed until the full application (dashboard + admin) is complete and polished.

---

## 3. Entity Priority Rules

### PR-06: Workspace is Always First
Workspace is the primary context. All data is workspace-scoped. No data from one workspace is ever displayed when another is active.

### PR-07: Screens Before Content
Screens are the primary management target. The Screens section comes before Content in the sidebar. Screen health is the primary Overview metric.

### PR-08: Branches are Optional
Branches are not a top-level navigation item. Branches are a filter within Screens. A workspace can function without any branches.

### PR-09: Analytics is Separate from Overview
Analytics is a separate section. Overview shows minimal health summary only. Detailed analytics live in the Analytics section.

---

## 4. Navigation Rules

### PR-10: Seven Items Maximum
The sidebar has exactly 7 first-level items: Overview, Screens, Content, Scheduling, Analytics, Team, Settings. No exceptions.

### PR-11: Overview is Home
Overview is the default landing page after login, workspace switch, and any "home" action.

### PR-12: Studio is Not a Nav Item
Studio is accessed by editing a playlist, not from the sidebar. Studio is a tool within the Content module, not a destination.

### PR-13: Disabled, Not Hidden
Unavailable navigation items are disabled (greyed out with tooltip), not hidden. The navigation structure is always visible to preserve the mental model.

### PR-14: Mobile Drawer
On mobile, the sidebar becomes a drawer with the workspace switcher at the top.

### PR-15: Back Button is Descriptive
Back button labels include the destination name ("Back to Screens"), not just "Back".

---

## 5. Workflow Rules

### PR-16: Shortest Path to Value
Every workflow uses the minimum number of steps. Optional steps must not block the primary path.

### PR-17: One Primary Action Per Screen
Each screen has one clearly primary action. Secondary actions are visually subordinate. Tertiary actions are in menus.

### PR-18: No Dead Ends
Every screen provides a clear next action. Every empty state includes a CTA. Every completed action provides a "next step" link.

### PR-19: Progressive Disclosure
Show essential information first. Reveal complexity only when the user needs it or asks for it.

### PR-20: Post-Action CTAs
Each step in a workflow ends with a CTA to the next step. No action leaves the user at a dead end.

---

## 6. Content Rules

### PR-21: Content Combines Playlists and Media
Playlists and Media are in a single "Content" section. They are not separate sidebar items.

### PR-22: Media Upload from Both Library and Studio
Media upload is available from both the Media Library and the Playlist Studio. Both use the same upload component and API.

### PR-23: Templates First, Studio Second
Content creation defaults to template picker. Studio is the advanced path for custom content. First-time users should not need Studio for their first publish.

### PR-24: Playlist Preview Without Studio
Playlist preview is available from the playlist detail page without entering Studio.

---

## 7. Scheduling Rules

### PR-25: Scheduling is Optional
Users may publish immediately without creating a schedule. Scheduling is an opt-in advanced feature.

### PR-26: Immediate Publish is Default
The "Publish" action from a playlist defaults to immediate assignment with "always active" scheduling.

### PR-27: Conflict Detection is Real-Time
Schedule conflicts are detected during creation, not after submit. The user sees conflicts before saving.

### PR-28: Calendar is Default View
The Scheduling section defaults to calendar view, not list view.

---

## 8. Screen Rules

### PR-29: Pairing Uses a Wizard
Screen onboarding uses a guided wizard with 2-3 steps. Not a settings page, not a modal without guidance.

### PR-30: Screen List Supports Search and Filter
The screen list supports search by name, filter by branch and status, and bulk operations.

### PR-31: Screen Detail Shows Actionable Information
Screen detail shows: status, current content, active schedules, and quick actions (assign content, override).

### PR-32: Screen Status is Realtime
Screen status updates in realtime via Socket.IO. No page refresh required to see status changes.

---

## 9. Team Rules

### PR-33: Three Default Roles
The product has three default roles: Owner, Editor, Viewer. Custom roles are a future enterprise feature.

### PR-34: Team CRUD is Complete
Team management supports: invite, role change, remove, cancel/resend invite. No partial implementations.

### PR-35: Remove Requires Confirmation
Removing a team member requires explicit confirmation via AlertDialog.

---

## 10. Settings Rules

### PR-36: Settings Uses Tabs
Settings uses a tab interface. Each tab has its own save action. No global save.

### PR-37: User-Level vs Workspace-Level Settings
User-level settings (profile, notifications, 2FA) are independent of workspace. Workspace-level settings (branding, API) are workspace-scoped.

### PR-38: Each Settings Tab Has Back Button
Each settings tab has a back button to return to the default settings tab (fixes IA-005).

---

## 11. i18n Rules

### PR-39: All Strings Translated
All user-facing strings use `useTranslations` or `getTranslations`. No hardcoded strings.

### PR-40: Both Languages Required
Translation keys must exist in both `en.json` and `ar.json`. No English-only or Arabic-only keys.

### PR-41: Logical CSS Properties
All directional layout uses logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`). No physical `left`/`right`/`ml`/`mr`.

### PR-42: Icons Flip in RTL
Directional icons (arrows, chevrons) use `rtl:rotate-180` to flip in RTL mode.

---

## 12. Accessibility Rules

### PR-43: WCAG 2.1 AA Compliance
All components and pages must meet WCAG 2.1 AA standards. No exceptions for new code.

### PR-44: Keyboard Accessible
All interactive elements are operable via keyboard. Tab order follows visual order. Focus is visible.

### PR-45: Touch Targets ≥ 44px
All interactive elements have a minimum touch target of 44×44px on mobile screens.

---

## 13. Realtime Rules

### PR-46: Socket.IO is the Only Realtime Library
No additional realtime libraries. Socket.IO with polling fallback is the standard.

### PR-47: Realtime Events Go Through Shell Providers
Modules do not create their own Socket.IO connections. All events are handled by NotificationProvider and WorkspaceProvider.

### PR-48: Realtime Updates Trigger SWR Revalidation
Socket.IO events trigger SWR revalidation via data epoch bump. Modules receive updates through SWR cache, not direct Socket.IO listeners.

---

## 14. Error Handling Rules

### PR-49: No Silent Failures
Every API call results in user-visible feedback (toast). Every error is displayed. No silent catches.

### PR-50: Error Messages are Localized
Error messages use `toastResponseError` which maps API error codes to localized messages. No raw error strings shown to users.

### PR-51: Graceful Degradation
When something fails, the product degrades gracefully. Error boundaries catch page errors. Socket.IO falls back to polling. Images have fallback placeholders.

---

## Cross-References

- See `18-product-constraints.md` for constraints that bound these rules
- See `15-interaction-principles.md` for interaction principles
- See `16-navigation-principles.md` for navigation principles
- See `transformation/26-product-principles.md` for permanent product principles
- See `transformation/24-design-decisions.md` for design decisions
- See `transformation/25-design-constraints.md` for design constraints
