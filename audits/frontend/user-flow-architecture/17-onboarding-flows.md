# Onboarding Flows

> **Evidence basis:** `ux-blueprint/07-overview-ux-blueprint.md` §9 Section 5, `product-architecture/05-primary-user-journey.md`, `05-cross-flow-relationships.md` §3.1 (critical path), `product-architecture/17-product-rules.md` PR-01
> **Purpose:** Complete user flow documentation for all onboarding scenarios: Empty Workspace, First Screen, First Media, First Playlist, First Publish

---

## FL-OB-05: Empty Workspace Onboarding

| Field | Value |
|-------|-------|
| Flow ID | FL-OB-05 |
| Flow Name | Empty Workspace Onboarding |
| Purpose | Guide new user from empty workspace to first screen |
| Primary User | New user (after registration) |
| Business Goal | 5-minute KPI; user activation; reduce abandonment |
| User Goal | Understand what to do first; get started |
| Starting Point | `/overview` (0 screens in workspace) |
| Ending Point | User clicks "Add Your First Screen" → FL-SC-01 |
| Success Criteria | User starts screen pairing flow |
| Failure Criteria | User leaves without taking action (abandonment) |
| Frequency | One-time |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: View empty workspace**
- Screen: `/overview`
- System Response: Overview detects 0 screens (SWR returns empty array)
- UI: First-time user state replaces normal widgets:
  - Welcome card: "Welcome to Cloud-Screen!"
  - 3-step guide: "1. Pair your screen → 2. Create a playlist → 3. Publish to your screen"
  - Primary CTA: "Add Your First Screen" (large, prominent button)
- State Transition: Overview → ONBOARDING state
- Micro Interaction: Welcome card fades in (MI-08, 300ms)
- Accessibility: Welcome card has `role="region"` with `aria-label="Getting started"`

**Step 2: User reads guide**
- User Action: Reads 3-step guide
- UI: Steps are visual (icons + short text), not text-heavy
- Hesitation Point: User may not understand "pair" terminology
- Prevention: Step 1 description: "Connect a TV or display to Cloud-Screen"

**Step 3: Click CTA**
- User Action: Clicks "Add Your First Screen"
- System Response: Navigate to `/screens/pair`
- Navigation: `/overview` → `/screens/pair`
- State Transition: ONBOARDING → PAIRING (FL-SC-01 begins)
- Micro Interaction: Page transition (fade, 200ms)

### Alternative Paths

**AP-1: User explores other pages first**
- User navigates to Content, Scheduling, or Team via sidebar
- Each page shows its respective empty state
- User returns to Overview and clicks CTA
- No penalty for exploration — onboarding state persists

**AP-2: User dismisses onboarding (future)**
- User clicks "Skip onboarding" (future feature)
- Overview shows normal empty state (Screen Health widget: "No screens")
- User can still access "Add Screen" from Screens page

**AP-3: User arrives from invitation (team member)**
- User accepted team invitation → registered → joined existing workspace
- Workspace is NOT empty (has screens, content)
- Overview shows normal widgets, not onboarding state
- This flow only triggers for brand-new workspaces with 0 screens

### Failure Paths

**FP-1: User abandons (closes tab)**
- Trigger: User closes browser tab or navigates away from app
- Recovery: On next login, Overview shows onboarding state again
- Onboarding persists until first screen is paired (0 screens → onboarding)

**FP-2: API failure on Overview load**
- Trigger: `useApiScreens` fails
- UI: Error state in Overview + "Retry"
- Recovery: User retries; if screens fetch succeeds and returns 0, onboarding shows

### Hesitation and Abandonment

| Point | Risk | Prevention | Recovery |
|-------|------|------------|----------|
| "What is Cloud-Screen?" | High — new users may not understand product | 3-step guide explains the workflow visually | User reads guide |
| "What is pairing?" | Medium — technical term | Step 1 description: "Connect a TV or display" | User reads description |
| "Do I need hardware?" | Medium — user may not have a screen yet | CTA is clear: "Add Your First Screen" | User can explore other pages first |
| First step hesitation | High — where to start? | Only ONE primary CTA (not multiple choices) | Single clear action |
| Abandonment | High — new users leave if confused | Minimal text, visual guide, single CTA | Onboarding persists on return |

### First-Time User Path
- This IS the first-time user path

### Returning User Path
- N/A (onboarding only shows for 0-screen workspaces)

### Power User Path
- Power user skips reading and clicks CTA immediately
- Or navigates directly to `/screens/pair` via URL

### Mobile Experience
- Welcome card: full width, centered
- 3-step guide: vertical stack (not horizontal)
- CTA: full width button

---

## FL-OB-01: First Screen Pairing

| Field | Value |
|-------|-------|
| Flow ID | FL-OB-01 |
| Flow Name | First Screen Pairing |
| Purpose | Pair the first physical screen to the workspace |
| Primary User | New user |
| Business Goal | 5-minute KPI (Step 3 of critical path); screen fleet growth |
| User Goal | Connect a screen to start displaying content |
| Starting Point | `/overview` (click CTA) or `/screens` (click "Add Screen") |
| Ending Point | Screen paired; post-pairing CTA shown |
| Success Criteria | Screen paired within 60 seconds |
| Failure Criteria | Invalid code; API failure; user abandons |
| Frequency | One-time |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

- Same as FL-SC-01 (Screen Pairing) with the following onboarding-specific differences:

**Onboarding-specific Step 1: Arrive from Overview CTA**
- User arrives at `/screens/pair` from Overview onboarding CTA
- Context: User has never paired a screen before
- UI: Wizard is the same, but help tooltips are more prominent
- Hesitation: User may not know where to find pairing code
- Prevention: Help tooltip: "The pairing code is displayed on your screen's player app. Install the Cloud-Screen Player app on your TV or display to get started."

**Onboarding-specific Step 5: Post-pairing CTA**
- After successful pairing, success state shows:
  - Checkmark animation (MI-11, 600ms)
  - "Screen paired successfully!"
  - Post-pairing CTA: "Assign Content" (→ `/content`)
- This CTA is CRITICAL for 5-minute KPI — guides user to next step
- Without this CTA, user might return to Overview and not know what to do next

### Critical Path Position

| Step | Flow | Cumulative Time |
|------|------|----------------|
| 1. Register | FL-AUTH-02 | 30s |
| 2. Workspace (auto) | FL-WS-01 | 40s |
| **3. Pair Screen** | **FL-OB-01** | **100s** |
| 4. Create Playlist | FL-OB-02 | 160s |
| 5. Publish | FL-OB-04 | 190s |

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Finding pairing code | Medium — first-time user | Prominent help tooltip with instructions |
| Code on physical screen | Medium — user must walk to screen | Clear instruction: "Check the code displayed on your screen" |
| Post-pairing confusion | Medium — what next? | Post-pairing CTA: "Assign Content" |

---

## FL-OB-03: First Media Upload

| Field | Value |
|-------|-------|
| Flow ID | FL-OB-03 |
| Flow Name | First Media Upload |
| Purpose | Upload first media file to workspace |
| Primary User | New user |
| Business Goal | Content creation enablement; 5-minute KPI support |
| User Goal | Add an image or video for playlist |
| Starting Point | `/content/media` (empty state CTA) or Studio (upload tab) |
| Ending Point | Media file in library |
| Success Criteria | At least one media file uploaded |
| Failure Criteria | File invalid; storage issue; user skips |
| Frequency | One-time |
| Business Importance | High |
| Complexity | Medium |

### Happy Path

**Step 1: View empty media library**
- Screen: `/content/media`
- System Response: Media tab shows empty state: "No media uploaded yet" + "Upload Media" CTA
- UI: Empty state with icon, message, and prominent upload button

**Step 2: Click upload**
- User Action: Clicks "Upload Media"
- System Response: Opens file picker
- Permission Check: 🔒 Owner or Editor

**Step 3: Select and upload file**
- Same as FL-MED-01 (Media Upload)
- User selects file, upload begins, progress bar shows
- Success: File appears in media grid

### Alternative Paths

**AP-1: Upload from Studio**
- User in Studio clicks "Upload" tab in media panel
- Uploads file directly from Studio
- File appears in Studio media panel

**AP-2: Use template (skip upload)**
- User creates playlist from template
- Template may include pre-built media (stock images)
- User can skip media upload for first playlist

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| File format | Low — most users have images | Show allowed formats in upload dialog |
| File size | Low — most images are small | Show size limit in upload dialog |
| Don't have media ready | Medium — user may not have files | Templates with stock media as alternative |

---

## FL-OB-02: First Playlist Creation

| Field | Value |
|-------|-------|
| Flow ID | FL-OB-02 |
| Flow Name | First Playlist Creation |
| Purpose | Create first playlist (template-guided for new users) |
| Primary User | New user |
| Business Goal | 5-minute KPI (Step 4 of critical path); content creation |
| User Goal | Create content to display on screen |
| Starting Point | `/content` (click "Create Playlist") or post-pairing CTA |
| Ending Point | Playlist created (detail or Studio) |
| Success Criteria | Playlist created within 60 seconds |
| Failure Criteria | Template confusion; Studio overwhelm; API failure |
| Frequency | One-time |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate creation**
- Screen: `/content` or post-pairing CTA ("Assign Content" → navigates to `/content`)
- User Action: Clicks "Create Playlist"
- System Response: Opens template picker dialog

**Step 2: Select template (recommended for first-time)**
- Screen: Template picker dialog
- UI: Templates with previews: "Single Image", "Image Slideshow", "Video Loop"
- User Action: Selects simple template (e.g., "Single Image")
- Hesitation Point: Template vs. blank choice
- Prevention: Templates have previews and descriptions; "Blank" is less prominent

**Step 3: Playlist created from template**
- System Response: API creates playlist from template structure
- Success: Navigate to playlist detail
- Feedback: Toast: "Playlist created from [Template Name]"
- State Transition: (none) → DRAFT

**Step 4: Add media to playlist**
- Screen: Playlist detail or Studio (depending on template)
- User Action: Adds media to playlist (from library or upload)
- If template requires media: User uploads or selects from library
- If template has pre-built media: User can publish directly

### Alternative Paths

**AP-1: Blank playlist (advanced)**
- User selects "Blank" in template picker
- Navigates to Studio (FL-PL-02)
- Higher complexity — not recommended for first-time users

**AP-2: Template with stock media**
- Template includes pre-built stock images/videos
- User can publish immediately without uploading media
- Fastest path to first publish

### Critical Path Position

| Step | Flow | Cumulative Time |
|------|------|----------------|
| 1. Register | FL-AUTH-02 | 30s |
| 2. Workspace (auto) | FL-WS-01 | 40s |
| 3. Pair Screen | FL-OB-01 | 100s |
| **4. Create Playlist** | **FL-OB-02** | **160s** |
| 5. Publish | FL-OB-04 | 190s |

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Template vs. blank | Medium — user unsure | Templates are default and recommended; previews help |
| Template selection | Low — templates are simple | Clear names and visual previews |
| Media needed | Medium — user may not have media | Templates with stock media; upload guidance |
| Studio complexity | High — if user chooses blank | Templates are recommended; blank is less prominent |

---

## FL-OB-04: First Publish

| Field | Value |
|-------|-------|
| Flow ID | FL-OB-04 |
| Flow Name | First Publish |
| Purpose | Publish first playlist to first screen — 5-minute KPI completion |
| Primary User | New user |
| Business Goal | 5-minute KPI completion; user activation; "moment of value" |
| User Goal | See content on their screen |
| Starting Point | `/content/playlists/{id}` (click "Publish to Screens") |
| Ending Point | Content playing on physical screen |
| Success Criteria | Playlist playing on screen; user sees their content |
| Failure Criteria | API failure; screen offline; user abandons before publish |
| Frequency | One-time |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: View playlist detail**
- Screen: `/content/playlists/{id}`
- UI: Playlist preview, "Publish to Screens" button (primary action)
- Context: User has 1 screen paired and 1 playlist created

**Step 2: Click publish**
- User Action: Clicks "Publish to Screens"
- System Response: Opens screen selector dialog
- UI: Dialog shows 1 screen (the one just paired) with checkbox (pre-checked or easy to check)

**Step 3: Select screen and publish**
- User Action: Checks screen checkbox, clicks "Publish Now"
- System Response: API call to assign playlist to screen
- Loading: Dialog spinner + "Publishing..."

**Step 4: Publish success**
- System Response: API returns 200
- Success: Dialog closes; toast: "Published to 1 screen"
- UI: Post-publish CTA: "View on screen" → navigates to `/screens/{id}`
- Feedback: Toast: "Published to 1 screen"
- State Transition: DRAFT → PUBLISHED

**Step 5: Moment of value**
- User navigates to screen detail or looks at physical screen
- Content is playing on the physical screen
- This is the "moment of value" — user sees their work displayed
- 5-minute KPI achieved: Registration → Workspace → Screen → Playlist → Publish

### Critical Path Position

| Step | Flow | Cumulative Time |
|------|------|----------------|
| 1. Register | FL-AUTH-02 | 30s |
| 2. Workspace (auto) | FL-WS-01 | 40s |
| 3. Pair Screen | FL-OB-01 | 100s |
| 4. Create Playlist | FL-OB-02 | 160s |
| **5. Publish** | **FL-OB-04** | **190s (3.2 min)** |

**5-minute KPI: 190s used out of 300s budget = 63%. 110s buffer for errors, hesitation, and network latency.**

### Alternative Paths

**AP-1: Publish from Overview quick action**
- User on Overview clicks "Create Playlist" → creates → publishes
- Same outcome but different starting point

**AP-2: Screen offline during first publish**
- Trigger: Paired screen hasn't connected yet or lost connection
- UI: Screen shows offline badge in dialog; warning: "Offline screens will receive content when they reconnect"
- User can proceed — content will sync when screen comes online
- Hesitation: User may be confused why screen is offline
- Prevention: Warning explains behavior clearly

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to publish. Try again."
- Recovery: User retries

**FP-2: Screen deleted between pairing and publishing**
- Trigger: Screen was deleted (unlikely in first-time flow)
- UI: Dialog shows no screens; "No screens available. Add a screen first." + "Add Screen" link
- Recovery: User pairs another screen

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Screen selection | Low — only 1 screen to select | Checkbox is easy to check |
| "Will it work?" | Medium — user anxious about result | Post-publish CTA: "View on screen" provides immediate feedback |
| Screen offline | Medium — user may think it failed | Warning explains: "Content will sync when screen reconnects" |

### UX Notes
- First publish is the most important moment in the product — it's the "aha" moment
- Post-publish CTA ("View on screen") is critical — it bridges the gap between software and hardware
- If screen is online, content appears within seconds — user sees immediate result
- If screen is offline, user should understand it will sync later (not a failure)
- This flow completes the 5-minute KPI critical path
- After first publish, user has experienced the full product value cycle

---

## Onboarding Flow Chain

```
FL-AUTH-02 (Register)
    │
FL-WS-01 (Auto Workspace)
    │
FL-OB-05 (Empty Workspace Onboarding)
    │
    ▼
FL-OB-01 (First Screen Pairing)
    │
    ▼ (post-pairing CTA: "Assign Content")
FL-OB-03 (First Media Upload) ── optional if template has stock media
    │
    ▼
FL-OB-02 (First Playlist Creation)
    │
    ▼
FL-OB-04 (First Publish) ── 5-MINUTE KPI COMPLETE
    │
    ▼
User sees content on screen (MOMENT OF VALUE)
```

### Time Budget

| Step | Target | Cumulative | Buffer Used |
|------|--------|------------|-------------|
| Register | 30s | 30s | — |
| Workspace | 10s | 40s | — |
| Pair Screen | 60s | 100s | — |
| Create Playlist | 60s | 160s | — |
| Publish | 30s | 190s | — |
| **Buffer** | **110s** | **300s** | **Errors, hesitation, network** |

---

## Cross-References

- See `05-cross-flow-relationships.md` §3.1 for critical path analysis
- See `08-screen-flows.md` FL-SC-01 for detailed pairing flow
- See `09-media-flows.md` FL-MED-01 for detailed upload flow
- See `10-playlist-flows.md` FL-PL-01 for detailed creation flow
- See `11-publishing-scheduling-flows.md` FL-PUB-01 for detailed publish flow
- See `ux-blueprint/07-overview-ux-blueprint.md` §9 Section 5 for first-time user section
- See `product-architecture/05-primary-user-journey.md` for primary journey definition
- See `product-architecture/17-product-rules.md` PR-01 for 5-minute KPI
