# Primary User Journey

> **Evidence basis:** `27-user-flows.md` (audit), `06-user-journey-analysis.md` (transformation), `09-workflow-analysis.md` (transformation), locked product decisions
> **Purpose:** Define the single most important user journey — the 5-minute time-to-first-screen

---

## 1. The Primary Journey

> **Goal:** A new customer signs up, connects their first screen, creates content, and publishes it — all in under 5 minutes.

This is the journey that defines the product. Every architectural decision must serve this journey. If a feature adds friction to this journey, it must be reconsidered.

---

## 2. Journey Steps

### Step 1: Sign Up (Target: 30 seconds)

| Attribute | Value |
|-----------|-------|
| **Action** | User creates an account |
| **Entry point** | Marketing page or direct registration link |
| **Current flow** | `/register` → form (name, email, password) → verify email → login |
| **Target flow** | `/register` → form (name, email, password) → workspace created automatically → skip to workspace setup |
| **Friction points** | Email verification delay, separate login step after registration |
| **Architecture requirement** | Registration should auto-create a workspace and auto-login. Email verification can be async (post-onboarding). |

**Evidence:** `06-auth-and-session.md` §6.7 (current auth flow); `27-user-flows.md` §27.3 (registration flow).

### Step 2: Workspace Setup (Target: 30 seconds)

| Attribute | Value |
|-----------|-------|
| **Action** | User names their workspace and optionally selects a demo or blank start |
| **Entry point** | Workspace welcome screen (after registration) |
| **Current flow** | `WorkspaceWelcome` → "Create New Workspace" or "Bootstrap Demo" → `OnboardingWizard` |
| **Target flow** | Auto-created workspace → user names it → "Add your first screen" CTA |
| **Friction points** | Current onboarding wizard has no skip option (`27-user-flows.md` §27.9) |
| **Architecture requirement** | Workspace is auto-created with a default name (editable later). The primary CTA is "Connect Your First Screen." Demo content is offered as an option, not a required step. |

**Evidence:** `07-workspace-management.md` §7.11 (WorkspaceWelcome, OnboardingWizard); `transformation/06-user-journey-analysis.md` Journey 1.

### Step 3: Connect First Screen (Target: 2 minutes)

| Attribute | Value |
|-----------|-------|
| **Action** | User pairs their first physical screen to the platform |
| **Entry point** | "Connect Your First Screen" CTA on workspace welcome or Overview |
| **Current flow** | Screen setup modal → enter pairing code → screen paired |
| **Target flow** | Pairing Wizard → Step 1: "Enter the code on your screen" → Step 2: "Name your screen" → Step 3: "Done! Your screen is connected" |
| **Friction points** | Current setup modal is not a wizard — no guided flow, no progress indication |
| **Architecture requirement** | Screen pairing MUST use a Wizard (locked decision). The wizard has 2-3 steps maximum. The wizard is accessible from Overview quick actions and from the Screens section. |

**Evidence:** `09-screens-feature.md` §9.8 (current ScreenSetupModal); locked product decision (Screen Pairing Wizard).

### Step 4: Create Content (Target: 1.5 minutes)

| Attribute | Value |
|-----------|-------|
| **Action** | User creates a playlist with content to display |
| **Entry point** | Post-pairing CTA: "Now let's show something on your screen" |
| **Current flow** | Navigate to Playlists → Create → Studio (blank canvas) → add media → arrange |
| **Target flow** | Template picker → select template → (optional) upload logo/image → preview → "Looks good!" |
| **Friction points** | Studio is a blank canvas with no templates — high cognitive load for first-time users |
| **Architecture requirement** | Content creation for first-time users MUST offer templates (locked decision implies this). Templates are pre-built playlists with placeholder media. User picks a template, optionally replaces placeholder media, and proceeds to publish. Studio is available for advanced editing but not required for first publish. |

**Evidence:** `10-playlists-and-studio.md` §10.12 (Studio is blank canvas); `transformation/06-user-journey-analysis.md` Journey 4 (Studio cognitive load: HIGH); `transformation/08-feature-priorities.md` F-MP-13 (templates).

### Step 5: Publish to Screen (Target: 30 seconds)

| Attribute | Value |
|-----------|-------|
| **Action** | User publishes the playlist to their connected screen |
| **Entry point** | Post-creation CTA: "Publish to your screen" |
| **Current flow** | Navigate to Schedules → Create schedule → select playlist → select screens → set time → save |
| **Target flow** | "Publish to [Screen Name]" button → confirm → done |
| **Friction points** | Current flow requires creating a schedule — too many steps for first publish |
| **Architecture requirement** | Publishing defaults to IMMEDIATE (locked decision). No schedule is required. The publish action assigns the playlist to the selected screen(s) with "always active" scheduling. Scheduling is available as an opt-in advanced option. |

**Evidence:** `12-schedules-feature.md` §12.8 (current schedule creation); locked product decision (Scheduling is optional).

---

## 3. Journey Timeline

```
Time:  0:00 ──── 0:30 ──── 1:00 ──── 1:30 ──── 2:00 ──── 2:30 ──── 3:00 ──── 3:30 ──── 4:00 ──── 4:30 ──── 5:00
       │         │         │         │         │         │         │         │         │         │         │
       ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼
      Sign Up ──→ Workspace ──→ Connect Screen ──────→ Create Content ──────→ Publish ──→ Done!
      (30s)      Setup (30s)   (2 min wizard)          (1.5 min template)     (30s)        ✅ < 5 min
```

---

## 4. Journey Architecture Requirements

### 4.1 Friction Budget

| Step | Time Budget | Friction Allowed |
|------|------------|-----------------|
| Sign Up | 30s | Minimal — auto-create workspace, auto-login |
| Workspace Setup | 30s | Minimal — default name, single CTA |
| Connect Screen | 2 min | Low — wizard with 2-3 steps |
| Create Content | 1.5 min | Low — template picker, minimal editing |
| Publish | 30s | Zero — single button click |

### 4.2 Architecture Implications

| Requirement | Architecture Decision |
|-------------|----------------------|
| Auto-create workspace on registration | Registration flow creates workspace, skips workspace welcome |
| Pairing wizard | New wizard component with 2-3 steps, progress indicator |
| Template picker | Template gallery with pre-built playlists, placeholder media |
| Immediate publish | Publish action creates "always active" schedule by default |
| No required scheduling | Scheduling section is secondary, not in the primary journey |
| Post-action CTAs | Each step ends with a CTA to the next step (not a dead end) |

### 4.3 State Flow During Primary Journey

```
[Not Authenticated]
    │
    ▼ (register)
[Authenticated, No Workspace]
    │
    ▼ (auto-create workspace)
[Authenticated, Active Workspace, No Screens]
    │
    ▼ (pairing wizard)
[Authenticated, Active Workspace, 1 Screen, No Content]
    │
    ▼ (template picker → create playlist)
[Authenticated, Active Workspace, 1 Screen, 1 Playlist]
    │
    ▼ (publish immediately)
[Authenticated, Active Workspace, 1 Screen, 1 Playlist, Published]
    │
    ▼ (redirect to Overview)
[Primary Journey Complete — < 5 minutes]
```

---

## 5. Post-Journey: What Happens Next

After the primary journey, the user is on the Overview page. The Overview must now show:

1. **Screen health:** "1 screen online" (green status)
2. **Current content:** "Now playing: [Playlist Name]"
3. **Quick actions:** "Add another screen", "Create more content", "Invite team member"
4. **Recent activity:** "Screen paired", "Playlist created", "Content published"

This transitions the user from the onboarding journey to the daily usage journey.

---

## 6. Current State vs. Target State

| Step | Current Time (est.) | Target Time | Gap | Primary Blocker |
|------|---------------------|-------------|-----|-----------------|
| Sign Up | 2-3 min (email verification) | 30s | 1.5-2.5 min | Email verification before login |
| Workspace Setup | 1-2 min (wizard, no skip) | 30s | 30-90s | No skip, demo content step |
| Connect Screen | 1-2 min (setup modal) | 2 min | 0 | Already close, needs wizard UX |
| Create Content | 5-10 min (blank Studio) | 1.5 min | 3.5-8.5 min | No templates, blank canvas |
| Publish | 2-3 min (schedule creation) | 30s | 1.5-2.5 min | Scheduling required |
| **Total** | **11-20 min** | **5 min** | **6-15 min** | Templates + immediate publish + auto-workspace |

**Evidence:** `transformation/06-user-journey-analysis.md` Journey 1 (onboarding friction: 4/5); `transformation/09-workflow-analysis.md` §1.1 (workflow friction: 3/5).

---

## Cross-References

- See `06-secondary-journeys.md` for secondary journeys (daily usage, team management, etc.)
- See `07-core-user-goals.md` for user goals that motivate this journey
- See `08-jobs-to-be-done.md` for JTBD framework
- See `09-product-modules.md` for modules that support this journey
- See `17-product-rules.md` for rules derived from this journey
- See `transformation/06-user-journey-analysis.md` Journey 1 for current-state analysis
- See `transformation/27-user-flows.md` (audit) for current user flow documentation
