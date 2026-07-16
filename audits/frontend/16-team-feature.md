# 16 — Team Feature

> **Source basis:** `src/features/team/team-client.tsx`, `src/features/team/team-api.ts`, `src/features/team/invite-accept-client.tsx`  

---

## 16.1 Team Client (`src/features/team/team-client.tsx`)

### Route: `/{locale}/team`

### Purpose
Team member management within the active workspace (~32KB).

### Sections

**Members List:**
- Table: name, email, role, status (active/pending), joined date
- Roles: Owner, Admin, Editor, Viewer
- Change role via dropdown
- Remove member with confirmation
- Resend invite (for pending members)
- Cancel invite (for pending members)

**Pending Invitations:**
- List of sent invitations not yet accepted
- Email, role, sent date, expiry
- Resend / cancel actions

**Invite Member:**
- Dialog with email input and role selector
- Sends invitation email
- Toast feedback on success/failure
- Multiple invites supported

**Role Permissions Matrix:**
| Permission | Owner | Admin | Editor | Viewer |
|-----------|-------|-------|--------|--------|
| Manage workspace | ✅ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Manage screens | ✅ | ✅ | ✅ | ❌ |
| Manage playlists | ✅ | ✅ | ✅ | ❌ |
| Manage media | ✅ | ✅ | ✅ | ❌ |
| Manage schedules | ✅ | ✅ | ✅ | ❌ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |

### API Calls
| Function | Method | Path |
|----------|--------|------|
| `fetchMembers(workspaceId)` | GET | `/workspaces/{ws}/members` |
| `inviteMember(workspaceId, email, role)` | POST | `/workspaces/{ws}/invite` |
| `updateMemberRole(wsId, memberId, role)` | PATCH | `/workspaces/{ws}/members/{id}` |
| `removeMember(wsId, memberId)` | DELETE | `/workspaces/{ws}/members/{id}` |
| `cancelInvite(wsId, inviteId)` | DELETE | `/workspaces/{ws}/invites/{id}` |
| `resendInvite(wsId, inviteId)` | POST | `/workspaces/{ws}/invites/{id}/resend` |

---

## 16.2 Team API (`src/features/team/team-api.ts`)

### Functions
All team API functions use `apiFetch` from session module. They handle:
- Member CRUD
- Invitation management
- Role management

### Error Handling
Uses `readApiError` and `useApiErrorToast` for consistent error display. Common error codes:
- `MEMBER_LIMIT_REACHED` — workspace plan limit
- `ALREADY_MEMBER` — email already in workspace
- `INVITE_EXPIRED` — invitation has expired
- `INSUFFICIENT_PERMISSIONS` — user lacks required role

---

## 16.3 Invite Accept Client (`src/features/team/invite-accept-client.tsx`)

### Route: `/{locale}/invite`

### Purpose
Page for accepting a team invitation. This is an auth-group page (no shell layout).

### Flow
1. User receives invitation email with link to `/{locale}/invite?token={token}`
2. If not authenticated: shows login/register prompt
3. If authenticated: shows invitation details (workspace name, inviter, role)
4. Accept button: calls `POST /workspaces/invite/accept` with token
5. On success: refreshes workspaces, navigates to overview, shows toast
6. Decline button: calls `POST /workspaces/invite/decline` with token
7. On decline: shows confirmation, navigates to overview

### UI
- Centered card (auth layout)
- Workspace name and inviter info
- Role being offered
- Accept and Decline buttons
- Loading states during API calls
- Error handling for expired/invalid tokens

---

## 16.4 [V2] UX Analysis — Team Feature

### Team Management — HCI Evaluation

**[V2] Team Member List:**
The team page shows workspace members with their roles. Key UX considerations:
- Role display (admin, editor, viewer) — should use badges with semantic colors
- Member status (active, invited, suspended) — should be visually distinct
- Last active timestamp — helps identify inactive members
- Member count vs plan limit — should show usage indicator

**[V2] Invite Flow:**
The invite flow sends an email invitation with a token. The `InviteAcceptClient` handles the acceptance page. Key UX considerations:
- Invite email should clearly state: workspace name, inviter name, role being offered
- Accept page should show workspace details before accepting
- Decline option should be available but not prominent
- Expired/invalid tokens should show clear error with contact info

**[V2] Missing Team Features:**
- No role change from the team page (must remove and re-invite)
- No member removal from the team page
- No cancel/resend invitation
- No bulk invite (multiple emails at once)
- No team member search/filter
- No team member activity log
- No custom roles (only predefined roles)
- No team member export
- No team member last-active indicator

### Invite Accept — Edge Cases

**[V2] Token Validation:**
The invite token is validated server-side. If the token is expired or invalid, the user sees an error. Key edge cases:
- Token already used (user already accepted) — should redirect to workspace
- Token expired — should show "request new invite" option
- Token for non-existent workspace — should show generic error
- User already in workspace — should inform, not error

**[V2] Auth Required for Accept:**
The accept page requires authentication. If the user is not logged in, they should be redirected to login with `returnTo` pointing back to the invite accept page. This is a standard pattern.

### Cross-References
- See `06-auth-and-session.md` for auth flow and returnTo handling
- See `07-workspace-management.md` for workspace context
- See `14-settings-feature.md` for notification preferences
- See `27-user-flows.md` for team invitation user journey
