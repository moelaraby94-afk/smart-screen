# IA Options — Three Alternative Approaches

> **Evidence basis:** `01-current-ia-analysis.md`, `product-architecture/04-product-hierarchy.md`, `product-architecture/09-product-modules.md`, locked product decisions
> **Purpose:** Design three fundamentally different IA approaches, each with full analysis — advantages, disadvantages, scalability, learning curve, enterprise suitability, maintenance cost, future extensibility, expected UX quality

---

## 1. Design Constraints (All Options)

All three options must satisfy these locked constraints:

| Constraint | Value | Evidence |
|-----------|-------|----------|
| Maximum sidebar items | 7 | Locked product decision |
| Entity priority | Workspace > Screens > Playlists > Media > Schedules > Users > Analytics > Branches | Locked product decision |
| Dashboard = Overview | Not analytics-heavy | Locked product decision |
| 5-minute KPI | First publish < 5 min | Locked product decision |
| Evolution, not revolution | Preserve existing stack and shell | Locked product decision |
| Scheduling is optional | Immediate publish is default | Locked product decision |
| Screen pairing uses wizard | Guided flow | Locked product decision |
| Media upload from both library and Studio | Dual entry point | Locked product decision |
| Branches are optional | Not a top-level nav item | DD-03 |
| Studio is not a nav item | Accessed via playlist edit | DD-02 |
| Bilingual EN/AR with RTL | All text must be translated | Locked product decision |

---

## 2. Option A: Entity-Oriented IA

### 2.1 Philosophy

Navigation is organized around **product entities**. Each sidebar item represents a primary entity. Sub-navigation within each section exposes related entities and actions.

### 2.2 Sidebar Structure

```
1. Overview          (dashboard — no entity, status view)
2. Screens           (Screen entity + Branch filter)
3. Content           (Playlist entity + Media entity — tabs)
4. Scheduling        (Schedule entity)
5. Analytics         (aggregated data — no entity)
6. Team              (User entity + Role)
7. Settings          (configuration — tabs)
```

### 2.3 Route Hierarchy

```
/{locale}
  ├── (auth)/
  │    ├── /login
  │    ├── /register
  │    └── /forgot-password
  ├── (shell)/
  │    ├── /overview
  │    ├── /screens
  │    │    ├── /screens                    (list + branch filter)
  │    │    ├── /screens/{id}               (detail)
  │    │    └── /screens/pair               (pairing wizard)
  │    ├── /content
  │    │    ├── /content/playlists          (playlist library)
  │    │    ├── /content/playlists/{id}     (playlist detail/preview)
  │    │    ├── /content/playlists/{id}/studio  (canvas editor)
  │    │    ├── /content/media              (media library)
  │    │    └── /content/media/upload       (upload — dialog, not page)
  │    ├── /scheduling
  │    │    ├── /scheduling                 (calendar)
  │    │    └── /scheduling/{id}            (schedule detail — future)
  │    ├── /analytics
  │    ├── /team
  │    ├── /settings
  │    │    ├── /settings                   (default: profile)
  │    │    ├── /settings/workspace
  │    │    ├── /settings/billing
  │    │    ├── /settings/notifications
  │    │    ├── /settings/security
  │    │    └── /settings/api
  │    └── /notifications                   (history — accessed via bell)
  └── (admin)/
       └── /admin/...
```

### 2.4 Analysis

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Advantages | — | Matches entity priority directly; clear ownership; each section is self-contained; familiar pattern (most SaaS use entity-oriented IA) |
| Disadvantages | — | "Content" combines two entities (Playlists + Media) which may confuse users expecting one-entity-per-section; Scheduling as a separate section may feel disconnected from Content |
| Scalability | 8/10 | New entities can be added as new sections (up to 7 max); sub-navigation within sections absorbs features; but 7-item limit is a hard ceiling |
| Learning curve | Low | Entity-oriented IA is the most common SaaS pattern; users intuitively understand "Screens = my screens, Content = my content" |
| Enterprise suitability | 7/10 | Clear entity boundaries support RBAC; but doesn't group by workflow (e.g., "publish" spans Content + Screens + Scheduling) |
| Maintenance cost | Low | Each section is independent; changes to one section don't affect others; route structure is predictable |
| Future extensibility | 7/10 | New features go into existing sections via tabs/sub-sections; but Content section may become overloaded with templates, versioning, A/B testing |
| Expected UX quality | 7/10 | Clean, predictable, but may require more clicks for cross-entity workflows (create playlist → assign to screen → schedule) |

### 2.5 Key Trade-off

Entity-oriented IA optimizes for **findability** (where is X?) at the cost of **workflow efficiency** (how do I do X that spans multiple entities?).

---

## 3. Option B: Task-Oriented IA

### 3.1 Philosophy

Navigation is organized around **user tasks and workflows**. Each sidebar item represents a primary task. Sub-navigation exposes steps within each task.

### 3.2 Sidebar Structure

```
1. Overview          (monitor — status, health, activity)
2. Screens           (manage devices — list, pair, troubleshoot)
3. Create            (content creation — playlists, media, templates, Studio)
4. Publish           (distribution — scheduling, immediate publish, assignments)
5. Insights          (analytics — screen health, content performance)
6. People            (team management — members, roles, invites)
7. Settings          (configuration — profile, workspace, billing, API, security)
```

### 3.3 Route Hierarchy

```
/{locale}
  ├── (auth)/...
  ├── (shell)/
  │    ├── /overview
  │    ├── /screens
  │    │    ├── /screens                    (list)
  │    │    ├── /screens/{id}               (detail)
  │    │    └── /screens/pair               (pairing wizard)
  │    ├── /create
  │    │    ├── /create/playlists           (playlist library)
  │    │    ├── /create/playlists/{id}      (playlist detail/preview)
  │    │    ├── /create/playlists/{id}/studio
  │    │    ├── /create/media              (media library)
  │    │    └── /create/templates          (template gallery — future)
  │    ├── /publish
  │    │    ├── /publish                    (publish dashboard — active assignments)
  │    │    ├── /publish/schedule           (calendar view)
  │    │    └── /publish/assign             (quick assign playlist to screen)
  │    ├── /insights
  │    │    ├── /insights                   (overview analytics)
  │    │    ├── /insights/screens           (screen health analytics)
  │    │    └── /insights/content           (content performance)
  │    ├── /people
  │    │    ├── /people                     (team list)
  │    │    └── /people/invite              (invite flow)
  │    ├── /settings
  │    │    ├── /settings                   (default: profile)
  │    │    ├── /settings/workspace
  │    │    ├── /settings/billing
  │    │    ├── /settings/notifications
  │    │    ├── /settings/security
  │    │    └── /settings/api
  │    └── /notifications
  └── (admin)/...
```

### 3.4 Analysis

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Advantages | — | Workflow-aligned (create → publish); groups related tasks; "Publish" section unifies scheduling and assignment; reduces cognitive load for task completion |
| Disadvantages | — | "Create" and "Publish" are verbs, not nouns — less intuitive for findability ("where are my playlists?" → "Create" section); "Publish" mixes scheduling and assignment which are different mental models; terminology is non-standard for SaaS |
| Scalability | 6/10 | Task categories are rigid; new tasks may not fit existing 7; "Create" section could become a dumping ground |
| Learning curve | Medium | Task-oriented IA is less common in SaaS; users must learn the task categorization; "Publish" concept may confuse (is it scheduling? is it assignment?) |
| Enterprise suitability | 6/10 | RBAC is harder to map (roles are entity-based, not task-based); "People" instead of "Team" is non-standard |
| Maintenance cost | Medium | Task boundaries are subjective; new features may not clearly belong to one task; "Create" vs "Publish" boundary is fuzzy |
| Future extensibility | 5/10 | New tasks may not fit 7 categories; adding "Moderate" (approval workflow) or "Automate" (AI) would require restructuring |
| Expected UX quality | 6/10 | Good for guided workflows but poor for ad-hoc navigation ("I just want to see my media") |

### 3.5 Key Trade-off

Task-oriented IA optimizes for **workflow efficiency** at the cost of **findability** and **scalability**.

---

## 4. Option C: Hybrid Entity-Workflow IA

### 4.1 Philosophy

Navigation is primarily **entity-oriented** (like Option A) but with **workflow shortcuts** embedded in the Overview and cross-navigation between sections. The sidebar uses entity names for findability, while quick actions and contextual links handle workflow efficiency.

### 4.2 Sidebar Structure

```
1. Overview          (status + quick actions + recent activity)
2. Screens           (entity: Screen + Branch filter)
3. Content           (entity: Playlist + Media — tabs)
4. Scheduling        (entity: Schedule — optional)
5. Analytics         (insights)
6. Team              (entity: User + Role)
7. Settings          (configuration — tabs)
```

### 4.3 Route Hierarchy

```
/{locale}
  ├── (auth)/
  │    ├── /login
  │    ├── /register
  │    └── /forgot-password
  ├── (shell)/
  │    ├── /overview                       (status + quick actions)
  │    ├── /screens
  │    │    ├── /screens                    (list + search + filter)
  │    │    ├── /screens/{id}               (detail + quick actions)
  │    │    └── /screens/pair               (pairing wizard)
  │    ├── /content
  │    │    ├── /content                    (default: playlists tab)
  │    │    ├── /content/playlists/{id}     (playlist detail/preview)
  │    │    ├── /content/playlists/{id}/studio  (canvas editor)
  │    │    └── /content/media              (media tab)
  │    ├── /scheduling
  │    │    └── /scheduling                 (calendar + creation dialog)
  │    ├── /analytics
  │    ├── /team
  │    ├── /settings
  │    │    ├── /settings                   (default: profile)
  │    │    ├── /settings/workspace
  │    │    ├── /settings/billing
  │    │    ├── /settings/notifications
  │    │    ├── /settings/security
  │    │    └── /settings/api
  │    └── /notifications                   (history — via bell)
  └── (admin)/
       └── /admin/...
```

### 4.4 Workflow Shortcuts (Embedded, Not in Sidebar)

The hybrid approach solves workflow efficiency through **cross-navigation** rather than task-based sidebar items:

| Workflow | Shortcut Path | How |
|----------|--------------|-----|
| Create → Publish | Playlist detail → "Publish to Screens" button | Direct action from playlist detail |
| Pair → Assign → Publish | Post-pairing CTA → "Assign content" → Select playlist → Publish | Guided post-action flow |
| Screen → Edit content | Screen detail → "Edit current playlist" link | Cross-navigation to Studio |
| Schedule → Screen | Schedule calendar → Click schedule → "View screen" link | Cross-navigation to screen detail |
| Media → Playlist | Media detail → "Used in [N] playlists" → Click playlist | Cross-navigation to playlist detail |
| Overview → Any action | Quick action buttons on Overview | Direct navigation to create/pair/schedule |

### 4.5 Analysis

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Advantages | — | Entity-oriented sidebar for findability + workflow shortcuts for efficiency; familiar SaaS pattern; scales well; clear module boundaries; matches product architecture exactly |
| Disadvantages | — | "Content" still combines two entities; workflow shortcuts require careful cross-navigation design; more complex than pure entity-oriented (but complexity is in cross-links, not structure) |
| Scalability | 9/10 | Entity sections absorb new features via tabs/sub-sections; workflow shortcuts are additive (new shortcuts don't require structural changes); 7-item limit has room |
| Learning curve | Low | Entity-oriented sidebar is intuitive; workflow shortcuts are discoverable (buttons, links, CTAs); no new mental model to learn |
| Enterprise suitability | 9/10 | Entity boundaries map directly to RBAC; module boundaries match product architecture; supports bulk operations within each entity section |
| Maintenance cost | Low | Entity sections are independent; cross-navigation links are explicit and documented; route structure is predictable and matches product architecture |
| Future extensibility | 9/10 | New features go into existing sections; new workflow shortcuts are additive; extension patterns defined in `product-architecture/20-future-extensibility.md` apply directly |
| Expected UX quality | 8/10 | High findability (entity-oriented) + high workflow efficiency (shortcuts) + clear hierarchy + no dead ends (CTAs on every page) |

### 4.6 Key Trade-off

Hybrid IA optimizes for **both findability and workflow efficiency** at the cost of **slightly more complex cross-navigation design** (but this complexity is in links, not structure).

---

## 5. Option D: Progressive Disclosure IA (Bonus)

### 5.1 Philosophy

Navigation starts with **minimal sidebar items** (3-4) and progressively reveals more as the user's workspace grows. New users see a simplified IA; power users see the full IA.

### 5.2 Sidebar Structure (Progressive)

```
Stage 1 (No screens):
1. Overview          (welcome + "Add Screen" CTA)
2. Screens           (pairing wizard)
3. Settings          (profile)

Stage 2 (Has screens, no content):
1. Overview
2. Screens
3. Content           (playlist creation + media upload)
4. Settings

Stage 3 (Has content, publishing):
1. Overview
2. Screens
3. Content
4. Scheduling
5. Analytics
6. Team
7. Settings
```

### 5.3 Analysis

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Advantages | — | Minimizes cognitive load for new users; aligns with 5-minute KPI; reveals complexity only when needed |
| Disadvantages | — | Sidebar changes as user adds features — disorienting; users may not discover features they haven't "unlocked"; inconsistent mental model; hard to support ("where is Scheduling?" — "you need to create content first") |
| Scalability | 7/10 | Progressive stages can accommodate growth; but stage transitions are jarring |
| Learning curve | Low initially, High over time | Easy at first, but users must re-learn navigation as stages unlock |
| Enterprise suitability | 5/10 | Enterprise users want full control immediately; progressive disclosure feels patronizing; inconsistent across team members at different stages |
| Maintenance cost | High | Must maintain multiple sidebar configurations; stage transition logic; testing all combinations |
| Future extensibility | 6/10 | New features need a stage to belong to; stage logic becomes complex |
| Expected UX quality | 6/10 | Great for onboarding, poor for experienced users |

### 5.4 Key Trade-off

Progressive disclosure IA optimizes for **onboarding simplicity** at the cost of **consistency and enterprise suitability**.

---

## Cross-References

- See `01-current-ia-analysis.md` for the current IA problems these options solve
- See `03-ia-comparison.md` for the comparison and scoring of all options
- See `product-architecture/04-product-hierarchy.md` for the locked product hierarchy
- See `product-architecture/09-product-modules.md` for module definitions
- See `product-architecture/16-navigation-principles.md` for navigation principles
