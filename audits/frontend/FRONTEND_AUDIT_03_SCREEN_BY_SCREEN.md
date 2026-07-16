# 03 — Screen-by-Screen Audit

> **Evidence basis:** All page.tsx files, feature client components, screen spec docs

---

## 1. Overview (`/`)

### 1.1 Components
- `HomeOverview` — hero section with welcome message
- `ClientHomeDashboard` — main dashboard with widgets
- `OnboardingProgressWidget` — 5-step progress
- `QuickActionsSection` — shortcut buttons
- `TotalsSection` — 6 stat cards
- `WorkspaceCardsSection` — branch cards
- `ScreenHealthSection` — screen status summary
- `RecentActivityFeed` — activity log
- `SubscriptionSummarySection` — plan info
- `PrayerTimesWidget`, `HijriDateWidget` — Islamic features

### 1.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| SC-01 | Hardcoded Tailwind colors in TotalsSection | Medium |
| SC-02 | Non-brand gradient colors in hero | Low |
| PX-01 | Full reload on every workspace action | Medium |

### 1.3 Score: 7/10

---

## 2. Screens List (`/screens`)

### 2.1 Components
- Screen cards grid with status indicators
- Search and filter controls
- "Add Screen" button

### 2.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| SC-03 | No virtualization for 200+ screens | Medium |
| CP-01 | No pagination component | Medium |
| PX-02 | SWR cache on workspace switch | Medium |

### 2.3 Score: 7/10

---

## 3. Screen Detail (`/screens/[screenId]`)

### 3.1 Components
- Screen info header with status
- Inline edit for name, location
- Branch dropdown
- Playlist assignment
- Remote commands (refresh, identify, restart)
- Realtime socket for status updates
- Delete screen

### 3.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| SC-04 | Native `<select>` instead of design system Select | Medium |
| A11Y-03 | No aria-live for realtime status updates | Medium |

### 3.3 Score: 8/10 (improved after stabilization)

---

## 4. Content (`/content`)

### 4.1 Tabs: Playlists, Media, Studio, Templates

### 4.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| IA-01 | Duplicated standalone routes | Critical |
| SC-08 | No URL sync for tab state | Medium |
| PC-01 | Studio violates DD-02 | Medium |

### 4.3 Score: 6/10

---

## 5. Playlists (tab + `/playlists`)

### 5.1 Components
- `PlaylistStudioClient` — grid view + editor view
- Grid: playlist cards with stats, search, sort, group sidebar
- Editor: media library panel, canvas, timeline, properties

### 5.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| UJ-03 | No empty state guidance in editor | Medium |
| RS-01 | No tablet layout for editor | High |
| PX-03 | No search debounce | Low |

### 5.3 Score: 7/10

---

## 6. Media (tab + `/media`)

### 6.1 Components
- `MediaLibraryClient` — 857 lines
- Drag-and-drop upload zone
- Folder sidebar
- Media grid with selection
- Bulk delete, info dialog, add-to-playlist
- Filter by type, sort, search, pagination

### 6.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| UJ-02 | No storage limit warning | High |
| SC-10 | No drag-to-folder | Low |
| PX-02 | No infinite scroll | Low |

### 6.3 Score: 7/10

---

## 7. Scheduling (`/scheduling`)

### 7.1 Components
- `SchedulesClient` — 429 lines
- Three view modes: calendar, timeline, list
- Create schedule dialog
- Overlap detection
- Sort by priority, playlist, screen, time

### 7.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| UJ-04 | No conflict preview during form | Medium |
| RS-02 | Calendar overflow on mobile | Medium |
| SC-06 | No view mode guidance | Low |

### 7.3 Score: 7/10

---

## 8. Analytics (`/analytics`)

### 8.1 Components
- `AnalyticsPageClient` — 389 lines
- Screen health summary
- Per-screen analytics table
- Search filter
- Export button

### 8.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| SC-05 | Hardcoded status colors | Medium |
| CP-03 | No chart component | Low |
| — | No date range selector | Medium |
| — | No content performance | Medium |

### 8.3 Score: 5/10

---

## 9. Team (`/team`)

### 9.1 Components
- `TeamClient` — 785 lines
- Workspace members list
- Pending invites
- Account-level members
- Create user with workspace scopes
- Role management, remove member

### 9.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| SC-06 | No empty state for zero members | Medium |
| UJ-05 | No role descriptions | Medium |
| — | Dual member system confusing | Medium |

### 9.3 Score: 6/10

---

## 10. Settings — Profile (`/settings/profile`)

### 10.1 Components
- Profile info form
- Password change
- `TwoFactorSettings` component
- `NotificationPreferences` component
- GDPR/anonymize section

### 10.2 Issues
| ID | Issue | Severity |
|----|-------|----------|
| SC-07 | Page too long, mixes concerns | Medium |
| IA-02 | 2FA and Notifications should be separate tabs | High |

### 10.3 Score: 5/10

---

## 11. Settings — Workspace (`/settings/workspace`)

### 11.1 Score: 8/10 — Clean, focused page

---

## 12. Settings — Billing (`/settings/billing`)

### 12.1 Issues
| ID | Issue | Severity |
|----|-------|----------|
| UJ-06 | No upgrade guidance | Low |

### 12.2 Score: 6/10

---

## 13. Emergency (`/emergency`)

### 13.1 Issues
| ID | Issue | Severity |
|----|-------|----------|
| IA-04 | Not discoverable from sidebar | Medium |
| — | No confirmation step | High |
| — | No deactivation flow | Medium |

### 13.2 Score: 4/10

---

## 14. AI Tools (`/ai`)

### 14.1 Issues
| ID | Issue | Severity |
|----|-------|----------|
| IA-04 | Not discoverable from sidebar | Medium |

### 14.2 Score: 5/10

---

## 15. Admin Pages

### 15.1 Routes: /admin, /admin/customers, /admin/staff, /admin/fleet, /admin/workspaces, /admin/billing, /admin/stats, /admin/logs, /admin/feature-flags, /admin/screens, /admin/settings

### 15.2 Score: 8/10 — Well structured with grouped sidebar

---

## 16. Screen Score Summary

| Screen | Score | Key Issue |
|--------|-------|-----------|
| Overview | 7/10 | Hardcoded colors, full reload |
| Screens List | 7/10 | No virtualization |
| Screen Detail | 8/10 | Native select |
| Content | 6/10 | Duplicated routes, no URL sync |
| Playlists | 7/10 | No tablet layout |
| Media | 7/10 | No storage warning |
| Scheduling | 7/10 | No conflict preview |
| Analytics | 5/10 | No charts, no date range |
| Team | 6/10 | No role descriptions |
| Settings Profile | 5/10 | Too long |
| Settings Workspace | 8/10 | — |
| Settings Billing | 6/10 | No upgrade path |
| Emergency | 4/10 | Not discoverable |
| AI Tools | 5/10 | Not discoverable |
| Admin | 8/10 | — |
| **Average** | **6.3/10** | |
