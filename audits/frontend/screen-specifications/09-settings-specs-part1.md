# Screen Specifications — Settings Part 1 (Profile, Workspace, Billing)

> **Evidence basis:** `ux-blueprint/11-settings-ux-blueprint-part1.md`, `user-flow-architecture/13-settings-flows.md` FL-ST-01, FL-ST-04, `user-flow-architecture/07-workspace-flows.md`, `product-architecture/09-product-modules.md` M-07, `product-architecture/17-product-rules.md` PR-36, `information-architecture/06-page-catalog.md` P-ST-01–P-ST-03

---

## SCR-ST-01: Settings — Profile

### Screen ID
SCR-ST-01

### Purpose
View and edit user profile (name, email, avatar).

### Business Goal
Personalization; user identity.

### User Goal
Update personal information.

### Primary Users
All users (each user edits their own profile).

### Permissions
- All users can view and edit their own profile
- No role restrictions (profile is personal, not workspace)

### Entry Points
- Sidebar "Settings" (defaults to Profile tab)
- User menu "Profile" (header dropdown)

### Exit Points
- Tab navigation to other settings tabs
- Sidebar navigation

### Navigation
- Sidebar active: "Settings"
- Breadcrumbs: None (top-level page)
- Tabs: "Profile" (active) | "Workspace" (Owner) | "Billing" (Owner) | "Security" | "API" (Owner) | "Notifications"

### Page Title
`Settings — Smart Screen`

### Primary CTA
"Save" button (form submit).

### Secondary CTA
- Tab navigation
- "Change Avatar" button

### Danger Actions
None.

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Settings"                               │
│ Tabs: [Profile] [Workspace] [Billing] [Security] ...  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Profile Form                                     │ │
│ │  Avatar (80px) + [Change Avatar]                 │ │
│ │  Name: [____________]                            │ │
│ │  Email: [____________]                           │ │
│ │  [Save]                                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[800px] mx-auto px-6 py-6`
- Form card: `bg-card border border-border rounded-xl p-6`

### Page Sections

#### Section 1: Page Header + Tabs
- "Settings" heading
- Tab bar with role-appropriate tabs visible

#### Section 2: Profile Form
- **Avatar:** 80px round, "Change Avatar" button below (file upload)
- **Name:** Text input, label "Full Name"
- **Email:** Email input, label "Email"
- **Save:** Button (disabled until changes made — future)

---

## Component Tree

```
<SettingsPage>
  <PageHeader>
    <Heading level={1}>Settings</Heading>
  </PageHeader>
  <SettingsTabs active="profile" role={user.role} />
  <ProfileForm>
    <AvatarSection>
      <Avatar src={user.avatar} size={80} />
      <Button variant="outline" onClick={triggerAvatarUpload}>Change Avatar</Button>
    </AvatarSection>
    <Form onSubmit={handleSave}>
      <FormField name="name" label="Full Name" required>
        <Input defaultValue={user.name} />
      </FormField>
      <FormField name="email" label="Email" required>
        <Input type="email" defaultValue={user.email} />
      </FormField>
      {error && <FormError message={error} />}
      <Button type="submit" variant="default" disabled={isLoading}>
        {isLoading ? <Spinner /> : "Save"}
      </Button>
    </Form>
  </ProfileForm>
</SettingsPage>
```

---

## States

### Loading
- Form fields: Skeleton inputs (gray bars)

### Success
- Toast: "Profile updated"

### Error
- **Invalid email:** Inline error on email field
- **Email in use:** Inline: "This email is already in use"
- **Avatar upload failure:** Toast: "Failed to upload avatar"
- **API failure:** Toast: "Failed to save profile. Try again."

### Unsaved Changes
- **Current:** No warning on tab switch (data lost)
- **Future:** AlertDialog: "Unsaved changes. Leave anyway?"

---

## Forms

### Validation
| Field | Rule | When | Message |
|-------|------|------|---------|
| Name | Required, 2-50 chars | On blur | "Name must be 2-50 characters" |
| Email | Required, valid format | On blur | "Please enter a valid email" |

### Submit
- API: `PATCH /auth/me` with `{ name, email, avatar? }`
- Success: Toast + SWR revalidate
- Error: Inline or toast

### Avatar Upload
- Trigger: "Change Avatar" → file picker
- Validation: Image only (jpg, png, gif, webp); max 2MB
- API: `POST /auth/me/avatar` (multipart)
- Loading: Progress on avatar
- Success: Avatar updates + toast: "Avatar updated"

---

## Responsive

### Desktop (≥ 768px)
- Form card centered, max-width 800px
- Tabs in horizontal row

### Mobile (< 768px)
- Form card full width
- Tabs: Horizontal scroll or wrapped

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/me` | GET | Current user profile |
| `/auth/me` | PATCH | Update profile |
| `/auth/me/avatar` | POST (multipart) | Upload avatar |

### Backend Limitations
- No email verification on change (email changes immediately)
- Avatar stored on backend (no external CDN — future)

---

## Acceptance Criteria

### Functional
- [ ] Form pre-filled with current name and email
- [ ] Save updates profile and shows toast
- [ ] Avatar upload works
- [ ] Tab navigation to other settings tabs
- [ ] Role-appropriate tabs visible

### UX
- [ ] Skeleton loading
- [ ] Inline validation on blur
- [ ] Save button shows loading state
- [ ] (Future) Unsaved changes warning

### Accessibility
- [ ] `<h1>` "Settings"
- [ ] Tabs: `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] Form inputs have labels
- [ ] Error via `aria-live`

### Performance
- [ ] Form renders < 500ms
- [ ] Save < 2s

### Responsive
- [ ] Form card centered on desktop, full width on mobile
- [ ] No horizontal scroll

---

## SCR-ST-02: Settings — Workspace

### Screen ID
SCR-ST-02

### Purpose
View and edit workspace settings (name, default settings).

### Business Goal
Workspace customization; organization.

### User Goal
Update workspace name and settings.

### Primary Users
Owner only.

### Permissions
- Tab visible: Owner only
- Editor/Viewer: Tab hidden

### Entry Points
- Settings tab "Workspace"

### Exit Points
- Tab navigation
- Sidebar navigation

### Page Title
`Workspace Settings — Smart Screen`

### Primary CTA
"Save" button.

---

## Layout

### Container
- `max-w-[800px] mx-auto px-6 py-6`
- Form card: `bg-card border border-border rounded-xl p-6`

### Page Sections

#### Section 1: Workspace Form
- **Workspace Name:** Text input
- **Workspace ID:** Read-only (display only, with copy button)
- **Created Date:** Read-only
- **Plan:** Read-only badge (Free, Pro, Enterprise)
- **Save:** Button

#### Section 2: Danger Zone (future)
- **Delete Workspace:** Destructive button (future — may require backend support)
- **Warning:** "This will permanently delete all screens, playlists, media, and team data."

---

## States

### Loading
- Skeleton form

### Success
- Toast: "Workspace settings saved"

### Error
- Toast: "Failed to save workspace. Try again."

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workspaces/{id}` | GET | Workspace details |
| `/workspaces/{id}` | PATCH | Update workspace |
| `/workspaces/{id}` | DELETE | Delete workspace (future) |

---

## Acceptance Criteria

### Functional
- [ ] Form pre-filled with workspace name
- [ ] Save updates workspace and shows toast
- [ ] Workspace ID shown as read-only with copy
- [ ] Plan badge displayed
- [ ] Tab hidden for non-Owner

### UX
- [ ] Skeleton loading
- [ ] Save shows loading state

### Accessibility
- [ ] Form inputs have labels
- [ ] Read-only fields have `aria-readonly`

### Performance
- [ ] Form renders < 500ms

### Responsive
- [ ] Form card centered on desktop, full width on mobile

---

## SCR-ST-03: Settings — Billing

### Screen ID
SCR-ST-03

### Purpose
View current plan, usage, and upgrade/downgrade.

### Business Goal
Revenue; plan upsell; subscription management.

### User Goal
Understand plan; upgrade for more features/screens.

### Primary Users
Owner only.

### Permissions
- Tab visible: Owner only
- Editor/Viewer: Tab hidden

### Entry Points
- Settings tab "Billing"
- Storage limit reached → "Upgrade" link (from Media upload)

### Exit Points
- Tab navigation
- Sidebar navigation

### Page Title
`Billing — Smart Screen`

### Primary CTA
"Select Plan" button (on plan cards).

### Secondary CTA
- "Manage Payment Method" (future)
- "View Invoices" (future)

### Danger Actions
- Downgrade plan (future — destructive, with proration warning)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Billing"                                │
│ Tabs: ... [Billing] ...                                │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Current Plan Card                                 │ │
│ │  Plan: Pro | Screens: 8/10 | Storage: 2.3/5 GB  │ │
│ │  [Manage Payment] [View Invoices]                │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Usage Bars                                        │ │
│ │  Screens: ████████░░ 8/10                         │ │
│ │  Storage: █████░░░░░ 2.3/5 GB                     │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌────────┐ ┌────────┐ ┌────────┐                    │
│ │ Free   │ │ Pro    │ │ Enterp │                    │
│ │ Plan   │ │ Plan   │ │ ise   │                    │
│ │[Select]│ │Current │ │[Select]│                    │
│ └────────┘ └────────┘ └────────┘                    │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1000px] mx-auto px-6 py-6`
- Plan cards: `grid grid-cols-1 md:grid-cols-3 gap-4`

### Page Sections

#### Section 1: Current Plan Card
- **Contents:** Plan name, billing cycle, screens used/limit, storage used/limit
- **Actions:** "Manage Payment Method" (future), "View Invoices" (future)

#### Section 2: Usage Bars
- **Screens:** Progress bar (used/limit)
- **Storage:** Progress bar (used/limit)
- **Color:** Green (< 70%), Amber (70-90%), Red (> 90%)

#### Section 3: Plan Cards
- **Contents:** 3 plan cards (Free, Pro, Enterprise) with features list and price
- **Current plan:** Highlighted with "Current Plan" badge
- **"Select Plan" button:** On non-current plans; opens upgrade confirmation dialog

---

## Component Tree

```
<BillingSettings>
  <CurrentPlanCard plan={currentPlan} usage={usage} />
  <UsageBars usage={usage} />
  <PlanCardsGrid>
    {plans.map(plan => (
      <PlanCard
        key={plan.id}
        plan={plan}
        isCurrent={plan.id === currentPlan.id}
        onSelect={handleSelectPlan}
      />
    ))}
  </PlanCardsGrid>
</BillingSettings>
```

### Component Details

#### PlanCard
- **Props:** `plan: Plan`, `isCurrent: boolean`, `onSelect: (plan) => void`
- **UI:** Card with plan name, price, features list (checkmarks), "Select Plan" or "Current Plan" badge
- **Current:** Badge "Current Plan" + card highlighted (`border-primary`)
- **Select:** Button "Select Plan" → opens upgrade dialog

---

## States

### Loading
- Skeleton cards

### Success — Upgraded
- Toast: "Plan upgraded to [Plan Name]"
- Current plan card updates
- Usage limits update

### Error
- **Payment failure:** Dialog: "Payment failed: [reason]. Try a different card."
- **API failure:** Toast: "Failed to upgrade plan. Try again."

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workspaces/{id}/billing` | GET | Current plan + usage |
| `/workspaces/{id}/billing/upgrade` | POST | Upgrade plan |
| `/workspaces/{id}/billing/invoices` | GET | Invoice list (future) |
| `/workspaces/{id}/billing/payment-method` | GET/PUT | Payment method (future) |

### Backend Limitations
- Payment processing via Stripe (backend)
- No invoice PDF generation (future)
- No proration calculation (future)

### Missing APIs
- `GET /plans` — Available plans with features and pricing
- `GET /workspaces/{id}/invoices` — Invoice history
- `POST /workspaces/{id}/billing/downgrade` — Downgrade plan

---

## Acceptance Criteria

### Functional
- [ ] Current plan displayed with usage
- [ ] Usage bars show screens and storage
- [ ] Plan cards show features and price
- [ ] Current plan highlighted
- [ ] "Select Plan" opens upgrade dialog
- [ ] Upgrade success updates current plan
- [ ] Tab hidden for non-Owner

### UX
- [ ] Skeleton loading
- [ ] Usage bars color-coded (green/amber/red)
- [ ] Upgrade dialog shows plan name and price
- [ ] Toast on success

### Accessibility
- [ ] Usage bars have `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Plan cards have descriptive `aria-label`
- [ ] Keyboard: Tab through plan cards, Enter to select

### Performance
- [ ] Page renders < 500ms
- [ ] Upgrade < 3s

### Responsive
- [ ] 3 plan cards on desktop, 1 column on mobile
- [ ] Usage bars full width

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `10-settings-specs-part2.md` for Security, API, Notifications specs
- See `ux-blueprint/11-settings-ux-blueprint-part1.md` for settings UX blueprint
- See `user-flow-architecture/13-settings-flows.md` for settings flow documentation
- See `product-architecture/09-product-modules.md` M-07 for settings module
