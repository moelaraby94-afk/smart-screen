# Phase 1: Information Architecture Audit

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Phase:** 1 of 9 (Information Architecture)  
**Status:** Audit complete — proposed hierarchy ready for review

---

## 1. Current Sidebar Structure

Source: `@/apps/dashboard/src/components/layout/shell-sidebar.tsx:58-84`

### Main Section
| # | Label | Route | Component | API |
|---|---|---|---|---|
| 1 | Overview | `/overview` | OverviewClient | `/auth/me`, `/screens/:ws/analytics` |
| 2 | Screens | `/screens` | ScreensClient | `/screens` (via `useApiScreens`) |
| 3 | Displays | `/displays` | DisplaysClient | `/screens` (via `useApiScreens`) — **SAME API as Screens** |
| 4 | Media | `/media` | MediaLibraryClient | `/media`, `/media/folders`, `/playlists` |
| 5 | Content | `/content` | ContentClient | `/media` — **SAME API as Media** |
| 6 | Studio | `/studio` | StudioEditorClient | `/canvases`, `/media`, `/playlists` |

### Management Section
| # | Label | Route | Component | API |
|---|---|---|---|---|
| 7 | Display Groups | `/displays/groups` | DisplayGroupsClient | `/playlists` — **MANAGES PLAYLISTS, NOT DISPLAY GROUPS** |
| 8 | Templates | `/templates` | TemplatesClient | `/canvases` — **SAME API as Studio** |
| 9 | Team | `/team` | TeamClient | `/workspaces/:id/members`, `/workspaces/:id/invites` |

### Scheduling Section
| # | Label | Route | Component | API |
|---|---|---|---|---|
| 10 | Playlists | `/playlists` | PlaylistStudioClient | `/playlists`, `/playlists/:id`, `/media`, `/canvases` |
| 11 | Campaigns | `/campaigns` | CampaignsClient | `/schedules`, `/playlists`, `/screens` — **SAME API as Schedules** |
| 12 | Schedules | `/schedules` | SchedulesClient | `/schedules`, `/playlists`, `/screens` |

### Tools Section
| # | Label | Route | Component | API |
|---|---|---|---|---|
| 13 | Proof of Play | `/proof-of-play` | ProofOfPlayClient | `/screens/:ws/analytics` — **SAME API as Analytics, NOT actual proof-of-play** |
| 14 | Analytics | `/analytics` | AnalyticsPageClient | `/screens/:ws/analytics` — **SAME API as Proof of Play** |
| 15 | AI | `/ai` | AiToolsClient | **NONE — fully mock** (hardcoded `mockResults`, `setTimeout`) |
| 16 | Emergency | `/emergency` | EmergencyClient | `/screens` (via `useApiScreens`), `PATCH /screens/:id/override` |

### Account Section
| # | Label | Route | Component | API |
|---|---|---|---|---|
| 17 | Billing | `/settings/billing` | SettingsBillingClient | `/account/billing`, `/subscriptions/:ws`, `/account/billing/invoice/:ref/pdf` |
| 18 | Settings | `/settings/profile` | SettingsProfileClient | `/auth/me`, `/account/profile`, `/account/export`, `/account/anonymize`, `/notifications/preferences` |

### Resources Section
| # | Label | Route | Component | API |
|---|---|---|---|---|
| 19 | Notifications | `/notifications` | NotificationsPageClient | `/notifications` (REST + Socket.IO) |
| 20 | Audit Log | `/audit-log` | AuditLogClient | `/workspaces/:id/audit-log` |
| 21 | API Docs | `/api-docs` | ApiDocsClient | N/A (static content) |
| 22 | Help | `/help` | HelpSupportClient | N/A (static content) |

---

## 2. Routes NOT in Sidebar (Unreachable or Secondary)

| Route | Component | Linked From | Problem |
|---|---|---|---|
| `/settings/workspace` | WorkspaceSettingsClient | **NOWHERE** | Completely unreachable from UI — workspace name, timezone, locale, pause, prayer config, Ramadan settings all inaccessible |
| `/billing` | BillingClient | SettingsBillingClient "Upgrade" button (hardcoded `/en/billing` — locale bug) | Full plan selection + checkout page not in sidebar |
| `/branches/[workspaceId]` | BranchDetailClient | Workspace switcher (on workspace select) | Workspace overview with tabs (playlists, screens, media, review) — overlaps with individual pages |
| `/branches/[workspaceId]/groups/[groupId]` | Group detail | Branch detail | Secondary drill-down |
| `/branches/[workspaceId]/playlists/[playlistId]` | Playlist studio (in branch context) | Branch detail | Overlaps with `/playlists` |
| `/screens/[screenId]` | Screen detail | ScreensClient card click | Secondary drill-down — correctly nested |

---

## 3. Duplicate Page Analysis

### 3.1 Screens vs Displays — **DUPLICATE (same API)**

| Feature | Screens (`ScreensClient`) | Displays (`DisplaysClient`) |
|---|---|---|
| List screens | ✅ Card grid | ✅ Table |
| Search | ✅ | ✅ |
| Status filter | ✅ | ❌ |
| Bulk select | ✅ | ❌ |
| Bulk playlist assign | ✅ | ❌ |
| Quick-edit panel | ✅ | ❌ |
| Analytics panel | ✅ | ❌ |
| Usage indicator | ✅ | ❌ |
| Player pairing | ✅ | ✅ |
| Screen creation | ✅ | ✅ |
| Delete screen | ✅ | ✅ |
| Realtime updates | ✅ | ❌ |
| Screen detail page | ✅ (`/screens/[id]`) | ❌ |
| Edit screen | ✅ | ❌ |

**Verdict:** Displays is a strict subset of Screens. Zero unique features.  
**Action:** Merge → redirect `/displays` to `/screens`. Add table view toggle to Screens.

### 3.2 Media vs Content — **DUPLICATE (same API)**

| Feature | Media (`MediaLibraryClient`) | Content (`ContentClient`) |
|---|---|---|
| Upload | ✅ Drag-drop (react-dropzone) | ✅ File input |
| List | ✅ Grid | ✅ Grid + Table |
| Delete | ✅ | ✅ |
| Folders | ✅ (create, rename, delete, move) | ❌ |
| Bulk select | ✅ | ❌ |
| Bulk delete | ✅ | ❌ |
| Search | ✅ | ❌ |
| Type filter | ✅ | ❌ |
| Pagination | ✅ | ❌ |
| Add to playlist | ✅ | ❌ |
| Scope toggle (branch/all) | ✅ | ❌ |
| Storage usage | ✅ | ❌ |
| Info dialog | ✅ (with expiry) | ❌ |
| Expiry UI | ✅ (functional, in info dialog) | ⚠️ (broken — Select with no handler) |
| Seed demo content | ✅ | ❌ |

**Verdict:** Content is a strict subset of Media. The only "unique" feature (expiry Select) is broken/non-functional.  
**Action:** Merge → redirect `/content` to `/media`. Add table view toggle to Media.

### 3.3 Campaigns vs Schedules — **DUPLICATE (same API)**

| Feature | Campaigns (`CampaignsClient`) | Schedules (`SchedulesClient`) |
|---|---|---|
| List schedules | ✅ | ✅ |
| Create schedule | ✅ (simplified — no day selection, defaults to all days) | ✅ (full — day-of-week, priority, date range) |
| Delete schedule | ✅ | ✅ |
| Edit schedule | ❌ | ✅ (drag-to-reschedule on calendar) |
| Day-of-week selection | ❌ (always all days) | ✅ |
| Priority | ❌ | ✅ (in type) |
| Enable/disable | ❌ | ✅ (in type) |
| Calendar view | ❌ | ✅ (7-day calendar with drag) |
| Timeline view | ✅ (7-day grid timeline) | ❌ |
| List view | ✅ | ✅ |
| Overlap detection | ❌ | ✅ (visual + API) |
| Screen override | ❌ | ✅ (playlist + duration) |
| Date range | ❌ | ✅ (in type) |

**Verdict:** Campaigns has exactly ONE unique feature: the timeline grid view. Everything else is a subset.  
**Action:** Merge → add timeline view to Schedules, redirect `/campaigns` to `/schedules`.

### 3.4 Display Groups vs Playlists — **MISLABELED DUPLICATE (same API)**

| Feature | Display Groups (`DisplayGroupsClient`) | Playlists (`PlaylistStudioClient`) |
|---|---|---|
| List playlists | ✅ (labeled as "groups") | ✅ |
| Create playlist | ✅ | ✅ |
| Edit playlist name | ✅ | ✅ |
| Delete playlist | ✅ | ✅ |
| Published status | ✅ | ✅ |
| Item count | ✅ (`_count.items`) | ✅ |
| Screens-in-group count | ✅ (`_count.screensInGroup`) | ❌ |
| Drag-and-drop items | ❌ | ✅ |
| Add media/canvas items | ❌ | ✅ |
| Set durations | ❌ | ✅ |
| Reorder items | ❌ | ✅ |
| Undo/redo | ❌ | ✅ |
| Duplicate playlist | ❌ | ✅ |
| Clone to workspace | ❌ | ✅ |
| Publish/unpublish | ❌ | ✅ |
| Preview | ❌ | ✅ |

**Verdict:** DisplayGroupsClient fetches `/playlists` and manages playlists. It's mislabeled as "Display Groups" and placed in the wrong section (Management instead of Scheduling). Its only unique feature is the `screensInGroup` count.  
**Action:** Merge → add screens-in-group count to Playlists list, redirect `/displays/groups` to `/playlists`.

### 3.5 Analytics vs Proof of Play — **DUPLICATE (same API, mislabeled)**

| Feature | Analytics (`AnalyticsPageClient`) | Proof of Play (`ProofOfPlayClient`) |
|---|---|---|
| Screen status counts | ✅ | ✅ (same data) |
| Hourly activity chart | ✅ | ✅ (same data) |
| Uptime | ✅ | ✅ (same data) |
| Per-screen breakdown | ✅ | ✅ (same data) |
| Playlist distribution | ✅ | ✅ (same data) |
| Overview stats cards | ✅ | ✅ (same data, different labels) |
| Search | ❌ | ✅ |
| CSV export | ❌ | ✅ |
| Table view | ❌ | ✅ |
| Empty state | ✅ | ✅ |

**Verdict:** Both call `fetchScreenAnalytics(workspaceId)` — the exact same endpoint. Proof of Play is mislabeled: it shows screen status (online/offline/uptime), NOT actual proof-of-play (impression/per-playback) data. The only unique features in PoP are search, CSV export, and table view.  
**Action:** Merge → add search, CSV export, and table view to Analytics. Redirect `/proof-of-play` to `/analytics`. Rename the combined page to "Analytics" until real PoP data exists.

### 3.6 Templates vs Studio — **PARTIAL OVERLAP (same canvas API)**

| Feature | Templates (`TemplatesClient`) | Studio (`StudioEditorClient`) |
|---|---|---|
| List canvases | ✅ (gallery view) | ✅ (sidebar list) |
| Create canvas | ❌ (links to Studio with template param) | ✅ |
| Edit canvas | ❌ (links to Studio) | ✅ |
| Delete canvas | ✅ | ❌ |
| Preview canvas | ✅ (image thumbnail) | ✅ (live editor) |
| Builtin template presets | ✅ (6 presets) | ✅ (template gallery in editor) |
| Search | ✅ | ❌ |

**Verdict:** Templates is a read-only gallery of canvases. Studio is the editor. They share the `/canvases` API. Templates has search and delete that Studio lacks. Studio has create/edit that Templates lacks. They're complementary but the separation is confusing — a user expects to manage their designs in one place.  
**Action:** Keep both but clarify relationship. Add delete to Studio. Add "Edit in Studio" link to Templates (already exists via builtin templates, but not for user-created canvases). Consider merging Templates into Studio as a gallery tab.

---

## 4. Navigation Problems

### 4.1 Unreachable Pages
| Page | Impact |
|---|---|
| `/settings/workspace` | **CRITICAL** — Workspace name, timezone, locale, pause, prayer config, Ramadan settings all inaccessible from UI |
| `/billing` | **HIGH** — Plan selection, upgrade, checkout not in sidebar. Only reachable via "Upgrade" button in settings/billing (which has a locale bug: hardcodes `/en/billing`) |

### 4.2 Mislabeled Pages
| Page | Problem |
|---|---|
| Display Groups (`/displays/groups`) | Manages playlists, not display groups. Placed in Management section, should be in Scheduling |
| Proof of Play (`/proof-of-play`) | Shows screen status analytics, not proof-of-play data |
| Campaigns (`/campaigns`) | Same thing as Schedules — different label for the same feature |

### 4.3 Structural Issues
| Issue | Impact |
|---|---|
| Screens + Displays in same section | User doesn't know which to use |
| Media + Content in same section | Same confusion |
| Playlists + Campaigns + Schedules in same section | Three items that are really two (playlists + schedules) |
| Display Groups in Management, not Scheduling | Wrong section + wrong label |
| Templates in Management, not with Studio | Studio and Templates manage the same canvas data |
| No settings tab navigation | Profile, Workspace, Billing settings are isolated pages with no cross-navigation |
| Branch detail overlaps with individual pages | Branch detail has tabs for playlists, screens, media — same as individual pages |

---

## 5. Proposed New Hierarchy

### Design Principles
1. **Workflow order** — sections follow the user journey: fleet → content → playback → insights → management
2. **One feature, one place** — no duplicates
3. **Clear labels** — names match what the page does
4. **Logical grouping** — related items are together

### Proposed Sidebar

```
OVERVIEW
  Overview

FLEET
  Screens          ← merged with Displays (card + table views, all features)
  Emergency        ← screen override, active alerts

CONTENT
  Media            ← merged with Content (grid + table views, all features)
  Studio           ← canvas editor + delete canvas
  Templates        ← canvas gallery (links to Studio for editing)

PLAYBACK
  Playlists        ← merged with Display Groups (timeline editor + list with screens count)
  Schedules        ← merged with Campaigns (calendar + timeline + list views, all features)

INSIGHTS
  Analytics        ← merged with Proof of Play (dashboard + table + search + CSV export)

MANAGEMENT
  Team
  Billing          ← merged: plan selection + payment history + invoice download
  Settings         ← tabbed: Profile | Workspace | Billing

RESOURCES
  Notifications
  Audit Log
  API Docs
  Help
```

### Route Changes Summary

| Old Route | Action | New Route |
|---|---|---|
| `/displays` | Redirect | `/screens` |
| `/content` | Redirect | `/media` |
| `/campaigns` | Redirect | `/schedules` |
| `/displays/groups` | Redirect | `/playlists` |
| `/proof-of-play` | Redirect | `/analytics` |
| `/billing` | Merge into | `/settings/billing` |
| `/settings/workspace` | Add to sidebar | `/settings/workspace` (linked) |

### Sidebar Section Changes

| Old Section | Items | New Section | Items |
|---|---|---|---|
| Main | Overview, Screens, Displays, Media, Content, Studio | Overview | Overview |
| — | — | Fleet | Screens, Emergency |
| — | — | Content | Media, Studio, Templates |
| Management | Display Groups, Templates, Team | — | — |
| Scheduling | Playlists, Campaigns, Schedules | Playback | Playlists, Schedules |
| Tools | Proof of Play, Analytics, AI, Emergency | Insights | Analytics, AI |
| Account | Billing, Settings | Management | Team, Billing, Settings |
| Resources | Notifications, Audit Log, API Docs, Help | Resources | Notifications, Audit Log, API Docs, Help |

---

## 6. Capability Matrix — What Must Be Merged Before Removing Duplicates

### Screens (absorb Displays)
- [ ] Add table view toggle to ScreensClient
- [ ] Verify: all Displays features already exist in Screens (they do — Displays is a strict subset)

### Media (absorb Content)
- [ ] Add table view toggle to MediaLibraryClient (Content has a table view)
- [ ] Verify: all Content features already exist in Media (they do — Content is a strict subset, expiry is broken)

### Schedules (absorb Campaigns)
- [ ] Add timeline grid view to SchedulesClient (from CampaignsClient)
- [ ] Verify: all Campaigns features exist in Schedules after merge (only timeline view is unique)

### Playlists (absorb Display Groups)
- [ ] Add `screensInGroup` count to playlist list view in PlaylistStudioClient
- [ ] Verify: all Display Groups features exist in Playlists after merge (only screens count is unique)

### Analytics (absorb Proof of Play)
- [ ] Add search to AnalyticsPageClient
- [ ] Add CSV export to AnalyticsPageClient
- [ ] Add per-screen table view to AnalyticsPageClient
- [ ] Verify: all PoP features exist in Analytics after merge

### Billing (merge `/billing` into `/settings/billing`)
- [ ] Add plan selection + checkout UI from BillingClient into SettingsBillingClient
- [ ] Add Stripe portal link (already exists in SettingsBillingClient)
- [ ] Add mock plan toggle (from BillingClient, dev-only)
- [ ] Fix locale bug: `/en/billing` hardcoded link → use locale variable
- [ ] Verify: all BillingClient features exist in SettingsBillingClient after merge

### Settings (add workspace settings to sidebar)
- [ ] Add `/settings/workspace` to sidebar (or add settings tab navigation)
- [ ] Verify: workspace settings page is accessible from UI

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Redirecting routes breaks bookmarks | Use Next.js `redirect()` in page.tsx (permanent redirect) |
| Merging features introduces bugs | Merge one pair at a time, test after each |
| Branch detail page overlaps with individual pages | Keep branch detail as workspace overview, but don't duplicate full page functionality — link to individual pages instead |
| Removing sidebar items changes user habits | Redirects ensure old URLs still work |
| Templates vs Studio relationship unclear | Keep both for now, clarify in Phase 4 |
| AI tools is fully mock | Keep in sidebar with "Demo" badge (already implemented) |

---

## 8. Phase 1 Deliverables

- [x] Complete sidebar audit (22 items)
- [x] Every page identified with purpose, API, component
- [x] Duplicate pages identified with capability matrix
- [x] Unreachable pages identified
- [x] Mislabeled pages identified
- [x] Navigation problems documented
- [x] Proposed new hierarchy
- [x] Route change summary
- [x] Capability merge checklist for Phase 2

---

## 9. Next Phase

**Phase 2: Duplicate Consolidation** — execute the merges identified in §6, one pair at a time, testing after each. Order of execution:

1. Screens ← Displays (simplest — zero unique features to merge)
2. Media ← Content (simple — add table view toggle)
3. Playlists ← Display Groups (simple — add screens count)
4. Schedules ← Campaigns (medium — add timeline view)
5. Analytics ← Proof of Play (medium — add search, CSV, table)
6. Billing merge (complex — combine two full pages)
7. Settings workspace accessibility (add to sidebar)

**No implementation begins until this audit is reviewed and approved.**
