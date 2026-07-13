# Phase 8: Advanced Onboarding & Module Management

## Overview

Phase 8 adds a comprehensive onboarding experience for new users and gives super admins full control over which feature modules are enabled per workspace.

## Backend

### Prisma Models

- **`OnboardingProgress`** — Tracks per-workspace onboarding step completion.
  - `workspaceId` (unique, 1:1 with Workspace)
  - `completedSteps` — JSON array of completed step keys
  - `dismissed` — Hide the onboarding widget
  - `completedAt` — Timestamp when all steps were done

- **`FeatureFlag`** — Per-workspace module enable/disable.
  - `workspaceId` + `module` (unique constraint)
  - `enabled` — Whether the module is active
  - `setBy` — `"super_admin"` or `"system"`

### Onboarding Module (`/onboarding`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/onboarding?workspaceId=` | GET | OWNER/ADMIN | Get onboarding progress |
| `/onboarding/complete-step?workspaceId=` | POST | OWNER/ADMIN | Mark a step as complete |
| `/onboarding/dismiss?workspaceId=` | PATCH | OWNER/ADMIN | Hide onboarding widget |
| `/onboarding/reset?workspaceId=` | POST | OWNER/ADMIN | Reset progress (for testing) |

**Onboarding Steps:**
1. `create_screen` — Add first screen
2. `upload_media` — Upload media content
3. `create_playlist` — Create a playlist
4. `schedule_content` — Schedule content
5. `invite_team` — Invite team members

### Feature Flags Module (`/admin/feature-flags`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/admin/feature-flags` | GET | SUPER_ADMIN | List all workspaces with their flags |
| `/admin/feature-flags/:workspaceId` | GET | SUPER_ADMIN | List flags for one workspace |
| `/admin/feature-flags/:workspaceId` | PATCH | SUPER_ADMIN | Toggle a module flag |

**Managed Modules:**
- `billing`, `api_keys`, `webhooks`, `analytics`, `campaigns`, `ai`, `emergency`, `proof_of_play`, `templates`

### Email Templates

- **`welcomeEmail`** — Sent on successful registration with getting-started guide
- **`onboardingTipsEmail`** — Drip tips (day 1, 3, 7) with targeted guidance

## Frontend

### Onboarding Progress Widget
- Shows on dashboard home above workspace summary
- Progress bar with percentage
- Clickable step cards that navigate to the relevant page
- Dismiss button to hide the widget
- Auto-hides when all steps are complete or dismissed

### Contextual Tooltips
- `InfoTooltip` component — reusable hover/click tooltip with info icon
- `TooltipProvider` context for programmatic tooltip management

### Super Admin Feature Flags Panel
- Accessible at `/admin/feature-flags`
- Searchable list of all workspaces
- Per-workspace grid of module toggle switches
- Real-time toggle with toast feedback
- Shows active module count per workspace

## i18n

All new UI text is translated in both `en.json` and `ar.json`:
- `onboardingWidget.*` — Onboarding widget labels
- `featureFlags.*` — Feature flags panel labels
- `adminFeatureFlags` — Sidebar nav label

## Files Created

### Backend
- `apps/backend/prisma/schema.prisma` — Added `OnboardingProgress` + `FeatureFlag` models
- `apps/backend/src/domains/onboarding/onboarding.module.ts`
- `apps/backend/src/domains/onboarding/onboarding.service.ts`
- `apps/backend/src/domains/onboarding/onboarding.controller.ts`
- `apps/backend/src/domains/onboarding/feature-flags.service.ts`
- `apps/backend/src/domains/onboarding/feature-flags.controller.ts`
- `apps/backend/src/domains/onboarding/dto/complete-step.dto.ts`
- `apps/backend/src/domains/onboarding/dto/set-feature-flag.dto.ts`
- `apps/backend/src/domains/email/email-templates.ts` — Added `welcomeEmail` + `onboardingTipsEmail`
- `apps/backend/src/domains/auth/auth.service.ts` — Send welcome email on registration
- `apps/backend/src/app.module.ts` — Registered `OnboardingModule`

### Frontend
- `apps/dashboard/src/features/onboarding/onboarding-api.ts`
- `apps/dashboard/src/features/onboarding/onboarding-progress-widget.tsx`
- `apps/dashboard/src/features/onboarding/tooltip-context.tsx`
- `apps/dashboard/src/components/ui/info-tooltip.tsx`
- `apps/dashboard/src/features/admin/feature-flags-client.tsx`
- `apps/dashboard/src/app/[locale]/(shell)/admin/feature-flags/page.tsx`
- `apps/dashboard/src/components/layout/shell-sidebar.tsx` — Added feature flags nav item
- `apps/dashboard/src/features/dashboard/client-home-dashboard.tsx` — Integrated onboarding widget
- `apps/dashboard/src/i18n/messages/en.json` + `ar.json` — Added translations
