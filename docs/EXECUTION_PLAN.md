# Cloud-Screen — خطة التنفيذ الكاملة لسد الفجوات

> **تاريخ الإنشاء:** 13 يوليو 2026  
> **المرجع:** ORCA-CLOUDSCREEN-main (دوسيه ORCA على Desktop)  
> **الهدف:** سد جميع الفجوات في رحلة العميل بشكل احترافي ومنظم  
> **القاعدة:** من الأسهل للأصعب، كل مرحلة لها تاسكات واضحة، testing بعد كل تعديل  
> **الاستثناء:** اللاندنج بيدج والابلكيشن خارج هذه الخطة تماماً (مرحلة منفصلة لاحقاً)

---

## جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المرحلة 1: إصلاحات UX سريعة (Quick Wins)](#المرحلة-1-إصلاحات-ux-سريعة-quick-wins)
- [المرحلة 2: إدارة الفريق والصلاحيات](#المرحلة-2-إدارة-الفريق-والصلاحيات)
- [المرحلة 3: تحسينات الشاشات والعرض](#المرحلة-3-تحسينات-الشاشات-والعرض)
- [المرحلة 4: تحسينات المحتوى والقوالب](#المرحلة-4-تحسينات-المحتوى-والقوالب)
- [المرحلة 5: تحسينات الجدولة والـ Campaigns](#المرحلة-5-تحسينات-الجدولة-والـ-campaigns)
- [المرحلة 6: تحسينات الـ AI والـ Analytics](#المرحلة-6-تحسينات-الـ-ai-والـ-analytics)
- [المرحلة 7: تحسينات الـ Billing والـ API](#المرحلة-7-تحسينات-الـ-billing-والـ-api)
- [المرحلة 8: تحسينات الـ Onboarding المتقدمة](#المرحلة-8-تحسينات-الـ-onboarding-المتقدمة)
- [المرحلة 9: ميزات السوق العربي الفريدة](#المرحلة-9-ميزات-السوق-العربي-الفريدة)
- [المرحلة 10: ميزات تقنية متقدمة](#المرحلة-10-ميزات-تقنية-متقدمة)
- [المرحلة 11: اللاندنج بيدج والابلكيشن (منفصلة)](#المرحلة-11-اللاندنج-بيدج-والابلكيشن-منفصلة)
- [سجل الإنجاز](#سجل-الإنجاز)

---

## نظرة عامة

### المعطيات الحالية

**Backend (موجود وشغال):**
- Auth (register, login, refresh, logout, invite, accept invite)
- Workspaces (create, update, delete, members, invites, roles, pairing)
- Screens (CRUD, remote-command, override, analytics, active-content)
- Playlists (CRUD, items, duplicate, clone-to-workspace)
- Schedules (CRUD, overlaps)
- Media (upload, list, folders, stats, move)
- Canvases (Studio)
- Subscriptions (current, mock-plan)
- Notifications (list, mark-read, mark-all-read)
- Account (profile, email change, billing, insights)
- Admin (customers, workspaces, fleet, staff, stats, logs, settings)
- Audit Log, Webhooks (Stripe)

**Dashboard (موجود وشغال):**
- 28+ صفحة في الـ sidebar (overview, screens, displays, media, content, studio, display groups, templates, team, playlists, campaigns, schedules, proof-of-play, analytics, AI, emergency, billing, settings, notifications, audit-log, api-docs, help)
- صفحات admin كاملة
- Auth pages (login, register, forgot-password, invite)
- i18n (EN + AR) مع RTL

### ما هو ناقص (مقارنة بـ ORCA)

الـ backend قوي جداً لكن في فجوات في الـ UI وميزات معينة. الخطة أدناه مرتبة من الأسهل للأصعب.

---

## المرحلة 1: إصلاحات UX سريعة (Quick Wins)

> **المدة المقدرة:** 3-5 ساعات  
> **الصعوبة:** سهلة  
> **الهدف:** إصلاحات UI سريعة بدون تغييرات في الـ backend

### تاسك 1.1: In-app Notifications Bell في الـ Header
- **الملفات:** `shell-header.tsx` أو `shell-sidebar.tsx`
- **الوصف:** إضافة bell icon في الـ header يعرض unread count + dropdown بآخر الإشعارات
- **الـ API:** موجود (`GET /notifications` بيرجع `unreadCount`)
- **الاختبار:**
  - [ ] الـ bell يظهر في الـ header
  - [ ] unread count صحيح
  - [ ] dropdown يعرض آخر 5 إشعارات
  - [ ] "Mark all read" يشتغل
  - [ ] RTL صحيح

### تاسك 1.2: Override Duration Customization
- **الملفات:** `schedules-client.tsx` أو `emergency-client.tsx`
- **الوصف:** استبدال المدة الثابتة (480 دقيقة) بـ dropdown (30min, 1h, 4h, 8h, 24h, custom)
- **الـ API:** موجود (`POST /screens/:id/override`)
- **الاختبار:**
  - [ ] dropdown يعرض كل الخيارات
  - [ ] custom يفتح input للأرقام
  - [ ] القيمة بتتبعت صح للـ backend
  - [ ] الترجمات موجودة (EN + AR)

### تاسك 1.3: Campaign Display Selection (Dropdown بدل Text Input)
- **الملفات:** `campaigns-client.tsx`
- **الوصف:** استبدال text input بـ dropdown لاختيار playlist
- **الـ API:** موجود (`GET /playlists?workspaceId=...`)
- **الاختبار:**
  - [ ] dropdown يعرض كل playlists
  - [ ] اختيار playlist يحدد القيمة صح
  - [ ] RTL صحيح

### تاسك 1.4: Schedule Display Group Selection
- **الملفات:** `schedules-client.tsx`
- **الوصف:** إضافة dropdown لاختيار screen (بدل ما يكون playlist فقط)
- **الـ API:** موجود (`GET /screens?workspaceId=...` + `Schedule.screenId`)
- **الاختبار:**
  - [ ] dropdown يعرض كل screens
  - [ ] "All screens" option موجود
  - [ ] اختيار screen يحدد القيمة صح

### تاسك 1.5: Loading/Error Boundaries
- **الملفات:** `loading.tsx` و `error.tsx` في `(shell)` group
- **الوصف:** إضافة Next.js loading + error boundaries لكل الصفحات
- **الاختبار:**
  - [ ] loading skeleton يظهر أثناء التحميل
  - [ ] error page تظهر عند الفشل مع retry button

### تاسك 1.6: 404/Error Pages
- **الملفات:** `not-found.tsx` و `error.tsx` في root
- **الوصف:** صفحات 404 و error مخصصة بـ ORCA styling
- **الاختبار:**
  - [ ] 404 page تظهر عند URL غير صحيح
  - [ ] error page تظهر عند runtime error
  - [ ] زر "Go Home" يشتغل

---

## المرحلة 2: إدارة الفريق والصلاحيات

> **المدة المقدرة:** 4-6 ساعات  
> **الصعوبة:** سهلة-متوسطة  
> **الهدف:** إكمال إدارة الفريق (change role + remove member + cancel invite)

### تاسك 2.1: Team Role Change UI
- **الملفات:** `team-client.tsx`
- **الوصف:** إضافة dropdown لتغيير دور عضو (OWNER, ADMIN, EDITOR, VIEWER)
- **الـ API:** موجود (`PATCH /workspaces/:workspaceId/members/:membershipId/role`)
- **الاختبار:**
  - [ ] dropdown يعرض كل الأدوار
  - [ ] تغيير الدور يرسل request صح
  - [ ] toast confirmation يظهر
  - [ ] OWNER لا يمكن تغيير دوره

### تاسك 2.2: Team Member Removal UI
- **الملفات:** `team-client.tsx`
- **الوصف:** إضافة زر "Remove" مع confirmation dialog
- **الـ API:** موجود (`DELETE /workspaces/:workspaceId/members/:membershipId`)
- **الاختبار:**
  - [ ] زر Remove يظهر لكل عضو (عدا OWNER)
  - [ ] confirmation dialog يظهر
  - [ ] العضو يتم إزالته بنجاح
  - [ ] toast confirmation

### تاسك 2.3: Cancel/Resend Invitation UI
- **الملفات:** `team-client.tsx`
- **الوصف:** إضافة أزرار Cancel + Resend للدعوات المعلقة
- **الـ API:** موجود (`DELETE /workspaces/:workspaceId/invites/:inviteId` + `POST /workspaces/:workspaceId/invites/:inviteId/resend`)
- **الاختبار:**
  - [ ] زر Cancel يظهر للدعوات PENDING
  - [ ] زر Resend يظهر للدعوات PENDING
  - [ ] Cancel يحذف الدعوة
  - [ ] Resend يرسل إيميل جديد
  - [ ] toast confirmation

### تاسك 2.4: Notification Preferences UI
- **الملفات:** `settings/notifications-client.tsx` (جديد)
- **الوصف:** صفحة preferences للإشعارات (email, push, in-app) لكل نوع حدث
- **الـ API:** يحتاج إضافة endpoint (`GET/PATCH /notifications/preferences`)
- **Backend task:** إضافة `NotificationPreferences` model + controller
- **الاختبار:**
  - [ ] toggles لكل نوع إشعار
  - [ ] save يخزن في الـ backend
  - [ ] load يقرأ من الـ backend
  - [ ] RTL صحيح

---

## المرحلة 3: تحسينات الشاشات والعرض

> **المدة المقدرة:** 6-8 ساعات  
> **الصعوبة:** متوسطة  
> **الهدف:** تحسين إدارة الشاشات وإضافة ميزات missing

### تاسك 3.1: Bulk Screen Actions
- **الملفات:** `screens-client.tsx`, `displays-client.tsx`
- **الوصف:** checkboxes لاختيار شاشات متعددة + bulk actions (delete, assign playlist, restart)
- **الـ API:** موجود لكل عملية على حدة، يحتاج batch endpoint أو loop
- **الاختبار:**
  - [ ] checkbox لكل شاشة + select-all
  - [ ] bulk delete مع confirmation
  - [ ] bulk assign playlist
  - [ ] counter يعرض عدد المختارين
  - [ ] RTL صحيح

### تاسك 3.2: Storage + Screen Limit Indicators
- **الملفات:** `overview-client.tsx` أو `billing-client.tsx`
- **الوصف:** progress bars لـ: screens used vs limit, storage used vs limit
- **الـ API:** موجود (`GET /subscriptions/current` + `GET /media/stats`)
- **الاختبار:**
  - [ ] progress bar للشاشات (X / Y)
  - [ ] progress bar للتخزين (X GB / Y GB)
  - [ ] لون يتغير عند الاقتراب من الحد
  - [ ] tooltip يعرض التفاصيل

### تاسك 3.3: Screen Detail Page Enhancement
- **الملفات:** `screen-detail-client.tsx`
- **الوصف:** إضافة: remote commands panel, command history, health metrics
- **الـ API:** موجود (`POST /screens/:id/remote-command`, `GET /screens/:id/active-content`, `GET /screens/analytics`)
- **الاختبار:**
  - [ ] remote commands panel (reload, restart, identify)
  - [ ] command history يعرض آخر 10 أوامر
  - [ ] health metrics (status, last seen, uptime)
  - [ ] active content display
  - [ ] RTL صحيح

### تاسك 3.4: Display Groups Hierarchical Support
- **الملفات:** `display-groups-client.tsx`
- **الوصف:** إضافة parent/child groups (hierarchical)
- **الـ API:** يحتاج إضافة `parentGroupId` في schema + controller
- **Backend task:** إضافة `parentGroupId` field + endpoints
- **الاختبار:**
  - [ ] إنشاء group داخل group
  - [ ] عرض tree view
  - [ ] نقل group لـ parent آخر
  - [ ] حذف group يحذف children

---

## المرحلة 4: تحسينات المحتوى والقوالب

> **المدة المقدرة:** 8-10 ساعات  
> **الصعوبة:** متوسطة  
> **الهدف:** إكمال نظام القوالب والمحتوى

### تاسك 4.1: Content Templates حقيقية (Pre-built)
- **الملفات:** `templates-client.tsx` (rewrite)
- **الوصف:** 8 قوالب جاهزة (fullscreen, split-screen, social-wall, menu-board, announcement, promo, weather, news) مع preview + one-click create
- **الـ API:** استخدام `POST /canvases` لإنشاء canvas من template
- **الاختبار:**
  - [ ] 8 قوالب مع thumbnail preview
  - [ ] category filter (business, retail, food, etc.)
  - [ ] one-click create يفتح Studio بـ template جاهز
  - [ ] search في القوالب
  - [ ] RTL صحيح

### تاسك 4.2: Content Auto-Expiry
- **الملفات:** `media/content-client.tsx`
- **الوصف:** إضافة expiry date picker لكل content item + visual indicator (expired/active/expiring soon)
- **الـ API:** يحتاج إضافة `expiresAt` field في Media model
- **Backend task:** إضافة `expiresAt DateTime?` في Media + filter في list
- **الاختبار:**
  - [ ] date picker ل expiry
  - [ ] badge "Expired" بالأحمر
  - [ ] badge "Expiring Soon" بالأصفر
  - [ ] filter: active / expired / all
  - [ ] auto-hide expired content من الـ playlist

### تاسك 4.3: Playlist Preview Mode
- **الملفات:** `playlists/playlist-editor-client.tsx`
- **الوصف:** زر "Preview" يفتح modal يعرض الـ playlist كأنه على شاشة (sequential playback)
- **الاختبار:**
  - [ ] preview button في playlist editor
  - [ ] modal يعرض items بالترتيب مع durations
  - [ ] transitions تعمل (fade, slide, zoom)
  - [ ] play/pause/next/prev controls
  - [ ] RTL صحيح

### تاسك 4.4: Multi-file Upload
- **الملفات:** `media/media-client.tsx`
- **الوصف:** رفع أكثر من ملف في نفس الوقت (drag & drop multiple)
- **الـ API:** يحتاج تعديل لـ accept array of files أو loop
- **الاختبار:**
  - [ ] drag & drop متعدد
  - [ ] progress bar لكل ملف
  - [ ] success/error state لكل ملف
  - [ ] total progress indicator

### تاسك 4.5: Content Version History
- **الملفات:** `media/content-client.tsx` أو `studio/`
- **الوصف:** عرض history لكل canvas مع ability لاستعادة نسخة سابقة
- **الـ API:** يحتاج إضافة `CanvasVersion` model + endpoints
- **Backend task:** إضافة CanvasVersion model + `GET /canvases/:id/versions` + `POST /canvases/:id/restore/:versionId`
- **الاختبار:**
  - [ ] history panel يعرض كل النسخ
  - [ ] كل نسخة لها timestamp + user
  - [ ] restore يرجع لنسخة سابقة
  - [ ] diff view (optional)

---

## المرحلة 5: تحسينات الجدولة والـ Campaigns

> **المدة المقدرة:** 8-10 ساعات  
> **الصعوبة:** متوسطة-عالية  
> **الهدف:** إكمال نظام الجدولة والـ campaigns

### تاسك 5.1: Campaign Approval Workflow UI
- **الملفات:** `campaigns-client.tsx` (rewrite)
- **الوصف:** lifecycle كامل: draft → submit → approve/reject → publish → pause/resume → end مع status badges + actions لكل state
- **الـ API:** يحتاج إضافة Campaign model + endpoints (submit, approve, reject, publish, pause, resume, end)
- **Backend task:** إضافة `Campaign` model مع status enum + controller endpoints
- **الاختبار:**
  - [ ] status badge لكل state
  - [ ] actions تظهر حسب الـ state
  - [ ] submit يرسل للـ approval
  - [ ] approve/reject مع optional comment
  - [ ] publish يفعّل الـ campaign
  - [ ] pause/resume
  - [ ] end ينهي الـ campaign
  - [ ] history log لكل تغيير state
  - [ ] RTL صحيح

### تاسك 5.2: Schedule Calendar View (Week/Month)
- **الملفات:** `schedules-client.tsx`
- **الوصف:** weekly calendar مع color-coded priority + toggle بين calendar و list views
- **الـ API:** موجود (`GET /schedules?workspaceId=...`)
- **الاختبار:**
  - [ ] week view يعرض 7 أيام
  - [ ] schedules تظهر كـ blocks في الوقت الصحيح
  - [ ] color-coded حسب priority
  - [ ] click على schedule يفتح edit
  - [ ] toggle بين calendar و list
  - [ ] RTL صحيح (الأحد → السبت في RTL)

### تاسك 5.3: Schedule Overlaps Visualization
- **الملفات:** `schedules-client.tsx`
- **الوصف:** عرض overlaps بين schedules مع warning indicator
- **الـ API:** موجود (`GET /schedules/overlaps?workspaceId=...`)
- **الاختبار:**
  - [ ] overlaps تظهر بـ warning icon
  - [ ] tooltip يعرض تفاصيل الـ overlap
  - [ ] list view يعرض overlaps في الأعلى

### تاسك 5.4: Nested Playlists Support
- **الملفات:** `playlists/playlist-editor-client.tsx`
- **الوصف:** إضافة playlist كـ item داخل playlist أخرى
- **الـ API:** يحتاج تعديل `PlaylistItem` لـ accept `playlistId` بدلاً من `mediaId` فقط
- **Backend task:** إضافة `playlistId` field في PlaylistItem
- **الاختبار:**
  - [ ] dropdown "Add Playlist" في الـ editor
  - [ ] nested playlist تظهر كـ item
  - [ ] preview يعرض محتوى الـ nested playlist
  - [ ] منع self-reference

---

## المرحلة 6: تحسينات الـ AI والـ Analytics

> **المدة المقدرة:** 10-12 ساعة  
> **الصعوبة:** عالية  
> **الهدف:** ربط الـ AI بـ backend حقيقي + تحسين الـ analytics

### تاسك 6.1: AI Content Generation حقيقي (بدل Mock)
- **الملفات:** `ai-tools-client.tsx` (rewrite)
- **الوصف:** ربط بـ AI service حقيقي (OpenAI/Anthropic) لتوليد: headlines, body text, CTAs, color schemes, image generation
- **الـ API:** يحتاج إضافة `AI module` في backend (proxy لـ OpenAI/Anthropic)
- **Backend task:** إضافة `ai.controller.ts` + `ai.service.ts` مع rate limiting + cost tracking
- **الاختبار:**
  - [ ] generate headline يرسل request حقيقي
  - [ ] generate body text
  - [ ] generate CTA
  - [ ] generate color scheme
  - [ ] usage stats تعرض tokens used
  - [ ] rate limiting يشتغل
  - [ ] error handling (API key missing, quota exceeded)
  - [ ] Arabic content generation
  - [ ] RTL صحيح

### تاسك 6.2: AI Suggestion History
- **الملفات:** `ai-tools-client.tsx`
- **الوصف:** حفظ وعرض history لكل suggestions
- **الـ API:** يحتاج `AIRequest` model + `GET /ai/history`
- **Backend task:** إضافة `AIRequest` model
- **الاختبار:**
  - [ ] history panel يعرض آخر 20 suggestions
  - [ ] click على suggestion يعرض التفاصيل
  - [ ] copy to clipboard
  - [ ] use in Studio (send to canvas)

### تاسك 6.3: Proof-of-Play Reports Enhancement
- **الملفات:** `proof-of-play-client.tsx`
- **الوصف:** summary cards (total plays, duration, unique content/displays) + filters (display, date range) + detailed records table + CSV export
- **الـ API:** يحتاج إضافة `ProofOfPlay` model + endpoints
- **Backend task:** إضافة `ProofOfPlay` model + `GET /proof-of-play/summary` + `GET /proof-of-play/records`
- **الاختبار:**
  - [ ] summary cards تعرض أرقام صحيحة
  - [ ] filters تعمل (display, date range)
  - [ ] table مع pagination
  - [ ] CSV export يحمّل ملف
  - [ ] RTL صحيح

### تاسك 6.4: Device Metrics Charts
- **الملفات:** `analytics-page-client.tsx` و `screen-detail-client.tsx`
- **الوصف:** charts لـ: uptime, heartbeat history, CPU/memory (إن توفر), status over time
- **الـ API:** يحتاج إضافة `DeviceMetric` model + `GET /screens/:id/metrics`
- **Backend task:** إضافة `DeviceMetric` model (TimescaleDB hypertable)
- **الاختبار:**
  - [ ] line chart لـ uptime %
  - [ ] timeline لـ status changes
  - [ ] date range selector
  - [ ] real-time update (optional)

### تاسك 6.5: Crash Reports UI
- **الملفات:** `screen-detail-client.tsx` أو صفحة جديدة
- **الوصف:** عرض crash reports + stack trace + recovery actions
- **الـ API:** يحتاج إضافة `CrashReport` model + endpoints
- **Backend task:** إضافة `CrashReport` model + `POST /screens/:id/crashes` + `GET /screens/:id/crashes`
- **الاختبار:**
  - [ ] crash list مع timestamp + severity
  - [ ] click يعرض stack trace
  - [ ] filter by severity
  - [ ] "Mark as resolved" action

---

## المرحلة 7: تحسينات الـ Billing والـ API

> **المدة المقدرة:** 6-8 ساعات  
> **الصعوبة:** متوسطة  
> **الهدف:** إكمال نظام الـ billing والـ API management

### تاسك 7.1: Plan Selection UI
- **الملفات:** `billing-client.tsx` أو صفحة جديدة `plans-client.tsx`
- **الوصف:** صفحة plans تعرض: Free, Starter, Pro, Enterprise مع comparison table + upgrade/downgrade
- **الـ API:** موجود (`GET /subscriptions/current` + `PATCH /subscriptions/mock-plan`)
- **الاختبار:**
  - [ ] 4 tiers مع features comparison
  - [ ] current plan highlighted
  - [ ] upgrade/downgrade buttons
  - [ ] confirmation dialog
  - [ ] RTL صحيح

### تاسك 7.2: Invoice PDF Download
- **الملفات:** `billing-client.tsx`
- **الوصف:** زر download لكل invoice يفتح PDF في tab جديد
- **الـ API:** يحتاج إضافة `GET /billing/invoices/:id/pdf` endpoint
- **Backend task:** إضافة invoice PDF generation (Stripe invoice PDF URL)
- **الاختبار:**
  - [ ] download button لكل invoice
  - [ ] PDF يفتح في tab جديد
  - [ ] error handling لو PDF مش متاح

### تاسك 7.3: API Keys Management UI
- **الملفات:** `api-docs-client.tsx` (expand) أو صفحة جديدة
- **الوصف:** create/list/revoke API keys مع scopes + rate limit display
- **الـ API:** يحتاج إضافة `ApiKey` model + endpoints
- **Backend task:** إضافة `ApiKey` model + controller
- **الاختبار:**
  - [ ] create API key مع name + scopes
  - [ ] list all keys
  - [ ] revoke key مع confirmation
  - [ ] copy key to clipboard (مرة واحدة فقط)
  - [ ] rate limit display per key

### تاسك 7.4: Webhooks Management UI (Customer-facing)
- **الملفات:** صفحة جديدة `webhooks-client.tsx`
- **الوصف:** create/list/delete webhooks + test webhook
- **الـ API:** يحتاج إضافة customer webhook endpoints (مش Stripe webhooks)
- **Backend task:** إضافة `Webhook` model + controller (customer-facing)
- **الاختبار:**
  - [ ] create webhook مع URL + events
  - [ ] list webhooks
  - [ ] delete webhook
  - [ ] test webhook (send test payload)
  - [ ] delivery history (optional)

---

## المرحلة 8: تحسينات الـ Onboarding المتقدمة

> **المدة المقدرة:** 8-10 ساعات  
> **الصعوبة:** عالية  
> **الهدف:** onboarding wizard متقدم بـ 8 خطوات + progress tracking

### تاسك 8.1: Onboarding Progress Tracking
- **الملفات:** `onboarding-wizard.tsx` (rewrite)
- **الوصف:** تتبع 8 خطوات: signup → tenant_setup → first_display → first_content → first_playlist → first_campaign → first_publish → complete
- **الـ API:** يحتاج إضافة `onboardingProgress` JSONB field في Workspace
- **Backend task:** إضافة `onboardingProgress` field + `PATCH /workspaces/:id/onboarding`
- **الاختبار:**
  - [ ] progress bar في الـ header أثناء الـ onboarding
  - [ ] checklist مع checkmarks
  - [ ] "Skip for now" لكل خطوة
  - [ ] resume من حيث توقف
  - [ ] progress يختفي بعد الاكتمال

### تاسك 8.2: Guided Onboarding Steps
- **الملفات:** `onboarding-wizard.tsx`
- **الوصف:** كل خطوة ترشد المستخدم: Tenant Setup (name, language, timezone, branding) → Add Display (pairing) → Create Content (upload or template) → Create Playlist → Create Campaign → Publish
- **الاختبار:**
  - [ ] Step 1: Tenant setup (pre-filled name, language dropdown, timezone auto)
  - [ ] Step 2: Add Display (pairing code flow)
  - [ ] Step 3: Create Content (upload or pick template)
  - [ ] Step 4: Create Playlist (auto-created with content)
  - [ ] Step 5: Create Campaign (link playlist + display)
  - [ ] Step 6: Publish (big green button)
  - [ ] Step 7: Celebration (confetti + next steps)
  - [ ] كل خطوة لها "Skip for now"

### تاسك 8.3: Contextual Help Tooltips
- **الملفات:** component جديد `contextual-tooltip.tsx`
- **الوصف:** tooltips تظهر تلقائياً لأول مرة في كل صفحة (CMS, Scheduling, Device, Campaign)
- **الاختبار:**
  - [ ] tooltip يظهر مرة واحدة فقط (localStorage flag)
  - [ ] dismiss button
  - [ ] "Don't show again" option
  - [ ] RTL صحيح

### تاسك 8.4: Onboarding Emails
- **الملفات:** backend email service
- **الوصف:** إرسال إيميلات عند day 1, 3, 7 بعد التسجيل
- **الـ API:** يحتاج cron job في backend + email templates
- **الاختبار:**
  - [ ] email يُرسل في day 1 (welcome)
  - [ ] email يُرسل في day 3 (tips)
  - [ ] email يُرسل في day 7 (advanced features)
  - [ ] unsubscribe link

---

## المرحلة 9: ميزات السوق العربي الفريدة

> **المدة المقدرة:** 10-12 ساعة  
> **الصعوبة:** عالية  
> **الهدف:** ميزات فريدة للسوق العربي (ميزات تنافسية لا يوجد لها منافس)

### تاسك 9.1: Prayer Times Widget
- **الملفات:** player app + dashboard widget settings
- **الوصف:** widget في الـ player يعرض أوقات الصلاة تلقائياً (بناءً على الموقع)
- **الـ API:** يحتاج إضافة prayer times API integration (Aladhan API أو حساب محلي)
- **Backend task:** إضافة prayer times endpoint + widget config
- **الاختبار:**
  - [ ] widget يعرض أوقات الصلاة الـ 5
  - [ ] تحديث تلقائي كل يوم
  - [ ] يحدد الموقع تلقائياً أو يدوي
  - [ ] countdown للصلاة القادمة
  - [ ] RTL صحيح

### تاسك 9.2: Hijri Calendar Widget
- **الملفات:** player app + dashboard widget settings
- **الوصف:** widget يعرض التاريخ الهجري بجانب الميلادي
- **الاختبار:**
  - [ ] widget يعرض التاريخ الهجري
  - [ ] تحديث تلقائي
  - [ ] format options (day, month, year)
  - [ ] RTL صحيح

### تاسك 9.3: Prayer Time Scheduling
- **الملفات:** `schedules-client.tsx`
- **الوصف:** جدولة المحتوى حول أوقات الصلاة (auto-pause during prayer, show Islamic content)
- **الـ API:** يحتاج إضافة prayer-based schedule type
- **الاختبار:**
  - [ ] "Prayer Schedule" option في schedule creation
  - [ ] auto-pause قبل/أثناء الصلاة
  - [ ] auto-resume بعد الصلاة
  - [ ] selectable prayer times (all or specific)

### تاسك 9.4: Ramadan Mode
- **الملفات:** dashboard settings + player
- **الوصف:** وضع خاص لرمضان يغيّر المحتوى تلقائياً (Iftar/Suhoor times, Ramadan playlists)
- **الاختبار:**
  - [ ] toggle "Ramadan Mode" في settings
  - [ ] auto-switch playlists during Ramadan
  - [ ] Iftar/Suhoor time awareness
  - [ ] auto-deactivate after Ramadan

---

## المرحلة 10: ميزات تقنية متقدمة

> **المدة المقدرة:** 12-15 ساعة  
> **الصعوبة:** عالية جداً  
> **الهدف:** ميزات متقدمة للتميز عالمياً

### تاسك 10.1: Global Search (Cmd+K)
- **الملفات:** component جديد `global-search.tsx`
- **الوصف:** search across screens, playlists, media, schedules, campaigns
- **الـ API:** يحتاج إضافة search endpoint أو client-side filtering
- **الاختبار:**
  - [ ] Cmd+K يفتح search overlay
  - [ ] results من كل entities
  - [ ] keyboard navigation
  - [ ] click result ينتقل للصفحة
  - [ ] recent searches

### تاسك 10.2: Live Screenshot من الشاشة
- **الملفات:** `screen-detail-client.tsx` + player app
- **الوصف:** التقاط screenshot من الـ player وعرضه في الـ dashboard
- **الـ API:** يحتاج إضافة `POST /screens/:id/screenshot` + player support
- **الاختبار:**
  - [ ] "Take Screenshot" button
  - [ ] screenshot يظهر في الـ dashboard
  - [ ] timestamp على الـ screenshot
  - [ ] fullscreen view

### تاسك 10.3: Map View للشاشات
- **الملفات:** صفحة جديدة `map-view-client.tsx`
- **الوصف:** عرض الشاشات على خريطة بناءً على location
- **الـ API:** موجود (`Screen.location` field)
- **الاختبار:**
  - [ ] خريطة تعرض كل الشاشات
  - [ ] markers مع status colors
  - [ ] click marker يعرض details
  - [ ] filter by status

### تاسك 10.4: OTA Updates UI
- **الملفات:** صفحة جديدة `ota-client.tsx` أو في admin
- **الوصف:** إدارة player versions + push updates
- **الـ API:** يحتاج إضافة `PlayerVersion` model + endpoints
- **الاختبار:**
  - [ ] list player versions
  - [ ] upload new version
  - [ ] push update لـ screen محددة
  - [ ] rollback to previous version

### تاسك 10.5: Multi-zone Layouts UI في Studio
- **الملفات:** `studio/` components
- **الوصف:** split screen (2-zone, 3-zone, 4-zone) مع content لكل zone
- **الاختبار:**
  - [ ] zone layout picker (fullscreen, 2-split, 3-split, 4-grid)
  - [ ] drag content لكل zone
  - [ ] zone-specific durations
  - [ ] preview mode

### تاسك 10.6: 2FA/MFA
- **الملفات:** `settings/profile-client.tsx` + auth
- **الوصف:** TOTP-based 2FA + backup codes
- **الـ API:** يحتاج إضافة 2FA endpoints (enable, verify, disable)
- **الاختبار:**
  - [ ] setup 2FA (QR code)
  - [ ] verify with TOTP code
  - [ ] backup codes
  - [ ] disable 2FA with password
  - [ ] login flow with 2FA

---

## المرحلة 11: اللاندنج بيدج والابلكيشن (منفصلة)

> **ملاحظة:** هذه المرحلة سيتم العمل عليها بشكل منفرد تماماً بعد اكتمال كل المراحل السابقة  
> **المدة المقدرة:** 15-20 ساعة  
> **الصعوبة:** عالية  
> **الهدف:** landing page احترافي + player app enhancements

### تاسك 11.1: 3D Landing Page (Three.js)
- hero section بـ 3D animations
- features section
- pricing table (4 tiers)
- testimonials carousel
- CTA + footer
- SEO + OG tags
- mobile responsive

### تاسك 11.2: Android Player (Capacitor)
- wrap player-app بـ Capacitor
- wake lock + boot startup + kiosk mode
- offline cache
- APK build

### تاسك 11.3: Player App Enhancements
- video wall sync
- player ticker UI من dashboard
- offline crash storage
- watchdog

---

## سجل الإنجاز

> يتم تحديث هذا القسم بعد إكمال كل تاسك مع توثيق الـ testing

### تاسكات مكتملة

**Phase 7: Billing & API — Completed 2025-01-30**

- **Task 7.1: Plan Selection UI Enhancement**
  - Files: `apps/dashboard/src/features/billing/billing-client.tsx`, `apps/dashboard/src/i18n/messages/en.json`, `apps/dashboard/src/i18n/messages/ar.json`
  - Added feature comparison table (9 rows × 4 plans) with check/minus icons
  - EN + AR translations added
  - Testing: Built successfully, dashboard running on localhost:3000

- **Task 7.2: Invoice PDF Download**
  - Files: `apps/backend/src/domains/account/account.service.ts`, `apps/backend/src/domains/account/account.controller.ts`, `apps/dashboard/src/features/billing/billing-api.ts`, `apps/dashboard/src/features/settings/settings-billing-client.tsx`, `apps/dashboard/src/i18n/messages/en.json`, `apps/dashboard/src/i18n/messages/ar.json`
  - Backend: `GET /account/billing/invoice/:invoiceRef/pdf` — retrieves Stripe invoice PDF URL via `stripe.invoices.retrieve()` (official Stripe API)
  - Frontend: Download button column in payment history table
  - EN + AR translations added
  - Testing: Backend built successfully, endpoint registered

- **Task 7.3: API Keys Management**
  - Files: `apps/backend/prisma/schema.prisma`, `apps/backend/src/domains/api-keys/*` (service, controller, module, DTO), `apps/backend/src/app.module.ts`, `apps/dashboard/src/features/api-docs/api-keys-manager.tsx`, `apps/dashboard/src/features/api-docs/api-management-api.ts`, `apps/dashboard/src/features/api-docs/api-docs-client.tsx`, `apps/dashboard/src/i18n/messages/en.json`, `apps/dashboard/src/i18n/messages/ar.json`
  - Prisma: `ApiKey` model with SHA-256 key hash, prefix, scopes, soft-revoke
  - Backend: CRUD endpoints (`GET/POST/DELETE /api-keys`) with OWNER/ADMIN role guard
  - Frontend: Full management UI with create dialog (shows raw key once), revoke button, scope badges
  - EN + AR translations added
  - Testing: Backend + dashboard built successfully, prisma db push completed

- **Task 7.4: Webhooks Management**
  - Files: `apps/backend/prisma/schema.prisma`, `apps/backend/src/domains/webhooks/webhooks.service.ts`, `apps/backend/src/domains/webhooks/webhooks-customer.controller.ts`, `apps/backend/src/domains/webhooks/webhooks.module.ts`, `apps/backend/src/domains/webhooks/dto/create-webhook.dto.ts`, `apps/dashboard/src/features/api-docs/webhooks-manager.tsx`, `apps/dashboard/src/features/api-docs/api-management-api.ts`, `apps/dashboard/src/i18n/messages/en.json`, `apps/dashboard/src/i18n/messages/ar.json`
  - Prisma: `WebhookEndpoint` model with URL, events, HMAC secret, enable/disable, soft-delete
  - Backend: CRUD + toggle + test endpoints (`GET/POST/DELETE/PATCH/POST /webhooks`)
  - Frontend: Full management UI with create dialog (event picker, signing secret display), enable/disable toggle, test button, delete
  - EN + AR translations added
  - Testing: All 3 containers healthy (backend, dashboard, db)

---

### تاسكات قيد التنفيذ

*(لا يوجد بعد)*

---

**Phase 4: Content & Templates — Completed 2025-07-18**

- **Task 4.1: Content Templates (Pre-built)**
  - Files: `canvas-templates.ts`, `template-preview.tsx` (NEW), `templates-client.tsx`, `studio-editor-client.tsx`, `studio/page.tsx`, `en.json`, `ar.json`
  - 10 templates with category/description/orientation metadata, Konva preview with lazy loading, category filter pills, search, one-click create via Studio, Radix Dialog preview modal
  - EN + AR translations (21 keys)
  - Testing: TypeScript 0 errors, ESLint 0 errors, Build passes

- **Task 4.2: Content Auto-Expiry**
  - Files: `media-library-client.tsx`, `playlist-list-client.tsx`, `en.json`, `ar.json` (already implemented)
  - Expiry date picker in media info dialog, PATCH `/media/:id/expiry` endpoint, expiry filter (active/expired/all), "Expired" badge (red), "Expiring Soon" badge (amber), playlist list expiry filter + badges
  - Testing: Verified existing implementation against spec

- **Task 4.3: Playlist Preview Mode**
  - Files: `playlist-preview-overlay.tsx`, `playlist-list-client.tsx`, `playlist-studio-client.tsx` (already implemented)
  - Full-screen overlay with auto-playing sequential playback, framer-motion transitions (fade/slide/zoom), play/pause/next/prev controls, progress dots, focus trap + Escape key, useReducedMotion, RTL support
  - Testing: Verified existing implementation against spec

- **Task 4.4: Multi-file Upload**
  - Files: `media-library-client.tsx`, `media-api.ts` (already implemented)
  - Multi-file drag & drop via react-dropzone, parallel uploads (max 3 concurrent), per-file progress bars, total progress indicator, per-file retry on error, auto-dismiss completed after 3s, pre-upload storage limit check, storage indicator
  - A11y fix: Added `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-label` to all progress bars per DS V2 §16
  - Testing: TypeScript 0 errors, ESLint 0 errors (2 pre-existing warnings)

- **Task 4.5: Content Version History**
  - Backend: `schema.prisma` (CanvasVersion model), `canvases.service.ts` (version snapshot on update, listVersions, restoreVersion), `canvases.controller.ts` (GET `:id/versions`, POST `:id/restore/:versionId`), migration SQL
  - Frontend: `studio-api.ts` (fetchCanvasVersions, restoreCanvasVersion), `studio-editor-client.tsx` (server versions panel with loading/restore states, local snapshots section, aria-live for loading, role=list/region)
  - EN + AR translations (5 new keys: savedVersions, localSnapshots, loadingVersions, restoring, restoreFailed)
  - Testing: TypeScript 0 errors (dashboard), Build passes, 0 new ESLint errors

---

## قواعد التنفيذ

1. **الترتيب:** التنفيذ من المرحلة 1 → 10 بالترتيب. المرحلة 11 منفصلة تماماً.
2. **Testing:** بعد كل تاسك:
   - sync to WSL: `wsl -d Ubuntu -- bash -c "cp /mnt/d/projects/Cloud-Screen/<file> /home/gpack/Cloud-Screen/<file>"`
   - rebuild: `wsl -d Ubuntu -- bash -c "cd /home/gpack/Cloud-Screen && docker compose up --build <service> -d"`
   - verify على `localhost:3000`
3. **التوثيق:** بعد إكمال كل تاسك، حدّث قسم "سجل الإنجاز" بـ:
   - رقم التاسك
   - تاريخ الإكمال
   - الملفات المعدلة
   - نتائج الـ testing
   - ملاحظات
4. **اللاندنج بيدج:** لا يتم المساس بها نهائياً حتى تكتمل كل المراحل 1-10
5. **الـ Backend:** بعض التاسكات تحتاج backend changes. يتم تنفيذها قبل الـ dashboard UI
6. **الترجمات:** كل تاسك يجب أن يضيف ترجمات EN + AR
7. **RTL:** كل تاسك يجب أن يختبر RTL
8. **ORCA styling:** كل UI جديد يتبع ORCA design system
