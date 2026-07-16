# Interaction Principles

> **Evidence basis:** `12-usability-breakdown.md` (transformation), `11-cognitive-load-analysis.md` (transformation), `26-product-principles.md` (transformation), locked product decisions
> **Purpose:** Define how users interact with the product — the principles that govern every click, input, and transition

---

## 1. Interaction Principle Inventory

| ID | Principle | Category | Evidence |
|----|-----------|----------|----------|
| IP-01 | Shortest Path to Value | Workflow | Locked decision (5-minute KPI) |
| IP-02 | One Primary Action | Visual hierarchy | `26-product-principles.md` PP-08 |
| IP-03 | Progressive Disclosure | Complexity management | `26-product-principles.md` PP-05 |
| IP-04 | Immediate Feedback | Responsiveness | `12-usability-breakdown.md` H5 |
| IP-05 | Safe Destructive Actions | Safety | `26-product-principles.md` PP-07 |
| IP-06 | Consistent Patterns | Learnability | `26-product-principles.md` PP-03 |
| IP-07 | No Dead Ends | Navigation | `06-user-journey-analysis.md` Journey 1 |
| IP-08 | Error Prevention Over Recovery | Safety | `12-usability-breakdown.md` H5 (1.3/4) |
| IP-09 | Recognition Over Recall | Memory | `26-product-principles.md` PP-04 |
| IP-10 | Graceful Degradation | Resilience | DD-07 (Socket.IO fallback) |

---

## 2. IP-01: Shortest Path to Value

### Principle
Every workflow should use the minimum number of steps required to achieve the user's goal. Optional steps must not block the primary path.

### Application
| Context | Primary Path | Optional Path |
|---------|-------------|---------------|
| First publish | Create playlist → Publish immediately | Schedule for later |
| Screen setup | Pairing wizard (2-3 steps) | Branch assignment, advanced settings |
| Content creation | Template picker → Customize → Publish | Blank Studio → Add media → Arrange |
| Team invite | Email + role → Send | Custom message, permissions |

### Architecture Rules
- Scheduling is never required for publishing (locked decision)
- Templates are the default content creation path; Studio is the advanced path
- Wizards use the minimum number of steps (2-3 for pairing)
- Optional fields are collapsed or in "More options" sections

### Evidence
`05-primary-user-journey.md` (5-minute KPI); `26-product-principles.md` PP-09 (Reduce Cognitive Load)

---

## 3. IP-02: One Primary Action

### Principle
Each screen has one clearly primary action. Secondary actions are visually subordinate. Tertiary actions are in menus.

### Application
| Screen | Primary Action | Secondary | Tertiary |
|--------|---------------|-----------|----------|
| Overview | "Add Screen" | "Create Playlist", "View Schedule" | Settings, Team |
| Screen list | "Add Screen" | Search, Filter | Bulk actions, Export |
| Screen detail | "Assign Content" | "Override", "Reboot" | Edit, Delete |
| Playlist library | "Create Playlist" | Search, Filter | Delete, Duplicate |
| Media library | "Upload" | Search, Filter | Delete, Download |
| Schedule calendar | "Create Schedule" | Switch view (month/week) | Bulk activate/deactivate |
| Team list | "Invite Member" | Search | Remove, Change role |
| Settings | "Save" (per tab) | Reset | — |

### Architecture Rules
- Primary action uses `default` button variant (solid background)
- Secondary actions use `outline` or `secondary` variant
- Tertiary actions are in `DropdownMenu` or "More" button
- Only one `default` variant button per screen section

### Evidence
`26-product-principles.md` PP-08; `02-design-system-and-tokens.md` §2.6 (button variant system)

---

## 4. IP-03: Progressive Disclosure

### Principle
Show essential information first. Reveal complexity only when the user needs it or asks for it.

### Application
| Context | Essential First | Revealed Later |
|---------|----------------|----------------|
| Schedule form | Playlist, screens, start time | Recurrence, end time, time slots |
| Settings | Profile, workspace | Billing, API, notifications, security |
| Screen detail | Status, current content | Active schedules, recent events, logs |
| Studio | Canvas, timeline | Layer panel, property panel, advanced settings |
| Onboarding | Workspace name, add screen | Demo content, team invite, branding |

### Architecture Rules
- Forms show required fields first; optional fields are collapsed
- Dialogs show minimum needed to complete the task
- Detail pages show summary first; drill-down for details
- Onboarding shows one step at a time; skip option always available

### Evidence
`26-product-principles.md` PP-05; `11-cognitive-load-analysis.md` §2.5 (schedule form: HIGH extraneous load)

---

## 5. IP-04: Immediate Feedback

### Principle
Every user action receives immediate visual feedback. No action leaves the user wondering "did that work?"

### Application
| Action | Feedback | Timing |
|--------|----------|--------|
| Button click | Button state change (pressed) | < 100ms |
| Form submit | Button → loading spinner | < 100ms |
| API success | Toast (success) | On response |
| API error | Toast (error with message) | On response |
| Page load | Skeleton loading | < 200ms |
| Data update | SWR revalidation → UI update | On response |
| Realtime event | Toast + bell badge | On Socket.IO event |
| Drag-drop | Visual indicator (drop zone) | < 50ms |

### Architecture Rules
- All buttons show loading state during async operations
- All API calls result in a toast (success or error)
- Page loads use skeleton loading (DD-06)
- Action-level loading uses spinner (DD-06)
- No silent failures — all errors produce user-visible feedback

### Evidence
`12-usability-breakdown.md` H5 (Error Prevention: 1.3/4); `23-error-handling-and-states.md` §23.6

---

## 6. IP-05: Safe Destructive Actions

### Principle
Destructive actions (delete, remove, disable, unpublish) require explicit confirmation. Confirmations clearly state what will be lost.

### Application
| Action | Confirmation | Message |
|--------|-------------|---------|
| Delete screen | AlertDialog | "Delete [Screen Name]? This will remove it from all schedules." |
| Delete playlist | AlertDialog | "Delete [Playlist Name]? [N] schedules reference this playlist." |
| Delete media | AlertDialog | "Delete [Filename]? It is used in [N] playlists." |
| Remove team member | AlertDialog | "Remove [Name] from this workspace?" |
| Emergency override | AlertDialog | "Override all screens with [Playlist Name]?" |
| Delete workspace | AlertDialog | "Delete [Workspace Name]? ALL data will be permanently lost." |

### Architecture Rules
- All destructive actions use `AlertDialog` (not `Dialog`)
- Confirm button uses `destructive` variant (red)
- Action name includes what is being destroyed
- Impact is stated (e.g., "N schedules will be affected")
- No undo for destructive actions (future: soft delete with undo period)

### Evidence
`26-product-principles.md` PP-07; `12-usability-breakdown.md` H5 (1.3/4)

---

## 7. IP-06: Consistent Patterns

### Principle
The same interaction pattern is used everywhere for the same type of action. Users learn a pattern once and apply it everywhere.

### Application
| Pattern | Standard | Evidence |
|---------|----------|----------|
| List page | Search + filter bar at top, grid/list below | All list pages |
| Detail page | Header with title + back button, content below | All detail pages |
| Create action | Primary button (top right) → dialog or wizard | All create actions |
| Delete action | Row/menu action → AlertDialog confirmation | All delete actions |
| Save action | Primary button (form footer) → toast feedback | All forms |
| Loading | Skeleton (page) or spinner (action) | DD-06 |
| Empty state | EmptyState component with icon + message + CTA | All empty states |
| Error state | Toast for API errors, error boundary for page errors | `23-error-handling-and-states.md` |

### Architecture Rules
- No list page without search
- No detail page without back button
- No create action without a clear entry point (primary button)
- No delete action without confirmation
- No form without a save button and feedback

### Evidence
`26-product-principles.md` PP-03; `26-consistency-audit.md` §26.6

---

## 8. IP-07: No Dead Ends

### Principle
Every screen provides a clear next action. No user should reach a screen and not know what to do next.

### Application
| Screen | Next Action |
|--------|------------|
| Overview (no screens) | "Connect Your First Screen" CTA |
| Overview (screens, no content) | "Create Your First Playlist" CTA |
| Screen list (empty) | "Add Screen" CTA |
| Playlist library (empty) | "Create Playlist" CTA (with template picker) |
| Media library (empty) | "Upload Media" CTA |
| Schedule calendar (empty) | "Create Schedule" CTA |
| Team list (empty) | "Invite Member" CTA |
| Analytics (no data) | "Add screens to see analytics" message |
| Search (no results) | "Try different keywords" + clear search button |

### Architecture Rules
- Every empty state includes a CTA to the next logical action
- Every completed action redirects or provides a "next step" link
- No page ends with just data — there is always an action
- Post-action CTAs guide users to the next step in their journey

### Evidence
`06-user-journey-analysis.md` Journey 1 (onboarding dead ends); `27-user-flows.md` §27.9

---

## 9. IP-08: Error Prevention Over Recovery

### Principle
Prevent errors before they happen through UI design. Recovery is the fallback, not the primary strategy.

### Application
| Context | Prevention | Recovery |
|---------|-----------|----------|
| Schedule conflict | Real-time conflict detection during creation | Manual resolution |
| Delete referenced entity | Warning with impact count | User decides to proceed or cancel |
| Invalid file upload | File type/size check before upload | Error toast |
| Required field missing | Visual indicator + disabled submit | Field-level error message |
| Workspace switch with unsaved changes | (Future) Warning prompt | Save or discard |
| Session expiry | Token refresh (silent) | Redirect to login |

### Architecture Rules
- Submit buttons are disabled until required fields are filled
- Conflict detection runs during schedule creation, not after submit
- Delete warnings show impact (how many items are affected)
- File upload validates type and size before sending to server

### Evidence
`12-usability-breakdown.md` H5 (Error Prevention: 1.3/4 — lowest score)

---

## 10. IP-09: Recognition Over Recall

### Principle
Users should not need to remember how to do something — the interface makes options and actions visible.

### Application
| Context | Recognition | Not Recall |
|---------|------------|------------|
| Navigation | Sidebar always visible (7 items) | User doesn't memorize URLs |
| Current workspace | Switcher always shows workspace name | User doesn't remember workspace ID |
| Page context | Header shows page title + breadcrumb | User doesn't guess their location |
| Available actions | Primary button + menu items visible | User doesn't memorize shortcuts |
| Screen status | Status badge on screen card | User doesn't check each screen individually |
| Schedule conflicts | Visual indicator on calendar | User doesn't cross-reference manually |

### Evidence
`26-product-principles.md` PP-04; `12-usability-breakdown.md` H6 (Recognition: 2.2/4)

---

## 11. IP-10: Graceful Degradation

### Principle
When something fails, the product degrades gracefully — it doesn't crash or show a blank screen.

### Application
| Failure | Degradation | Evidence |
|---------|------------|----------|
| WebSocket blocked | Polling fallback | DD-07 |
| API timeout | Error toast + retry option | `23-error-handling-and-states.md` |
| Image load failure | Placeholder image | — |
| Page error | Error boundary with "Try again" | `23-error-handling-and-states.md` |
| 404 | Not found page with link to Overview | `23-error-handling-and-states.md` |
| Session expired | Redirect to login with toast | `07-workspace-management.md` |
| Offline | (Future) Cached data + offline indicator | — |

### Architecture Rules
- Every page has an error boundary
- Every API call has error handling (toast)
- Socket.IO has polling fallback
- Images have fallback placeholders
- 404 pages are branded and helpful

### Evidence
DD-07; `23-error-handling-and-states.md` §23.9

---

## Cross-References

- See `16-navigation-principles.md` for navigation-specific principles
- See `17-product-rules.md` for product rules derived from these principles
- See `transformation/26-product-principles.md` for permanent product principles
- See `transformation/12-usability-breakdown.md` for Nielsen heuristic scores
- See `transformation/11-cognitive-load-analysis.md` for cognitive load analysis
