# State Machines

> **Evidence basis:** `01-flow-principles.md`, `ux-blueprint/02-state-guidelines.md`, `information-architecture/07-page-states.md`, `product-architecture/13-frontend-state-boundaries.md`
> **Purpose:** Define state machines for key entities — Screen, Playlist, Media, Schedule, Team Member, Workspace, and User Session

---

## 1. Screen State Machine

```
                    ┌─────────┐
                    │  PAIRED  │
                    │ (initial)│
                    └────┬────┘
                         │
                    Content assigned
                         │
                         ▼
              ┌─────────────────┐
              │     ONLINE       │◄──────────────────┐
              │ (playing content)│                    │
              └────┬───────┬────┘                    │
                   │       │                         │
         Connection lost   Warning detected           │
                   │       │                         │
                   ▼       ▼                         │
         ┌──────────┐  ┌──────────┐                 │
         │ OFFLINE   │  │ WARNING  │                 │
         │(no signal)│  │(degraded)│                 │
         └────┬─────┘  └────┬─────┘                 │
              │              │                       │
       Connection restored   Warning resolved        │
              │              │                       │
              └──────────────┴───────────────────────┘
              
              Any state:
                   │
              Delete screen
                   │
                   ▼
              ┌──────────┐
              │ DELETED   │
              │ (terminal)│
              └──────────┘
```

### Screen States

| State | Description | UI Indicator | Evidence |
|-------|-------------|-------------|----------|
| PAIRED | Screen paired but no content assigned | Gray badge "No Content" | `08-screens-ux-blueprint.md` |
| ONLINE | Screen connected and playing content | Green badge "Online" | VH-04 |
| OFFLINE | Screen disconnected | Red badge "Offline" | VH-04 |
| WARNING | Screen connected but degraded (storage, sync issue) | Amber badge "Warning" | VH-04 |
| DELETED | Screen removed from workspace | Removed from list | — |

### Screen State Transitions

| From | To | Trigger | User Feedback | Evidence |
|------|-----|---------|--------------|----------|
| (none) | PAIRED | Pairing wizard complete | Toast + checkmark animation | FL-SC-01 |
| PAIRED | ONLINE | Content assigned + screen connects | Toast: "Content assigned" | FL-PUB-01 |
| ONLINE | OFFLINE | Connection lost (Socket.IO event) | Toast (red) + bell notification | `04-feature-ux-standards.md` §1 |
| OFFLINE | ONLINE | Connection restored (Socket.IO event) | Bell notification (no toast) | — |
| ONLINE | WARNING | Degraded state detected | Bell notification (amber) | — |
| WARNING | ONLINE | Warning resolved | Bell notification (no toast) | — |
| OFFLINE | WARNING | Partial connection | Bell notification (amber) | — |
| Any | DELETED | User deletes screen | Toast: "Screen deleted" + redirect | FL-SC-04 |

---

## 2. Playlist State Machine

```
┌──────────┐     Save     ┌──────────┐    Publish    ┌──────────┐
│  NEW      │─────────────→│  DRAFT    │─────────────→│ PUBLISHED │
│ (creating)│              │ (saved)   │              │ (live)    │
└──────────┘              └────┬─────┘              └────┬─────┘
                               │                         │
                          Edit (Studio)              Unpublish
                               │                         │
                               ▼                         ▼
                          ┌──────────┐              ┌──────────┐
                          │ EDITING   │              │ UNPUBLISHED│
                          │ (in Studio)│             │ (draft)   │
                          └────┬─────┘              └──────────┘
                               │
                          Save
                               │
                               ▼
                          ┌──────────┐
                          │  DRAFT    │
                          └──────────┘

          Any state:
               │
          Delete playlist
               │
               ▼
          ┌──────────┐
          │ DELETED   │
          │ (terminal)│
          └──────────┘
```

### Playlist States

| State | Description | UI Indicator | Evidence |
|-------|-------------|-------------|----------|
| NEW | Being created, not yet saved | (In Studio, no badge) | `09-content-studio-ux-blueprint.md` |
| DRAFT | Saved but not published | Gray badge "Draft" | VH-04 |
| EDITING | Being edited in Studio | (In Studio, no badge) | — |
| PUBLISHED | Assigned to one or more screens | Green badge "Published" | VH-04 |
| UNPUBLISHED | Was published, now removed from all screens | Gray badge "Draft" | — |
| DELETED | Removed from workspace | Removed from list | — |

### Playlist State Transitions

| From | To | Trigger | User Feedback |
|------|-----|---------|--------------|
| (none) | NEW | User clicks "Create Playlist" | Navigate to Studio or template |
| NEW | DRAFT | User saves in Studio | Toast: "Playlist saved" |
| DRAFT | EDITING | User opens Studio | Navigate to Studio |
| EDITING | DRAFT | User saves in Studio | Toast: "Playlist saved" |
| DRAFT | PUBLISHED | User publishes to screens | Toast: "Published to [N] screens" |
| PUBLISHED | UNPUBLISHED | User unpublishes (removes from all screens) | Toast: "Unpublished" |
| UNPUBLISHED | DRAFT | (Automatic — same as draft) | — |
| PUBLISHED | EDITING | User opens Studio from published playlist | Navigate to Studio |
| Any | DELETED | User deletes playlist | Toast: "Playlist deleted" |

---

## 3. Media State Machine

```
┌──────────┐    Upload     ┌──────────┐    Delete     ┌──────────┐
│ SELECTED  │─────────────→│ UPLOADED  │─────────────→│ DELETED   │
│ (choosing)│              │ (in library)│             │ (terminal)│
└────┬─────┘              └──────────┘               └──────────┘
     │
  Upload fails
     │
     ▼
┌──────────┐
│  ERROR    │── Retry ──→ UPLOADED
│ (failed)  │
└──────────┘
```

### Media States

| State | Description | UI Indicator |
|-------|-------------|-------------|
| SELECTED | File chosen, upload not started | Progress bar (0%) |
| UPLOADING | Upload in progress | Progress bar (0-100%) |
| UPLOADED | Upload complete, in library | Thumbnail in grid |
| ERROR | Upload failed | Red error indicator |
| DELETED | Removed from library | Removed from grid |

---

## 4. Schedule State Machine

```
┌──────────┐    Save       ┌──────────┐    Activate    ┌──────────┐
│ CREATING  │─────────────→│  ACTIVE   │◄─────────────→│ INACTIVE  │
│ (in dialog)│              │ (running) │   Deactivate  │ (paused)  │
└──────────┘              └────┬─────┘              └──────────┘
                               │
                          Delete
                               │
                               ▼
                          ┌──────────┐
                          │ DELETED   │
                          │ (terminal)│
                          └──────────┘
```

### Schedule States

| State | Description | UI Indicator | Evidence |
|-------|-------------|-------------|----------|
| CREATING | Being created in dialog | (In dialog) | `10-scheduling-analytics-team-ux-blueprint.md` |
| ACTIVE | Schedule is active and will trigger | Blue/green event on calendar | — |
| INACTIVE | Schedule paused by user | Muted/gray event on calendar | — |
| CONFLICT | Overlaps with another schedule | Red indicator on calendar | FL-SCH-02 |
| DELETED | Removed | Removed from calendar | — |

### Schedule State Transitions

| From | To | Trigger | User Feedback |
|------|-----|---------|--------------|
| (none) | CREATING | User clicks "Create Schedule" | Dialog opens |
| CREATING | ACTIVE | User saves schedule | Toast: "Schedule created" |
| CREATING | CONFLICT | API detects overlap | Conflict details shown |
| CONFLICT | ACTIVE | User resolves conflict + re-saves | Toast: "Schedule created" |
| ACTIVE | INACTIVE | User deactivates | Toast: "Schedule deactivated" |
| INACTIVE | ACTIVE | User activates | Toast: "Schedule activated" |
| ACTIVE | DELETED | User deletes | Toast: "Schedule deleted" |
| INACTIVE | DELETED | User deletes | Toast: "Schedule deleted" |

---

## 5. Team Member State Machine

```
                    ┌──────────┐
                    │ INVITED   │
                    │ (pending) │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
          Accept     Decline    Expire
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  ACTIVE   │ │ DECLINED  │ │ EXPIRED   │
        │ (member)  │ │ (terminal)│ │ (terminal)│
        └────┬─────┘ └──────────┘ └──────────┘
             │
        Remove member
             │
             ▼
        ┌──────────┐
        │ REMOVED   │
        │ (terminal)│
        └──────────┘
```

### Team Member States

| State | Description | UI Indicator | Evidence |
|-------|-------------|-------------|----------|
| INVITED | Invitation sent, not yet accepted | "Pending" badge in pending list | `10-scheduling-analytics-team-ux-blueprint.md` |
| ACTIVE | Member joined workspace | Avatar in active members list | — |
| DECLINED | Invitee declined invitation | Removed from pending list | — |
| EXPIRED | Invitation expired (future) | Removed from pending list | — |
| REMOVED | Owner removed member | Removed from active list | — |

### Team Member State Transitions

| From | To | Trigger | User Feedback |
|------|-----|---------|--------------|
| (none) | INVITED | Owner sends invitation | Toast: "Invitation sent" |
| INVITED | ACTIVE | Invitee accepts | Toast (realtime): "[Name] joined" |
| INVITED | DECLINED | Invitee declines | Toast (realtime): "[email] declined" |
| INVITED | EXPIRED | Time limit reached (future) | Removed from pending |
| INVITED | REMOVED | Owner cancels invite | Toast: "Invitation cancelled" |
| ACTIVE | REMOVED | Owner removes member | Toast: "[Name] removed" |

---

## 6. Workspace State Machine

```
┌──────────┐    Setup      ┌──────────┐    Suspend     ┌──────────┐
│ CREATING  │─────────────→│  ACTIVE   │─────────────→│SUSPENDED  │
│ (initial) │              │ (in use)  │              │ (blocked) │
└──────────┘              └────┬─────┘              └────┬─────┘
                               │                         │
                          Delete                   Activate
                               │                         │
                               ▼                         │
                          ┌──────────┐                   │
                          │ DELETED   │◄─────────────────┘
                          │ (terminal)│
                          └──────────┘
```

### Workspace States

| State | Description | UI Indicator |
|-------|-------------|-------------|
| CREATING | Being set up (onboarding wizard) | Welcome screen |
| ACTIVE | Normal operation | Normal UI |
| SUSPENDED | Admin suspended (no access) | "Workspace suspended" message |
| DELETED | Permanently removed | Redirect to login |

---

## 7. User Session State Machine

```
┌──────────┐    Login      ┌──────────┐    Timeout     ┌──────────┐
│UNAUTHENT- │─────────────→│AUTHENTI-  │─────────────→│ EXPIRED   │
│  ICATED   │              │  CATED    │              │ (redirect)│
└──────────┘              └────┬─────┘              └────┬─────┘
                               │                         │
                          Logout                   Re-login
                               │                         │
                               ▼                         │
                          ┌──────────┐                   │
                          │ LOGGED OUT│◄─────────────────┘
                          │ (redirect)│
                          └──────────┘
```

### Session States

| State | Description | UI Indicator | Evidence |
|-------|-------------|-------------|----------|
| UNAUTHENTICATED | No session, not logged in | Login page | `06-auth-ux-blueprint.md` |
| AUTHENTICATED | Valid session, logged in | Normal app UI | — |
| EXPIRED | Session token expired | Redirect to login + toast | `07-workspace-management.md` |
| LOGGED_OUT | User explicitly logged out | Redirect to login | — |

### Session State Transitions

| From | To | Trigger | User Feedback |
|------|-----|---------|--------------|
| UNAUTHENTICATED | AUTHENTICATED | Successful login | Redirect to Overview |
| AUTHENTICATED | LOGGED_OUT | User clicks logout | Redirect to login |
| AUTHENTICATED | EXPIRED | Token expires (401 response) | Redirect to login + toast: "Session expired" |
| EXPIRED | UNAUTHENTICATED | (Automatic — same as unauthenticated) | Login form shown |
| EXPIRED | AUTHENTICATED | User re-logs in | Redirect to Overview |

---

## 8. Upload State Machine (Per File)

```
┌──────────┐    Select     ┌──────────┐   Upload     ┌──────────┐
│  IDLE     │─────────────→│ QUEUED    │─────────────→│UPLOADING  │
│ (no file) │              │ (waiting) │              │ (active)  │
└──────────┘              └──────────┘              └────┬─────┘
                                                         │
                                              ┌──────────┼──────────┐
                                              │          │          │
                                          Success    Error     Cancel
                                              │          │          │
                                              ▼          ▼          ▼
                                        ┌──────────┐ ┌──────────┐ ┌──────────┐
                                        │ COMPLETE │ │  ERROR   │ │ CANCELLED │
                                        │(in library)│ │(failed) │ │(aborted) │
                                        └──────────┘ └────┬─────┘ └──────────┘
                                                          │
                                                       Retry
                                                          │
                                                          ▼
                                                    ┌──────────┐
                                                    │UPLOADING  │
                                                    └──────────┘
```

### Upload States

| State | Description | UI Indicator |
|-------|-------------|-------------|
| IDLE | No file selected | Upload button/drop zone |
| QUEUED | File selected, waiting for upload slot | Progress bar (0%, "Queued") |
| UPLOADING | Upload in progress | Progress bar (0-100%) |
| COMPLETE | Upload successful | Thumbnail in grid |
| ERROR | Upload failed | Red error indicator + "Retry" |
| CANCELLED | User cancelled upload | Removed from upload list |

---

## Cross-References

- See `01-flow-principles.md` for flow principles and notation
- See `02-flow-matrix.md` for flow matrices
- See `03-decision-trees.md` for decision trees
- See `05-cross-flow-relationships.md` for flow dependencies
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
- See `information-architecture/07-page-states.md` for page state definitions
- See `product-architecture/13-frontend-state-boundaries.md` for state architecture
