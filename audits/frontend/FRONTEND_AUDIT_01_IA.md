# 01 — Information Architecture Audit

> **Evidence basis:** `shell-sidebar.tsx`, `crystal-shell.tsx`, `header.tsx`, `content-tabs-client.tsx`, route files in `app/[locale]/(shell)/`, IA spec `09-ia-summary.md`, `04-final-ia-sitemap.md`

---

## 1. Current Navigation Structure

### 1.1 Workspace Sidebar (7 items — matches IA spec)
1. **Overview** → `/[locale]/`
2. **Screens** → `/[locale]/screens`
3. **Content** → `/[locale]/content`
4. **Scheduling** → `/[locale]/scheduling`
5. **Analytics** → `/[locale]/analytics`
6. **Team** → `/[locale]/team`
7. **Settings** → `/[locale]/settings/profile`

### 1.2 Admin Sidebar (separate mode)
- Customers, Staff, Fleet, Workspaces, Billing, Stats, Logs, Feature Flags, Screens, Settings

### 1.3 Header Actions
- Desktop: Global Search, Density Toggle, Workspace Switcher, Notification Bell, User Menu
- Mobile: Global Search, Density Toggle, Notification Bell, User Menu

---

## 2. Issues Found

### 2.1 Duplicated Content Routes (Critical)
**Evidence:** `content-tabs-client.tsx` renders `PlaylistStudioClient`, `MediaLibraryClient`, `StudioEditorClient`, `TemplatesClient` in tabs. But standalone routes `/playlists`, `/media`, `/studio`, `/templates` also render the same components with different page headers.

**Impact:** Two URLs for same content; different headers; confusing bookmarks.

### 2.2 Settings Tab Mismatch (High)
**Evidence:** `settings-tabs.tsx` defines 3 tabs: profile, workspace, billing. IA spec `09-ia-summary.md` §1.2 defines 6: Profile, Workspace, Billing, Security, API Keys, Notifications.

**Where missing tabs live:**
- Security (2FA): Embedded in `settings-profile-client.tsx` line 230
- Notifications: Embedded in `settings-profile-client.tsx` line 232
- API Keys: In `/api-docs` route, not in Settings

### 2.3 Onboarding Links Use Old Routes (Medium)
**Evidence:** `onboarding-progress-widget.tsx` line 42-46:
- `upload_media` → `/media` (standalone, should be `/content?tab=media`)
- `create_playlist` → `/playlists` (standalone, should be `/content?tab=playlists`)
- `schedule_content` → `/schedules` (redirects to `/scheduling`)

### 2.4 Emergency and AI Not in Sidebar (Medium)
**Evidence:** `/emergency` and `/ai` routes exist with full page implementations. Old nav arrays `FLEET_NAV` and `INSIGHTS_NAV` in `shell-sidebar.tsx` reference them but are not rendered. 7-item sidebar doesn't include them.

### 2.5 Branches Page Outside IA Spec (Medium)
**Evidence:** `/branches` and `/branches/[workspaceId]` exist. IA spec DD-03: "Branches as filter within Screens — optional entity, doesn't deserve nav slot."

### 2.6 Dead Navigation Arrays (Low)
**Evidence:** `shell-sidebar.tsx` defines `OVERVIEW_NAV`, `FLEET_NAV`, `CONTENT_NAV`, `PLAYBACK_NAV`, `INSIGHTS_NAV`, `MANAGEMENT_NAV` — none are imported or used by the rendered sidebar.

### 2.7 Content Tabs Not URL-Synced (Medium)
**Evidence:** `content-tabs-client.tsx` uses `defaultValue="playlists"` with no URL query param sync. Refresh always returns to Playlists tab.

### 2.8 Studio Violates IA Design Decision (Medium)
**Evidence:** IA spec DD-02: "Studio is a tool, not destination." Implementation has `/studio` as standalone route AND as Content tab.

---

## 3. Route Inventory

### 3.1 Shell Routes (Workspace)
| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ | Overview dashboard |
| `/screens` | ✅ | Screens list |
| `/screens/[screenId]` | ✅ | Screen detail |
| `/content` | ✅ | Tabbed: Playlists, Media, Studio, Templates |
| `/playlists` | ⚠️ | Duplicates Content → Playlists tab |
| `/media` | ⚠️ | Duplicates Content → Media tab |
| `/studio` | ⚠️ | Duplicates Content → Studio tab; violates DD-02 |
| `/templates` | ⚠️ | Duplicates Content → Templates tab |
| `/scheduling` | ✅ | Schedules |
| `/schedules` | ⚠️ | Redirects to /scheduling |
| `/campaigns` | ⚠️ | Redirects to /scheduling |
| `/analytics` | ✅ | Analytics |
| `/proof-of-play` | ⚠️ | Redirects to /analytics |
| `/team` | ✅ | Team management |
| `/settings/profile` | ✅ | Profile settings |
| `/settings/workspace` | ✅ | Workspace settings |
| `/settings/billing` | ✅ | Billing |
| `/branches` | ⚠️ | Outside IA spec |
| `/branches/[workspaceId]` | ⚠️ | Branch detail |
| `/emergency` | ⚠️ | Not discoverable |
| `/ai` | ⚠️ | Not discoverable |
| `/api-docs` | ⚠️ | API Keys should be in Settings |
| `/displays` | ⚠️ | Redirects to /screens |

### 3.2 Auth Routes
| Route | Status |
|-------|--------|
| `/login` | ✅ |
| `/register` | ✅ |
| `/forgot-password` | ✅ |
| `/invite` | ✅ |
| `/terms` | ✅ |
| `/privacy` | ✅ |

### 3.3 Admin Routes
| Route | Status |
|-------|--------|
| `/admin` | ✅ |
| `/admin/customers` | ✅ |
| `/admin/customers/[id]` | ✅ |
| `/admin/staff` | ✅ |
| `/admin/fleet` | ✅ |
| `/admin/workspaces` | ✅ |
| `/admin/billing` | ✅ |
| `/admin/stats` | ✅ |
| `/admin/logs` | ✅ |
| `/admin/feature-flags` | ✅ |
| `/admin/screens` | ✅ |
| `/admin/settings` | ✅ |

---

## 4. Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Sidebar item count | 10/10 | 7 items, matches spec |
| Route clarity | 6/10 | Duplicated routes, redirect chains |
| Settings completeness | 5/10 | 3 of 6 tabs implemented |
| Feature discoverability | 6/10 | Emergency, AI not discoverable |
| Dead code | 7/10 | Unused nav arrays |
| **Overall IA Score** | **6.8/10** | **Needs cleanup** |
