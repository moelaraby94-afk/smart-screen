# Flow Matrices

> **Evidence basis:** `01-flow-principles.md`, `ux-blueprint/17-ux-blueprint-summary.md`, `information-architecture/06-page-catalog.md`, `product-architecture/05-primary-user-journey.md`, `product-architecture/06-secondary-journeys.md`
> **Purpose:** Define flow priority matrix, complexity matrix, user friction matrix, and risk matrix

---

## 1. Flow Priority Matrix

All flows ranked by combined business importance and frequency.

| Flow ID | Flow Name | Business Importance | Frequency | Priority Score | Priority Rank |
|---------|-----------|-------------------|-----------|---------------|---------------|
| FL-OB-01 | First Screen Pairing | Critical | One-time | 10.0 | 1 |
| FL-OB-02 | First Playlist Creation | Critical | One-time | 10.0 | 2 |
| FL-OB-04 | First Publish | Critical | One-time | 10.0 | 3 |
| FL-AUTH-01 | Login | Critical | Daily | 9.5 | 4 |
| FL-PUB-01 | Immediate Publish | Critical | Weekly | 9.0 | 5 |
| FL-SC-01 | Screen Pairing | Critical | Occasional | 8.5 | 6 |
| FL-AUTH-02 | Registration | Critical | One-time | 8.5 | 7 |
| FL-PL-01 | Playlist Creation | High | Weekly | 8.0 | 8 |
| FL-MED-01 | Media Upload | High | Weekly | 8.0 | 9 |
| FL-PL-02 | Playlist Editing (Studio) | High | Weekly | 7.5 | 10 |
| FL-SC-02 | Screen Detail View | High | Daily | 7.5 | 11 |
| FL-WS-02 | Workspace Switching | High | Daily | 7.0 | 12 |
| FL-SCH-01 | Schedule Creation | High | Weekly | 7.0 | 13 |
| FL-NT-01 | Notification View | Medium | Daily | 6.5 | 14 |
| FL-TM-01 | Team Invitation | Medium | Monthly | 6.0 | 15 |
| FL-AN-01 | Analytics Navigation | Medium | Monthly | 5.5 | 16 |
| FL-SC-03 | Screen Rename | Medium | Occasional | 5.0 | 17 |
| FL-PL-03 | Playlist Publishing (with schedule) | High | Weekly | 7.0 | 18 |
| FL-SCH-02 | Conflict Resolution | High | Occasional | 6.5 | 19 |
| FL-ST-01 | Profile Update | Low | Occasional | 4.0 | 20 |
| FL-ST-02 | Password Change | Low | Occasional | 4.0 | 21 |
| FL-ST-03 | 2FA Setup | Low | One-time | 4.5 | 22 |
| FL-ST-04 | Billing Upgrade | Critical | Occasional | 7.5 | 23 |
| FL-ST-05 | API Key Creation | Low | Occasional | 3.5 | 24 |
| FL-AUTH-03 | Forgot Password | Medium | Occasional | 4.5 | 25 |
| FL-AUTH-04 | Logout | Low | Daily | 5.0 | 26 |
| FL-WS-01 | Workspace Creation | Critical | One-time | 8.0 | 27 |
| FL-OB-03 | First Media Upload | High | One-time | 7.5 | 28 |
| FL-SC-04 | Screen Delete | Medium | Occasional | 4.5 | 29 |
| FL-MED-02 | Media Delete | Medium | Occasional | 4.0 | 30 |
| FL-MED-03 | Media Replace | Medium | Occasional | 4.0 | 31 |
| FL-TM-02 | Role Change | Medium | Occasional | 4.5 | 32 |
| FL-TM-03 | Permission Denied | High | Occasional | 5.5 | 33 |
| FL-SCH-03 | Schedule Editing | Medium | Weekly | 5.5 | 34 |
| FL-SC-05 | Branch Assignment | Medium | Occasional | 4.0 | 35 |
| FL-AD-01 | Admin Impersonation | Medium | Occasional | 4.5 | 36 |
| FL-AD-02 | Fleet Management | Medium | Weekly | 4.5 | 37 |
| FL-AD-03 | Feature Flag Toggle | Medium | Occasional | 4.0 | 38 |
| FL-SYS-01 | System Error Recovery | High | Occasional | 6.0 | 39 |
| FL-SYS-02 | Global Search | Medium | Daily | 5.5 | 40 |
| FL-SYS-03 | Command Palette | Medium | Daily | 5.5 | 41 |
| FL-SYS-04 | Quick Actions | High | Daily | 6.0 | 42 |
| FL-OB-05 | Empty Workspace Onboarding | Critical | One-time | 8.0 | 43 |
| FL-SC-06 | Screen Recovery | Medium | Rare | 3.5 | 44 |
| FL-NAV-01 | Navigation to Screen Detail | High | Daily | 6.5 | 45 |
| FL-NAV-02 | Cross-Navigation (Screen to Content) | High | Daily | 6.5 | 46 |
| FL-ST-06 | Notification Preferences | Low | Occasional | 3.5 | 47 |
| FL-PL-04 | Playlist Delete | Medium | Occasional | 4.0 | 48 |
| FL-PL-05 | Playlist Duplicate | Low | Occasional | 3.0 | 49 |
| FL-WS-03 | Empty Workspace State | High | One-time | 6.0 | 50 |

**Priority Score Formula:** (Business Importance: Critical=3, High=2, Medium=1, Low=0.5) × (Frequency: Daily=3.5, Weekly=2.5, Monthly=1.5, Occasional=1, One-time=2.5, Rare=0.5) + Base 1.0

---

## 2. Flow Complexity Matrix

| Flow ID | Flow Name | Steps | Decision Points | Error Paths | Edge Cases | Complexity | Notes |
|---------|-----------|-------|----------------|-------------|-------------|------------|-------|
| FL-AUTH-01 | Login | 3 | 1 | 3 | 4 | Simple | 2FA adds 1 step |
| FL-AUTH-02 | Registration | 4 | 2 | 4 | 5 | Medium | Auto-workspace creation |
| FL-AUTH-03 | Forgot Password | 3 | 1 | 2 | 3 | Simple | Always shows success |
| FL-AUTH-04 | Logout | 1 | 0 | 1 | 1 | Simple | Token clear + redirect |
| FL-WS-01 | Workspace Creation | 3 | 1 | 3 | 4 | Medium | Demo vs. fresh |
| FL-WS-02 | Workspace Switching | 2 | 2 | 2 | 3 | Simple | Data epoch invalidation |
| FL-WS-03 | Empty Workspace State | 2 | 1 | 1 | 2 | Simple | Onboarding trigger |
| FL-SC-01 | Screen Pairing | 5 | 3 | 5 | 6 | Medium | 3-step wizard |
| FL-SC-02 | Screen Detail View | 2 | 1 | 2 | 3 | Simple | Read + navigate |
| FL-SC-03 | Screen Rename | 2 | 0 | 2 | 2 | Simple | Inline edit |
| FL-SC-04 | Screen Delete | 3 | 2 | 2 | 4 | Medium | Schedule impact warning |
| FL-SC-05 | Branch Assignment | 2 | 1 | 2 | 2 | Simple | Dropdown select |
| FL-SC-06 | Screen Recovery | 3 | 2 | 3 | 3 | Medium | Re-pair deleted screen |
| FL-MED-01 | Media Upload | 4 | 2 | 5 | 6 | Medium | Multi-file, drag-drop, progress |
| FL-MED-02 | Media Delete | 3 | 2 | 2 | 4 | Medium | Usage warning |
| FL-MED-03 | Media Replace | 4 | 2 | 3 | 3 | Medium | In-place replacement |
| FL-PL-01 | Playlist Creation | 4 | 3 | 4 | 5 | Medium | Template vs. blank |
| FL-PL-02 | Playlist Editing (Studio) | 8+ | 5 | 6 | 8 | High | Canvas, layers, properties |
| FL-PL-03 | Playlist Publishing | 5 | 3 | 4 | 5 | Medium | Screen selector + confirm |
| FL-PL-04 | Playlist Delete | 3 | 2 | 2 | 4 | Medium | Published impact warning |
| FL-PL-05 | Playlist Duplicate | 2 | 0 | 2 | 2 | Simple | One-click |
| FL-PUB-01 | Immediate Publish | 4 | 2 | 3 | 4 | Medium | Select screens + publish |
| FL-PUB-02 | Always Active Publish | 5 | 3 | 3 | 4 | Medium | Publish + schedule always |
| FL-SCH-01 | Schedule Creation | 6 | 4 | 4 | 6 | Complex | Recurrence, conflict check |
| FL-SCH-02 | Conflict Resolution | 5 | 3 | 3 | 5 | Complex | Visual conflict + adjust |
| FL-SCH-03 | Schedule Editing | 5 | 3 | 3 | 5 | Medium | Modify existing schedule |
| FL-TM-01 | Team Invitation | 3 | 2 | 3 | 4 | Medium | Email + role + send |
| FL-TM-02 | Role Change | 2 | 1 | 2 | 3 | Simple | Dropdown + immediate |
| FL-TM-03 | Permission Denied | 2 | 1 | 1 | 3 | Simple | Hidden UI + redirect |
| FL-ST-01 | Profile Update | 3 | 1 | 3 | 3 | Simple | Form + save |
| FL-ST-02 | Password Change | 4 | 2 | 4 | 3 | Medium | Current + new + confirm |
| FL-ST-03 | 2FA Setup | 7 | 3 | 4 | 5 | Complex | QR + code + backup codes |
| FL-ST-04 | Billing Upgrade | 5 | 3 | 4 | 5 | Medium | Plan select + confirm |
| FL-ST-05 | API Key Creation | 4 | 2 | 3 | 4 | Medium | Name + generate + copy |
| FL-ST-06 | Notification Preferences | 2 | 1 | 2 | 2 | Simple | Toggles + save |
| FL-NT-01 | Notification View | 2 | 1 | 1 | 3 | Simple | Click + navigate |
| FL-AN-01 | Analytics Navigation | 3 | 2 | 2 | 3 | Simple | Period + tab + view |
| FL-AD-01 | Admin Impersonation | 4 | 2 | 3 | 4 | Medium | Select + confirm + banner |
| FL-AD-02 | Fleet Management | 3 | 2 | 2 | 4 | Medium | Search + filter + action |
| FL-AD-03 | Feature Flag Toggle | 2 | 1 | 2 | 3 | Simple | Toggle + toast |
| FL-SYS-01 | System Error Recovery | 3 | 2 | 4 | 5 | Medium | Error + retry + fallback |
| FL-SYS-02 | Global Search | 3 | 2 | 2 | 4 | Medium | Type + results + navigate |
| FL-SYS-03 | Command Palette | 3 | 2 | 2 | 3 | Medium | Open + search + select |
| FL-SYS-04 | Quick Actions | 2 | 1 | 1 | 2 | Simple | Click + navigate |
| FL-OB-01 | First Screen Pairing | 5 | 3 | 5 | 6 | Medium | Guided wizard |
| FL-OB-02 | First Playlist Creation | 5 | 3 | 4 | 5 | Medium | Template-guided |
| FL-OB-03 | First Media Upload | 4 | 2 | 5 | 6 | Medium | Guided upload |
| FL-OB-04 | First Publish | 4 | 2 | 3 | 4 | Medium | Guided publish |
| FL-OB-05 | Empty Workspace Onboarding | 4 | 3 | 3 | 5 | Medium | Step-by-step guide |
| FL-NAV-01 | Navigation to Screen Detail | 2 | 0 | 1 | 2 | Simple | Click card |
| FL-NAV-02 | Cross-Navigation | 2 | 1 | 1 | 2 | Simple | Click link |

---

## 3. User Friction Matrix

| Flow ID | Flow Name | Hesitation Point | Abandonment Risk | Confusion Point | Mistake Risk | Friction Score |
|---------|-----------|-----------------|-----------------|----------------|-------------|----------------|
| FL-AUTH-01 | Login | Password field (show/hide) | Low | 2FA code entry | Wrong password | Low (2) |
| FL-AUTH-02 | Registration | Too many fields | High | Email verification | Duplicate email | Medium (5) |
| FL-WS-01 | Workspace Creation | Demo vs. fresh choice | Medium | None | None | Low (3) |
| FL-SC-01 | Screen Pairing | Finding pairing code | Medium | Code on physical screen | Wrong code | Medium (4) |
| FL-MED-01 | Media Upload | File size limits | Low | Drag-drop zone | Wrong file type | Low (3) |
| FL-PL-01 | Playlist Creation | Template vs. blank | Medium | Studio complexity | None | Medium (5) |
| FL-PL-02 | Studio Editing | Panel complexity | High | Layer management | Delete wrong layer | High (8) |
| FL-PUB-01 | Immediate Publish | Screen selection | Low | None | Publish to wrong screen | Medium (4) |
| FL-SCH-01 | Schedule Creation | Recurrence rules | Medium | Conflict detection | Overlap | Medium (5) |
| FL-SCH-02 | Conflict Resolution | Understanding conflict | High | Visual indicators | Ignore conflict | High (7) |
| FL-TM-01 | Team Invitation | Role selection | Low | Permission levels | Wrong role | Low (3) |
| FL-TM-03 | Permission Denied | Hidden actions | Low | Why can't I do X? | None | Low (2) |
| FL-ST-03 | 2FA Setup | QR scan + backup codes | Medium | Backup code storage | Lose codes | Medium (5) |
| FL-ST-04 | Billing Upgrade | Plan comparison | Medium | Proration confusion | Wrong plan | Medium (5) |
| FL-AD-01 | Admin Impersonation | Confirmation dialog | Low | Impersonation banner | Forget to exit | Low (3) |
| FL-OB-05 | Empty Workspace | Where to start | High | First step confusion | None | Medium (6) |

**Friction Score:** Low (1-3), Medium (4-6), High (7-10)

---

## 4. Risk Matrix

| ID | Risk | Probability | Impact | Risk Score | Mitigation | Affected Flows |
|----|------|------------|--------|-----------|------------|----------------|
| FR-01 | Studio data loss (no auto-save) | Medium | High | 7 | Auto-save after 30s inactivity (F-MP-14) | FL-PL-02 |
| FR-02 | Schedule conflict undetected | High | Medium | 6 | Visual conflict indicators + toast | FL-SCH-01, FL-SCH-02 |
| FR-03 | Publish to wrong screen | Low | High | 5 | Screen names in confirmation dialog | FL-PUB-01, FL-PL-03 |
| FR-04 | Registration abandonment | Medium | High | 7 | Minimal fields, auto-workspace | FL-AUTH-02 |
| FR-05 | Empty workspace abandonment | Medium | High | 7 | Guided onboarding with CTAs | FL-OB-05, FL-WS-03 |
| FR-06 | 2FA lockout (lost codes) | Low | High | 5 | Backup codes + recovery flow | FL-ST-03 |
| FR-07 | Session timeout during editing | Medium | Medium | 6 | Auto-save + session warning (future) | FL-PL-02, FL-ST-01 |
| FR-08 | Network loss during upload | Medium | Medium | 6 | Per-file retry + progress resume | FL-MED-01 |
| FR-09 | Double-submit creates duplicate | Low | Medium | 4 | Button disabled during submit | All submit flows |
| FR-10 | Permission change during active session | Low | Medium | 4 | Realtime permission update (future) | FL-TM-02, FL-TM-03 |
| FR-11 | Concurrent editing of same playlist | Low | Medium | 4 | Optimistic locking (future) | FL-PL-02 |
| FR-12 | Browser refresh loses form data | High | Medium | 6 | Form state persistence (future) | FL-ST-01, FL-SCH-01 |
| FR-13 | Offline screen not noticed | Medium | Medium | 6 | Realtime toast + bell notification | FL-SC-02, FL-NT-01 |
| FR-14 | Deleted media breaks playlist | Low | High | 5 | Usage warning in delete dialog | FL-MED-02 |
| FR-15 | API key shown once and lost | Medium | Medium | 6 | Prominent copy button + warning | FL-ST-05 |

---

## Cross-References

- See `01-flow-principles.md` for flow principles and notation
- See `03-decision-trees.md` for decision trees of key flows
- See `04-state-machines.md` for entity state machines
- See `05-cross-flow-relationships.md` for flow dependencies
- See `ux-blueprint/17-ux-blueprint-summary.md` for UX risks and opportunities
- See `product-architecture/05-primary-user-journey.md` for primary journey
- See `product-architecture/06-secondary-journeys.md` for secondary journeys
