# Screen Specifications — Settings Part 2 (Security, API Keys, Notifications)

> **Evidence basis:** `ux-blueprint/12-settings-ux-blueprint-part2.md`, `ux-blueprint/13-settings-ux-blueprint-part3.md`, `user-flow-architecture/13-settings-flows.md` FL-ST-02, FL-ST-03, FL-ST-05, FL-ST-06, `product-architecture/09-product-modules.md` M-07

---

## SCR-ST-04: Settings — Security

### Screen ID
SCR-ST-04

### Purpose
Change password and manage two-factor authentication.

### Business Goal
Account security; enterprise compliance.

### User Goal
Update password; enable 2FA for security.

### Primary Users
All users.

### Permissions
- All users can access Security tab
- All users can change their own password
- All users can enable/disable 2FA on their own account

### Entry Points
- Settings tab "Security"

### Exit Points
- Tab navigation
- Sidebar navigation

### Page Title
`Security — Cloud-Screen`

### Primary CTA
"Change Password" button.

### Secondary CTA
"Enable 2FA" / "Disable 2FA" button.

---

## Layout

### Container
- `max-w-[800px] mx-auto px-6 py-6`
- Sections: `flex flex-col gap-6`

### Page Sections

#### Section 1: Change Password
- **Card:** `bg-card border border-border rounded-xl p-6`
- **Fields:** Current Password, New Password, Confirm New Password
- **Submit:** "Change Password" button
- **Password toggle:** Eye icon on each password field

#### Section 2: Two-Factor Authentication
- **Card:** `bg-card border border-border rounded-xl p-6`
- **Status:** Badge "Enabled" (green) or "Disabled" (gray)
- **Action:** "Enable 2FA" button (if disabled) or "Disable 2FA" button (if enabled)
- **Backup codes:** (If enabled) "View Backup Codes" link + "Regenerate Codes" button

---

## Component Tree

```
<SecuritySettings>
  <PasswordSection>
    <SectionHeading>Change Password</SectionHeading>
    <Form onSubmit={handlePasswordChange}>
      <FormField name="currentPassword" label="Current Password" required>
        <PasswordInput autoComplete="current-password" />
      </FormField>
      <FormField name="newPassword" label="New Password" required hint="Minimum 8 characters">
        <PasswordInput autoComplete="new-password" />
      </FormField>
      <FormField name="confirmPassword" label="Confirm New Password" required>
        <PasswordInput autoComplete="new-password" />
      </FormField>
      {error && <FormError message={error} />}
      <Button type="submit" variant="default" disabled={isLoading}>
        {isLoading ? <Spinner /> : "Change Password"}
      </Button>
    </Form>
  </PasswordSection>
  <TwoFactorSection>
    <SectionHeading>Two-Factor Authentication</SectionHeading>
    <StatusBadge status={twoFactorEnabled ? "enabled" : "disabled"} />
    {!twoFactorEnabled ? (
      <Button variant="default" onClick={open2FADialog}>Enable 2FA</Button>
    ) : (
      <TwoFactorEnabled>
        <Button variant="outline" onClick={viewBackupCodes}>View Backup Codes</Button>
        <Button variant="outline" onClick={regenerateCodes}>Regenerate Codes</Button>
        <Button variant="destructive" onClick={disable2FA}>Disable 2FA</Button>
      </TwoFactorEnabled>
    )}
  </TwoFactorSection>
</SecuritySettings>
```

---

## States

### Loading
- Skeleton form fields

### Success — Password Changed
- Toast: "Password changed successfully"
- Form clears

### Success — 2FA Enabled
- Dialog shows backup codes
- Status badge updates to "Enabled"

### Error
- **Wrong current password:** Inline: "Current password is incorrect"
- **Passwords don't match:** Inline: "Passwords do not match"
- **Weak password:** Inline: "Password must be at least 8 characters"
- **2FA code invalid:** Inline in dialog: "Invalid verification code"
- **API failure:** Toast: "Failed. Try again."

---

## Forms

### Password Change Validation
| Field | Rule | When | Message |
|-------|------|------|---------|
| Current Password | Required | On submit | "Current password is required" |
| New Password | Required, min 8 chars | On blur | "Password must be at least 8 characters" |
| Confirm Password | Must match new | On blur | "Passwords do not match" |

### 2FA Setup Dialog
- **Step 1:** QR code displayed + manual entry key
- **Step 2:** 6-digit code input (auto-submit on 6th digit)
- **Step 3:** Backup codes displayed (10 codes in grid)
- **Warning:** "Save these codes. You won't see them again."
- **Actions:** "Download Codes" + "Done"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/me/password` | PUT | Change password |
| `/auth/2fa/enable` | POST | Enable 2FA (returns QR + secret) |
| `/auth/2fa/verify` | POST | Verify 2FA code |
| `/auth/2fa/disable` | POST | Disable 2FA |
| `/auth/2fa/backup-codes` | GET | View backup codes |
| `/auth/2fa/backup-codes/regenerate` | POST | Regenerate backup codes |

### Backend Limitations
- 2FA uses TOTP (Google Authenticator compatible)
- Backup codes shown only once on enable/regenerate
- No SMS-based 2FA (future)

---

## Acceptance Criteria

### Functional
- [ ] Password change form works with validation
- [ ] 2FA enable shows QR code and verifies code
- [ ] 2FA enable shows backup codes
- [ ] 2FA disable works
- [ ] Backup codes can be viewed and regenerated
- [ ] Password toggle shows/hides text

### UX
- [ ] Skeleton loading
- [ ] Inline validation on blur
- [ ] 2FA auto-submits on 6th digit
- [ ] Backup codes warning prominent

### Accessibility
- [ ] Password inputs have labels and `autocomplete` attributes
- [ ] QR code has `alt` text; manual entry key provided
- [ ] 2FA code input has `aria-label`
- [ | Error via `aria-live`

### Performance
- [ ] Form renders < 500ms
- [ ] 2FA QR generation < 2s

### Responsive
- [ ] Form full width on mobile
- [ ] 2FA dialog: QR code scales, backup codes in 2-column grid

---

## SCR-ST-05: Settings — API Keys

### Screen ID
SCR-ST-05

### Purpose
Generate and manage API keys for programmatic access.

### Business Goal
Developer enablement; integrations; enterprise feature.

### User Goal
Get API key for integration; manage existing keys.

### Primary Users
Owner only (developer-oriented).

### Permissions
- Tab visible: Owner only
- Editor/Viewer: Tab hidden

### Entry Points
- Settings tab "API"

### Exit Points
- Tab navigation
- Sidebar navigation

### Page Title
`API Keys — Cloud-Screen`

### Primary CTA
"Create API Key" button.

### Secondary CTA
- "Copy" per key
- "Revoke" per key

### Danger Actions
- Revoke API key (destructive — key permanently invalidated)

---

## Layout

### Container
- `max-w-[900px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: API Key Creation
- "Create API Key" button
- (If no keys) Empty state: "No API keys created. Create one to access the Cloud-Screen API."

#### Section 2: API Key Table
- **Columns:** Name, Key (masked — `cs_••••••••`), Created Date, Last Used, Status, Actions
- **Actions:** "Copy" (copies full key — only shown once on creation), "Revoke" (destructive)
- **Data:** `useApiApiKeys()`

#### Section 3: API Documentation Link
- Link to API docs (external or in-app docs page)

---

## States

### Loading
- Skeleton table rows

### Empty — No API Keys
- "No API keys created. Create one to access the Cloud-Screen API." + "Create API Key" CTA

### Success — Key Created
- Dialog shows full key (large, monospace)
- Warning: "This key won't be shown again. Copy it now."
- "Copy Key" button + "Done" button

### Error
- **API failure:** Toast: "Failed to create API key. Try again."

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Create API Key" | Open create dialog (name input) |
| Click | "Copy" | Copy key to clipboard + toast |
| Click | "Revoke" | AlertDialog: "Revoke [Name]? This cannot be undone." |
| Confirm | Revoke dialog | Key revoked + toast: "API key revoked" |

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api-keys` | GET | List API keys |
| `/api-keys` | POST | Create API key (returns full key once) |
| `/api-keys/{id}` | DELETE | Revoke API key |

### Backend Limitations
- Key shown only once on creation (not retrievable later)
- No key scoping (all keys have full access — future: scoped keys)
- No key rotation (must revoke + create new)

### Missing APIs
- `PATCH /api-keys/{id}` — Update key name
- `POST /api-keys/{id}/rotate` — Rotate key (future)

---

## Acceptance Criteria

### Functional
- [ ] "Create API Key" opens dialog with name input
- [ ] Key generated and shown once with copy button
- [ ] Key table lists all keys with name, date, status
- [ ] Revoke shows confirmation and removes key
- [ ] Copy copies to clipboard + toast
- [ ] Tab hidden for non-Owner

### UX
- [ ] Skeleton loading
- [ ] Empty state with CTA
- [ ] Key shown once with prominent warning
- [ ] Revoke requires confirmation

### Accessibility
- [ ] Table has `role="table"` with proper headers
- [ | Copy button has `aria-label="Copy API key"`
- [ ] Revoke button has `aria-label="Revoke [Name]"`

### Performance
- [ ] Table renders < 500ms
- [ ] Key generation < 2s

### Responsive
- [ ] Table scrolls horizontally on mobile
- [ ] Dialog full width on mobile

---

## SCR-ST-06: Settings — Notifications

### Screen ID
SCR-ST-06

### Purpose
Configure which notifications the user receives.

### Business Goal
User engagement; reduce notification fatigue.

### User Goal
Control notification types and channels.

### Primary Users
All users.

### Permissions
- All users can access Notifications tab
- Users configure their own notification preferences

### Entry Points
- Settings tab "Notifications"

### Exit Points
- Tab navigation
- Sidebar navigation

### Page Title
`Notification Preferences — Cloud-Screen`

### Primary CTA
"Save" button.

### Secondary CTA
"Reset to Defaults" button.

---

## Layout

### Container
- `max-w-[800px] mx-auto px-6 py-6`
- Sections: `flex flex-col gap-6`

### Page Sections

#### Section 1: Notification Categories
- **Card per category:** Screen, Schedule, Team, System
- **Each card:** Toggle switches per notification type
- **Toggle types:**
  - Screen: "Screen offline", "Screen online", "Content changed"
  - Schedule: "Schedule started", "Schedule ended", "Schedule conflict"
  - Team: "Invite accepted", "Invite declined", "Member joined", "Member removed"
  - System: "Storage limit", "Plan expiry", "System maintenance"
- **Channels (future):** In-app, Email (toggle per channel per type)

#### Section 2: Actions
- "Save" button (primary)
- "Reset to Defaults" button (secondary)

---

## Component Tree

```
<NotificationSettings>
  {categories.map(category => (
    <NotificationCategoryCard key={category.id} category={category}>
      <SectionHeading>{category.label}</SectionHeading>
      {category.types.map(type => (
        <NotificationToggle
          key={type.id}
          label={type.label}
          description={type.description}
          checked={preferences[type.id]}
          onChange={(val) => updatePreference(type.id, val)}
        />
      ))}
    </NotificationCategoryCard>
  ))}
  <ActionsBar>
    <Button variant="ghost" onClick={resetToDefaults}>Reset to Defaults</Button>
    <Button variant="default" onClick={handleSave} disabled={isLoading}>
      {isLoading ? <Spinner /> : "Save"}
    </Button>
  </ActionsBar>
</NotificationSettings>
```

### Component Details

#### NotificationToggle
- **Props:** `label: string`, `description: string`, `checked: boolean`, `onChange: (val) => void`
- **UI:** Label + description (left), Toggle switch (right)
- **Micro Interaction:** Switch animates immediately on click (MI-03, 150ms)
- **Accessibility:** `role="switch"`, `aria-checked`, `aria-label`

---

## States

### Loading
- Skeleton toggle rows

### Success
- Toast: "Notification preferences saved"

### Reset
- Confirmation: "Reset all preferences to defaults?"
- All toggles animate to default state
- User must still click "Save" to persist

### Error
- Toast: "Failed to save preferences. Try again."

---

## Forms

### Validation
- None (toggles are boolean, no validation needed)

### Submit
- API: `PUT /auth/me/notification-preferences` with full preferences object
- Success: Toast
- Error: Toast

### Unsaved Changes
- **Current:** No warning on tab switch
- **Future:** AlertDialog: "Unsaved changes. Leave anyway?"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/me/notification-preferences` | GET | Current preferences |
| `/auth/me/notification-preferences` | PUT | Update preferences |

### Backend Limitations
- No per-channel configuration (in-app vs email — future)
- No digest/summary options (future: daily/weekly digest)

### Missing APIs
- `PUT /auth/me/notification-preferences/channels` — Per-channel preferences (future)

---

## Acceptance Criteria

### Functional
- [ ] Toggles pre-filled with current preferences
- [ ] Toggle switches animate on click
- [ ] Save persists preferences + toast
- [ ] Reset to Defaults works with confirmation
- [ ] Categories grouped correctly

### UX
- [ ] Skeleton loading
- [ | Toggle animation smooth
- [ ] Save shows loading state
- [ ] (Future) Unsaved changes warning

### Accessibility
- [ ] Toggles: `role="switch"`, `aria-checked`, `aria-label`
- [ ] Keyboard: Tab to toggle, Space/Enter to toggle
- [ ] Focus visible on toggles

### Performance
- [ ] Page renders < 500ms
- [ ] Save < 1s

### Responsive
- [ | Toggle rows full width on mobile
- [ ] Cards stack vertically

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `09-settings-specs-part1.md` for Profile, Workspace, Billing specs
- See `ux-blueprint/12-settings-ux-blueprint-part2.md` for Security + API UX blueprint
- See `ux-blueprint/13-settings-ux-blueprint-part3.md` for Notifications UX blueprint
- See `user-flow-architecture/13-settings-flows.md` for settings flow documentation
- See `product-architecture/09-product-modules.md` M-07 for settings module
