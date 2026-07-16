# Settings Flows

> **Evidence basis:** `ux-blueprint/11-settings-ux-blueprint-part1.md` through `13-settings-ux-blueprint-part3.md`, `product-architecture/09-product-modules.md` M-07, `product-architecture/17-product-rules.md` PR-36, `03-decision-trees.md` §9
> **Purpose:** Complete user flow documentation for Profile Update, Password Change, 2FA Setup, Billing Upgrade, API Key Creation, and Notification Preferences

---

## FL-ST-01: Profile Update

| Field | Value |
|-------|-------|
| Flow ID | FL-ST-01 |
| Flow Name | Profile Update |
| Purpose | Update user profile (name, email, avatar) |
| Primary User | All users |
| Business Goal | Personalization; user identity |
| User Goal | Update personal information |
| Starting Point | `/settings` (Profile tab) |
| Ending Point | `/settings` (profile saved) |
| Success Criteria | Profile updated and saved |
| Failure Criteria | Invalid email; API failure |
| Frequency | Occasional |
| Business Importance | Low |
| Complexity | Simple |

### Happy Path

**Step 1: View profile form**
- Screen: `/settings` (Profile tab active)
- System Response: Form pre-filled with current name, email, avatar
- Loading: Skeleton form fields during initial load
- Accessibility: All inputs have associated labels

**Step 2: Edit fields**
- User Action: Modifies name and/or email; optionally uploads avatar
- Validation: Name (2-50 chars) on blur; email format on blur
- Micro Interaction: Avatar upload shows progress indicator

**Step 3: Save**
- User Action: Clicks "Save" button
- System Response: API call to update profile
- Loading: Button spinner + "Saving..."
- Success: Toast: "Profile updated"
- State Transition: Profile data updated in SWR cache

### Failure Paths

**FP-1: Invalid email**
- UI: Inline error on email field
- Recovery: User corrects email

**FP-2: Email already in use**
- Trigger: API returns 409
- UI: Inline error: "This email is already in use"
- Recovery: User uses different email

**FP-3: Avatar upload failure**
- UI: Toast: "Failed to upload avatar"
- Recovery: User retries

**FP-4: API failure**
- UI: Toast: "Failed to save profile. Try again."
- Recovery: User retries

### Cancellation Path
- User navigates to another tab → (Future) unsaved changes warning
- Currently: changes lost without warning

---

## FL-ST-02: Password Change

| Field | Value |
|-------|-------|
| Flow ID | FL-ST-02 |
| Flow Name | Password Change |
| Purpose | Update user password |
| Primary User | All users |
| Business Goal | Security |
| User Goal | Change password |
| Starting Point | `/settings/security` |
| Ending Point | `/settings/security` (password changed) |
| Success Criteria | Password updated successfully |
| Failure Criteria | Wrong current password; mismatch; weak password |
| Frequency | Occasional |
| Business Importance | Low |
| Complexity | Medium |

### Happy Path

**Step 1: View password form**
- Screen: `/settings/security` (Security tab)
- UI: Current password, new password, confirm password inputs

**Step 2: Enter passwords**
- User Action: Types current password, new password, confirms new password
- Validation: New password (min 8 chars) on blur; confirm matches new on blur
- Micro Interaction: Password toggle (eye icon) shows/hides text

**Step 3: Submit**
- User Action: Clicks "Change Password"
- System Response: API call to change password (requires current password for verification)
- Loading: Button spinner
- Success: Toast: "Password changed successfully"; form clears

### Failure Paths

**FP-1: Wrong current password**
- Trigger: API returns 401
- UI: Inline error on current password: "Current password is incorrect"
- Recovery: User re-enters current password

**FP-2: Passwords don't match**
- Trigger: Client-side validation
- UI: Inline error on confirm field: "Passwords do not match"
- Recovery: User re-types confirm password

**FP-3: Weak password**
- Trigger: API returns 400 (password doesn't meet requirements)
- UI: Inline error: "Password must be at least 8 characters"
- Recovery: User enters stronger password

### Cancellation Path
- User navigates away → form data lost (no warning currently)

---

## FL-ST-03: 2FA Setup

| Field | Value |
|-------|-------|
| Flow ID | FL-ST-03 |
| Flow Name | 2FA Setup |
| Purpose | Enable two-factor authentication for account security |
| Primary User | All users (recommended for Owner) |
| Business Goal | Security; enterprise compliance |
| User Goal | Add extra security to account |
| Starting Point | `/settings/security` |
| Ending Point | `/settings/security` (2FA enabled, backup codes saved) |
| Success Criteria | 2FA enabled; backup codes displayed and saved |
| Failure Criteria | Invalid 2FA code; API failure |
| Frequency | One-time |
| Business Importance | Low |
| Complexity | Complex |

### Happy Path

**Step 1: Initiate 2FA setup**
- Screen: `/settings/security`
- User Action: Clicks "Enable 2FA" button
- System Response: Opens 2FA setup dialog with QR code
- UI: QR code displayed, 6-digit code input field

**Step 2: Scan QR code**
- User Action: Scans QR code with authenticator app (Google Authenticator, Authy, etc.)
- System Response: App displays 6-digit time-based code
- Accessibility: QR code has `alt` text; manual entry key provided as alternative

**Step 3: Enter verification code**
- User Action: Types 6-digit code from authenticator app
- System Response: API call to verify code and enable 2FA
- Validation: 6 digits required; auto-submit on 6th digit
- Loading: Dialog spinner + "Verifying..."

**Step 4: 2FA enabled**
- System Response: API returns 200; 2FA is now active
- Success: Dialog shows backup codes (10 codes in grid)
- State Transition: 2FA DISABLED → 2FA ENABLED
- Feedback: Toast: "Two-factor authentication enabled"

**Step 5: Save backup codes**
- UI: Warning: "Save these codes in a safe place. You won't see them again."
- User Action: Clicks "Download Codes" (downloads text file) or copies manually
- User Action: Clicks "Done" to close dialog
- UI: 2FA status badge updates to green "Enabled"; backup codes section appears

### Alternative Paths

**AP-1: Manual entry key**
- User cannot scan QR (no camera or authenticator app doesn't support scan)
- User types manual entry key (shown below QR code) into authenticator app
- Proceeds to Step 3

### Failure Paths

**FP-1: Invalid verification code**
- Trigger: API returns 401 (code doesn't match)
- UI: Inline error: "Invalid verification code"
- Recovery: User re-enters code (code may have expired — 30s window)

**FP-2: API failure**
- UI: Toast: "Failed to enable 2FA. Try again."
- Recovery: User retries

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Invalid code | Re-enter code (wait for new code in app) | Step 3 |
| API failure | Retry | Step 3 |

### Cancellation Path
- User closes dialog at any point → 2FA not enabled
- If closed after Step 4 (enabled) but before Step 5 (codes saved): codes are lost
- User can regenerate codes later from Security tab

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| QR scan | Medium — user may not have authenticator app | Provide manual entry key as alternative |
| Backup code storage | Medium — user may lose codes | Strong warning + download button |
| Code expiry | Low — 30s window | Auto-submit on 6th digit; clear error if expired |

---

## FL-ST-04: Billing Upgrade

| Field | Value |
|-------|-------|
| Flow ID | FL-ST-04 |
| Flow Name | Billing Upgrade |
| Purpose | Upgrade workspace subscription plan |
| Primary User | Workspace Owner |
| Business Goal | Revenue; plan upsell |
| User Goal | Access more features or higher limits |
| Starting Point | `/settings/billing` |
| Ending Point | `/settings/billing` (plan upgraded) |
| Success Criteria | Plan upgraded; new features/limits active |
| Failure Criteria | Payment failure; API failure |
| Frequency | Occasional |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: View billing**
- Screen: `/settings/billing`
- UI: Current plan, usage bars, plan options
- Permission Check: 🔒 Owner only (tab hidden for Editor/Viewer)

**Step 2: Select new plan**
- User Action: Clicks "Select Plan" on desired plan card
- System Response: Opens upgrade confirmation dialog
- UI: Dialog shows plan name, price, billing cycle

**Step 3: Confirm upgrade**
- User Action: Clicks "Confirm Upgrade"
- System Response: Check payment method
- ◇ Has payment method? → No: Collect payment via Stripe (future)
- Yes: Process upgrade

**Step 4: Upgrade success**
- System Response: API returns 200; plan updated
- Success: Dialog closes; page refreshes with new plan
- Feedback: Toast: "Plan upgraded to [Plan Name]"
- State Transition: Plan changes; new limits active

### Failure Paths

**FP-1: Payment failure**
- Trigger: Stripe returns error (card declined, insufficient funds)
- UI: Dialog: "Payment failed: [reason]. Try a different card."
- Recovery: User updates payment method and retries

**FP-2: API failure**
- UI: Toast: "Failed to upgrade plan. Try again."
- Recovery: User retries

### Cancellation Path
- User clicks "Cancel" in dialog → no upgrade

---

## FL-ST-05: API Key Creation

| Field | Value |
|-------|-------|
| Flow ID | FL-ST-05 |
| Flow Name | API Key Creation |
| Purpose | Generate API key for programmatic access |
| Primary User | Workspace Owner (developer) |
| Business Goal | Developer enablement; integrations |
| User Goal | Get API key for integration |
| Starting Point | `/settings/api` |
| Ending Point | `/settings/api` (key created and copied) |
| Success Criteria | API key generated and copied by user |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Low |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate key creation**
- Screen: `/settings/api`
- User Action: Clicks "Create API Key"
- System Response: Opens create dialog
- Permission Check: 🔒 Owner only

**Step 2: Name the key**
- Screen: Create dialog
- UI: Key name input (e.g., "Production Server", "Mobile App")
- User Action: Types descriptive name, clicks "Generate"
- Validation: Name required

**Step 3: Key generated**
- System Response: API call; key generated and returned
- Loading: Dialog spinner
- Success: Dialog shows generated key (large, monospace text)
- UI: Warning: "This key won't be shown again. Copy it now."
- Micro Interaction: Key appears with highlight (MI-08)

**Step 4: Copy key**
- User Action: Clicks "Copy Key" button
- System Response: Key copied to clipboard
- Feedback: Toast: "API key copied to clipboard"
- User Action: Clicks "Done" to close dialog
- UI: Key appears in key table (name, created date, status: Active)

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to create API key. Try again."
- Recovery: User retries

### Cancellation Path
- User clicks "Cancel" in dialog → no key created
- If user closes dialog after key is shown but before copying: key is created but user must generate a new one (old one still works until revoked)

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Key shown once | Medium — user may lose key | Prominent warning + copy button + download option (future) |
| Key security | Low — user may share key | Warning: "Never share your API key publicly" |

---

## FL-ST-06: Notification Preferences

| Field | Value |
|-------|-------|
| Flow ID | FL-ST-06 |
| Flow Name | Notification Preferences |
| Purpose | Configure which notifications user receives |
| Primary User | All users |
| Business Goal | User engagement; reduce notification fatigue |
| User Goal | Control notification types and channels |
| Starting Point | `/settings/notifications` |
| Ending Point | `/settings/notifications` (preferences saved) |
| Success Criteria | Preferences saved |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Low |
| Complexity | Simple |

### Happy Path

**Step 1: View preferences**
- Screen: `/settings/notifications`
- UI: Toggle switches grouped by category (Screen, Schedule, Team, System)
- System Response: Toggles pre-filled with current preferences

**Step 2: Toggle preferences**
- User Action: Clicks toggle switches to enable/disable notification types
- Micro Interaction: Switch animates immediately (MI-03, 150ms)
- Note: Changes are visual only until "Save" is clicked

**Step 3: Save**
- User Action: Clicks "Save"
- System Response: API call to update preferences
- Loading: Button spinner
- Success: Toast: "Notification preferences saved"

### Alternative Paths

**AP-1: Reset to defaults**
- User clicks "Reset to Defaults"
- Confirmation dialog: "Reset all preferences to defaults?"
- User confirms → all toggles animate to default state
- User must still click "Save" to persist

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to save preferences. Try again."
- Recovery: User retries

### Cancellation Path
- User navigates to another tab → (Future) unsaved changes warning
- Currently: changes lost without warning

---

## Cross-References

- See `03-decision-trees.md` §9 for billing upgrade decision tree
- See `ux-blueprint/11-settings-ux-blueprint-part1.md` through `13-settings-ux-blueprint-part3.md` for settings UX
- See `product-architecture/09-product-modules.md` M-07 for settings module
- See `14-notification-flows.md` for notification view flow
