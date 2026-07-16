# Open Questions

> **Evidence basis:** All transformation documents, gaps identified during analysis
> **Purpose:** Identify everything that cannot be answered from code or audits alone

---

## 1. Questions Requiring Stakeholder Input

### Q-STK-01: Target Customer Segment Priority

**Question:** Should the transformation prioritize SMB retention or enterprise expansion?

**Context:** The current product serves SMBs well. Enterprise features (SSO, audit, RBAC) require significant investment. The roadmap includes both, but sequencing depends on business priority.

**Why it matters:** Determines whether Phase 9 (Settings/Enterprise) runs in parallel with core improvements or after them. If enterprise is the priority, backend work for SSO/RBAC/audit should start immediately.

**Who can answer:** CEO, VP Product, Head of Sales

### Q-STK-02: Mobile Strategy

**Question:** Is mobile a primary platform or a secondary monitoring tool?

**Context:** The current mobile experience is limited — no workspace switching, no Studio, touch targets too small. If mobile is primary, we need bottom navigation, push notifications, and touch-optimized layouts. If secondary, fixing workspace switching and touch targets may suffice.

**Why it matters:** Determines the scope of mobile work in Phase 2 and whether a dedicated mobile experience is needed.

**Who can answer:** VP Product, Head of Design

### Q-STK-03: Content Approval Workflow Priority

**Question:** Do target customers need content approval workflows (draft → review → publish)?

**Context:** This is listed as "Future" in the feature priorities. It requires custom roles (E-003) as a prerequisite. If customers need it, the RBAC implementation in Phase 9 must include approval-specific permissions.

**Why it matters:** Affects RBAC design — if approval workflow is needed, the permission model must support "approve" as a distinct permission from "edit" and "publish."

**Who can answer:** VP Product, Customer Success

### Q-STK-04: Pricing and Plan Structure

**Question:** What are the plan tiers, limits, and pricing?

**Context:** The code references plan limits (screen, storage, member) but the actual plan structure is not visible in the frontend. The billing page exists but has no plan selector. To implement inline upgrade prompts and plan comparison, we need the plan structure.

**Why it matters:** Blocks F-MP-09 (plan selector), F-MP-10 (inline upgrade prompts), and Phase 9 billing tasks.

**Who can answer:** CEO, VP Product, Finance

### Q-STK-05: Geographic Expansion Timeline

**Question:** When does the product expand beyond the GCC region?

**Context:** Timezone-aware scheduling (E-005) is critical for multi-timezone deployments. If expansion is imminent, this becomes higher priority. If GCC-only for the next 12 months, it can be deferred.

**Why it matters:** Affects Phase 8 priority and whether timezone backend work should start immediately.

**Who can answer:** CEO, VP Product

---

## 2. Questions Requiring Product Decisions

### Q-PRD-01: Sidebar Grouping Structure

**Question:** What are the exact group names and item assignments for the restructured sidebar?

**Context:** The transformation proposes 4-5 groups (Dashboard, Content, Insights, Management, Developer) but the exact names and item assignments need product validation.

**Proposed structure:**
```
Dashboard: Overview
Content: Screens, Playlists, Media, Schedules
Insights: Analytics, Notifications
Management: Team, Settings
Developer: API Docs, API Keys
```

**Why it matters:** Blocks Phase 3 implementation. User testing may reveal better groupings.

**Who can answer:** VP Product, Head of Design, UX Researcher

### Q-PRD-02: Studio Integration Model

**Question:** Should Studio remain a separate page (accessed via playlist edit) or become a modal/drawer within the playlist library?

**Context:** The transformation recommends removing Studio from top-level nav. But should it be a full page (current behavior, just accessed differently) or a modal/drawer (more integrated)?

**Why it matters:** Affects Phase 7 implementation. Modal/drawer is more complex but provides a more integrated experience.

**Who can answer:** Head of Design, Staff Frontend Architect

### Q-PRD-03: Branch Repositioning

**Question:** Should branches be removed from navigation entirely (accessible only via URL and screen filter) or remain as a secondary nav item?

**Context:** The transformation recommends demoting branches from top-level. But some users may expect to see branches in the sidebar. Removing entirely is cleaner but may confuse users who look for it.

**Why it matters:** Affects Phase 3 implementation.

**Who can answer:** VP Product, UX Researcher

### Q-PRD-04: Notification Strategy

**Question:** Should the notifications page remain in the sidebar or be removed (bell dropdown only)?

**Context:** Notifications are currently a top-level nav item AND a bell dropdown. The bell dropdown may suffice for most users, making the full page redundant in the sidebar.

**Why it matters:** Affects Phase 3 sidebar grouping.

**Who can answer:** VP Product, UX Researcher

### Q-PRD-05: Onboarding Skip Behavior

**Question:** When a user skips onboarding, should they see it again on next login?

**Context:** Adding a skip button is straightforward, but the persistence of the skip decision needs definition. Options: (a) skip permanently, (b) skip for this session, (c) skip but show "complete onboarding" banner on dashboard.

**Why it matters:** Affects Phase 4 implementation.

**Who can answer:** VP Product, Head of Design

---

## 3. Questions Requiring Business Decisions

### Q-BIZ-01: SSO Provider Priority

**Question:** Which SSO provider should be implemented first?

**Context:** Options include Okta, Azure AD, Google Workspace, or custom SAML. Each has different integration complexity. The Saudi market may favor certain providers.

**Why it matters:** Blocks Phase 9 SSO implementation. Backend team needs to know which provider to integrate first.

**Who can answer:** VP Product, Head of Sales, Enterprise Customers

### Q-BIZ-02: Custom Role Permissions Model

**Question:** What is the permission model for custom roles?

**Context:** Options include: (a) feature-level permissions (can access Screens, can access Playlists), (b) action-level permissions (can view screens, can edit screens, can delete screens), (c) resource-level permissions (can edit screens in Branch A only).

**Why it matters:** Affects RBAC design complexity. Feature-level is simplest, resource-level is most powerful but most complex.

**Who can answer:** VP Product, Enterprise Customers

### Q-BIZ-03: Data Retention Policy

**Question:** What is the data retention policy for audit logs, notifications, and analytics?

**Context:** Audit logs and analytics data can grow indefinitely. A retention policy is needed for compliance and storage management.

**Why it matters:** Affects backend design for audit log and analytics storage.

**Who can answer:** VP Product, Legal, Compliance

### Q-BIZ-04: Invoice and Payment Provider

**Question:** What payment provider is used, and does it support invoice generation?

**Context:** The frontend references billing but the payment provider integration is not visible. To implement invoice download, we need to know if the provider generates PDFs or if we need to generate them.

**Why it matters:** Affects Phase 9 billing implementation.

**Who can answer:** VP Product, Finance

---

## 4. Questions Requiring UX Research

### Q-UX-01: User Mental Model Validation

**Question:** Do users actually think "screens first, branches as filter" or do some users think "branches first, screens within"?

**Context:** The transformation assumes users think of screens as primary. This is based on general digital signage mental models, not user research. Some users (e.g., franchise managers) may think "location first."

**Why it matters:** Validates the IA restructuring direction. If some users think "branches first," the IA may need to support both mental models.

**Method:** Card sorting exercise with 10-15 users.

### Q-UX-02: Sidebar Grouping Validation

**Question:** Do the proposed sidebar groups (Dashboard, Content, Insights, Management, Developer) match user expectations?

**Context:** The grouping is based on feature analysis, not user testing. Users may group features differently.

**Why it matters:** Validates Phase 3 implementation.

**Method:** Card sorting exercise with 10-15 users.

### Q-UX-03: Quick Action Expectations

**Question:** Do users expect quick actions to open dialogs or navigate to pages?

**Context:** The transformation recommends dialogs. But some users may prefer navigation (to see the full page context before acting).

**Why it matters:** Validates Phase 4 implementation.

**Method:** A/B testing or user preference survey.

### Q-UX-04: Mobile Usage Patterns

**Question:** What do users actually do on mobile? Do they try to create content, or only monitor?

**Context:** If mobile is monitoring-only, we don't need Studio on mobile. If users try to create content, we need a mobile content creation experience.

**Why it matters:** Determines mobile strategy scope.

**Method:** Analytics review + user interviews.

### Q-UX-05: Template Demand

**Question:** What templates do users want? Industry-specific (retail, restaurant, corporate) or format-specific (full-screen image, split-screen, text overlay)?

**Context:** Template library design depends on user needs. Without research, we're guessing.

**Why it matters:** Affects Phase 7 template library design.

**Method:** User survey + content analysis of existing playlists.

---

## 5. Questions Requiring User Interviews

### Q-INT-01: Workspace Switching Behavior

**Question:** How often do users switch workspaces? What triggers a switch?

**Context:** The transformation assumes workspace switching is common for multi-workspace users. But we don't know the frequency or triggers.

**Method:** Interview 5-10 multi-workspace users.

### Q-INT-02: Schedule Creation Complexity

**Question:** Which schedule fields do users actually use? Are there fields they never touch?

**Context:** The schedule form has many fields. Progressive disclosure design depends on knowing which fields are commonly used vs. rarely used.

**Method:** Interview 5-10 users who create schedules regularly.

### Q-INT-03: Content Publishing Confidence

**Question:** After publishing, how do users verify content is playing? Do they physically check screens?

**Context:** The transformation recommends publish confirmation and proof-of-play. But users may have their own verification methods.

**Method:** Interview 5-10 users after they publish content.

### Q-INT-04: Team Management Needs

**Question:** What team management operations do users actually need? Is role change critical or nice-to-have?

**Context:** The transformation recommends role change, member removal, cancel/resend. But we don't know which are most needed.

**Method:** Interview 5-10 workspace owners with team members.

---

## 6. Questions Requiring Analytics

### Q-ANA-01: Feature Usage Frequency

**Question:** Which features are used daily vs. weekly vs. monthly vs. rarely?

**Context:** The screen and feature priorities are based on assumptions about usage frequency. Analytics data would validate or correct these assumptions.

**Method:** Review analytics data for feature usage (if analytics are implemented).

### Q-ANA-02: Navigation Patterns

**Question:** How do users actually navigate? Do they use the sidebar, search, quick actions, or bookmarks?

**Context:** The transformation focuses on sidebar restructuring. But if users primarily use search or quick actions, sidebar changes may have less impact.

**Method:** Review navigation analytics (click tracking on sidebar items, search usage, quick action usage).

### Q-ANA-03: Error Frequency

**Question:** How often do users encounter errors? Which errors are most common?

**Context:** The transformation addresses error prevention and recovery. Analytics on error frequency would help prioritize.

**Method:** Review error tracking data (Sentry, API error logs).

### Q-ANA-04: Session Duration and Depth

**Question:** How long are user sessions? How many pages do they visit per session?

**Context:** Long sessions with many page visits suggest users are power users who benefit from efficiency improvements. Short sessions suggest monitoring-only usage.

**Method:** Review session analytics.

### Q-ANA-05: Mobile vs. Desktop Usage

**Question:** What percentage of usage is mobile? What do mobile users do vs. desktop users?

**Context:** Determines mobile investment priority.

**Method:** Review device analytics.

---

## 7. Questions Requiring Technical Investigation

### Q-TEC-01: Backend API Capabilities

**Question:** Which of the required backend changes (SSO, RBAC, audit, bulk, timezone, multi-upload, versioning, export) are feasible within the transformation timeline?

**Context:** The frontend roadmap depends on backend APIs. If some backend changes take longer, frontend phases may need resequencing.

**Method:** Technical spike on each backend requirement.

### Q-TEC-02: Konva Performance with Large Playlists

**Question:** How does Konva perform with 50+ elements on canvas? Is there a performance ceiling?

**Context:** If users create complex playlists, the canvas editor may slow down. This affects whether we need to optimize Konva or limit element count.

**Method:** Performance test with 50, 100, 200 elements.

### Q-TEC-03: SWR Cache Memory

**Question:** How much memory does SWR consume with many cached keys? Is there a cache eviction strategy?

**Context:** If users navigate extensively, SWR cache grows. This may cause memory issues on low-end devices.

**Method:** Memory profiling during extended usage.

### Q-TEC-04: Socket.IO Connection Scaling

**Question:** How many concurrent Socket.IO connections can the backend handle? Is there a connection limit per user?

**Context:** If users have many tabs open or if the platform scales to many users, Socket.IO connections may hit limits.

**Method:** Load testing with concurrent connections.

---

## 8. Question Priority Summary

| Category | Count | Blocking? | Action |
|----------|-------|-----------|--------|
| Stakeholder input | 5 | Yes — blocks Phase 9 and mobile scope | Schedule stakeholder meeting |
| Product decisions | 5 | Yes — blocks Phase 3 and 4 | Product team review |
| Business decisions | 4 | Yes — blocks Phase 9 | Executive review |
| UX research | 5 | Recommended — validates assumptions | Schedule research sessions |
| User interviews | 4 | Recommended — informs design | Schedule interviews |
| Analytics | 5 | Recommended — validates priorities | Review analytics data |
| Technical investigation | 4 | Yes — blocks backend-dependent phases | Technical spikes |

**Immediate action required:** Stakeholder and product decision questions should be resolved before Phase 3 begins. Business decisions should be resolved before Phase 9 begins. Technical investigations should start in Phase 0.

---

## Cross-References

- See `19-redesign-roadmap.md` for roadmap phases
- See `20-implementation-phases.md` for phase execution plans
- See `13-enterprise-saas-review.md` for enterprise context
- See `04-information-architecture-review.md` for IA context
