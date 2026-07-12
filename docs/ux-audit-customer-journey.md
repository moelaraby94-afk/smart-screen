# UX Audit & Customer Journey Map — Cloud Signage

> **تاريخ:** 2026-07-12
> **نطاق:** Dashboard (customer) + Admin (platform staff) + Player (kiosk)
> **مرجع:** Best practices from ScreenCloud, Yodeck, OptiSigns + SaaS UX patterns 2025

---

## 1. رحلة العميل الكاملة (Customer Journey)

### 1.1 Discovery → Signup → Onboarding

| # | الخطوة | الكليك/القرار | الصفحة | الحالة | ملاحظات |
|---|-------|---------------|--------|------|---------|
| 1 | يصل للموقع | — | `apps/marketing` | 🔴 Placeholder | صفحة تسويق فارغة — لا يوجد محتوى، شرح، pricing، أو CTA |
| 2 | يضغط Sign Up | Click "Create account" | `/[locale]/register` | ✅ | فورم كامل: email, fullName, businessName, phone, country, city, password |
| 3 | يستلم OTP | يكتب 6 أرقام | `/[locale]/register` (step: otp) | ✅ | resend متاح، throttle 5/min |
| 4 | يتم إنشاء account | — | redirect → `/[locale]/overview` | ✅ | لا workspace → WorkspaceWelcome |
| 5 | ينشئ أول workspace | Click "Create first workspace" | WorkspaceWelcome | ✅ | Dialog بسيط (اسم فقط) |
| 6 | **Onboarding wizard** | Choose demo or fresh → next steps | OnboardingWizard | ✅ | 2-step wizard بعد إنشاء workspace: اختيار المحتوى (demo/fresh) ثم quick links (add screen, upload media, invite team) |

### 1.2 Daily Operations (المستخدم العادي)

| # | الخطوة | الكليك/القرار | الصفحة | الحالة | ملاحظات |
|---|-------|---------------|--------|------|---------|
| 7 | Login | email + password | `/[locale]/login` | ✅ | Cookie-based + refresh token |
| 8 | يرى Overview | — | `/[locale]/overview` | ✅ | Stats + branch cards + quick actions |
| 9 | يرفع ملف | Drag/upload | `/[locale]/media` | ✅ | Folders support، 150MB limit |
| 10 | ينشئ Canvas (تصميم) | Studio editor | `/[locale]/studio` | ✅ | Konva-based: text, shapes, images |
| 11 | ينشئ Playlist | Add media/canvas items | `/[locale]/playlists` | ✅ | Drag-and-drop reorder, duration per item |
| 12 | يسجل شاشة | Pairing flow (6-digit code) | `/[locale]/screens` → claim | ✅ | Player generates code → dashboard claims |
| 13 | يربط Playlist بشاشة | Assign from screen card | `/[locale]/screens` | ✅ | Quick edit panel |
| 14 | ينشئ Schedule | Calendar + time slots | `/[locale]/schedules` | ✅ | Day-of-week + time range + priority |
| 15 | Override شاشة | Pick screen + playlist | `/[locale]/schedules` | ⚠️ | مدة ثابتة 480 دقيقة (8 ساعات) — لا يمكن تخصيصها |
| 16 | يدعو عضو فريق | email + role | `/[locale]/team` | ✅ | إيميل حقيقي يُرسل مع token آمن، صفحة قبول دعوة `/invite`، إلغاء دعوة معلّقة |
| 17 | يعدل ملفه الشخصي | name, businessName, phone | `/[locale]/settings/profile` | ✅ | + email change مع OTP |
| 18 | يرى الفواتير | — | `/[locale]/settings/billing` | ✅ | Payment history + Stripe portal link |

### 1.3 Multi-Branch (الفروع)

| # | الخطوة | الصفحة | الحالة | ملاحظات |
|---|-------|--------|------|---------|
| 19 | ينشئ workspace ثاني | Workspace switcher → create | ✅ | كل workspace = فرع مستقل |
| 20 | يدخل فرع | `/[locale]/branches/[workspaceId]` | ✅ | تفاصيل الفرع: screens, playlists, media |
| 21 | يستنسخ playlist لفرع | "Clone to workspace" | ✅ | من branch detail |
| 22 | ينشئ group داخل فرع | `/[locale]/branches/[wsId]/groups/[groupId]` | ✅ | Playlist groups |

### 1.4 Cancellation / Downgrade

| # | الخطوة | الصفحة | الحالة | ملاحظات |
|---|-------|--------|------|---------|
| 23 | يفتح Stripe portal | `/[locale]/settings/billing` | ✅ | زر "Manage billing" يفتح Stripe portal |
| 24 | يلغي subscription | Stripe portal (external) | ✅ | عبر Stripe |
| 25 | **فجوة post-cancellation** | — | 🔴 | لا يوجد retention flow، لا survey، لا downgrade to free tier message |

---

## 2. رحلة الأدمن (Admin / Platform Staff)

| # | الخطوة | الصفحة | الحالة | ملاحظات |
|---|-------|--------|------|---------|
| A1 | Admin Overview | `/[locale]/admin` | ✅ | Stats: revenue, screens, users, workspaces + server health |
| A2 | إدارة العملاء | `/[locale]/admin/customers` | ✅ | Search + filter (all/active/expired/trial) |
| A3 | تفاصيل عميل | `/[locale]/admin/customers/[id]` | ✅ | Profile tabs: workspaces, subscription, payments |
| A4 | تفاصيل workspace عميل | `/[locale]/admin/customers/[id]/workspace/[wsId]` | ✅ | Full workspace detail |
| A5 | Fleet (شاشات عالمية) | `/[locale]/admin/fleet` | ✅ | All screens across all customers |
| A6 | شاشات عالمية | `/[locale]/admin/screens` | ✅ | Same as fleet |
| A7 | إدارة الموظفين | `/[locale]/admin/staff` | ✅ | Create staff + set role |
| A8 | الإحصائيات | `/[locale]/admin/stats` | ✅ | Revenue + usage charts |
| A9 | سجلات التدقيق | `/[locale]/admin/logs` | ✅ | Audit trail |
| A10 | الإعدادات | `/[locale]/admin/settings` | ✅ | Platform settings + branding upload |
| A11 | إدارة المستخدمين | `/[locale]/admin/users` | ✅ | User list + impersonation |
| A12 | Workspaces | `/[locale]/admin/workspaces` | ✅ | All workspaces |
| A13 | Billing (admin) | `/[locale]/admin/billing` | ✅ | Platform billing view |
| A14 | Impersonation | From user list → "Impersonate" | ✅ | Super-admin only, with audit log |
| A15 | Exit impersonation | Floating button | ✅ | Returns to admin session |

---

## 3. رحلة الـ Player (Kiosk / Screen)

| # | الخطوة | الحالة | ملاحظات |
|---|-------|------|---------|
| P1 | Boot → check persisted secret | ✅ | localStorage |
| P2 | No secret → Pairing mode | ✅ | Shows 6-digit code on screen |
| P3 | Pairing wait → poll every 2s | ✅ | Socket.IO + REST poll |
| P4 | Paired → bootstrap | ✅ | Fetches playlist + media |
| P5 | Playback (playlist engine) | ✅ | Canvas Konva + media rotation |
| P6 | Heartbeat every 30s | ✅ | WebSocket → screen status |
| P7 | Offline cache | ✅ | localStorage snapshot |
| P8 | HUD (clock + ticker + online status) | ✅ | Bottom marquee |
| P9 | Identify overlay | ✅ | Shows serial number |
| P10 | Remote commands (refresh/restart) | ✅ | From dashboard |
| P11 | Realtime updates | ✅ | Socket.IO: ticker, playlist changes |

---

## 4. الفجوات الحرجة (Critical Gaps)

### 4.1 🔴 Backend له كود + لا يوجد UI

| # | الـ Feature | الـ API | الموقع | الوصف |
|---|------------|---------|-------|-------|
| G1 | **Workspace bootstrap-demo** | `POST workspaces/bootstrap-demo` | `workspaces.controller.ts:43` | ينشئ workspace + demo content تلقائياً — **موجود في WorkspaceWelcome + OnboardingWizard** ✅ |
| G2 | **Workspace seed-demo** | `POST workspaces/:id/seed-demo` | `workspaces.controller.ts:50` | يضيف demo content لـ workspace موجود — **موجود في dashboard + media library + OnboardingWizard** ✅ |
| G3 | **Playlist clone-to-workspace** | `POST playlists/:id/clone-to-workspace` | `playlists.controller.ts:71` | يستنسخ playlist لـ workspace آخر — **موجود في branches فقط، مش في playlists page** |
| G4 | **Schedule overlap detection** | `GET schedules/overlaps` | `schedules.controller.ts:34` | يكشف تعارض المواعيد — **موجود في schedules UI** ✅ |
| G5 | **Screen active-content** | `GET screens/:id/active-content` | `screens.controller.ts:52` | يعرض المحتوى النشط حالياً — **موجود كـ preview** ✅ |
| G6 | **Subscription mock-plan** | `PATCH subscriptions/mock-plan` | `subscriptions.controller.ts:22` | تغيير الخطة يدوياً — **موجود في billing UI** ✅ |
| G7 | **Admin send reminder** | `POST admin/customers/:id/reminder` | `admin.controller.ts:156` | إرسال تذكير اشتراك — **لا يوجد زر في admin UI** |
| G8 | **Admin patch subscription** | `PATCH admin/customers/:id/subscription` | `admin.controller.ts:147` | تعديل اشتراك عميل — **موجود في customer profile** ✅ |
| G9 | **Admin create customer workspace** | `POST admin/customers/:id/workspaces` | `admin.controller.ts:117` | إنشاء workspace لعميل — **موجود في customer profile** ✅ |
| G10 | **Admin update user (super admin)** | `PATCH admin/users/:id` | `admin.controller.ts:239` | تعديل مستخدم + صلاحيات — **موجود في admin users** ✅ |
| G11 | **Account insights** | `GET account/insights` | `account.controller.ts:43` | إحصائيات الحساب — **موجود في overview** ✅ |
| G12 | **Account billing** | `GET account/billing` | `account.controller.ts:38` | الفواتير — **موجود في settings/billing** ✅ |
| G13 | **Player workspace-bootstrap** | `GET player/workspace-bootstrap` | `player.controller.ts:50` | Bootstrap لـ player موثق بـ JWT — **موجود في player** ✅ |
| G14 | **Player canvas compiled** | `GET player/canvas/:canvasId` | `player.controller.ts:63` | Canvas مُجمّع للـ player — **موجود في player** ✅ |

### 4.2 🔴 صفحات ناقصة تماماً

| # | الصفحة المطلوبة | السبب | الأولوية |
|---|-----------------|------|----------|
| M1 | **Marketing/Landing page** | `apps/marketing` placeholder فارغ — لا يوجد شرح المنتج، pricing، features، testimonials | P0 |
| M2 | **Onboarding wizard** | ✅ تم — 2-step wizard بعد إنشاء workspace (content choice + next steps) | ✅ |
| M3 | **Pricing page** | لا توجد صفحة pricing — المنافسين (ScreenCloud, Yodeck, OptiSigns) كلهم عندهم | P1 |
| M4 | **Templates gallery** | لا توجد قوالب جاهزة — Yodeck عنده 400+، OptiSigns 4000+ | P1 |
| M5 | **Help/Support page** | لا توجد صفحة دعم، FAQ، أو documentation للعميل | P1 |
| M6 | **404/Error page** | لا توجد صفحة 404 مخصصة | P2 |
| M7 | **Accept invite page** | ✅ تم — صفحة `/invite` مع token آمن، accept/cancel flow | ✅ |
| M8 | **Screen detail page** | لا توجد صفحة تفاصيل مستقلة لكل شاشة (التعديل من dialog فقط) | P2 |
| M9 | **Playlist detail page** | لا توجد صفحة مستقلة — التعديل من studio embedded | P2 |

### 4.3 🔴 فيتشر ناقصة في الواجهة (موجود في الكود لكن مش مكتمل UI)

| # | الفيتشر | الوصف | الأولوية |
|---|---------|------|----------|
| F1 | **Onboarding flow بعد إنشاء workspace** | ✅ تم — 2-step OnboardingWizard (demo/fresh + quick links) | ✅ |
| F2 | **Demo content seeding button** | ✅ تم — موجود في WorkspaceWelcome، dashboard، media library، OnboardingWizard | ✅ |
| F3 | **Override duration customization** | Override شاشة بمدة ثابتة 480 دقيقة — العميل مش قادر يختار المدة | P1 |
| F4 | **Screen status filter/search** | لا يوجد بحث أو فلترة في صفحة الشاشات | P1 |
| F5 | **Media search/filter** | لا يوجد بحث في مكتبة الميديا بالاسم أو النوع | P1 |
| F6 | **Playlist publish/unpublish toggle** | `isPublished` field موجود في schema لكن لا toggle في UI | P1 |
| F7 | **Schedule enable/disable toggle** | `enabled` field موجود — يوجد في UI؟ | P1 |
| F8 | **Workspace settings (timezone, locale)** | `timezone` و `defaultLocale` موجودين في schema لكن لا يوجد UI لتعديلهم | P1 |
| F9 | **Workspace pause** | `isPaused` field موجود — لا يوجد زر pause في UI | P1 |
| F10 | **Screen location management** | `location` field موجود لكن مش ظاهر في quick edit | P2 |
| F11 | **Screen resolution display** | `resolutionWidth/Height` موجودين لكن مش ظاهرين في card | P2 |
| F12 | **Player ticker text** | `playerTicker` field — لا يوجد UI لإرسال ticker لشاشة معينة | P1 |
| F13 | **Bulk screen actions** | لا يوجد select-all + bulk delete/assign | P1 |
| F14 | **Playlist duplicate (same workspace)** | `POST :id/duplicate` موجود — غير واضح في UI | P1 |
| F15 | **Team role management** | لا يمكن تغيير دور عضو أو إزالته — فقط دعوة | P1 |
| F16 | **Storage usage indicator** | `storageLimitBytes` موجود في subscription لكن لا يوجد progress bar في media library | P1 |
| F17 | **Screen limit indicator** | `screenLimit` موجود لكن لا يوجد "X of Y screens used" indicator | P1 |
| F18 | **Admin: send subscription reminder** | `POST admin/customers/:id/reminder` — لا يوجد زر | P2 |
| F19 | **Canvas templates** | لا توجد قوالب جاهزة للـ Canvas/Studio | P1 |
| F20 | **Export/Download media** | لا يوجد زر download للملفات المرفوعة | P2 |

### 4.4 🔴 نقاط ضعف في تجربة المستخدم (UX Weaknesses)

| # | المشكلة | التأثير | الحل المقترح | الأولوية |
|---|---------|--------|-------------|----------|
| U1 | **لا onboarding** | ✅ تم — Onboarding wizard 2-step بعد إنشاء workspace | ✅ |
| U2 | **Marketing page فارغ** | لا conversion funnel — العميل المحتمل يخرج | Landing page كامل: hero, features, pricing, CTA | P0 |
| U3 | **Team invite "demo"** | ✅ تم — إيميل حقيقي يُرسل مع token آمن، صفحة قبول دعوة، إلغاء دعوة معلّقة | ✅ |
| U4 | **Override مدة ثابتة** | العميل مش قادر يعمل override لمدة 30 دقيقة | Dropdown: 30min, 1h, 4h, 8h, 24h, custom | P1 |
| U5 | **لا empty states تفاعلية** | ✅ تم — empty states مع CTAs في screens, media, schedules, playlists, team | ✅ |
| U6 | **Studio editor بسيط** | مقارنة بـ OptiSigns Designer 2.0: لا layers panel، لا templates، لا multi-zone | إضافة layers + templates + more shapes | P1 |
| U7 | **لا keyboard shortcuts** | Studio و Playlist editor بدون shortcuts | Save (Ctrl+S), Undo (Ctrl+Z), Delete (Del) | P2 |
| U8 | **لا preview mode للـ playlist** | العميل مش قادر يشاهد playlist قبل نشره | Preview button يفتح modal مع playback simulation | P1 |
| U9 | **لا notifications in-app** | لا يوجد bell icon أو notifications dropdown | Real-time notifications: screen offline, upload complete | P1 |
| U10 | **لا breadcrumb navigation** | في صفحات deep (branches/groups) العميل يضيع | Breadcrumbs في header | P2 |
| U11 | **لا search عام** | لا يوجد global search (search across screens, playlists, media) | Cmd+K palette | P2 |
| U12 | **Schedule calendar بسيط** | لا day/week/month views — فقط list + basic calendar | Full calendar view مع drag-to-reschedule | P1 |
| U13 | **لا analytics للعميل** | العميل مش قادر يشاهد "screen was online X hours, played Y items" | Analytics dashboard per screen | P1 |
| U14 | **لا mobile-responsive للـ admin** | Admin panels مش mobile-friendly | Responsive admin layout | P2 |
| U15 | **Player: لا orientation lock** | لا يوجد UI لـ portrait/landscape toggle في player | Auto-detect + manual override | P2 |
| U16 | **لا multi-zone layouts** | المنافسين عندهم multi-zone (split screen) | إضافة zone support في Canvas/Studio | P1 |
| U17 | **لا content approval workflow** | ScreenCloud عنده approval workflow للـ team | Add role-based approval before publish | P2 |
| U18 | **لا version history للـ Canvas** | لا يمكن التراجع عن تعديل — Save فقط يحفظ الحالي | Auto-save + version history | P1 |
| U19 | **لا webhook/API docs للعملاء** | لا يوجد API documentation للعملاء | Public API docs page | P2 |
| U20 | **لا 2FA / MFA** | لا يوجد two-factor authentication | SMS or TOTP-based 2FA | P1 |

---

## 5. مقارنة بالمنافسين (Competitive Analysis)

| Feature | Cloud Signage | ScreenCloud | Yodeck | OptiSigns |
|---------|:---:|:---:|:---:|:---:|
| Templates gallery | ❌ | ✅ 150+ | ✅ 400+ | ✅ 4000+ |
| Built-in designer | ✅ Basic | ✅ Studio+Canvas | ✅ Layout Editor | ✅ Designer 2.0 |
| Multi-zone layouts | ❌ | ✅ | ✅ | ✅ (Pro) |
| App integrations | ❌ | ✅ 80+ | ✅ 50+ | ✅ 160+ |
| AI content generation | ❌ | ❌ | ❌ | ✅ |
| Team management | ✅ RBAC + email invites | ✅ RBAC + approval | ✅ Simple | ✅ Simple |
| Content approval | ❌ | ✅ | ❌ | ❌ |
| Analytics | ❌ | ✅ | ✅ Basic | ✅ Basic |
| Scheduling | ✅ Basic | ✅ Advanced | ✅ Advanced | ✅ Advanced |
| Remote management | ✅ Refresh/Restart | ✅ Full | ✅ Full | ✅ Full |
| Offline playback | ✅ | ✅ | ✅ | ✅ |
| Mobile app | ❌ | ✅ | ❌ | ✅ |
| SOC 2 / Security | ⚠️ Basic | ✅ | ✅ | ✅ |
| Free tier | ❌ | ❌ (trial) | ✅ 1 screen | ✅ 1 screen |
| Onboarding wizard | ✅ | ✅ | ✅ | ✅ |
| Marketing site | ❌ Placeholder | ✅ Full | ✅ Full | ✅ Full |

---

## 6. خطة العمل المقترحة (Prioritized Action Plan)

### Phase 1: Foundation (P0 — Launch Blockers)

| # | Task | الجهد | التأثير |
|---|------|------|---------|
| 1 | **Onboarding wizard** بعد إنشاء workspace | ✅ تم | عميل جديد يبدأ خلال 5 دقائق |
| 2 | **Demo content seeding button** (wire `seed-demo` API) | ✅ تم | عميل يرى محتوى فوراً |
| 3 | **Marketing landing page** كامل | 3-5 days | Conversion funnel |
| 4 | **Fix team invite** (إرسال إيميل حقيقي أو تغيير الـ copy) | ✅ تم | عدم تضليل العميل |
| 5 | **Empty states تفاعلية** في كل صفحة | ✅ تم | إرشاد العميل |

### Phase 2: Growth (P1 — Competitive Parity)

| # | Task | الجهد | التأثير |
|---|------|------|---------|
| 6 | **Templates gallery** (10-20 قالب جاهز) | 3-5 days | سرعة الإنتاج |
| 7 | **Multi-zone layouts** في Studio | 5-7 days | ميزة تنافسية رئيسية |
| 8 | **Playlist preview mode** | 1-2 days | ثقة قبل النشر |
| 9 | **Override duration customization** | 0.5 day | مرونة |
| 10 | **Search + filter** في screens و media | 1 day | سرعة البحث |
| 11 | **In-app notifications** (screen offline, etc.) | 2 days | reactive monitoring |
| 12 | **Screen analytics** (uptime, content played) | 3 days | قيمة للعميل |
| 13 | **Workspace settings** (timezone, locale, pause) | 1 day | تحكم |
| 14 | **Player ticker UI** (send ticker from dashboard) | 0.5 day | ميزة يومية |
| 15 | **Bulk screen actions** | 1 day | كفاءة للشاشات الكثيرة |
| 16 | **Team role management** (change role, remove) | 1 day | تحكم في الفريق |
| 17 | **Storage + screen limit indicators** | 0.5 day | شفافية |
| 18 | **Schedule calendar improvements** (week/month view) | 2-3 days | جدولة أفضل |
| 19 | **Pricing page** | 1 day | conversion |
| 20 | **2FA / MFA** | 2 days | أمان |
| 21 | **Canvas version history** | 2 days | أمان ضد الأخطاء |
| 22 | **Accept invite flow** (حقيقي) | 2 days | team onboarding |

### Phase 3: Polish (P2 — Delight)

| # | Task | الجهد |
|---|------|------|
| 23 | Global search (Cmd+K) | 2-3 days |
| 24 | Keyboard shortcuts في Studio | 1 day |
| 25 | Breadcrumb navigation | 0.5 day |
| 26 | 404/error pages | 0.5 day |
| 27 | Screen detail page | 1 day |
| 28 | Admin mobile responsive | 2 days |
| 29 | Player orientation lock | 0.5 day |
| 30 | Content approval workflow | 3-5 days |
| 31 | Public API docs | 2 days |
| 32 | Export/download media | 0.5 day |
| 33 | Admin: send reminder button | 0.5 day |
| 34 | Screen location + resolution display | 0.5 day |

---

## 7. خريطة الصفحات الحالية (Existing Page Inventory)

### Dashboard (Customer)
```
/[locale]/
├── (auth)/
│   ├── login              ✅
│   ├── register           ✅
│   ├── forgot-password    ✅
│   ├── privacy            ✅ (static)
│   └── terms              ✅ (static)
├── (shell)/
│   ├── overview           ✅ (home dashboard)
│   ├── media              ✅ (library + folders)
│   ├── studio             ✅ (canvas editor)
│   ├── playlists          ✅ (playlist studio)
│   ├── screens            ✅ (fleet management)
│   ├── schedules          ✅ (calendar + override)
│   ├── team               ⚠️ (demo invites only)
│   ├── billing            ✅ (Stripe checkout)
│   ├── settings/
│   │   ├── profile        ✅ (name, email change)
│   │   └── billing        ✅ (payment history)
│   ├── branches/
│   │   └── [workspaceId]  ✅ (branch detail)
│   │       ├── groups/[groupId]  ✅
│   │       └── playlists/[playlistId]  ✅
│   └── admin/             ✅ (super-admin only)
│       ├── (overview)     ✅
│       ├── customers      ✅
│       │   └── [id]       ✅
│       │       └── workspace/[wsId]  ✅
│       ├── fleet          ✅
│       ├── screens        ✅
│       ├── staff          ✅
│       ├── stats          ✅
│       ├── logs           ✅
│       ├── settings       ✅
│       ├── users          ✅
│       ├── workspaces     ✅
│       └── billing        ✅
```

### Player
```
/                         ✅ (PlayerRuntime — kiosk mode)
```

### Marketing
```
/                         🔴 (placeholder)
```

---

## 8. الـ Navigation الحالي (Sidebar)

### Customer Sidebar
- **Home** (overview)
- **Media** (library)
- **Playlists** (studio)
- **Screens** (fleet)
- **Schedules** (calendar)
- **Team** (members)
- ---
- **Profile Settings**
- **Billing & Payments**
- ---
- Theme toggle | Language (AR/EN) | Logout

### Admin Sidebar (Sovereign mode)
- **Overview** (shared)
- **Admin Home**
- ---
- **Customers**
- **Fleet** (global screens)
- **Screens** (global)
- ---
- **Staff**
- **Stats**
- **Logs**
- **Settings**

---

## 9. الـ Navigation الناقص

| الصفحة المطلوبة | مكانها المقترح | الأولوية |
|-----------------|---------------|----------|
| **Onboarding wizard** | Modal بعد إنشاء workspace | P0 |
| **Templates** | Sidebar → "Templates" | P1 |
| **Analytics** | Sidebar → "Analytics" | P1 |
| **Help/Support** | Sidebar bottom → "Help" | P1 |
| **Notifications** | Header → bell icon | P1 |
| **Workspace Settings** | Sidebar → "Settings" (timezone, locale, pause) | P1 |
| **Screen Detail** | Click screen card → dedicated page | P2 |
| **Global Search** | Header → Cmd+K | P2 |

---

## 10. الخلاصة

**المنصة قوية في الـ backend والـ API** (auth, pairing, realtime, scheduling, multi-tenant, admin CRM) لكن **الـ UX من ناحية onboarding و content creation و competitive features** متأخر عن المنافسين.

**أكبر 3 فجوات:**
1. **لا onboarding** — عميل جديد يواجه dashboard فارغ بدون إرشاد
2. **Marketing page فارغ** — لا conversion funnel
3. **لا templates + لا multi-zone** — المنافسين كلهم عندهم

**أسرع 3 مكاسب:**
1. **Wire demo content seeding** (API موجود، فقط زر في UI) — 0.5 day
2. **Onboarding wizard** (3 خطوات بسيطة) — 2-3 days
3. **Fix team invite copy** (تغيير نص) — 0.5 day
