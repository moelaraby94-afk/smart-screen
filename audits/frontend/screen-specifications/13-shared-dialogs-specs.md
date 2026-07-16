# Screen Specifications — Shared Dialogs, Drawers & Wizards

> **Evidence basis:** `ux-blueprint/03-component-ux-standards.md` §4 (dialogs), `user-flow-architecture/13-shared-dialogs-specs.md`, `user-flow-architecture/06-auth-flows.md`–`18-edge-cases.md`, `product-architecture/17-product-rules.md` UP-09, NP-08
> **Purpose:** Specifications for all shared dialogs, drawers, wizards, and modal overlays used across multiple screens

---

## SCR-DLG-01: Publish to Screens Dialog

### Screen ID
SCR-DLG-01

### Purpose
Select screens and publish a playlist immediately.

### Used By
- Playlist Detail (`05-content-specs.md` SCR-CN-03)
- Screen Detail (`04-screens-specs.md` SCR-SC-02) — reverse: select playlist for this screen

### Trigger
- "Publish to Screens" button on Playlist Detail
- "Assign Content" button on Screen Detail

### Permissions
Owner/Editor only.

---

## Layout

### Dialog
- **Type:** AlertDialog (centered modal)
- **Width:** `max-w-[500px]`
- **Background:** Overlay `bg-black/50`, dialog `bg-card`
- **Animation:** Scale-in (MI-06, 200ms)

### Contents
1. **Title:** "Publish to Screens"
2. **Screen list:** Checkboxes for each workspace screen with status badge
3. **"Select All" checkbox** (if > 1 screen)
4. **Offline warning:** If any selected screen is offline: "Offline screens will receive content when they reconnect"
5. **Actions:** "Cancel" (ghost) + "Publish Now" (default)

---

## Component Tree

```
<PublishDialog open={open} onClose={onClose}>
  <DialogHeader>
    <DialogTitle>Publish to Screens</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <ScreenList>
      <SelectAllCheckbox checked={allSelected} onChange={toggleAll} />
      {screens.map(screen => (
        <ScreenCheckboxRow
          key={screen.id}
          screen={screen}
          checked={selectedIds.includes(screen.id)}
          onChange={() => toggleScreen(screen.id)}
        />
      ))}
    </ScreenList>
    {hasOfflineSelected && <WarningBanner>
      Offline screens will receive content when they reconnect.
    </WarningBanner>}
  </DialogContent>
  <DialogFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button variant="default" onClick={handlePublish} disabled={selectedIds.length === 0 || isPublishing}>
      {isPublishing ? <Spinner /> : "Publish Now"}
    </Button>
  </DialogFooter>
</PublishDialog>
```

---

## States

### Loading
- "Publish Now" button: spinner + "Publishing..."

### Success
- Dialog closes
- Toast: "Published to [N] screens"
- "Assigned Screens" section updates on Playlist Detail

### Error
- **No screens selected:** Button disabled (prevention)
- **API failure:** Toast: "Failed to publish. Try again." + dialog stays open

### Validation
- At least 1 screen must be selected (button disabled if 0)

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/screens` | GET | Screen list for selection |
| `/playlists/{id}/publish` | POST | Publish playlist to screens |
| `/screens/{id}/assign` | POST | Assign playlist to screen (from Screen Detail) |

---

## Acceptance Criteria

### Functional
- [ ] Dialog opens with screen list
- [ ] Checkboxes toggle selection
- [ ] "Select All" works
- [ ] "Publish Now" sends API call
- [ ] Success closes dialog + toast
- [ ] Offline warning shows when offline screen selected
- [ ] Button disabled when no screens selected

### UX
- [ ] Dialog animation smooth (scale-in)
- [ ] Loading state on button
- [ ] No layout shift

### Accessibility
- [ ] `role="dialog"`, `aria-modal="true"`
- [ ] `aria-labelledby` pointing to title
- [ ] Focus trap within dialog
- [ | Escape closes dialog
- [ ] Checkboxes have `aria-label` with screen name

---

## SCR-DLG-02: Template Picker Dialog

### Screen ID
SCR-DLG-02

### Purpose
Select a template or blank canvas when creating a new playlist.

### Used By
- Content Playlists tab (`05-content-specs.md` SCR-CN-01)
- Overview Quick Action "Create Playlist"

### Trigger
- "Create Playlist" button

### Permissions
Owner/Editor only.

---

## Layout

### Dialog
- **Type:** Dialog (centered modal)
- **Width:** `max-w-[700px]`
- **Height:** `max-h-[80vh]` with scroll

### Contents
1. **Title:** "Create Playlist"
2. **Subtitle:** "Choose a template to get started fast, or start from scratch."
3. **Template grid:** 3-4 template cards (preview, name, description)
4. **Blank option:** "Blank" card (no template)
5. **Actions:** "Cancel" (ghost)

---

## Component Tree

```
<TemplatePickerDialog open={open} onClose={onClose}>
  <DialogHeader>
    <DialogTitle>Create Playlist</DialogTitle>
    <DialogDescription>Choose a template to get started fast, or start from scratch.</DialogDescription>
  </DialogHeader>
  <DialogContent>
    <TemplateGrid>
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onClick={() => handleSelect(template)}
        />
      ))}
      <BlankCard onClick={() => handleSelect(null)} />
    </TemplateGrid>
  </DialogContent>
  <DialogFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
  </DialogFooter>
</TemplatePickerDialog>
```

### Component Details

#### TemplateCard
- **Props:** `template: Template`, `onClick: () => void`
- **UI:** Card with preview thumbnail (16:9), template name, short description
- **Hover:** `shadow-md`, `border-primary` highlight
- **Click:** Create playlist from template → navigate to detail or Studio

#### BlankCard
- **UI:** Card with "+" icon, "Blank" label, "Start from scratch" description
- **Click:** Create empty playlist → navigate to Studio

---

## States

### Loading
- Template grid: Skeleton cards

### Success
- Dialog closes
- API creates playlist
- Navigate to playlist detail (template) or Studio (blank)
- Toast: "Playlist created" or "Playlist created from [Template Name]"

### Error
- API failure: Toast: "Failed to create playlist. Try again." + dialog stays open

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/playlists/templates` | GET | Available templates |
| `/playlists` | POST | Create playlist (with `templateId` or blank) |

### Backend Limitations
- Template list is hardcoded or from backend (future: dynamic templates)
- No template preview API (static images)

---

## Acceptance Criteria

### Functional
- [ ] Dialog opens with template grid
- [ ] Template cards show preview and description
- [ ] Click template creates playlist and navigates
- [ ] Click "Blank" creates empty playlist and navigates to Studio
- [ ] Cancel closes dialog

### UX
- [ ] Skeleton loading for templates
- [ ] Hover highlight on cards
- [ ] Toast on creation

### Accessibility
- [ ] `role="dialog"`, `aria-modal="true"`
- [ ] Template cards: `role="button"`, `aria-label`
- [ ] Focus trap
- [ ] Escape closes

---

## SCR-DLG-03: Schedule Creation/Edit Dialog

### Screen ID
SCR-DLG-03

### Purpose
Create or edit a time-based schedule for playlist playback.

### Used By
- Scheduling page (`07-scheduling-analytics-specs.md` SCR-SCH-01)
- Playlist Detail "Create Schedule"
- Screen Detail "View All Schedules"

### Trigger
- "Create Schedule" button
- Click existing schedule event (edit mode)

### Permissions
Owner/Editor only.

---

## Layout

### Dialog
- **Type:** Dialog (centered modal)
- **Width:** `max-w-[600px]`
- **Scrollable:** If content exceeds viewport

### Contents (Create Mode)
1. **Title:** "Create Schedule"
2. **Playlist selector:** Dropdown/search
3. **Screen selector:** Checkboxes or dropdown
4. **Start date/time:** Date picker + time input
5. **End date/time:** Date picker + time input
6. **Recurrence:** Radio buttons (One-time, Daily, Weekly, Custom — future)
7. **Actions:** "Cancel" + "Create Schedule"

### Contents (Edit Mode)
- Same fields, pre-filled with existing values
- Title: "Edit Schedule"
- Additional: "Delete" button (destructive) + "Deactivate" button

---

## States

### Loading
- "Create Schedule" / "Save Changes" button: spinner

### Success
- Dialog closes
- Toast: "Schedule created" / "Schedule updated"
- Calendar updates with new/modified event

### Error — Conflict
- API returns 409
- Conflict details shown in dialog: "[Playlist] conflicts with [Existing Schedule] on [Screen] at [Time]"
- User can adjust time, change screen, or override (replace existing)

### Error — Validation
- **End before start:** Inline: "End time must be after start time"
- **No screen selected:** Inline: "Select at least one screen"
- **No playlist selected:** Inline: "Select a playlist"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/schedules` | POST | Create schedule |
| `/schedules/{id}` | PUT | Update schedule |
| `/schedules/{id}` | DELETE | Delete schedule |
| `/schedules/{id}/deactivate` | POST | Deactivate schedule |
| `/playlists` | GET | Playlist list for selector |
| `/screens` | GET | Screen list for selector |

---

## Acceptance Criteria

### Functional
- [ ] Dialog opens with form fields
- [ ] Playlist and screen selectors work
- [ | Date/time pickers work
- [ ] Validation: end after start, at least 1 screen, playlist required
- [ ] Create succeeds → toast + calendar updates
- [ ] Edit pre-fills existing values
- [ ] Delete (edit mode) shows confirmation
- [ ] Conflict shows details and resolution options

### UX
- [ ] Date/time pickers are intuitive
- [ ] Conflict details clear and actionable
- [ ] Loading state on submit button

### Accessibility
- [ ] `role="dialog"`, `aria-modal="true"`
- [ ] Form fields have labels
- [ ] Date/time inputs have `aria-label`
- [ ] Error via `aria-live`
- [ ] Focus trap
- [ ] Escape closes

---

## SCR-DLG-04: Invite Member Dialog

### Screen ID
SCR-DLG-04

### Purpose
Send a workspace invitation to a new team member.

### Used By
- Team page (`08-team-spec.md` SCR-TM-01)

### Trigger
- "Invite Member" button (Owner only)

### Permissions
Owner only.

---

## Layout

### Dialog
- **Type:** Dialog (centered modal)
- **Width:** `max-w-[450px]`

### Contents
1. **Title:** "Invite Member"
2. **Email input:** With label "Email Address"
3. **Role selector:** Dropdown (Owner, Editor, Viewer) with descriptions
4. **Actions:** "Cancel" + "Send Invitation"

---

## States

### Loading
- "Send Invitation" button: spinner + "Sending..."

### Success
- Dialog closes
- Pending invite appears in list
- Toast: "Invitation sent to [email]"

### Error
- **Invalid email:** Inline: "Please enter a valid email"
- **Already member:** Inline: "This email is already a member"
- **Already invited:** Inline: "This email has already been invited"
- **API failure:** Toast: "Failed to send invitation. Try again."

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/team/invite` | POST | Send invitation |

---

## Acceptance Criteria

### Functional
- [ ] Email and role inputs work
- [ ] Role dropdown shows descriptions
- [ ] Submit sends invitation
- [ ] Success: dialog closes + toast + pending invite appears
- [ ] Validation: email format, required fields
- [ ] Error handling: already member, already invited

### Accessibility
- [ ] `role="dialog"`, `aria-modal="true"`
- [ ] Inputs have labels
- [ ] Role dropdown has `aria-label`
- [ ] Focus trap
- [ ] Escape closes

---

## SCR-DLG-05: Delete Confirmation Dialog

### Screen ID
SCR-DLG-05

### Purpose
Generic destructive action confirmation dialog used across all delete flows.

### Used By
- Screen Delete (`04-screens-specs.md`)
- Playlist Delete (`05-content-specs.md`)
- Media Delete (`05-content-specs.md`)
- Schedule Delete (`07-scheduling-analytics-specs.md`)
- Member Remove (`08-team-spec.md`)
- API Key Revoke (`10-settings-specs-part2.md`)
- Cancel Invitation (`08-team-spec.md`)

### Trigger
- Any destructive action button (Delete, Remove, Revoke, Cancel)

---

## Layout

### Dialog
- **Type:** AlertDialog (centered modal)
- **Width:** `max-w-[450px]`
- **Focus:** Default focus on "Cancel" (safe default — UP-09)

### Contents
1. **Title:** Context-specific (e.g., "Delete [Name]?")
2. **Description:** Context-specific warning (e.g., "[N] active schedules will be affected")
3. **Actions:** "Cancel" (default focus) + "Delete" (destructive variant)

---

## Component Tree

```
<DeleteDialog open={open} onClose={onClose} title={title} description={description} onConfirm={onConfirm}>
  <AlertDialogHeader>
    <AlertDialogTitle>{title}</AlertDialogTitle>
    <AlertDialogDescription>{description}</AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <Button variant="outline" onClick={onClose} autoFocus>Cancel</Button>
    <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
      {isLoading ? <Spinner /> : actionLabel}
    </Button>
  </AlertDialogFooter>
</DeleteDialog>
```

---

## States

### Loading
- "Delete" button: spinner + disabled

### Success
- Dialog closes
- Entity removed from list
- Toast: "[Name] deleted" / context-specific

### Error
- Toast: "Failed to delete. Try again." + dialog stays open

---

## Acceptance Criteria

### Functional
- [ ] Dialog shows entity name and impact warning
- [ ] "Cancel" has default focus (safe default)
- [ ] "Delete" uses destructive styling (red)
- [ ] Confirm executes deletion
- [ | Cancel closes without action
- [ ] Loading state on confirm

### UX
- [ ] Destructive button is visually distinct (red)
- [ ] No accidental deletion (confirmation required)
- [ ] Impact warning shown (e.g., schedule count)

### Accessibility
- [ ] `role="alertdialog"`, `aria-modal="true"`
- [ ] `aria-labelledby` pointing to title
- [ ] `aria-describedby` pointing to description
- [ ] Focus trap
- [ ] Escape closes (cancels)
- [ ] Default focus on Cancel (safe)

---

## SCR-DLG-06: 2FA Setup Dialog

### Screen ID
SCR-DLG-06

### Purpose
Guide user through enabling two-factor authentication.

### Used By
- Settings Security tab (`10-settings-specs-part2.md` SCR-ST-04)

### Trigger
- "Enable 2FA" button

### Permissions
All users (on their own account).

---

## Layout

### Dialog
- **Type:** Dialog (centered modal)
- **Width:** `max-w-[500px]`
- **Multi-step:** 3 steps (QR → Verify → Backup Codes)

### Contents

**Step 1: QR Code**
- QR code image (200×200px)
- Manual entry key (monospace, copyable)
- Instruction: "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"

**Step 2: Verify Code**
- 6-digit code input (large, monospace, auto-submit on 6th digit)
- Instruction: "Enter the 6-digit code from your authenticator app"

**Step 3: Backup Codes**
- 10 backup codes in 2-column grid (monospace)
- Warning: "Save these codes in a safe place. You won't see them again."
- "Download Codes" button + "Done" button

---

## States

### Loading
- Step 1: QR code loading (spinner)
- Step 2: "Verifying..." on submit
- Step 3: "Enabling..." on final submit

### Success
- Step 2 passes → proceed to Step 3
- Step 3 "Done" → dialog closes
- Toast: "Two-factor authentication enabled"
- Security tab status badge updates to "Enabled"

### Error
- **Invalid code:** Inline: "Invalid verification code"
- **API failure:** Toast: "Failed to enable 2FA. Try again."

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/2fa/enable` | POST | Get QR code + secret |
| `/auth/2fa/verify` | POST | Verify 6-digit code |

---

## Acceptance Criteria

### Functional
- [ ] QR code displayed and scannable
- [ ] Manual entry key provided as alternative
- [ ] 6-digit code input with auto-submit
- [ ] Backup codes displayed after verification
- [ ] "Download Codes" downloads text file
- [ ] "Done" closes dialog and updates status

### UX
- [ ] Step-by-step flow is clear
- [ ] QR code loads quickly
- [ ] Auto-submit on 6th digit
- [ | Backup code warning prominent

### Accessibility
- [ ] `role="dialog"`, `aria-modal="true"`
- [ ] QR code has `alt` text
- [ ] Code input has `aria-label="Verification code"`
- [ | Manual entry key has `aria-label`
- [ ] Focus trap

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `03-component-ux-standards.md` §4 for dialog UX standards
- See `product-architecture/17-product-rules.md` UP-09 for safe defaults, NP-08 for hidden UI
- See all page specs (`02` through `12`) for where each dialog is used
- See `user-flow-architecture/06-auth-flows.md` through `18-edge-cases.md` for flow documentation
