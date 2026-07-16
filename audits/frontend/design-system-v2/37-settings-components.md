# 37 — Settings Components

> **Evidence basis:** `15-cards.md`, `13-input-specifications.md`, `14-form-standards.md`, `09-interaction-states.md`, `screen-specifications/09-settings-specs-part1.md`, `screen-specifications/10-settings-specs-part2.md`, `screen-specifications/08-team-spec.md`, `ux-blueprint/11-settings-ux-blueprint-part1.md` through `13-settings-ux-blueprint-part3.md`

---

## 1. Settings Component Philosophy

Settings components are **form-centric, simple, and organized by tabs**. They use standard form components from the design system. Each settings tab is a self-contained form or list.

---

## 2. Components

### Component: SettingsTabs

#### Purpose
Tab navigation for settings pages.

#### Usage
Settings page (Profile, Workspace, Billing, Security, API, Notifications).

#### Structure
```
<SettingsTabs active={activeTab} role={user.role} />
```

#### Tab Visibility
| Tab | Owner | Editor | Viewer |
|-----|-------|--------|--------|
| Profile | ✅ | ✅ | ✅ |
| Workspace | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ |
| Security | ✅ | ✅ | ✅ |
| API Keys | ✅ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ |

#### Visual
- Uses standard Tabs component (`25-navigation-components.md`)
- `border-b --border`
- Active: `--foreground` text, 2px bottom `--primary` border
- Inactive: `--muted-foreground` text

---

### Component: MemberRow

#### Purpose
Display a team member with avatar, name, email, role, and actions.

#### Usage
Team page.

#### Structure
```
<MemberRow
  member={member}
  isSelf={member.id === currentUser.id}
  isOwner={isOwner}
  onRoleChange={handleRoleChange}
  onRemove={handleRemove}
/>
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | `flex items-center gap-3 p-3`, `border-b --border` |
| Avatar | 32px (`Avatar` size `md`) |
| Name | `--text-sm --font-medium --foreground` |
| Email | `--text-xs --muted-foreground` |
| Role dropdown | Select component (disabled if `isSelf`) |
| "More" menu | `MoreHorizontal` icon (hidden if `isSelf`) |

#### Role Dropdown
- Options: Owner, Editor, Viewer
- Disabled if `isSelf` (can't change own role)
- Change: Immediate (no confirmation for promotions)
- Toast: "[Name] is now [Role]"

#### "More" Menu
- "Remove Member" (destructive) — hidden if `isSelf`
- Opens AlertDialog: "Remove [Name] from the workspace?"

#### Accessibility
- `role="listitem"` in `role="list"`
- Role dropdown: `aria-label="Change role for [Name]"`
- Remove: `aria-label="Remove [Name]"`

---

### Component: PendingInviteRow

#### Purpose
Display a pending team invitation with resend and cancel actions.

#### Usage
Team page (Pending Invites section).

#### Visual Design
| Element | Style |
|---------|-------|
| Container | `flex items-center gap-3 p-3`, `border-b --border` |
| Email | `--text-sm --font-medium --foreground` |
| Role badge | Badge component |
| Sent date | `--text-xs --muted-foreground` ("Sent 2 days ago") |
| Resend button | `ghost`, `sm`, "Resend" |
| Cancel button | `ghost`, `sm`, `X` icon |

#### Actions
| Action | Behavior |
|--------|---------|
| Resend | API call → toast "Invitation resent" |
| Cancel | AlertDialog: "Cancel invitation to [email]?" → API → toast |

---

### Component: NotificationItem

#### Purpose
Display a single notification with icon, message, and timestamp.

#### Usage
Notifications page, Notification bell dropdown.

#### Structure
```
<NotificationItem notification={n} onClick={() => handleClick(n)} />
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | `flex items-start gap-3 p-3`, `border-b --border` |
| Unread | `bg-primary/5` |
| Read | `--card` bg |
| Icon | 18px, by notification type, `--muted-foreground` |
| Message | `--text-sm --foreground` |
| Timestamp | `--text-xs --muted-foreground` (relative: "2m ago") |
| Unread dot | 8px, `--primary`, right side |

#### Icon by Type
| Type | Icon |
|------|------|
| Screen | `Monitor` |
| Schedule | `CalendarClock` |
| Team | `Users` |
| System | `Settings` |

#### Accessibility
- `role="link"`, `aria-label` with notification text
- Unread: `aria-label` includes "unread"

---

### Component: PlanCard

#### Purpose
Display a subscription plan with features and price.

#### Usage
Settings Billing page.

#### Structure
```
<PlanCard plan={plan} isCurrent={plan.id === currentPlan.id} onSelect={handleSelect} />
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | Card `variant="default"` |
| Current plan | `border-primary` (2px), "Current Plan" badge |
| Plan name | `--text-lg --font-semibold --foreground` |
| Price | `--text-2xl --font-bold --foreground` + `--text-sm --muted-foreground` ("/month") |
| Features | List with `Check` icons (16px, `--success`) |
| Button | "Select Plan" (default) or "Current Plan" badge |

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `plan` | `Plan` | Plan entity |
| `isCurrent` | `boolean` | Is current plan |
| `onSelect` | `(plan) => void` | Selection handler |

---

### Component: ApiKeyRow

#### Purpose
Display an API key in a table row with masked key and actions.

#### Usage
Settings API Keys page.

#### Visual Design
| Element | Style |
|---------|-------|
| Name | `--text-sm --font-medium --foreground` |
| Key | `--font-mono --text-sm --muted-foreground` (masked: `cs_••••••••`) |
| Created | `--text-xs --muted-foreground` |
| Last used | `--text-xs --muted-foreground` |
| Status | Badge (Active/Revoked) |
| Copy button | `ghost`, `sm`, `Copy` icon |
| Revoke button | `destructive`, `sm`, "Revoke" |

---

### Component: NotificationToggle

#### Purpose
Toggle switch for a notification preference.

#### Usage
Settings Notifications page.

#### Structure
```
<NotificationToggle
  label="Screen offline"
  description="Get notified when a screen goes offline"
  checked={preferences.screenOffline}
  onChange={(val) => updatePreference('screenOffline', val)}
/>
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | `flex items-center justify-between py-3` |
| Label | `--text-sm --font-medium --foreground` |
| Description | `--text-xs --muted-foreground` |
| Toggle | Standard Toggle component (`13-input-specifications.md`) |

#### Accessibility
- `role="switch"`, `aria-checked`, `aria-label="[label]"`
- Keyboard: Space to toggle

---

### Component: TwoFactorStatus

#### Purpose
Display 2FA status badge and action buttons.

#### Visual Design
| State | Badge | Action |
|-------|-------|--------|
| Enabled | `success` badge "Enabled" | "View Backup Codes", "Regenerate", "Disable" |
| Disabled | `muted` badge "Disabled" | "Enable 2FA" button |

---

## 3. Settings Component Rules

- **Tab-based navigation:** All settings use tabs
- **Role-based visibility:** Tabs hidden based on user role
- **Form-based:** Most settings are forms with Save button
- **Immediate feedback:** Role changes, toggles are immediate (no Save needed)
- **Confirmation for destructive:** Remove member, disable 2FA, revoke API key
- **Toast feedback:** All actions show toast on success/failure

---

## Cross-References

- See `15-cards.md` for Card and Badge
- See `13-input-specifications.md` for Input, Toggle, Select
- See `14-form-standards.md` for form patterns
- See `25-navigation-components.md` for Tabs
- See `09-interaction-states.md` for state definitions
- See `screen-specifications/09-settings-specs-part1.md` for Settings Part 1
- See `screen-specifications/10-settings-specs-part2.md` for Settings Part 2
- See `screen-specifications/08-team-spec.md` for Team page
- See `ux-blueprint/11-settings-ux-blueprint-part1.md` through `13-settings-ux-blueprint-part3.md`
