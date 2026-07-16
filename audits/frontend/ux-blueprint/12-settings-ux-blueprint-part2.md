# Settings UX Blueprint — Part 2: Billing & Notifications

> **Evidence basis:** `05-page-type-ux-rules.md` §7, `information-architecture/06-page-catalog.md` P-ST-03, P-ST-04, `audits/frontend/14-settings-feature.md`, `product-architecture/09-product-modules.md` M-07
> **Purpose:** Complete UX blueprint for Settings Billing and Notifications tabs
> **Part:** 2 of 3 (Settings)

---

## P-ST-03: Billing

### 1. Purpose
- **Business purpose:** Subscription management; revenue; plan upgrades
- **User purpose:** View current plan, check usage, upgrade or downgrade, view invoices
- **Success criteria:** User can upgrade plan within 60 seconds; user can view invoices within 10 seconds
- **Failure criteria:** Can't upgrade; unclear usage; missing invoices; payment errors

### 2. Target Users
- **Primary user:** Workspace Owner
- **Secondary user:** None (Editor and Viewer cannot access this tab)
- **Permissions:** Owner only. Editor/Viewer: tab hidden.
- **Visibility:** Authenticated + has workspace + Owner role

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Direct revenue impact; enterprise customers need billing visibility

### 4. Primary Goal
Manage subscription and payment

### 5. Primary Action
"Upgrade Plan" (if not on highest plan) or "Manage Subscription" (if on paid plan)

### 6. Secondary Actions
1. View current plan details
2. View usage (screens, storage, team members)
3. Download invoice (PDF)
4. Update payment method
5. Cancel subscription (danger zone)
6. Switch billing cycle (monthly/annual — future)

### 7. Information Priority
1. Current plan name and price — **what am I paying?**
2. Usage bars (screens, storage, members) — **am I at limits?**
3. Next billing date — **when is next charge?**
4. Payment method — **how am I paying?**
5. Invoice history — **what have I paid?**
6. Plan features — **what do I get?**

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (Billing active)
- Current Plan card: plan name, price, billing cycle, next billing date
- Usage section: progress bars for screens, storage, team members

**Middle:**
- Plan comparison (current plan highlighted, upgrade options)
- Payment method card: card type, last 4 digits, expiry

**Bottom:**
- Invoice history table
- Danger zone: "Cancel Subscription"

**Collapsed:**
- Detailed plan comparison (future)
- Billing address (future)

### 9. Page Sections

#### Section 1: Current Plan
- **Purpose:** Show active subscription details
- **Priority:** 1
- **Contents:** Plan name, price, billing cycle, next billing date, plan features list
- **Dependencies:** `useApiSubscription` (SWR)
- **Visibility:** Always (Owner only)

#### Section 2: Usage
- **Purpose:** Show resource consumption vs. plan limits
- **Priority:** 1
- **Contents:** Progress bars for screens (used/limit), storage (used/limit), team members (used/limit)
- **Dependencies:** `useApiUsage` (SWR)
- **Visibility:** Always
- **Future:** Overage charges, auto-upgrade prompt

#### Section 3: Plan Options
- **Purpose:** Show available plans and enable upgrade
- **Priority:** 2
- **Contents:** Plan cards (Free, Starter, Pro, Enterprise) with features and prices
- **Visibility:** Always (if upgrade available)
- **Future:** Annual/monthly toggle, proration calculator

#### Section 4: Payment Method
- **Purpose:** Show and update payment card
- **Priority:** 2
- **Contents:** Card brand, last 4 digits, expiry, "Update" button
- **Dependencies:** `useApiPaymentMethod` (SWR)
- **Visibility:** Only if paid plan or payment method exists
- **Future:** Multiple payment methods, Apple/Google Pay

#### Section 5: Invoice History
- **Purpose:** Past payment records
- **Priority:** 3
- **Contents:** Table of invoices (date, amount, status, download link)
- **Dependencies:** `useApiInvoices` (SWR, paginated)
- **Visibility:** Only if invoices exist
- **Future:** Billing address, tax ID

#### Section 6: Danger Zone
- **Purpose:** Cancel subscription
- **Priority:** 3
- **Contents:** "Cancel Subscription" button (destructive)
- **Visibility:** Only if on paid plan
- **Future:** Downgrade instead of cancel, proration info

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix, vertical) | Navigation |
| "Billing" tab | Tab trigger (active) | Navigation |
| Plan name | Text (large) | Current Plan |
| Plan price | Text (large) | Current Plan |
| Billing cycle | Text (muted) | Current Plan |
| Next billing date | Text | Current Plan |
| Feature list | List | Current Plan |
| Usage progress bar | Progress | Usage |
| Usage label | Text | Usage |
| Usage value | Text (e.g., "12/25") | Usage |
| "Upgrade Plan" button | Button (default) | Current Plan |
| Plan card | Card | Plan Options |
| Plan name | Text (medium) | Plan Options |
| Plan price | Text | Plan Options |
| Plan features | List | Plan Options |
| "Select Plan" button | Button (outline) | Plan Options |
| Card brand icon | Icon | Payment Method |
| Card last 4 | Text | Payment Method |
| Card expiry | Text (muted) | Payment Method |
| "Update Payment" button | Button (outline) | Payment Method |
| Invoice table | Table | Invoice History |
| Invoice date | Text | Invoice History |
| Invoice amount | Text | Invoice History |
| Invoice status | Badge | Invoice History |
| "Download" button | Button (icon, ghost) | Invoice History |
| Danger zone container | Div (red, dashed) | Danger Zone |
| "Cancel Subscription" button | Button (destructive) | Danger Zone |
| Cancel dialog | AlertDialog | Danger Zone |
| Empty State | EmptyState | Invoice History (if none) |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Upgrade Plan" | Scrolls to Plan Options section |
| Click | "Select Plan" | Opens upgrade confirmation dialog |
| Click | "Update Payment" | Opens payment update dialog (Stripe) |
| Click | "Download" invoice | Downloads PDF |
| Click | "Cancel Subscription" | Opens confirmation dialog |
| Click | Usage bar | (Future) Navigates to relevant section (Screens, Content, Team) |
| Hover | Invoice row | Subtle background |
| Keyboard | Tab | Through tabs → plan → usage → payment → invoices |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | All sections with data |
| Loading | Initial load | Skeleton cards + skeleton table |
| Empty — no invoices | No invoice history | "No invoices yet" (mini empty state) |
| Empty — no payment method | Free plan | Payment Method section hidden |
| Upgrading | Plan select confirmed | Dialog spinner |
| Upgrade success | API 200 | Toast: "Plan upgraded to [Plan Name]" + page refreshes |
| Upgrade error | API error | Toast: "Failed to upgrade: [message]" |
| Cancel confirmed | Dialog confirm | Spinner |
| Cancel success | API 200 | Toast: "Subscription cancelled" + plan shows "Free" |
| Invoice download | Click download | Browser downloads PDF |
| Usage at limit | Usage ≥ 100% | Progress bar turns red |
| Usage near limit | Usage ≥ 80% | Progress bar turns amber |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Plan upgraded | Toast: "Plan upgraded to [Plan Name]" |
| Plan cancelled | Toast: "Subscription cancelled. You'll keep access until [date]." |
| Payment updated | Toast: "Payment method updated" |
| Invoice downloaded | (No toast — browser handles download) |
| Upgrade error | Toast: "Failed to upgrade: [message]" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Upgrade or stay? | Usage at limit | Upgrade plan or reduce usage | Upgrade (if screens needed) |
| Monthly or annual? | Selecting plan | Monthly (flexible) or annual (discount) | Monthly (future) |
| Cancel or downgrade? | Want to reduce cost | Cancel (lose all) or downgrade (keep some) | Downgrade (future) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Cancel instead of downgrade | Dialog: "You'll lose access to all screens and content" | Must confirm; consider showing downgrade option |
| Upgrade wrong plan | Plan name and price shown in confirmation dialog | Verify before confirm |
| Forget to update payment | (Future) Email reminder when card expires | Update payment method |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through all interactive elements |
| Screen reader | Usage bars have `aria-valuenow` and `aria-label` |
| ARIA | Plan cards have `aria-label` with plan name + price |
| Focus | Tab content auto-focused on tab switch |
| Contrast | Progress bars meet 3:1 |
| Touch targets | All buttons ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tab nav | Horizontal scroll |
| Current plan | Full width card |
| Usage bars | Full width, stacked |
| Plan options | Single column, stacked cards |
| Payment method | Full width card |
| Invoice table | Card list (stacked rows) |
| Danger zone | Full width, prominent |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | Parallel SWR fetches (subscription, usage, invoices) |
| Invoice PDF | Server-generated, streamed download |
| Plan comparison | Static data (cached) |
| Tab switch | SWR cache (instant) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Annual/monthly toggle | Plan Options section |
| Proration calculator | Upgrade dialog |
| Tax ID and billing address | New section |
| Multiple payment methods | Payment Method section |
| Apple/Google Pay | Payment Method section |
| Usage alerts | Email notifications |
| Auto-upgrade at limit | Toggle in Usage section |
| Invoice email delivery | Notifications tab enhancement |
| Custom enterprise pricing | Contact sales CTA |

### 20. UX Notes
- Billing is the highest-value settings tab for the business — upgrade flow must be frictionless
- Usage bars are critical — users need to see when they're approaching limits
- Amber at 80%, red at 100% for usage bars (consistent with storage indicator on Media tab)
- Invoice download should be one click, no dialog
- Cancel subscription should show downgrade as an alternative (reduce churn)
- Plan comparison should highlight current plan and show "Current" badge
- Consider showing savings for annual billing (e.g., "Save 20%")
- Payment method should show card brand icon (Visa, Mastercard) for quick recognition
- Tab is hidden for Editor/Viewer roles — only Owner sees "Billing" in the tab list

---

## P-ST-04: Notifications Preferences

### 1. Purpose
- **Business purpose:** User engagement; reduce notification fatigue
- **User purpose:** Choose which notifications to receive and how
- **Success criteria:** User can update preferences within 20 seconds
- **Failure criteria:** Can't save; unclear options; too many toggles

### 2. Target Users
- **Primary user:** All users (Owner, Editor, Viewer)
- **Secondary user:** None
- **Permissions:** All users can manage their own notification preferences
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Occasional use; important for engagement but not daily operations

### 4. Primary Goal
Configure notification preferences

### 5. Primary Action
"Save" button

### 6. Secondary Actions
1. Toggle notification types (screen, schedule, team, system)
2. Toggle delivery channels (in-app, email — future)
3. Toggle quiet hours (future)
4. Reset to defaults

### 7. Information Priority
1. Notification type toggles — **what to receive**
2. Delivery channel toggles — **how to receive**
3. Quiet hours (future) — **when to receive**
4. Reset to defaults — **quick recovery**

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (Notifications active)
- "Notification Types" section: toggle list grouped by category
- "Delivery Channels" section: in-app toggle, email toggle (future)

**Middle:**
- "Quiet Hours" section (future): time range selector

**Bottom:**
- "Save" button
- "Reset to Defaults" link

### 9. Page Sections

#### Section 1: Notification Types
- **Purpose:** Choose which events generate notifications
- **Priority:** 1
- **Contents:** Toggle switches grouped by category:
  - Screen Events: offline, online, warning
  - Schedule Events: started, ended, failed
  - Team Events: invite accepted, invite declined, role changed
  - System Events: storage warning, maintenance, updates
- **Dependencies:** `useApiNotificationPreferences` (SWR)
- **Visibility:** Always

#### Section 2: Delivery Channels
- **Purpose:** Choose how notifications are delivered
- **Priority:** 2
- **Contents:** In-app toggle (always on — cannot disable), Email toggle (future), SMS toggle (future)
- **Visibility:** Always
- **Future:** Push notifications, webhook notifications

#### Section 3: Quiet Hours (future)
- **Purpose:** Suppress notifications during specific hours
- **Priority:** 3
- **Contents:** Enable toggle, start time, end time, timezone
- **Visibility:** Future implementation

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix, vertical) | Navigation |
| "Notifications" tab | Tab trigger (active) | Navigation |
| Section heading | Text (h2) | Notification Types |
| Category heading | Text (h3, medium) | Notification Types |
| Notification toggle | Switch (Radix) | Notification Types |
| Notification label | Text | Notification Types |
| Notification description | Text (muted, xs) | Notification Types |
| In-app toggle | Switch (disabled, on) | Delivery Channels |
| Email toggle | Switch (Radix) | Delivery Channels |
| "Save" button | Button (default) | Bottom |
| "Reset to Defaults" link | Link | Bottom |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Tab | Switches settings tab |
| Click | Toggle switch | Toggles preference (visual feedback immediate) |
| Click | "Save" | Saves all preferences |
| Click | "Reset to Defaults" | Resets all toggles to default state (confirm dialog) |
| Keyboard | Tab | Through tabs → toggles → save |
| Keyboard | Space | Toggles focused switch |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Toggles in current state |
| Loading | Initial load | Skeleton toggle rows |
| Saving | "Save" clicked | Button spinner + "Saving..." |
| Save success | API 200 | Toast: "Notification preferences saved" |
| Save error | API error | Toast: "Failed to save preferences" |
| Resetting | "Reset" confirmed | All toggles animate to default state |
| Toggle change | Click toggle | Switch animates immediately (not saved until "Save") |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Preferences saved | Toast: "Notification preferences saved" |
| Reset to defaults | Toast: "Preferences reset to defaults" (after save) |
| Toggle changed | Switch animates (immediate visual feedback) |
| Unsaved changes | (Future) Dot indicator on "Save" button |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Which notifications? | Configuring types | Enable all, disable all, or selective | All enabled (default) |
| Email notifications? | Delivery channels | In-app only or in-app + email | In-app only (default) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Disable critical notifications | Screen offline is marked as "recommended on" | "Reset to Defaults" link |
| Forget to save | (Future) Unsaved changes indicator | Save before leaving tab |
| Reset accidentally | "Reset to Defaults" opens confirm dialog | Must confirm |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab to each toggle, Space to toggle |
| Screen reader | Switch has `aria-label` with notification type name |
| ARIA | Switch has `role="switch"` and `aria-checked` (Radix) |
| Focus | Visible focus ring on switch |
| Touch targets | Switches ≥ 44px touch target |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tab nav | Horizontal scroll |
| Toggles | Full width rows, label + switch |
| Save | Full width button |
| Reset | Full width link |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch preferences (fast, single record) |
| Tab switch | SWR cache (instant) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Email notifications | Delivery Channels section |
| Quiet hours | New section |
| Push notifications (PWA) | Delivery Channels section |
| Webhook notifications | Delivery Channels section |
| Per-screen notification settings | New section or per-screen config |
| Notification digest (daily/weekly) | New section |
| Custom notification rules | New section (if/then rules) |

### 20. UX Notes
- In-app notifications cannot be disabled — they are the primary alert mechanism
- Toggles should animate immediately on click (visual feedback) but only persist on "Save"
- Group toggles by category (Screen, Schedule, Team, System) for scannability
- Each toggle should have a brief description below the label explaining what it does
- "Reset to Defaults" should require confirmation to prevent accidental reset
- Consider showing a preview of what each notification looks like (mini example)
- Screen offline notification should be marked as "Recommended" and have a tooltip explaining why
- This tab is separate from the Notifications history page (`/notifications`) — this is preferences, not history

---

## Cross-References

- See `11-settings-ux-blueprint-part1.md` for Profile and Workspace tabs
- See `13-settings-ux-blueprint-part3.md` for Security and API tabs
- See `14-notifications-ux-blueprint.md` for Notifications history page
- See `05-page-type-ux-rules.md` §7 for settings page type rules
- See `information-architecture/06-page-catalog.md` P-ST-03, P-ST-04
- See `audits/frontend/14-settings-feature.md` for settings audit
- See `audits/frontend/17-notifications.md` for notifications audit
- See `product-architecture/09-product-modules.md` M-07 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
