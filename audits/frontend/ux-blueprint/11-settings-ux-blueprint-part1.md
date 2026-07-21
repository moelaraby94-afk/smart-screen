# Settings UX Blueprint — Part 1: Profile & Workspace

> **Evidence basis:** `05-page-type-ux-rules.md` §7, `information-architecture/06-page-catalog.md` P-ST-01, P-ST-02, `audits/frontend/14-settings-feature.md`, `product-architecture/09-product-modules.md` M-07
> **Purpose:** Complete UX blueprint for Settings Profile and Workspace tabs
> **Part:** 1 of 3 (Settings)

---

## Settings Overview

Settings uses a **tabbed layout** with vertical tab navigation on the start side and content on the end side. Each tab has its own save button (PR-36). Tabs are URL-addressable.

### Tab Inventory

| Tab | Route | Priority | Primary User | Primary Action |
|-----|-------|----------|-------------|----------------|
| Profile | `/settings` | Medium | All users | "Save" |
| Workspace | `/settings/workspace` | Medium | Owner | "Save" |
| Billing | `/settings/billing` | High | Owner | "Upgrade Plan" |
| Notifications | `/settings/notifications` | Medium | All users | "Save" |
| Security | `/settings/security` | High | All users | "Enable 2FA" / "Change Password" |
| API | `/settings/api` | Low | Owner/Developer | "Create API Key" |

### Settings UX Rules (All Tabs)

| Rule | Description | Evidence |
|------|-------------|----------|
| Vertical tab nav on start side | 180px width, rounded-xl items | `05-page-type-ux-rules.md` §7 |
| Each tab has own save | No global save button | PR-36 |
| Active tab is URL-addressable | `/settings/billing` | `05-navigation-architecture.md` §4.2 |
| Tab order: Profile, Workspace, Billing, Notifications, Security, API | Priority order | `08-naming-and-conventions.md` §7.3 |
| Danger zone at bottom of tab | Distinct visual treatment (red border) | UP-09 |
| Mobile: tabs become horizontal scroll | Vertical tabs do not work on mobile | `04-feature-ux-standards.md` §3.2 |
| Save button at bottom of form | Full width on mobile | `03-component-ux-standards.md` §1.1 |
| Unsaved changes warning (future) | AlertDialog on tab switch with unsaved changes | `03-component-ux-standards.md` §1.5 |

### Settings Layout Template

```
┌──────────────────────────────────────────────────┐
│ Settings                                           │
├──────────────┬───────────────────────────────────┤
│              │                                    │
│  Profile     │  [Tab Content]                     │
│  Workspace   │                                    │
│  Billing     │  [Form fields / Configuration]     │
│  Notifications│                                   │
│  Security    │  [Save button at bottom]           │
│  API         │                                    │
│              │                                    │
└──────────────┴───────────────────────────────────┘
```

---

## P-ST-01: Profile

### 1. Purpose
- **Business purpose:** User identity management; personalization
- **User purpose:** Update name, email, avatar, personal preferences
- **Success criteria:** User can update profile within 30 seconds
- **Failure criteria:** Can't save; email validation fails silently; avatar upload broken

### 2. Target Users
- **Primary user:** All users (Owner, Editor, Viewer)
- **Secondary user:** None
- **Permissions:** All users can edit their own profile
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Occasional use; important for personalization but not daily operations

### 4. Primary Goal
Update personal information

### 5. Primary Action
"Save" button

### 6. Secondary Actions
1. Upload/change avatar
2. Change email (requires verification — future)
3. Change password (link to Security tab)
4. Delete account (future — danger zone)

### 7. Information Priority
1. Full name — **identification**
2. Email — **contact and login**
3. Avatar — **visual identity**
4. Phone number (future) — **secondary contact**
5. Timezone (future) — **localization**
6. Language preference (future) — **personalization**

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (Profile active)
- "Personal Information" section heading
- Name input
- Email input
- Avatar upload area

**Middle:**
- "Preferences" section (future: timezone, language)

**Bottom:**
- "Save" button
- Danger zone (future: delete account)

**Collapsed:**
- Advanced preferences (future)
- Email change verification (future)

### 9. Page Sections

#### Section 1: Personal Information
- **Purpose:** Core identity fields
- **Priority:** 1
- **Contents:** Name input, email input, avatar upload
- **Dependencies:** `useApiUser` (SWR, current user)
- **Visibility:** Always
- **Future:** Phone number, timezone, language preference

#### Section 2: Avatar
- **Purpose:** Visual identity
- **Priority:** 2
- **Contents:** Current avatar, upload button, remove button
- **Dependencies:** File upload API
- **Visibility:** Always
- **Future:** Avatar crop/resize editor

#### Section 3: Danger Zone (future)
- **Purpose:** Account deletion
- **Priority:** 3
- **Contents:** "Delete Account" button (destructive)
- **Visibility:** Future implementation
- **Future:** Double confirmation

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix, vertical) | Navigation |
| "Profile" tab | Tab trigger (active) | Navigation |
| Section heading | Text (h2) | Personal Info |
| Name input | Input (text) | Personal Info |
| Email input | Input (email) | Personal Info |
| Avatar display | Avatar (image/initials) | Avatar |
| "Upload Avatar" button | Button (outline) | Avatar |
| "Remove Avatar" button | Button (ghost) | Avatar |
| "Save" button | Button (default) | Bottom |
| "Change Password" link | Link | Personal Info |
| Danger zone border | Border (red, dashed) | Danger Zone |
| "Delete Account" button | Button (destructive) | Danger Zone |
| Inline error | Text (red) | Personal Info |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Tab | Switches to selected settings tab |
| Click | "Save" | Validates and submits form |
| Click | "Upload Avatar" | Opens file picker |
| Click | "Remove Avatar" | Removes avatar, shows initials |
| Click | "Change Password" | Navigates to `/settings/security` |
| Click | "Delete Account" | Opens double confirmation dialog (future) |
| Keyboard | Tab | Through tabs → form fields → save |
| Keyboard | Enter | Submits form |
| Keyboard | Escape | (Future) Cancels unsaved changes |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Form with current values |
| Loading | Initial load | Skeleton form fields |
| Saving | "Save" clicked | Button spinner + "Saving..." |
| Save success | API 200 | Toast: "Profile updated" + button returns to normal |
| Save error | API error | Toast: "Failed to save: [message]" + form re-enabled |
| Validation error | Invalid field on blur | Red border + inline message |
| Avatar uploading | File selected | Upload progress indicator |
| Avatar success | Upload complete | Avatar updates + toast: "Avatar updated" |
| Avatar error | Upload fails | Toast: "Failed to upload avatar" |
| Email exists | API 409 | Inline: "This email is already in use" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Profile saved | Toast: "Profile updated" |
| Avatar updated | Toast: "Avatar updated" |
| Avatar removed | Toast: "Avatar removed" |
| Save error | Toast: "Failed to save: [message]" |
| Validation error | Inline red border + message |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Change email? | Updating email | Change (requires re-verification) or keep | Keep (email is login identifier) |
| Upload or initials? | Setting avatar | Upload image or use auto-generated initials | Initials (zero effort) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Save with invalid email | Client-side validation on blur | Inline error, correct and retry |
| Upload oversized avatar | Client-side size check | Error: "Image must be under 2MB" |
| Forget to save | (Future) Unsaved changes indicator on tab | Save before switching tabs |

### 16. Accessibility

| Element | Rule | Evidence |
|---------|------|----------|
| Keyboard | Tab through tabs → form → save | ACC-02 |
| Screen reader | Form labels associated with inputs | ACC-03 |
| ARIA | Tabs have proper roles (Radix) | TC-05 |
| Focus | First form field auto-focused on tab switch | ACC-02 |
| Contrast | Form inputs meet 4.5:1 | ACC-01 |
| Touch targets | All buttons ≥ 44px | PR-45 |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tab nav | Horizontal scroll tabs at top |
| Form | Full width, single column |
| Avatar | Centered, larger touch target |
| Save | Full width button |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch user data (fast, single record) |
| Avatar upload | Compress on client before upload (future) |
| Tab switch | SWR cache per tab (instant switch) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Phone number | Personal Info section |
| Timezone selector | Preferences section |
| Language preference | Preferences section |
| Email change verification | New flow (email → verify → update) |
| Account deletion | Danger zone |
| Profile export | Danger zone or toolbar |
| Two-factor auth link | Cross-link to Security tab |

### 20. UX Notes
- Profile is the default tab when navigating to `/settings` (no tab specified)
- Email change should require verification (future) — email is the login identifier
- Avatar should auto-generate initials from name if no image is uploaded
- Consider adding "Last updated" timestamp below save button
- "Change Password" should cross-navigate to Security tab, not be inline
- Profile tab is the only tab visible to all roles at the same permission level (own profile)

---

## P-ST-02: Workspace

### 1. Purpose
- **Business purpose:** Workspace identity and configuration management
- **User purpose:** Change workspace name, logo, branding, default settings
- **Success criteria:** User can update workspace settings within 30 seconds
- **Failure criteria:** Can't save; branding not applied; accidental deletion

### 2. Target Users
- **Primary user:** Workspace Owner
- **Secondary user:** None (Editor and Viewer cannot access this tab)
- **Permissions:** Owner only. Editor/Viewer: tab hidden.
- **Visibility:** Authenticated + has workspace + Owner role

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Occasional use; important for branding but not daily operations

### 4. Primary Goal
Configure workspace identity and settings

### 5. Primary Action
"Save" button

### 6. Secondary Actions
1. Upload/change workspace logo
2. Change brand colors (future)
3. Change default language (EN/AR)
4. Delete workspace (danger zone — double confirmation)

### 7. Information Priority
1. Workspace name — **identification**
2. Workspace logo — **branding**
3. Default language — **localization**
4. Brand colors (future) — **visual identity**
5. Workspace description — **context**
6. Created date — **tenure**

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (Workspace active)
- "General" section: workspace name, description
- "Branding" section: logo upload, brand colors (future)

**Middle:**
- "Localization" section: default language selector

**Bottom:**
- "Save" button
- Danger zone: "Delete Workspace" (red border, double confirmation)

### 9. Page Sections

#### Section 1: General
- **Purpose:** Workspace identity
- **Priority:** 1
- **Contents:** Workspace name input, description textarea
- **Dependencies:** `useApiWorkspace` (SWR, current workspace)
- **Visibility:** Always (Owner only)

#### Section 2: Branding
- **Purpose:** Visual identity
- **Priority:** 2
- **Contents:** Logo upload, brand color picker (future)
- **Dependencies:** File upload API
- **Visibility:** Always (Owner only)
- **Future:** Custom login page branding, email branding

#### Section 3: Localization
- **Purpose:** Default language for workspace
- **Priority:** 2
- **Contents:** Language selector (EN/AR)
- **Visibility:** Always (Owner only)

#### Section 4: Danger Zone
- **Purpose:** Irreversible destructive action
- **Priority:** 3
- **Contents:** "Delete Workspace" button with red dashed border container
- **Visibility:** Always (Owner only)
- **Future:** Transfer ownership, export workspace data

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix, vertical) | Navigation |
| "Workspace" tab | Tab trigger (active) | Navigation |
| Section heading | Text (h2) | General |
| Workspace name input | Input (text) | General |
| Description textarea | Textarea | General |
| Logo display | Image | Branding |
| "Upload Logo" button | Button (outline) | Branding |
| "Remove Logo" button | Button (ghost) | Branding |
| Color picker | ColorInput (future) | Branding |
| Language selector | Select (Radix) | Localization |
| "Save" button | Button (default) | Bottom |
| Danger zone container | Div (red, dashed border) | Danger Zone |
| "Delete Workspace" button | Button (destructive) | Danger Zone |
| Delete confirmation dialog | AlertDialog | Danger Zone |
| Delete name input | Input (text) | Delete Dialog |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Tab | Switches settings tab |
| Click | "Save" | Validates and submits form |
| Click | "Upload Logo" | Opens file picker |
| Click | "Remove Logo" | Removes logo |
| Click | "Delete Workspace" | Opens first confirmation dialog |
| Type | Delete dialog name input | Confirm button enables only when name matches |
| Click | Delete dialog "Confirm" | Opens second confirmation dialog |
| Click | Second "Confirm" | Deletes workspace (irreversible) |
| Keyboard | Tab | Through tabs → form → save → danger zone |
| Keyboard | Enter | Submits form |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Form with current values |
| Loading | Initial load | Skeleton form fields |
| Saving | "Save" clicked | Button spinner + "Saving..." |
| Save success | API 200 | Toast: "Workspace settings saved" |
| Save error | API error | Toast: "Failed to save: [message]" |
| Logo uploading | File selected | Upload progress |
| Logo success | Upload complete | Logo updates + toast: "Logo updated" |
| Delete dialog 1 | "Delete Workspace" clicked | AlertDialog: "Delete [Workspace Name]? ALL data will be permanently lost." + name input |
| Delete dialog 2 | Name matches, "Confirm" clicked | Second AlertDialog: "Are you absolutely sure? This cannot be undone." |
| Deleting | Final confirm | Spinner on confirm button |
| Delete success | API 200 | Redirect to login + toast: "Workspace deleted" |
| Delete error | API error | Toast: "Failed to delete workspace" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Settings saved | Toast: "Workspace settings saved" |
| Logo updated | Toast: "Logo updated" |
| Logo removed | Toast: "Logo removed" |
| Delete success | Redirect to login + toast: "Workspace deleted" |
| Delete error | Toast: "Failed to delete workspace" |
| Validation error | Inline red border + message |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Delete workspace? | Danger zone | Delete (irreversible) or cancel | Cancel (safe default) |
| EN or AR default? | Localization | English or Arabic | English (current default) |
| Upload logo or use default? | Branding | Custom logo or default Smart Screen logo | Default (zero effort) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Accidental delete | Double confirmation + type name match | Must type workspace name exactly |
| Save with empty name | Client-side validation: name required | Inline error |
| Upload oversized logo | Client-side size check | Error: "Logo must be under 1MB" |
| Wrong language selection | Language change is immediate on save | Re-select and save |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Full navigable; Tab through all elements |
| Screen reader | Danger zone has `aria-label` warning |
| Focus | Delete confirmation: focus on "Cancel" (safe default) |
| Contrast | Danger zone border meets 3:1 |
| Touch targets | All buttons ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tab nav | Horizontal scroll |
| Form | Full width, single column |
| Logo | Centered |
| Danger zone | Full width, prominent |
| Delete dialog | Full screen dialog |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch workspace data (fast, single record) |
| Logo upload | Compress on client (future) |
| Tab switch | SWR cache (instant) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Brand colors | Branding section |
| Custom domain | New section |
| Email branding | New section |
| Workspace export | Danger zone or toolbar |
| Transfer ownership | Danger zone |
| Workspace templates | New section |
| Multi-language workspace | Localization section enhancement |

### 20. UX Notes
- Workspace deletion is the most destructive action in the product — double confirmation is mandatory
- Name input in delete dialog must match exactly (case-sensitive) to enable confirm button
- Workspace name change should update sidebar/header immediately (SWR revalidation)
- Logo should appear in sidebar and header after upload
- Default language affects all team members' UI language
- Consider showing workspace member count and screen count in the General section for context
- "Delete Workspace" button should be visually isolated (red dashed border container) to prevent accidental clicks
- Tab is hidden for Editor/Viewer roles — they should not see "Workspace" in the tab list at all

---

## Cross-References

- See `12-settings-ux-blueprint-part2.md` for Billing and Notifications tabs
- See `13-settings-ux-blueprint-part3.md` for Security and API tabs
- See `05-page-type-ux-rules.md` §7 for settings page type rules
- See `information-architecture/06-page-catalog.md` P-ST-01, P-ST-02
- See `audits/frontend/14-settings-feature.md` for settings audit
- See `product-architecture/09-product-modules.md` M-07 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `03-component-ux-standards.md` §1 for form UX standards
