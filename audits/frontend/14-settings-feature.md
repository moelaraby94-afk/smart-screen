# 14 — Settings Feature

> **Source basis:** `src/features/settings/settings-tabs.tsx`, `src/features/settings/settings-profile-client.tsx`, `src/features/settings/settings-billing-client.tsx`, `src/features/settings/workspace-settings-client.tsx`, `src/features/settings/notification-preferences.tsx`, `src/features/settings/two-factor-settings.tsx`  

---

## 14.1 Settings Architecture

### Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/{locale}/settings/profile` | `SettingsProfilePage` | User profile settings |
| `/{locale}/settings/workspace` | `WorkspaceSettingsPage` | Workspace settings |
| `/{locale}/settings/billing` | `SettingsBillingPage` | Billing & subscription |

### Shared Layout
All settings pages:
1. Render page header (kicker, title, description) from `settingsPages` translation namespace
2. Render `SettingsTabs` component (navigation between settings sections)
3. Render the specific settings client component

---

## 14.2 Settings Tabs (`src/features/settings/settings-tabs.tsx`)

### Purpose
Tab navigation between the three settings sections.

### Tabs
| Tab | Route | Label Key |
|-----|-------|-----------|
| Profile | `/{locale}/settings/profile` | `settingsPages.profileTab` |
| Workspace | `/{locale}/settings/workspace` | `settingsPages.workspaceTab` |
| Billing | `/{locale}/settings/billing` | `settingsPages.billingTab` |

### Rendering
Uses the `Tabs` UI component from `src/components/ui/tabs.tsx`. Active tab is determined by current pathname. Each tab trigger is a `Link` to the respective settings page.

---

## 14.3 Settings Profile Client (`src/features/settings/settings-profile-client.tsx`)

### Purpose
User profile management (~10KB).

### Sections

**Profile Information:**
- Full name (editable)
- Email (read-only or editable with verification)
- Phone number (with country code selector from `COUNTRIES` list)
- Avatar upload
- Bio/description

**Security:**
- Change password (current, new, confirm)
- Two-factor authentication settings (`TwoFactorSettings` component)
- Active sessions list
- Revoke sessions

**Preferences:**
- Language preference (AR/EN)
- Theme preference (light/dark)
- Density preference (comfortable/compact)
- Timezone selection

### Validation
- Password change requires current password
- New password must meet complexity requirements
- Phone number validated by country dial code
- Form submission shows loading state and toast feedback

---

## 14.4 Settings Billing Client (`src/features/settings/settings-billing-client.tsx`)

### Purpose
Billing and subscription management (~33KB — the largest settings component).

### Sections

**Current Plan:**
- Plan name and tier
- Billing cycle (monthly/annual)
- Next billing date
- Monthly cost
- Upgrade/downgrade buttons

**Usage:**
- Screen usage (used/limit) with progress bar
- Storage usage (used/limit) with progress bar
- `UsageIndicator` component for visual display

**Payment Method:**
- Current payment method (card type, last 4 digits)
- Update payment method
- Add new card

**Invoices:**
- List of past invoices
- Download invoice (PDF)
- Invoice date, amount, status (paid/pending/failed)

**Plan Selection:**
- Grid of available plans
- Feature comparison
- Select plan → confirmation dialog → API call

**Subscription Management:**
- Cancel subscription (with confirmation)
- Pause subscription
- Resume subscription

### API Calls
Uses `billing-api.ts` for all billing operations:
| Function | Method | Path |
|----------|--------|------|
| `fetchSubscription()` | GET | `/billing/subscription` |
| `fetchInvoices()` | GET | `/billing/invoices` |
| `updatePaymentMethod(data)` | POST | `/billing/payment-method` |
| `changePlan(planId)` | POST | `/billing/change-plan` |
| `cancelSubscription()` | POST | `/billing/cancel` |
| `downloadInvoice(id)` | GET | `/billing/invoices/{id}/pdf` |

---

## 14.5 Workspace Settings Client (`src/features/settings/workspace-settings-client.tsx`)

### Purpose
Workspace configuration (~7KB).

### Fields
| Field | Type | Purpose |
|-------|------|---------|
| Workspace name | text | Display name |
| Slug | text (read-only) | URL-safe identifier |
| Timezone | select | Workspace timezone |
| Default locale | select (ar/en) | Default language for workspace |
| Is paused | switch | Pause all screens in workspace |
| Default playlist | select | Default playlist for new screens |

### Actions
- Save changes → `PATCH /workspaces/{id}`
- Delete workspace → Confirmation dialog → `DELETE /workspaces/{id}`
- Export workspace data (if supported)

---

## 14.6 Notification Preferences (`src/features/settings/notification-preferences.tsx`)

### Purpose
Configure which notifications the user receives.

### Channels
- In-app notifications
- Email notifications
- Browser push notifications

### Categories
| Category | Options |
|----------|---------|
| Screen status | Online/offline alerts |
| Upload complete | Media upload notifications |
| Subscription updates | Plan changes, billing events |
| Schedule changes | Schedule modifications |
| Pairing activity | New device pairing |
| Team activity | Member joined, invite accepted |

### UI
Each category has toggle switches for each channel (in-app, email, push). Changes are saved via API call.

---

## 14.7 Two-Factor Settings (`src/features/settings/two-factor-settings.tsx`)

### Purpose
Manage two-factor authentication (~10KB).

### Features

**Status Display:**
- Shows whether 2FA is enabled or disabled
- Last enabled date
- Backup codes remaining

**Enable 2FA Flow:**
1. User enters password to confirm
2. System generates QR code for authenticator app
3. User scans QR with app (Google Authenticator, Authy, etc.)
4. User enters 6-digit verification code
5. System verifies and enables 2FA
6. Displays backup codes for safekeeping

**Disable 2FA Flow:**
1. User enters current 2FA code
2. User enters password
3. System disables 2FA

**Regenerate Backup Codes:**
- Requires 2FA code verification
- Generates new set of backup codes
- Old codes are invalidated

### API Calls
| Function | Method | Path |
|----------|--------|------|
| `enable2FA(data)` | POST | `/auth/2fa/enable` |
| `verify2FA(code)` | POST | `/auth/2fa/verify` |
| `disable2FA(code)` | POST | `/auth/2fa/disable` |
| `regenerateBackupCodes(code)` | POST | `/auth/2fa/backup-codes` |

---

## 14.8 [V2] UX Analysis — Settings Feature

### Settings Architecture — IA Evaluation

**[V2] Tab-Based Settings:**
Settings uses a tab-based layout with: Profile, Billing, Workspace, Notification Preferences, Two-Factor. This is a standard SaaS settings pattern. The tabs are:
- **Profile** — User avatar, name, email
- **Billing** — Plan, invoices, payment method
- **Workspace** — Workspace name, settings, danger zone
- **Notifications** — Per-event notification preferences
- **Two-Factor** — 2FA enable/disable, backup codes

**[V2] Settings/Workspace Missing Back Button:**
As identified in `03-routing-and-navigation.md` V2, `settings/workspace` has no back button in the header (unlike `settings/profile` and `settings/billing`). This is an inconsistency — users on the workspace settings page must use breadcrumbs or sidebar to navigate away.

**[V2] Settings URL Structure:**
Settings uses `/settings/profile`, `/settings/billing`, `/settings/workspace` — separate routes for each tab. This means each tab is bookmarkable and the browser back button works between tabs. This is good IA practice.

### Profile Settings — UX Analysis

**[V2] Profile Form:**
The profile settings likely include avatar upload, name editing, and email display. Key UX considerations:
- Avatar upload should support drag-and-drop and show preview
- Name editing should have inline validation
- Email changes should require verification (security)

### Billing Settings — UX Analysis

**[V2] Billing Page:**
The billing settings show current plan, usage, and payment method. Key UX considerations:
- Plan comparison/upgrade flow
- Invoice download (PDF)
- Payment method update
- Proration display when changing plans

**[V2] No Plan Selector in Frontend:**
The billing page may show the current plan but not offer a plan selector/upgrade flow. Users may need to contact sales or use an external billing portal. This is a friction point for self-service upgrades.

### Workspace Settings — UX Analysis

**[V2] Danger Zone:**
Workspace settings likely include a "Danger Zone" section for workspace deletion. As noted in `08-dashboard-and-overview.md` V2, the delete dialog has no undo capability. The workspace settings page is another entry point for this destructive action.

**[V2] No Workspace Transfer:**
There is no option to transfer workspace ownership to another team member. This is important for organizational changes (e.g., manager leaves, new manager takes over).

### Notification Preferences — UX Analysis

**[V2] Per-Event Granularity:**
Notification preferences allow users to choose which events trigger notifications. This is good UX — it respects user attention and prevents notification fatigue.

**[V2] Channel Selection:**
Users should be able to choose notification channels (in-app, email, push). If only in-app notifications are configurable, users who prefer email notifications have no option.

### Two-Factor Settings — UX Analysis

**[V2] 2FA Enable Flow:**
The 2FA enable flow requires: entering current 2FA code (from authenticator app) and password. This is standard. The flow should also:
- Show QR code for authenticator app setup
- Display backup codes for recovery
- Confirm backup codes were saved

**[V2] 2FA Disable — Requires Verification:**
Disabling 2FA requires both a 2FA code and password. This prevents unauthorized 2FA disabling. Good security practice.

**[V2] Backup Code Regeneration:**
Backup codes can be regenerated with 2FA code verification. Old codes are invalidated. This is correct — prevents stale backup codes from being used.

### [V2] Nielsen Heuristic Evaluation — Settings

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ✅ Good | Loading states on forms, success toasts |
| User control and freedom | ⚠️ Medium | Missing back button on workspace settings |
| Consistency and standards | ⚠️ Medium | Back button inconsistency between settings tabs |
| Error prevention | ⚠️ Medium | No type-to-confirm on workspace deletion |
| Recognition rather than recall | ✅ Good | Tab labels are clear, forms have labels |
| Flexibility and efficiency | ⚠️ Medium | No keyboard shortcuts, no quick settings search |

### Cross-References
- See `06-auth-and-session.md` for 2FA login flow
- See `08-dashboard-and-overview.md` for workspace rename/delete dialogs
- See `17-notifications.md` for notification system
- See `03-routing-and-navigation.md` for settings route back button behavior
- See `15-admin-panel.md` for admin-side settings management
