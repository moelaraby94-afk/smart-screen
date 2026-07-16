# Cognitive Load Analysis

> **Evidence basis:** `03-routing-and-navigation.md`, `05-navigation-analysis.md`, `06-user-journey-analysis.md`, `09-workflow-analysis.md`, `10-mental-model-analysis.md`, all feature audit files
> **Purpose:** Assess cognitive load per screen and flow — identify where the system demands too much from the user's working memory

---

## 1. Cognitive Load Framework

Cognitive load theory identifies three types of load:

| Type | Definition | Relevance |
|------|-----------|-----------|
| **Intrinsic** | Difficulty inherent in the task itself | Cannot be eliminated — content management is inherently complex |
| **Extraneous** | Load imposed by how information is presented | **This is what we can reduce** — bad IA, confusing navigation, inconsistent patterns |
| **Germane** | Load devoted to creating permanent knowledge | **This is what we want to maximize** — learning the system efficiently |

This analysis focuses on **extraneous cognitive load** — the unnecessary mental effort imposed by the current design.

---

## 2. Cognitive Load by Screen

### 2.1 Sidebar Navigation

**Extraneous load: HIGH**

| Factor | Load | Evidence |
|--------|------|----------|
| 18 flat items to scan | High | Exceeds Miller's 7±2 working memory capacity (`03-routing-and-navigation.md` §3.2) |
| No grouping | High | No way to chunk items into categories |
| No visual hierarchy | Medium | All items look the same — no weight difference |
| Icon + text | Low | Dual coding (icon + text) reduces recognition time |
| Active state indicator | Low | Clear visual feedback for current location |

**Total extraneous load: HIGH** — User must scan 18 items on every navigation action. With grouping (4-5 categories), this drops to scanning 4-5 group headers + 3-5 items within the target group.

### 2.2 Dashboard

**Extraneous load: MEDIUM**

| Factor | Load | Evidence |
|--------|------|----------|
| Multiple widgets | Medium | Screen health, activity, quick actions, subscription, onboarding — 5+ sections |
| No information hierarchy | Medium | All widgets appear equally important |
| Inconsistent loading | Medium | Different loading patterns create uncertainty (`23-error-handling-and-states.md` §23.9) |
| Quick actions are links | Low | 6 clear actions with icons |
| No screen health summary | Medium | Must count offline screens manually (`08-dashboard-and-overview.md` §8.17) |

**Total extraneous load: MEDIUM** — Dashboard has many sections but they're visually separated. Adding a summary count ("3 of 15 screens offline") would reduce load.

### 2.3 Screen List

**Extraneous load: HIGH (for large fleets)**

| Factor | Load | Evidence |
|--------|------|----------|
| No search | High | Must scroll through all screens to find one (`09-screens-feature.md` §9.8) |
| No filter | High | Can't filter by branch, status, or playlist |
| No sort | Medium | Can't sort by name, status, or last seen |
| Card grid | Low | Visual cards with status badges are easy to scan |
| No bulk selection | Medium | Can't select multiple screens for batch operations |

**Total extraneous load: HIGH for 20+ screens, LOW for <10 screens** — The card grid works well for small fleets but doesn't scale.

### 2.4 Playlist Studio (Canvas Editor)

**Extraneous load: HIGH**

| Factor | Load | Evidence |
|--------|------|----------|
| Canvas-based editing | High | Free-form canvas requires spatial reasoning |
| Multiple panels | Medium | Layers, properties, timeline, preview — 4+ panels |
| No alignment guides | Medium | Must manually align elements (`10-playlists-and-studio.md` §10.12) |
| No templates | High | Must build from scratch — high intrinsic + extraneous load |
| Timeline editing | Medium | Sequential ordering with duration control |
| Live preview | Low | Immediate visual feedback reduces uncertainty |

**Total extraneous load: HIGH** — The canvas editor is inherently complex (high intrinsic load), and the lack of templates and alignment guides adds unnecessary extraneous load.

### 2.5 Schedule Create Dialog

**Extraneous load: HIGH**

| Factor | Load | Evidence |
|--------|------|----------|
| Many form fields | High | Name, playlist, screens, start/end date, recurrence, time slots (`12-schedules-feature.md` §12.9) |
| No progressive disclosure | High | All fields visible at once |
| No conflict detection | Medium | Must mentally check for conflicts |
| No timezone context | Medium | Unclear which timezone the schedule uses |
| No preview | Medium | Can't see when content will play before saving |

**Total extraneous load: HIGH** — The form presents all complexity upfront without progressive disclosure or visual aids.

### 2.6 Settings

**Extraneous load: LOW**

| Factor | Load | Evidence |
|--------|------|----------|
| Tab-based organization | Low | Clear separation of concerns |
| 5 tabs | Low | Within working memory capacity |
| No back button | Medium | Must use sidebar to navigate away (`14-settings-feature.md` §14.8) |
| Forms are simple | Low | Standard form patterns |

**Total extraneous load: LOW** — Settings is well-organized with tabs. The missing back button is the main issue.

### 2.7 Admin Panel

**Extraneous load: MEDIUM**

| Factor | Load | Evidence |
|--------|------|----------|
| Grouped navigation | Low | Admin sidebar uses groups (`03-routing-and-navigation.md` §3.2) |
| Tables with many columns | Medium | Horizontal scroll on mobile (`25-responsive-audit.md` §25.6) |
| No admin dashboard widgets | Medium | No overview of key metrics |
| Impersonation flow | Low | Clear return button |

**Total extraneous load: MEDIUM** — Admin panel is better organized than client panel (grouped nav) but lacks dashboard widgets.

---

## 3. Cognitive Load by Flow

### 3.1 Onboarding Flow

| Step | Intrinsic | Extraneous | Germane | Total |
|------|-----------|------------|---------|-------|
| Register | Low | Low (simple form) | Low | Low |
| Verify email | Low | Medium (no back button, no progress) | Low | Medium |
| Login | Low | Low (simple form) | Low | Low |
| Workspace welcome | Low | Medium (create vs demo decision) | Medium | Medium |
| Onboarding wizard | Medium | Medium (no progress indicator) | High | High |

**Flow total: Medium** — The onboarding flow has medium cognitive load. The wizard is the highest point because the user is learning the system (high germane load) while also dealing with missing progress feedback (medium extraneous load).

### 3.2 Content Creation Flow

| Step | Intrinsic | Extraneous | Germane | Total |
|------|-----------|------------|---------|-------|
| Navigate to playlists | Low | High (18 nav items) | Low | High |
| Create playlist | Low | Medium (wizard steps) | Low | Medium |
| Open Studio | Low | High (separate nav, confusing) | Low | High |
| Add elements | High | Medium (no templates, no guides) | High | Very High |
| Arrange elements | High | Medium (no alignment aids) | Medium | High |
| Set timeline | Medium | Low | Medium | Medium |
| Preview | Low | Low | Low | Low |
| Save | Low | Medium (no auto-save anxiety) | Low | Medium |
| Publish | Low | Medium (no confirmation) | Low | Medium |

**Flow total: Very High** — Content creation is the most cognitively demanding flow. The intrinsic load is high (canvas editing), and extraneous load adds unnecessary overhead (no templates, no alignment guides, no auto-save, confusing Studio entry point).

### 3.3 Screen Pairing Flow

| Step | Intrinsic | Extraneous | Germane | Total |
|------|-----------|------------|---------|-------|
| Navigate to screens | Low | High (18 nav items) | Low | High |
| Click add | Low | Low | Low | Low |
| Enter pairing code | Low | Low | Low | Low |
| Configure screen | Medium | Low | Medium | Medium |

**Flow total: Medium** — Screen pairing is straightforward. The main extraneous load is navigation (18 items).

### 3.4 Schedule Creation Flow

| Step | Intrinsic | Extraneous | Germane | Total |
|------|-----------|------------|---------|-------|
| Navigate to schedules | Low | High (18 nav items) | Low | High |
| Open create dialog | Low | Low | Low | Low |
| Fill form | High | High (many fields, no progressive disclosure) | Medium | Very High |
| View on calendar | Low | Medium (no overlap viz) | Low | Medium |

**Flow total: High** — Schedule creation has high intrinsic load (scheduling is complex) and high extraneous load (all fields at once, no conflict detection, no visual aids).

---

## 4. Cognitive Load Hotspots

### 4.1 Navigation (Persistent Load)

The 18-item flat sidebar imposes a **persistent extraneous load** on every page. Users must scan the list on every navigation action. This is the single largest source of unnecessary cognitive load in the product.

**Mitigation:** Group items into 4-5 categories. This reduces scanning from 18 items to 4-5 group headers + 3-5 items within the target group.

### 4.2 Studio Canvas (Task-Specific Load)

The canvas editor has high intrinsic load (spatial reasoning, element composition) compounded by extraneous load (no templates, no alignment guides, no auto-save).

**Mitigation:** Add templates (reduces intrinsic load by providing starting points), alignment guides (reduces extraneous load for arrangement), auto-save (reduces anxiety load).

### 4.3 Schedule Form (Task-Specific Load)

The schedule form presents all complexity upfront without progressive disclosure.

**Mitigation:** Progressive disclosure — show basic fields first (name, playlist, screens), reveal advanced fields on demand (recurrence, time slots, timezone).

---

## 5. Cognitive Load Reduction Priority

| Priority | Target | Current Load | Target Load | Method |
|----------|--------|-------------|-------------|--------|
| 1 | Sidebar navigation | High | Low | Group 18 items into 4-5 categories |
| 2 | Screen list (large fleets) | High | Low | Add search, filter, sort |
| 3 | Schedule form | High | Medium | Progressive disclosure |
| 4 | Studio canvas | Very High | High | Templates, alignment guides, auto-save |
| 5 | Dashboard | Medium | Low | Screen health summary, loading consistency |
| 6 | Onboarding wizard | Medium | Low | Progress indicator, skip option |

---

## 6. Hick's Law Analysis

Hick's Law: Reaction time increases logarithmically with the number of choices.

**Sidebar navigation:**
- Current: 18 choices → RT = a + b × log₂(18) ≈ a + b × 4.17
- With grouping (5 groups, 4 items avg): 5 choices → select group → 4 choices → RT = a + b × log₂(5) + a + b × log₂(4) ≈ 2a + b × (2.32 + 2.00) = 2a + b × 4.32

Grouping slightly increases total RT (two decisions vs one) but significantly reduces **scanning time** (visual search through 18 items vs 5 items + 4 items). The scanning time reduction outweighs the decision time increase.

**Workspace switcher:**
- Current (no search): N choices → linear scan → RT = O(N)
- With search: 1 choice (type query) → RT = O(1) for known targets

Search is vastly superior for N > 10 workspaces.

---

## 7. Fitts's Law Analysis

Fitts's Law: Movement time to a target depends on distance and target size.

**Mobile header touch targets:**
- Current: 32px targets, 6px gaps → MT = a + b × log₂(D/W + 1) where W=32px
- Recommended: 44px targets, 8px gaps → MT = a + b × log₂(D/W + 1) where W=44px

Larger targets reduce movement time and error rate. The current 32px targets are below the WCAG 2.5.5 minimum.

**Sidebar nav items:**
- Height: `py-2` + text = ~40px → adequate for desktop (mouse precision)
- Width: 240px - padding = ~228px → large target, easy to hit

---

## Cross-References

- See `05-navigation-analysis.md` for navigation system details
- See `06-user-journey-analysis.md` for journey friction scores
- See `10-mental-model-analysis.md` for mental model alignment
- See `12-usability-breakdown.md` for Nielsen heuristic evaluation
- See `24-accessibility-audit.md` for touch target accessibility
