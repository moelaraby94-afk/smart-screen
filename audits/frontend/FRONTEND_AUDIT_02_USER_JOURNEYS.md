# 02 — User Journey Audit

> **Evidence basis:** Screen spec files, onboarding widget, screen-setup-modal, media-library-client, schedules-client, team-client, playlist-studio-client

---

## 1. Journey: First-Time User Onboarding

### 1.1 Flow
1. Register → Login → Land on Overview
2. See Onboarding Progress Widget with 5 steps
3. Click step → navigate to feature page
4. Complete step → widget updates

### 1.2 Issues
- **Onboarding links use old routes** — `/media`, `/playlists`, `/schedules` instead of `/content?tab=media`, `/content?tab=playlists`, `/scheduling`
- **No first-time tooltip overlay** — onboarding widget is passive; no guided tour
- **No "Skip onboarding" option** — only dismiss button; no "remind me later"

### 1.3 Score: 7/10

---

## 2. Journey: Pair a New Screen

### 2.1 Flow
1. Screens page → "Add Screen" button
2. Screen Setup Modal opens
3. Enter pairing code → submit
4. Wait for device to connect
5. Configure screen settings (name, location, orientation, branch, playlist)
6. Screen created → redirect to screen detail

### 2.2 Issues
- **No feedback during pairing wait** — progress banner but no estimated time or troubleshooting
- **No cancel during pairing** — user can close modal but can't cancel the pairing request
- **Settings applied silently** — pendingSettings effect applies settings after pairing; if it fails, user may not notice (fixed in stabilization: res.ok checks added)
- **No validation feedback** — pairing code format not validated client-side

### 2.3 Score: 6/10

---

## 3. Journey: Upload Media

### 3.1 Flow
1. Content → Media tab OR /media
2. Drag files to dropzone or click upload
3. Files upload with progress
4. Media appears in grid

### 3.2 Issues
- **No storage limit warning** — upload starts without checking if storage is full
- **No upload progress per file** — only pending state
- **No file type validation feedback** — invalid files silently rejected
- **No retry on failed upload** — must re-drag file
- **UsageIndicator component exists** but placement is below upload area, not prominent

### 3.3 Score: 6/10

---

## 4. Journey: Create and Publish a Playlist

### 4.1 Flow
1. Content → Playlists tab OR /playlists
2. Enter name → "Create"
3. Grid shows new playlist card
4. Click playlist → Editor opens
5. Drag media from left panel to timeline
6. Set durations, transitions
7. Save → "Publish" button
8. Playlist is now live on assigned screens

### 4.2 Issues
- **Empty editor has no guidance** — new playlist opens with empty canvas, no "drag media here" hint
- **Save state indicator** — exists (idle/saving/saved/unsaved) but no auto-save
- **No unsaved changes warning** — navigating back from editor without saving loses changes silently
- **Publish requires OWNER/ADMIN role** — EDITOR can create but not publish; no clear messaging about this
- **Multi-zone layout** — complex feature with no onboarding guidance

### 4.3 Score: 7/10

---

## 5. Journey: Schedule Content

### 5.1 Flow
1. Scheduling page
2. "Create Schedule" button
3. Form: select playlist, screen, days, time range, priority
4. Save → schedule appears in calendar/timeline/list

### 5.2 Issues
- **No conflict preview during form fill** — conflicts only detected after save
- **Overlap detection exists** — `overlapIds` computed from pairs but shown as badges, not preventative
- **No recurring schedule UI** — recurrence field exists in API type but no UI for it
- **Calendar view** — no drag-to-create or drag-to-resize
- **Priority system** — no explanation of how priority works

### 5.3 Score: 6/10

---

## 6. Journey: Invite Team Member

### 6.1 Flow
1. Team page
2. Enter email, select role
3. "Send Invite"
4. Invite appears in pending list
5. Invitee receives email → accepts → becomes member

### 6.2 Issues
- **No role descriptions** — dropdown shows VIEWER, EDITOR, ADMIN, OWNER with no explanation
- **No empty state** — when no members, just empty table
- **No resend notification** — resend button exists but no confirmation
- **Account-level members** — separate section with create user form; confusing dual-member system
- **Workspace scopes** — complex scope selection UI for account members; no guidance

### 6.3 Score: 6/10

---

## 7. Journey: View Analytics

### 7.1 Flow
1. Analytics page
2. See screen health summary, per-screen analytics table
3. Filter by search
4. Export button

### 7.2 Issues
- **No date range selector** — analytics are all-time, no filtering by period
- **No charts** — only numbers and colored bars
- **No content performance** — only screen health, not what's playing
- **No proof-of-play reports** — route redirects to analytics but no POP data shown
- **Export button exists** but functionality unclear

### 7.3 Score: 5/10

---

## 8. Journey: Emergency Broadcast

### 8.1 Flow
1. Navigate to /emergency (not in sidebar)
2. Select screens or all screens
3. Choose emergency content
4. Activate broadcast

### 8.2 Issues
- **Not discoverable** — no sidebar link, no quick-action button
- **No confirmation step** — emergency broadcast is destructive; should require confirmation
- **No deactivation flow visible** — unclear how to end emergency broadcast
- **No audit trail** — no log of who triggered emergency when

### 8.3 Score: 4/10

---

## 9. Journey: Manage Billing

### 9.1 Flow
1. Settings → Billing
2. View current plan, usage
3. Manage subscription

### 9.2 Issues
- **No upgrade CTA** — current plan shown but no clear upgrade path
- **No plan comparison** — can't compare plans side by side
- **No invoice history** — or not visible
- **No payment method management** — or not clearly accessible

### 9.3 Score: 5/10

---

## 10. Journey Summary

| Journey | Score | Key Gap |
|---------|-------|---------|
| First-time onboarding | 7/10 | Old route links |
| Pair screen | 6/10 | No wait feedback |
| Upload media | 6/10 | No storage warning |
| Create playlist | 7/10 | No empty state guidance |
| Schedule content | 6/10 | No conflict preview |
| Invite team | 6/10 | No role descriptions |
| View analytics | 5/10 | No charts, no date range |
| Emergency broadcast | 4/10 | Not discoverable |
| Manage billing | 5/10 | No upgrade path |
| **Average** | **5.8/10** | **Needs improvement** |
