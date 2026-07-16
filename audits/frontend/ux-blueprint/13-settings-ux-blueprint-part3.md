# Settings UX Blueprint — Part 3: Security & API

> **Evidence basis:** `05-page-type-ux-rules.md` §7, `information-architecture/06-page-catalog.md` P-ST-05, P-ST-06, `audits/frontend/14-settings-feature.md`, `product-architecture/09-product-modules.md` M-07
> **Purpose:** Complete UX blueprint for Settings Security and API tabs
> **Part:** 3 of 3 (Settings)

---

## P-ST-05: Security

### 1. Purpose
- **Business purpose:** Account security; 2FA enforcement; password management
- **User purpose:** Change password, enable/disable 2FA, manage sessions
- **Success criteria:** User can change password within 30 seconds; user can enable 2FA within 60 seconds
- **Failure criteria:** Can't change password; 2FA setup confusing; session management missing

### 2. Target Users
- **Primary user:** All users (Owner, Editor, Viewer)
- **Secondary user:** None
- **Permissions:** All users can manage their own security settings
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Security is critical for enterprise customers; 2FA may be required by plan

### 4. Primary Goal
Manage account security (password and 2FA)

### 5. Primary Action
"Change Password" or "Enable 2FA" (context-dependent)

### 6. Secondary Actions
1. Change password
2. Enable/disable 2FA
3. View/regenerate backup codes
4. View active sessions (future)
5. Revoke sessions (future)

### 7. Information Priority
1. 2FA status (enabled/disabled) — **most critical security indicator**
2. Password last changed date — **freshness**
3. Change password form — **action**
4. Backup codes — **recovery**
5. Active sessions (future) — **awareness**

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (Security active)
- "Two-Factor Authentication" section: status badge, enable/disable button
- "Change Password" section: current password, new password, confirm password

**Middle:**
- "Backup Codes" section (visible only if 2FA enabled): codes display, regenerate button

**Bottom:**
- "Active Sessions" section (future): device list, revoke buttons

### 9. Page Sections

#### Section 1: Two-Factor Authentication
- **Purpose:** 2FA management
- **Priority:** 1
- **Contents:** Status badge (Enabled/Disabled), "Enable 2FA" or "Disable 2FA" button
- **Dependencies:** `useApi2FA` (SWR)
- **Visibility:** Always
- **Future:** 2FA enforcement by workspace, SSO/SAML

#### Section 2: Change Password
- **Purpose:** Password update
- **Priority:** 1
- **Contents:** Current password input, new password input, confirm password input, "Change Password" button
- **Visibility:** Always

#### Section 3: Backup Codes
- **Purpose:** 2FA recovery codes
- **Priority:** 2 (conditional)
- **Contents:** Grid of 10 backup codes, "Download" button, "Regenerate" button, warning text
- **Visibility:** Only when 2FA is enabled
- **Future:** Copy all codes button

#### Section 4: Active Sessions (future)
- **Purpose:** Session management
- **Priority:** 3
- **Contents:** List of active sessions (device, browser, location, last active), "Revoke" button per session
- **Visibility:** Future implementation

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix, vertical) | Navigation |
| "Security" tab | Tab trigger (active) | Navigation |
| 2FA status badge | Badge (green=enabled, amber=disabled) | 2FA |
| "Enable 2FA" button | Button (default) | 2FA |
| "Disable 2FA" button | Button (destructive) | 2FA |
| 2FA setup dialog | Dialog (Radix) | 2FA |
| QR code | Image | 2FA Dialog |
| 2FA code input | Input (text, 6-digit) | 2FA Dialog |
| Current password input | Input (password) | Change Password |
| New password input | Input (password) | Change Password |
| Confirm password input | Input (password) | Change Password |
| Password toggle | Button (icon) | Change Password |
| Password strength indicator | Progress (future) | Change Password |
| "Change Password" button | Button (default) | Change Password |
| Backup code grid | Grid (2 columns, 5 rows) | Backup Codes |
| Backup code | Text (mono) | Backup Codes |
| "Download Codes" button | Button (outline) | Backup Codes |
| "Regenerate Codes" button | Button (outline) | Backup Codes |
| Warning text | Text (amber) | Backup Codes |
| Session item | List item | Active Sessions (future) |
| Device icon | Icon | Active Sessions |
| Device name | Text | Active Sessions |
| Last active | Text (muted) | Active Sessions |
| "Revoke" button | Button (ghost, destructive) | Active Sessions |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Enable 2FA" | Opens 2FA setup dialog (QR code + code input) |
| Click | "Disable 2FA" | Opens disable dialog (requires password + 2FA code) |
| Click | "Change Password" | Validates and submits password change |
| Click | Password toggle | Shows/hides password text |
| Click | "Download Codes" | Downloads backup codes as text file |
| Click | "Regenerate Codes" | Opens confirmation dialog, then generates new codes |
| Type | 2FA code input | Auto-submits when 6 digits entered |
| Keyboard | Tab | Through tabs → 2FA → password → backup codes |
| Keyboard | Enter | Submits focused form |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Security sections with current state |
| Loading | Initial load | Skeleton sections |
| 2FA enabling | QR dialog open | QR code displayed, code input ready |
| 2FA verifying | 6 digits entered | Dialog spinner + "Verifying..." |
| 2FA enabled | API 200 | Dialog closes, status badge updates to green, backup codes appear, toast: "2FA enabled" |
| 2FA enable error | API error | Inline: "Invalid verification code" |
| 2FA disabling | Disable dialog confirm | Dialog spinner |
| 2FA disabled | API 200 | Status badge updates to amber, backup codes hidden, toast: "2FA disabled" |
| Password changing | "Change Password" clicked | Button spinner + "Changing..." |
| Password success | API 200 | Toast: "Password changed" + form clears |
| Password error — wrong current | API 401 | Inline: "Current password is incorrect" |
| Password error — mismatch | Client validation | Inline: "Passwords do not match" |
| Password error — weak | API 400 | Inline: "Password must be at least 8 characters" |
| Codes regenerating | "Regenerate" confirmed | Spinner + new codes appear |
| Codes regenerated | API 200 | New codes displayed, toast: "Backup codes regenerated" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| 2FA enabled | Toast: "Two-factor authentication enabled" |
| 2FA disabled | Toast (amber): "Two-factor authentication disabled" |
| Password changed | Toast: "Password changed successfully" |
| Backup codes regenerated | Toast: "Backup codes regenerated. Save these new codes." |
| Backup codes downloaded | (No toast — browser handles download) |
| Wrong current password | Inline error on current password field |
| Password mismatch | Inline error on confirm field |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Enable 2FA? | Security tab | Enable (more secure) or skip | Skip (optional, but recommended for Owner) |
| Regenerate codes? | Backup codes section | Keep current or regenerate | Keep (regenerate only if compromised) |
| Download or copy codes? | After enabling 2FA | Download file or copy manually | Download (safer storage) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Lose backup codes | Warning: "Save these codes in a safe place" | Regenerate codes (requires 2FA code) |
| Forget current password | Cannot change password without current | Use "Forgot Password" flow |
| Disable 2FA accidentally | Disable requires password + 2FA code | Must provide both |
| Weak new password | (Future) Strength indicator | Inline guidance |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Full navigable; Tab through all sections |
| Screen reader | 2FA status badge has `aria-label` (e.g., "Two-factor authentication: enabled") |
| ARIA | QR code has `alt` text describing purpose |
| Focus | First input auto-focused on section |
| Contrast | Status badges meet 3:1 |
| Touch targets | All buttons ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tab nav | Horizontal scroll |
| 2FA setup | QR code centered, large enough to scan from another device |
| Password form | Full width inputs |
| Backup codes | Single column list |
| Dialogs | Full screen |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch 2FA status (fast) |
| QR code | Generated server-side, cached |
| Tab switch | SWR cache (instant) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Password strength indicator | Change Password section |
| Active sessions | New section |
| SSO/SAML | New section (or separate tab if complex) |
| Biometric 2FA (WebAuthn) | 2FA section enhancement |
| 2FA enforcement by workspace | Workspace tab cross-link |
| Security audit log | New section or Settings → Audit tab |
| Trusted devices | Active sessions enhancement |

### 20. UX Notes
- 2FA setup dialog must show QR code large enough to scan from another device (mobile)
- Backup codes must be displayed prominently with a strong warning to save them
- "Regenerate Codes" should warn that old codes will be invalid
- Password change should require current password (security best practice)
- Password strength indicator should show requirements before user types (future)
- Consider showing "Last password change: [date]" for security awareness
- 2FA disable should require both password AND 2FA code (double security)
- Active sessions is a highly requested enterprise feature — prioritize for future
- SSO/SAML may warrant its own tab if configuration is complex
- This tab is visible to all roles (each user manages their own security)

---

## P-ST-06: API

### 1. Purpose
- **Business purpose:** Developer enablement; integration support
- **User purpose:** Generate API keys, read API documentation, configure webhooks
- **Success criteria:** Developer can generate an API key within 30 seconds; documentation is accessible
- **Failure criteria:** Can't generate keys; no documentation; keys exposed

### 2. Target Users
- **Primary user:** Workspace Owner (developer or technical owner)
- **Secondary user:** Editor (if granted API access — future)
- **Permissions:** Owner only. Editor/Viewer: tab hidden.
- **Visibility:** Authenticated + has workspace + Owner role

### 3. Page Priority
- **Priority:** Low
- **Reasoning:** Developer-focused; used rarely; important for integrations but not daily operations

### 4. Primary Goal
Manage API keys and access developer resources

### 5. Primary Action
"Create API Key" (dialog)

### 6. Secondary Actions
1. View existing API keys (name, created date, last used)
2. Copy API key (only shown once on creation)
3. Revoke API key (→ AlertDialog)
4. View API documentation (external link or embedded)
5. Configure webhooks (future)

### 7. Information Priority
1. API key list — **what exists**
2. "Create API Key" button — **primary action**
3. API documentation link — **how to use**
4. Webhook configuration (future) — **integrations**
5. Key permissions/scope (future) — **security**

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (API active)
- "API Keys" section: key list table + "Create API Key" button
- "Documentation" section: link to API docs

**Middle:**
- "Webhooks" section (future): webhook URL list + "Add Webhook" button

**Bottom:**
- Security warning about key management

### 9. Page Sections

#### Section 1: API Keys
- **Purpose:** Key management
- **Priority:** 1
- **Contents:** Key table (name, created date, last used, status, actions), "Create API Key" button
- **Dependencies:** `useApiKeys` (SWR)
- **Visibility:** Always (Owner only)
- **Future:** Key scopes, key expiration

#### Section 2: Documentation
- **Purpose:** Developer resources
- **Priority:** 2
- **Contents:** Link to API documentation (external or embedded viewer), code examples
- **Visibility:** Always
- **Future:** Interactive API explorer, SDK downloads

#### Section 3: Webhooks (future)
- **Purpose:** Event subscription
- **Priority:** 3
- **Contents:** Webhook URL list, "Add Webhook" button, event type selector
- **Visibility:** Future implementation
- **Future:** Webhook test, delivery logs

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix, vertical) | Navigation |
| "API" tab | Tab trigger (active) | Navigation |
| "Create API Key" button | Button (default) | API Keys |
| Key table | Table | API Keys |
| Key name | Text | API Keys |
| Key created date | Text (muted) | API Keys |
| Key last used | Text (muted) | API Keys |
| Key status | Badge (Active/Revoked) | API Keys |
| "Copy" button | Button (icon, ghost) | API Keys |
| "Revoke" button | Button (ghost, destructive) | API Keys |
| Create key dialog | Dialog (Radix) | API Keys |
| Key name input | Input (text) | Create Dialog |
| Generated key display | Text (mono, large) | Create Dialog |
| "Copy Key" button | Button (outline) | Create Dialog |
| Warning text | Text (amber) | Create Dialog |
| "Documentation" link | Link | Documentation |
| "API Docs" card | Card | Documentation |
| Code example | Code block | Documentation |
| Webhook URL input | Input (text) | Webhooks (future) |
| "Add Webhook" button | Button (outline) | Webhooks (future) |
| Empty State | EmptyState | API Keys (if none) |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Create API Key" | Opens create dialog |
| Click | "Copy Key" | Copies key to clipboard + toast: "API key copied" |
| Click | "Revoke" | Opens AlertDialog: "Revoke [Key Name]?" |
| Click | "Documentation" link | Opens API docs in new tab |
| Click | Code example | Copies to clipboard (future) |
| Keyboard | Tab | Through tabs → keys → docs |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Key table with data |
| Loading | Initial load | Skeleton table rows |
| Empty — no keys | 0 API keys | "No API keys created" + "Create API Key" CTA |
| Creating | Dialog submit | Dialog spinner |
| Key created | API 200 | Dialog shows generated key (large, monospace) + copy button + warning |
| Key copied | "Copy Key" clicked | Toast: "API key copied to clipboard" |
| Revoking | AlertDialog confirm | Spinner on revoke button |
| Key revoked | API 200 | Toast: "API key revoked" + table updates |
| Error — create | API error | Toast: "Failed to create API key" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Key created | Dialog shows key + toast: "API key created. Copy it now — it won't be shown again." |
| Key copied | Toast: "API key copied to clipboard" |
| Key revoked | Toast: "API key revoked" |
| Create error | Toast: "Failed to create API key" |
| Revoke error | Toast: "Failed to revoke API key" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Create key? | Need API access | Create key or use existing | Use existing if available |
| Revoke key? | Key no longer needed | Revoke (permanent) or keep | Keep (revoke only if compromised) |
| Copy now or later? | Key shown on creation | Copy immediately or lose access | Copy immediately (shown once) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Lose API key | Warning: "This key won't be shown again. Copy it now." | Generate new key (old one still works until revoked) |
| Revoke wrong key | AlertDialog: "Revoke [Key Name]? Apps using this key will stop working." | Must confirm |
| Share key publicly | Warning: "Never share your API key publicly" | Revoke and generate new key |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through tabs → key table → buttons |
| Screen reader | Key status has `aria-label` (Active/Revoked) |
| Focus | Create dialog: key name input auto-focused |
| Contrast | Code block meets 4.5:1 |
| Touch targets | All buttons ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tab nav | Horizontal scroll |
| Key table | Card list (stacked rows) |
| Create dialog | Full screen |
| Generated key | Full width, large monospace text |
| Documentation | Link opens in new tab |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch keys (fast, few records) |
| Key generation | Server-side, instant response |
| Tab switch | SWR cache (instant) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Key scopes/permissions | Create dialog enhancement |
| Key expiration | Create dialog enhancement |
| Webhook configuration | New section |
| Webhook delivery logs | New sub-page or section |
| Interactive API explorer | Documentation section |
| SDK downloads | Documentation section |
| Rate limit display | API Keys section |
| Key usage analytics | Key table enhancement |

### 20. UX Notes
- API key is shown ONLY ONCE on creation — this is critical and must be communicated clearly
- Warning text in create dialog: "This key won't be shown again. Copy it now."
- Key name should be descriptive (e.g., "Production Server", "Mobile App") for management
- "Last used" timestamp helps identify unused keys for cleanup
- Documentation link should open in a new tab (external resource)
- Consider embedding a minimal API explorer for common endpoints (future)
- Tab is hidden for Editor/Viewer roles — only Owner sees "API" in the tab list
- Webhook configuration is a natural extension of this tab — plan for it in future
- Security warning at bottom: "Never share your API keys publicly or commit them to version control"

---

## Cross-References

- See `11-settings-ux-blueprint-part1.md` for Profile and Workspace tabs
- See `12-settings-ux-blueprint-part2.md` for Billing and Notifications tabs
- See `05-page-type-ux-rules.md` §7 for settings page type rules
- See `information-architecture/06-page-catalog.md` P-ST-05, P-ST-06
- See `audits/frontend/14-settings-feature.md` for settings audit
- See `product-architecture/09-product-modules.md` M-07 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `03-component-ux-standards.md` §1 for form UX standards
