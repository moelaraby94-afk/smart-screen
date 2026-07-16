# Workflow Analysis

> **Evidence basis:** `27-user-flows.md`, `01-current-product-model.md`, all feature audit files
> **Purpose:** Analyze workflows for each user type — what they do, how they do it, and where the system supports or impedes them

---

## 1. User Type Workflows

### 1.1 Workspace Owner (Primary User)

**Daily workflow:**
```
1. Check dashboard for screen health
2. Investigate any offline screens
3. Upload new media (if content update needed)
4. Edit/create playlist in Studio
5. Publish playlist to screens
6. Check schedule for upcoming changes
```

**Weekly workflow:**
```
7. Review analytics (screen uptime, content performance)
8. Update schedules for new promotions/campaigns
9. Manage team members (invite, remove)
10. Review storage usage and limits
```

**Monthly workflow:**
```
11. Review billing and subscription
12. Export analytics for reporting
13. Audit screen fleet (add/remove/reassign)
14. Review notification preferences
```

**System support assessment:**

| Workflow Step | Support Level | Gap |
|---------------|--------------|-----|
| 1. Check dashboard | ⚠️ Partial | No screen health summary count, inconsistent loading |
| 2. Investigate offline | ✅ Good | Screen detail shows status, realtime updates |
| 3. Upload media | ❌ Poor | No multi-file, no drag-drop, no progress, no preview |
| 4. Edit playlist | ⚠️ Partial | Studio works but desktop-only, no auto-save, no templates |
| 5. Publish | ⚠️ Partial | Works but no proof-of-play confirmation |
| 6. Check schedule | ⚠️ Partial | Calendar works but no conflict detection, no timezone |
| 7. Review analytics | ⚠️ Partial | Charts work but no export, no custom date range |
| 8. Update schedules | ⚠️ Partial | No drag-to-reschedule, no overlap visualization |
| 9. Manage team | ❌ Poor | No role change, no member removal, no cancel/resend |
| 10. Review storage | ⚠️ Partial | Usage shown but no proactive warning |
| 11. Review billing | ❌ Poor | No plan selector, no invoice download, no upgrade path |
| 12. Export analytics | ❌ Missing | No export functionality |
| 13. Audit fleet | ❌ Poor | No bulk actions, no search/filter |
| 14. Review notifications | ✅ Good | Per-event granularity, channel selection |

**Workflow friction score: 3/5**
**Primary blockers:** Media upload UX, team management, billing, bulk operations

---

### 1.2 Editor (Content Manager)

**Daily workflow:**
```
1. Check assigned screens for status
2. Upload new media assets
3. Create/edit playlists in Studio
4. Schedule playlists on screens
5. Preview content before publishing
```

**Weekly workflow:**
```
6. Review content performance via analytics
7. Update seasonal/promotional content
8. Archive old media
```

**System support assessment:**

| Workflow Step | Support Level | Gap |
|---------------|--------------|-----|
| 1. Check screens | ✅ Good | Screen list with status badges |
| 2. Upload media | ❌ Poor | Same as owner — no multi-file, no drag-drop |
| 3. Create/edit playlists | ⚠️ Partial | Studio works but no templates, no versioning |
| 4. Schedule playlists | ⚠️ Partial | No conflict detection, no timezone |
| 5. Preview content | ✅ Good | Live preview in Studio |
| 6. Review performance | ⚠️ Partial | No per-playlist analytics, no export |
| 7. Update content | ⚠️ Partial | No bulk media operations |
| 8. Archive old media | ❌ Missing | No archival feature, no auto-expiry |

**Workflow friction score: 3/5**
**Primary blockers:** Media upload, content templates, bulk operations, archival

---

### 1.3 Viewer (Read-Only)

**Daily workflow:**
```
1. View dashboard for screen status
2. View screen details
3. View playlists and schedules
4. View analytics
```

**System support assessment:**

| Workflow Step | Support Level | Gap |
|---------------|--------------|-----|
| 1. View dashboard | ⚠️ Partial | Inconsistent loading |
| 2. View screen details | ✅ Good | Detail page shows all info |
| 3. View playlists | ✅ Good | Library and detail pages |
| 4. View analytics | ⚠️ Partial | No export for reporting |

**Workflow friction score: 2/5**
**Primary blockers:** Loading inconsistency, analytics export

---

### 1.4 Super-Admin

**Daily workflow:**
```
1. Check admin dashboard
2. Monitor system health
3. Review new customer registrations
4. Manage feature flags
5. Review system logs
```

**Weekly workflow:**
```
6. Impersonate customers for support
7. Manage staff accounts
8. Review fleet status
9. Suspend/delete problematic accounts
```

**System support assessment:**

| Workflow Step | Support Level | Gap |
|---------------|--------------|-----|
| 1. Admin dashboard | ⚠️ Partial | Basic overview, no widgets |
| 2. System health | ✅ Good | Health page exists |
| 3. Customer registrations | ✅ Good | Customer list with detail |
| 4. Feature flags | ✅ Good | Toggle UI |
| 5. System logs | ✅ Good | Log viewer |
| 6. Impersonate | ⚠️ Partial | Works but no audit trail, no confirmation |
| 7. Manage staff | ⚠️ Partial | No custom roles for staff |
| 8. Fleet status | ⚠️ Partial | Basic overview, no remote control |
| 9. Suspend/delete | ⚠️ Partial | No clear distinction between suspend and delete |

**Workflow friction score: 2/5**
**Primary blockers:** Audit trail, staff roles, fleet management depth

---

### 1.5 Mobile User (Any Role)

**Daily workflow:**
```
1. Check dashboard on mobile
2. View screen status
3. Receive push notifications for alerts
4. Switch workspace (if multi-workspace)
5. Approve/reject actions (if applicable)
```

**System support assessment:**

| Workflow Step | Support Level | Gap |
|---------------|--------------|-----|
| 1. Dashboard on mobile | ⚠️ Partial | Works but touch targets too small |
| 2. Screen status | ✅ Good | Card grid responsive |
| 3. Push notifications | ⚠️ Partial | In-app notifications work, no push notifications |
| 4. Switch workspace | ❌ Blocked | No switcher on mobile (P-002) |
| 5. Approve/reject | ❌ Missing | No approval workflow |

**Workflow friction score: 4/5**
**Primary blockers:** Workspace switching blocked, touch targets, no push notifications

---

## 2. Cross-User-Type Workflow Gaps

### 2.1 Content Lifecycle Workflow

**Current state:**
```
Create → Edit → Save → Publish → (no monitoring) → (no archival) → (no deletion workflow)
```

**Gaps:**
- No content staging (draft → review → publish)
- No approval workflow (editor creates, owner approves)
- No content expiry (auto-remove time-sensitive content)
- No archival (old content stays in library forever)
- No proof-of-play (no confirmation content is playing)
- No version history (can't revert to previous version)

**Evidence:** `28-feature-inventory.md` §28.6 — "No content approval workflow, No playlist versioning/history"

### 2.2 Fleet Management Workflow

**Current state:**
```
Pair screen → Configure → Assign playlist → Monitor status → (no remote control) → (no grouping) → (no bulk config)
```

**Gaps:**
- No screen grouping (hierarchical folders, tags)
- No bulk configuration (assign playlist to 10 screens at once)
- No remote control (reboot, volume, brightness)
- No OTA updates
- No live screenshot preview
- No geographic map view

**Evidence:** `09-screens-feature.md` §9.8, `28-feature-inventory.md` §28.6

### 2.3 Team Management Workflow

**Current state:**
```
Invite → Accept → (no role change) → (no removal) → (no permission audit)
```

**Gaps:**
- No role change after invitation
- No member removal
- No cancel/resend invitation
- No permission audit (who can access what)
- No custom roles
- No team activity log

**Evidence:** `16-team-feature.md` §16.4

### 2.4 Billing Workflow

**Current state:**
```
Subscribe → (no plan comparison) → Hit limit → Error toast → (no inline upgrade) → (no invoice) → (no cancellation flow)
```

**Gaps:**
- No plan comparison/selector in settings
- No inline upgrade prompts when hitting limits
- No invoice download or history
- No proration display
- No cancellation flow
- No payment method management

**Evidence:** `14-settings-feature.md` §14.8, `08-dashboard-and-overview.md` §8.17

---

## 3. Workflow Efficiency Analysis

### 3.1 Common Task Efficiency

| Task | Current Steps | Optimal Steps | Overhead | Evidence |
|------|--------------|---------------|----------|----------|
| Check screen status | 1 (sidebar → overview) | 1 | 0 | ✅ Efficient |
| Find a specific screen | 1 (sidebar → screens) + scroll | 2 (search) | +1 | No search (F-HP-03) |
| Upload 10 media files | 10 × (click upload → select file → wait) | 1 (select 10 files) | +9 | No multi-file (F-HP-05) |
| Assign playlist to 5 screens | 5 × (open screen → assign → save) | 1 (bulk assign) | +4 | No bulk (F-HP-04) |
| Create a simple playlist | 5+ (create → studio → add elements → save → publish) | 3 (template → customize → publish) | +2 | No templates |
| Switch workspace on mobile | Impossible | 2 (open switcher → select) | ∞ | P-002 |
| Upgrade plan | Impossible from dashboard | 2 (see limit → click upgrade) | ∞ | No upgrade path |
| Check schedule conflicts | Manual review | Automatic detection | +5 | No conflict detection |

### 3.2 Workflow Bottlenecks

| Bottleneck | Impact | Frequency | Evidence |
|------------|--------|-----------|----------|
| No bulk operations | High — 10x time for fleet management | Daily for large fleets | E-004 |
| No search on list pages | Medium — scroll time increases with data | Daily | F-HP-03 |
| No content templates | Medium — rebuild from scratch each time | Weekly | `28-feature-inventory.md` |
| No publish confirmation | Medium — uncertainty about deployment | Each publish | `27-user-flows.md` §27.9 |
| No mobile workspace switching | Critical — blocks mobile multi-workspace | Each mobile session | P-002 |
| No upgrade path | High — revenue loss from limit friction | When limits hit | `14-settings-feature.md` |

---

## 4. Workflow State Transitions

### 4.1 Content State Machine (Current)

```
[Draft] → [Saved] → [Published] → (no state change) → (no archival)
                ↑
           (edit and re-save)
```

**Missing states:**
- `In Review` — submitted for approval
- `Approved` — approved by manager
- `Rejected` — rejected, back to draft
- `Scheduled` — queued for future publish
- `Expired` — auto-expired based on date
- `Archived` — removed from active library

### 4.2 Screen State Machine (Current)

```
[Unpaired] → [Paired/Online] → [Offline] → (back to Online)
                  ↓
            [Deleted]
```

**Missing states:**
- `Maintenance` — intentionally taken offline
- `Error` — hardware/software error
- `Updating` — OTA update in progress
- `Disabled` — admin disabled

### 4.3 Team Member State Machine (Current)

```
[Invited] → [Accepted/Active] → (no state change) → (no removal)
```

**Missing states:**
- `Suspended` — temporarily disabled
- `Removed` — removed from workspace
- `Role Changed` — role modified

---

## 5. Workflow Recommendations

### 5.1 Content Lifecycle

1. Add draft/review/publish states (requires custom roles — E-003)
2. Add content expiry dates on playlists
3. Add playlist versioning (F-MP-13)
4. Add proof-of-play confirmation (F-MP-15)
5. Add content archival (auto-archive expired content)

### 5.2 Fleet Management

1. Add screen grouping/folders (F-HP-03)
2. Add bulk operations (F-HP-04)
3. Add search/filter to screen list (F-HP-03)
4. Add remote control (Future — requires player app)
5. Add live screenshot (Future — requires player app)

### 5.3 Team Management

1. Add role change (F-HP-08)
2. Add member removal (F-HP-09)
3. Add cancel/resend invite (F-HP-09)
4. Add custom roles (F-HP-08)
5. Add team activity log

### 5.4 Billing

1. Add plan selector (F-MP-09)
2. Add inline upgrade prompts (F-MP-10)
3. Add invoice download
4. Add payment method management
5. Add cancellation flow

---

## Cross-References

- See `06-user-journey-analysis.md` for step-by-step journey maps
- See `08-feature-priorities.md` for feature-level priorities
- See `10-mental-model-analysis.md` for mental model alignment
- See `11-cognitive-load-analysis.md` for cognitive load per workflow
- See `13-enterprise-saas-review.md` for enterprise workflow assessment
