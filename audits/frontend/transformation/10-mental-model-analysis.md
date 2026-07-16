# Mental Model Analysis

> **Evidence basis:** `04-information-architecture-review.md`, `05-navigation-analysis.md`, `06-user-journey-analysis.md`, `09-workflow-analysis.md`, all feature audit files
> **Purpose:** Evaluate alignment between user mental model and system model

---

## 1. Mental Model Framework

A mental model is the user's internal representation of how a system works. When the system model matches the user's mental model, the system feels "intuitive." When they diverge, users experience confusion, errors, and frustration.

This analysis evaluates alignment across three dimensions:
- **Structural alignment** — does the system's organization match how users think about their work?
- **Procedural alignment** — do the system's workflows match how users actually perform tasks?
- **Conceptual alignment** — do the system's concepts and terminology match users' vocabulary?

---

## 2. Structural Alignment

### 2.1 Entity Hierarchy

**User mental model:**
```
My Organization
  └── My Locations (branches)
       └── My Screens (displays)
            └── My Content (playlists/media)
                 └── My Schedule (when content shows)
```

**System model:**
```
Workspace (organization)
  ├── Branches (locations) ← top-level nav item
  ├── Screens (displays) ← top-level nav item, separate from branches
  ├── Playlists (content) ← top-level nav item
  ├── Studio (creation tool) ← top-level nav item, separate from playlists
  ├── Media (assets) ← top-level nav item
  ├── Schedules (time) ← top-level nav item
  ├── Analytics ← top-level nav item
  ├── Team ← top-level nav item
  ├── Notifications ← top-level nav item
  ├── Settings ← top-level nav item
  ├── API Docs ← top-level nav item
  └── API Keys ← top-level nav item
```

**Alignment assessment:**

| Dimension | Alignment | Issue |
|-----------|-----------|-------|
| Organization → Workspace | ✅ Aligned | Workspace = organization concept |
| Locations → Branches | ⚠️ Partial | Branches are top-level but users think of them as containers for screens |
| Screens | ⚠️ Partial | Screens are separate from branches in nav, but users think "my screens at location X" |
| Content → Playlists + Media | ⚠️ Partial | Playlists and Media are separate nav items, but users think "my content" holistically |
| Creation tool → Studio | ❌ Misaligned | Studio is a top-level nav item, but users think "edit my playlist" not "go to Studio" |
| Schedule | ✅ Aligned | Schedules as time-based assignment matches mental model |
| Analytics | ✅ Aligned | Performance monitoring matches mental model |
| Team | ✅ Aligned | User management matches mental model |
| Developer tools | ❌ Misaligned | API Docs/Keys at same level as core business features |

### 2.2 Navigation Mental Model

**User expectation:** "I go to my screens, then I filter by location"
**System reality:** "I go to branches, then I click a branch, then I see its screens"

This is a fundamental misalignment. Users think of screens as the primary entity and branches as a filter/grouping. The system treats branches as a primary destination.

**Evidence:** `04-information-architecture-review.md` §2.5 — "users think 'show me my screens' not 'show me my branches'"

### 2.3 Workspace Mental Model

**User expectation:** "I switch workspace and see my new dashboard"
**System reality:** "I switch workspace and see my branch list"

**Evidence:** IA-003, `07-workspace-management.md` §7.11

---

## 3. Procedural Alignment

### 3.1 Content Creation Procedure

**User mental model:**
```
"I want to show a promotion on my screens"
→ Pick a template or start from scratch
→ Add my images/text
→ Preview it
→ Send it to my screens
→ Know it's playing
```

**System procedure:**
```
Navigate to Playlists
→ Click Create
→ Fill wizard (name, description, orientation)
→ Navigate to playlist detail
→ Click Edit → Studio opens
→ Add elements on canvas
→ Arrange elements
→ Set timeline
→ Preview
→ Save
→ Click Publish
→ Select screens
→ Confirm
→ (no confirmation it's playing)
```

**Alignment assessment:**

| Step | Alignment | Issue |
|------|-----------|-------|
| Start creation | ⚠️ Partial | Multiple steps before reaching the editor |
| Add content | ✅ Good | Canvas editor is intuitive for visual content |
| Arrange content | ⚠️ Partial | No alignment guides, no snap-to-grid |
| Preview | ✅ Good | Live preview matches mental model |
| Save | ⚠️ Partial | No auto-save — user must remember to save |
| Publish | ⚠️ Partial | Works but no confirmation of playback |
| Templates | ❌ Missing | No template library — must start from scratch |

### 3.2 Screen Management Procedure

**User mental model:**
```
"I want to see how my screens are doing"
→ See list of all screens with status
→ Filter by location if needed
→ Click a screen to see details
→ Fix any issues
```

**System procedure:**
```
Navigate to Screens
→ See card grid of all screens
→ (no filter by location)
→ (no search by name)
→ Click a screen → detail page
→ View status, playlist, config
→ (no remote fix — must physically access screen)
```

**Alignment assessment:**

| Step | Alignment | Issue |
|------|-----------|-------|
| See all screens | ✅ Good | Card grid shows all screens |
| Filter by location | ❌ Missing | No filter — must go to Branch detail |
| Search by name | ❌ Missing | No search |
| Click for details | ✅ Good | Detail page shows info |
| Fix issues | ❌ Missing | No remote control |

### 3.3 Schedule Management Procedure

**User mental model:**
```
"I want this playlist to show on these screens at this time"
→ Pick playlist
→ Pick screens
→ Pick time
→ Done
```

**System procedure:**
```
Navigate to Schedules
→ Click Create
→ Fill form: name, playlist, screens, start/end date, recurrence, time slots
→ Submit
→ See on calendar
→ (no conflict check)
→ (no timezone selection)
```

**Alignment assessment:**

| Step | Alignment | Issue |
|------|-----------|-------|
| Pick playlist | ✅ Good | Dropdown selection |
| Pick screens | ✅ Good | Multi-select |
| Pick time | ⚠️ Partial | Complex form with many fields |
| Done | ⚠️ Partial | No conflict detection, no timezone |
| Visual feedback | ⚠️ Partial | Calendar view but no overlap visualization |

---

## 4. Conceptual Alignment

### 4.1 Terminology

| System Term | User Term | Alignment |
|-------------|-----------|-----------|
| Workspace | Organization/Company | ⚠️ "Workspace" is a technical term |
| Branch | Location/Store/Site | ⚠️ "Branch" implies banking — "location" is more universal |
| Screen | Screen/Display/TV | ✅ Aligned |
| Playlist | Playlist/Content/Slideshow | ⚠️ "Playlist" implies audio — "content" or "slideshow" may be clearer |
| Studio | Editor/Designer | ❌ "Studio" is ambiguous — users may think it's a separate product |
| Media | Media/Assets/Images/Videos | ⚠️ "Media" is broad — users think "my images and videos" |
| Schedule | Schedule/Campaign | ⚠️ "Schedule" is correct but "campaign" may match marketing users |
| Branch Pairing | Screen Setup/Registration | ⚠️ "Pairing" is technical — "setup" or "add screen" is clearer |

### 4.2 Conceptual Confusion Points

**Studio vs. Playlists:**
Users don't understand the distinction between Playlists (library) and Studio (editor). Both use the `Clapperboard` icon. The system treats them as separate destinations, but users think "I go to my playlists and edit one" — not "I go to Studio to edit a playlist."

**Evidence:** `26-consistency-audit.md` §26.6, `04-information-architecture-review.md` §2.4

**Branches vs. Screens:**
Users think of screens as the primary entity. Branches are a way to group screens. The system elevates branches to a top-level concept, creating confusion about the relationship.

**Evidence:** `04-information-architecture-review.md` §2.5, `13-branches-feature.md` §13.13

**Workspace vs. Branch:**
The hierarchy is Workspace → Branch → Screen. But in the UI, switching workspace navigates to `/branches`, making branches feel like the workspace landing page. This conflates the workspace concept with the branch concept.

**Evidence:** IA-003, `07-workspace-management.md` §7.11

---

## 5. Mental Model Gaps by User Type

### 5.1 New User Gaps

| Gap | Impact | Evidence |
|-----|--------|----------|
| "What is a workspace?" | Confusion at onboarding | No explanation of workspace concept |
| "What's the difference between Playlists and Studio?" | Confusion at content creation | Separate nav items with same icon |
| "What is pairing?" | Confusion at screen setup | Technical terminology |
| "Do I need to create a branch?" | Uncertainty about workflow order | Branches are top-level but optional |

### 5.2 Experienced User Gaps

| Gap | Impact | Evidence |
|-----|--------|----------|
| "How do I find a specific screen quickly?" | Time wasted scrolling | No search/filter |
| "How do I apply the same playlist to multiple screens?" | Repetitive work | No bulk operations |
| "How do I know my content is actually playing?" | Uncertainty after publish | No proof-of-play |
| "How do I revert a playlist to a previous version?" | Can't recover from mistakes | No version history |

### 5.3 Admin User Gaps

| Gap | Impact | Evidence |
|-----|--------|----------|
| "What did I do during impersonation?" | No accountability | No audit trail |
| "Can I create a staff role with limited permissions?" | Can't delegate safely | No custom roles |
| "How do I suspend a customer without deleting?" | Fear of data loss | No clear suspend vs delete |

---

## 6. Mental Model Recommendations

### 6.1 Structural Realignment

1. **Merge Studio into Playlists** — Studio is an action (edit playlist), not a destination
2. **Demote Branches from top-level** — Make branches a filter within Screens
3. **Group Developer tools** — API Docs/Keys under a "Developer" section
4. **Group nav items** — 4-5 categories instead of 18 flat items

### 6.2 Procedural Realignment

1. **Add templates** — Start from a template matches "I want to show a promotion"
2. **Add auto-save** — Don't require manual save
3. **Add publish confirmation** — "Content is now playing on 5 screens"
4. **Add bulk operations** — "Apply to all screens in this branch"
5. **Add search/filter** — Find screens by name, filter by branch

### 6.3 Conceptual Realignment

1. **Rename "Studio" to "Editor"** or integrate it so the name doesn't matter
2. **Consider renaming "Branch" to "Location"** — more universal term
3. **Add contextual help** — Explain "workspace" concept at onboarding
4. **Rename "Pairing" to "Add Screen"** — clearer for non-technical users

---

## 7. Model Alignment Score

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Structural alignment | 3/5 | Branches and Studio misaligned; rest is acceptable |
| Procedural alignment | 3/5 | Content creation and screen management have extra steps |
| Conceptual alignment | 3/5 | Terminology gaps (Studio, Branch, Workspace, Pairing) |
| **Overall** | **3/5** | Functional but with friction points that compound |

---

## Cross-References

- See `04-information-architecture-review.md` for IA structural analysis
- See `05-navigation-analysis.md` for navigation system analysis
- See `06-user-journey-analysis.md` for journey-level friction
- See `09-workflow-analysis.md` for workflow efficiency
- See `11-cognitive-load-analysis.md` for cognitive load per task
- See `22-open-questions.md` for terminology decisions requiring stakeholder input
