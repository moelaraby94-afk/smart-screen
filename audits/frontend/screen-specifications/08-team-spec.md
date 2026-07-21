# Screen Specifications — Team

> **Evidence basis:** `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-TM-01, `user-flow-architecture/12-team-flows.md`, `product-architecture/09-product-modules.md` M-06, `product-architecture/17-product-rules.md` PR-33–PR-38, `information-architecture/06-page-catalog.md` P-TM-01

---

## SCR-TM-01: Team

### Screen ID
SCR-TM-01

### Purpose
View and manage workspace team members and pending invitations.

### Business Goal
Team scaling; access management; collaboration.

### User Goal
See team members; invite new members; manage roles.

### Primary Users
Owner (full access); Editor (view only); Viewer (view only).

### Permissions
- "Invite Member" button: Owner only
- Role change: Owner only
- Remove member: Owner only
- Cancel/resend invite: Owner only
- View team: All roles

### Entry Points
- Sidebar "Team"
- Notification click (invite accepted/declined)

### Exit Points
- Sidebar navigation
- No detail pages (team is a single-page management interface)

### Navigation
- Sidebar active: "Team"
- Breadcrumbs: None (top-level page)

### Page Title
`Team — Smart Screen`

### Primary CTA
"Invite Member" button (Owner only).

### Secondary CTA
- Pending invite actions: "Resend", "Cancel" (Owner only)
- Role dropdown per member (Owner only)

### Danger Actions
- Remove member (Owner only)
- Cancel invitation (Owner only)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Team" + [Invite Member] (Owner)        │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Pending Invites (if any)                         │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ email@example.com | Pending | [Resend][×]   │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Active Members                                   │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Avatar | Name | email | Role▼ | [More]       │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Avatar | Name | email | Role▼ | [More]       │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1000px] mx-auto px-6 py-6`
- Sections: `flex flex-col gap-6`

### Spacing
- Page header: `mb-6`
- Section cards: `gap-6`
- Member rows: `gap-2 p-3`
- Pending rows: `gap-2 p-3`

### Visual Hierarchy
1. Page header with "Invite Member" CTA (Owner)
2. Pending Invites section (if any invites)
3. Active Members section (primary content)

### Page Sections

#### Section 1: Page Header
- "Team" heading + "Invite Member" button (Owner only)
- Member count subtitle: "[N] members"

#### Section 2: Pending Invites (conditional)
- **Visibility:** Only if pending invites exist
- **Contents:** List of pending invitations (email, role, sent date, "Resend" + "Cancel" buttons)
- **Header:** "Pending Invitations ([N])"
- **Empty:** Section hidden entirely (no empty state — just absent)
- **Data:** `useApiTeamInvites({ status: 'pending' })`

#### Section 3: Active Members
- **Contents:** List of active team members (avatar, name, email, role dropdown, "More" menu)
- **Header:** "Active Members ([N])"
- **Data:** `useApiTeamMembers()`
- **Row:** Avatar (32px), Name (bold), Email (muted), Role dropdown, "More" menu (⋯)
- **Owner row:** Role dropdown disabled (can't change own role); "More" menu hidden
- **"More" menu:** "Remove Member" (destructive)

---

## Component Tree

```
<TeamPage>
  <PageHeader>
    <Heading level={1}>Team</Heading>
    <Text variant="muted">{members.length} members</Text>
    {isOwner && <Button variant="default" onClick={openInviteDialog}>
      <Plus icon /> Invite Member
    </Button>}
  </PageHeader>
  {pendingInvites.length > 0 && (
    <PendingInvitesSection>
      <SectionHeading>Pending Invitations ({pendingInvites.length})</SectionHeading>
      {pendingInvites.map(invite => (
        <PendingInviteRow
          key={invite.id}
          invite={invite}
          onResend={handleResend}
          onCancel={handleCancel}
        />
      ))}
    </PendingInvitesSection>
  )}
  <ActiveMembersSection>
    <SectionHeading>Active Members ({members.length})</SectionHeading>
    {members.map(member => (
      <MemberRow
        key={member.id}
        member={member}
        isSelf={member.id === currentUser.id}
        isOwner={isOwner}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
      />
    ))}
  </ActiveMembersSection>
</TeamPage>
```

### Component Details

#### PendingInviteRow
- **Props:** `invite: Invitation`, `onResend: (id) => void`, `onCancel: (id) => void`
- **UI:** Email (bold), role badge, "Sent [date]" (muted), "Resend" button, "Cancel" (×) button
- **Resend:** API call → toast: "Invitation resent"
- **Cancel:** AlertDialog: "Cancel invitation to [email]?" → API call → toast: "Invitation cancelled"

#### MemberRow
- **Props:** `member: Member`, `isSelf: boolean`, `isOwner: boolean`, `onRoleChange`, `onRemove`
- **UI:** Avatar (32px round), Name (bold), Email (muted), Role dropdown, "More" menu
- **Role dropdown:** Options: Owner, Editor, Viewer; disabled if `isSelf` (can't change own role)
- **"More" menu:** "Remove Member" (destructive) — hidden if `isSelf`
- **Role change:** Immediate (no confirmation); API call → toast: "[Name] is now [Role]"
- **Remove:** AlertDialog: "Remove [Name] from the workspace?" → API call → toast: "[Name] removed"

---

## States

### Loading
- Member rows: Skeleton rows (avatar circle + text bars)

### Empty — No Members (impossible)
- Workspace always has at least the Owner; this state should never occur

### Empty — No Pending Invites
- Pending Invites section hidden (not shown as empty state)

### Error
- Member list: Error + "Retry"
- Pending list: Error + "Retry" (if section visible)

### Realtime
- Invite accepted: Toast: "[Name] joined the team" + member appears in Active Members
- Invite declined: Toast: "[email] declined the invitation" + invite removed from Pending

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Invite Member" | Open invite dialog |
| Click | Role dropdown | Open role selector |
| Select | Role option | Change role (immediate, no confirmation) |
| Click | "More" → "Remove Member" | Open AlertDialog |
| Click | "Resend" (pending) | Resend invitation + toast |
| Click | "Cancel" (pending) | Open cancel AlertDialog |
| Confirm | Remove dialog | Remove member + toast |
| Confirm | Cancel invite dialog | Cancel invite + toast |

---

## Forms

### Invite Dialog
- **Fields:** Email (required, email format), Role (required, dropdown: Owner/Editor/Viewer)
- **Submit:** "Send Invitation"
- **Validation:** Email format on blur; email required on submit
- **Success:** Dialog closes; pending invite appears; toast: "Invitation sent to [email]"
- **Error — Already member:** Inline: "This email is already a member"
- **Error — Already invited:** Inline: "This email has already been invited"
- **Error — API:** Toast: "Failed to send invitation. Try again."

### Role Change
- **No form** — immediate dropdown selection
- **API:** `PATCH /team/{memberId}` with `{ role }`
- **Success:** Toast: "[Name] is now [Role]"
- **Error:** Toast: "Failed to change role. Try again." + dropdown reverts

### Remove Member
- **Confirmation:** AlertDialog: "Remove [Name] from the workspace? They will lose access to all workspace data."
- **API:** `DELETE /team/{memberId}`
- **Success:** Member removed from list; toast: "[Name] removed"
- **Error:** Toast: "Failed to remove member. Try again."

---

## Responsive

### Desktop (≥ 768px)
- Full row layout: Avatar | Name | Email | Role | More
- Two-column max width 1000px

### Mobile (< 768px)
- Stacked row: Avatar + Name on first line, Email on second line, Role + More on third line
- Full width

---

## Accessibility

| Element | Rule |
|---------|------|
| Page | `<h1>` "Team" |
| Sections | `role="region"` with `aria-label` |
| Member rows | `role="listitem"` in `role="list"` |
| Role dropdown | `aria-label="Change role for [Name]"` |
| Remove button | `aria-label="Remove [Name]"` |
| Pending row | `aria-label="[email], pending, role [Role]"` |
| Focus | Header → pending (if visible) → active members |
| Contrast | All text meets WCAG AA |

---

## Performance UX

| Concern | Strategy |
|---------|----------|
| Data fetch | Parallel SWR (members + pending invites) |
| Realtime | Socket.IO for invite accepted/declined events |
| Optimistic UI | Role change: update immediately, revert on error |
| Cache | SWR with 30s revalidation focus |

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/team` | GET | Active members |
| `/team/invites?status=pending` | GET | Pending invitations |
| `/team/invite` | POST | Send invitation |
| `/team/{id}` | PATCH | Change role |
| `/team/{id}` | DELETE | Remove member |
| `/team/invites/{id}/resend` | POST | Resend invitation |
| `/team/invites/{id}` | DELETE | Cancel invitation |

### Realtime Events
| Event | Handler | UI Update |
|-------|---------|-----------|
| `team:invite-accepted` | Add to members, remove from pending | Toast + list update |
| `team:invite-declined` | Remove from pending | Toast + list update |

### Backend Limitations
- No bulk invite (must send one by one)
- No role change confirmation (immediate)
- Owner cannot be removed or demoted (by self)

### Missing APIs
- `POST /team/bulk-invite` — Bulk invite multiple emails
- `GET /team/invites` — All invites (not just pending) for history

---

## Acceptance Criteria

### Functional
- [ ] Displays active members with avatar, name, email, role
- [ ] Displays pending invites (if any)
- [ ] "Invite Member" opens dialog (Owner only)
- [ ] Invite dialog sends invitation and shows toast
- [ ] Role dropdown changes role (Owner only)
- [ ] Owner's own role dropdown is disabled
- [ ] Remove member shows confirmation and removes
- [ ] Resend invite works
- [ ] Cancel invite shows confirmation and cancels
- [ ] Realtime: invite accepted/declined updates lists

### UX
- [ ] Skeleton loading for member rows
- [ ] Pending section hidden when no pending invites
- [ ] Role change is immediate (no confirmation for promotions)
- [ ] Remove requires confirmation (destructive)
- [ ] Toast feedback for all actions

### Accessibility
- [ ] `<h1>` "Team"
- [ ] Role dropdown has `aria-label`
- [ | Remove button has `aria-label`
- [ ] Keyboard: Tab through members, Enter on role dropdown

### Performance
- [ ] Member list < 500ms
- [ ] Realtime update < 1s

### Responsive
- [ ] Row layout adapts on mobile (stacked)
- [ ] Full width on mobile

---

## Current Problems
| ID | Problem | Impact |
|----|---------|--------|
| TP-01 | No member removal confirmation detail | User may not understand impact |
| TP-02 | No invite expiration | Pending invites persist indefinitely |
| TP-03 | No activity log per member | Can't see what each member did |

## Technical Debt
| ID | Debt | Impact |
|----|------|--------|
| TTD-01 | No bulk invite | Must invite one by one |
| TTD-02 | No member detail page | Can't view per-member activity |

## UX Improvements
| ID | Improvement | Priority | Effort |
|----|------------|----------|--------|
| TUI-01 | Add invite expiration date | Medium | Low |
| TUI-02 | Add member activity log | Low | Medium |
| TUI-03 | Add bulk invite | Medium | Medium |
| TUI-04 | Add role change confirmation for demotions | Low | Low |

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `13-shared-dialogs-specs.md` for invite dialog spec
- See `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-TM-01 for team UX blueprint
- See `user-flow-architecture/12-team-flows.md` for team flow documentation
- See `product-architecture/09-product-modules.md` M-06 for team module
- See `product-architecture/17-product-rules.md` PR-33–PR-38 for permission rules
