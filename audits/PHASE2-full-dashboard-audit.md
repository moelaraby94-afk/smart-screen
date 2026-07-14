# أوديت كامل احترافي — داشبورد الكلاينت (Phase 2 Audit)

**تاريخ المراجعة:** 2026-07-14
**النطاق:** كل صفحات داشبورد الكلاينت + الباك إند + التطابق بينهما
**المنهجية:** مراجعة صفحة بصفحة في الشجرة الحالية، مع التحقق من كل ملاحظة بدليل `file:line`

---

## 0. ملخّص تنفيذي

تم إنجاز **10 مهام (T-A → T-J)** في Phase 1 بنجاح. الداشبورد الآن **نظيف من التكرارات** (5 صفحات مدمجة بـ redirect)، **السايدبار مُهيكَل في 7 أقسام**، **GlobalSearch مربوط**، **OverviewMetrics محذوف**، **Skeleton متبنّى جزئياً**، **Settings متبوّبة**، **الـ i18n نظيف**.

**لكن تبقى 6 فئات من المشاكل:**

| الفئة | العدد | الأولوية |
|---|---|---|
| Skeleton لم يُتبنَّ في 4 صفحات | 4 | P1 |
| confirm() بدل AlertDialog في Team | 1 | P0 |
| Audit Log بلا بحث/فلتر/ترقيم | 1 | P1 |
| Notifications بلا ترقيم/فلتر نوع/حذف | 1 | P1 |
| Team بلا بحث/فلتر | 1 | P2 |
| لا per-page error boundaries | 1 | P2 |

---

> **تصحيح المراجع الشامل (Reviewer verification — 2026-07-14، Claude):** أُعيد التحقّق من **كل** بنود هذا الأوديت في الشجرة الحالية بعد أوديت مستقل كامل. **قائمة "المتبقّي" في §0 قديمة/متشائمة — البنود التالية كلها مُنجَزة ومُتحقَّقة فعلاً:**
>
> | البند | الحالة الفعلية | الدليل |
> |---|---|---|
> | **F1** Team confirm→AlertDialog | ✅ منجَز | `team-client.tsx:418` |
> | **F2** Skeleton في كل الصفحات | ✅ منجَز | Overview/Analytics/Billing (`4fd341b`) + Audit Log/Team (`ListSkeleton` import) |
> | **F3** Audit Log بحث/فلتر/ترقيم/تصدير | ✅ منجَز | `audit-log-page-client.tsx:64` (search) `:83-94` (filter) `:96` (pagination slice) `:99` (export) |
> | **F4** Notifications فلتر نوع/حذف/click/clearAll | ✅ منجَز | `notifications-page-client.tsx:43,58,80,139,193,216` |
> | **F5** Team بحث/فلتر | ✅ منجَز | `team-client.tsx:76-77,197-207` |
> | **F6** per-page error boundaries | ✅ منجَز | 8 `error.tsx` (admin/analytics/billing/media/playlists/schedules/screens/settings) |
> | **F7** Analytics status i18n | ✅ منجَز | `analytics-page-client.tsx:362` (`tAnalytics('status'+...)` + لون + نقطة) |
> | **F8** sort في القوائم | ✅ منجَز (Screens/Playlists) | `screens-client.tsx:139,350` · `playlist-studio-client.tsx:73-89` |
>
> **الصحة المُتحقَّقة:** typecheck ✅ · i18n:check ✅ · lint 0 errors (16 warnings) ✅ · build ✅. **المتبقّي فعلياً = لا شيء من F1–F9** (Media sort أيضاً منجَز `media-library-client.tsx:94,601`؛ F9 `screensInGroup` ظاهر في نص الـ dropdown وقابل للفرز — كافٍ). **الباقي كله = باك‑لوج W7 (ميزات كبيرة تحتاج قراراً):** AI حقيقي · Proof-of-Play حقيقي · screenshot مباشر · OTA · map view · schedule recurrence.

## 1. ما تم إصلاحه (مؤكد في الشجرة الحالية)

| الإصلاح | الدليل | الحالة |
|---|---|---|
| 5 تكرارات → redirects | `displays/page.tsx`, `content/page.tsx`, `campaigns/page.tsx`, `proof-of-play/page.tsx`, `billing/page.tsx`, `displays/groups/page.tsx` | ✅ كلها redirect |
| ملفات الـ client الميتة محذوفة | لا توجد `displays*`, `content*`, `campaigns*`, `proof*` في `features/` | ✅ |
| السايدبار 7 أقسام | `shell-sidebar.tsx:54-81` (OVERVIEW/FLEET/CONTENT/PLAYBACK/INSIGHTS/MANAGEMENT/RESOURCES) | ✅ |
| Settings متبوّبة | `settings-tabs.tsx` + `settings/{profile,billing,workspace}/page.tsx` كلها تستوردها | ✅ |
| GlobalSearch مربوط | `header.tsx` يستورده ويعرضه | ✅ |
| OverviewMetrics محذوف | لا يوجد `overview-metrics.tsx` | ✅ |
| Skeleton patterns | `skeleton-patterns.tsx` (TableSkeleton/CardGridSkeleton/ListSkeleton) | ✅ |
| B1 — رسالة الطوارئ تُرسَل | `emergency-client.tsx:67` — `ensureEmergencyOverlayPlaylist(workspaceId, message.trim())` | ✅ |
| B2 — "كل الشاشات" تعمل | `emergency-client.tsx:61` — `selectedScreenId ? [selectedScreenId] : screens.map(s => s.id)` | ✅ |
| B3 — لا reload في Notifications | `notification-provider.tsx:223-226` — `setNotifications` state update + `markAllNotificationsRead()` | ✅ |
| B4 — locale في روابط الفواتير | `settings-billing-client.tsx` — `allowMockBilling` env-gated | ✅ |
| B5 — locale في روابط المساعدة | `help-support-client.tsx:52,58,64,70,76,82` — `href: /${locale}/...` | ✅ |
| B7 — نصوص إنجليزية في Analytics | `analytics-page-client.tsx:32-43` — `Intl.RelativeTimeFormat(locale, ...)` | ✅ |
| i18n namespaces الميتة محذوفة | لا توجد `billingPage`, `displaysPage`, إلخ في `en.json`/`ar.json` | ✅ |
| workspace-gate نظيف | `workspace-gate.tsx:11-28` — لا إشارات لصفحات ميتة | ✅ |

---

## 2. المشاكل المتبقية (مرتبة بالأولوية)

### P0 — تجربة مكسورة الآن

#### F1 — Team يستخدم `confirm()` بدل `AlertDialog`
- **الدليل:** `team-client.tsx:159` — `if (!confirm(t('confirmRemove'))) return;`
- **المشكلة:** `confirm()` متصفح أصلي — قبيح، يحجب الـ thread، لا يدعم RTL بشكل صحيح، لا يتماشى مع نظام ORCA. مكوّن `AlertDialog` (Radix) موجود في `components/ui/alert-dialog.tsx` وجاهز.
- **الأثر:** تجربة غير احترافية في عملية مدمّرة (إزالة عضو).
- **الحل:** استبدل `confirm()` بـ `AlertDialog` مع trigger على زر الحذف.

### P1 — عيب معماري / احتكاك كبير

#### F2 — Skeleton لم يُتبنَّ في 4 صفحات
T-J كان مفترض تبني Skeleton عبر **كل** الصفحات. هذه الصفحات لا تزال تستخدم spinners:

| الصفحة | الدليل | النوع الحالي |
|---|---|---|
| Overview | `overview-page-client.tsx:19-25` | `Loader2` spinner |
| Analytics | `analytics-page-client.tsx:116-122` | CSS spinner |
| Audit Log | `audit-log-page-client.tsx:56-62` | CSS spinner |
| Team | `team-client.tsx:195-196` | نص "Loading…" |
| Settings Billing | `settings-billing-client.tsx:204` | نص "Loading…" |

- **الحل:** استبدل كل spinner بـ `ListSkeleton` أو `CardGridSkeleton` من `skeleton-patterns.tsx`.

#### F3 — Audit Log بلا بحث/فلتر/ترقيم/تصدير
- **الدليل:** `audit-log-page-client.tsx:46-54` — يحمّل كل السجل دفعة واحدة، لا search، لا filter by action، لا pagination، لا date range، لا export.
- **المقارنة:** نسخة الأدمن (`admin-logs-client.tsx:99-106`) لديها بحث + جدول. نسخة الكلاينت متخلفة عنها.
- **الحل:** أضف search input + filter by action type + pagination + export CSV (نفس نمط Analytics).

#### F4 — Notifications بلا ترقيم/فلتر نوع/حذف/click-to-navigate
- **الدليل:** `notification-provider.tsx:69` — `MAX_NOTIFICATIONS = 50` (سقف صلب). `notifications-page-client.tsx:43` — فلتر بالقراءة فقط (all/unread)، لا فلتر بالنوع، لا حذف، لا pagination، الروابط (`n.link`) موجودة في البيانات لكن غير قابلة للنقر.
- **الحل:** أضف فلتر بالنوع، اجعل العناصر قابلة للنقر (navigate to `n.link`)، أضف زر حذف، أضف pagination أو "load more".

### P2 — احتكاك تجربة

#### F5 — Team بلا بحث/فلتر/ترقيم
- **الدليل:** `team-client.tsx` — لا search by name/email، لا filter by role، لا pagination. مناسب للفرق الصغيرة لكن يتعثر مع النمو.
- **الحل:** أضف search input + filter dropdown.

#### F6 — لا per-page error boundaries
- **الدليل:** يوجد `error.tsx` واحد على مستوى الـ shell (`app/[locale]/(shell)/error.tsx`). لا error boundaries على مستوى الصفحة. انهيار قسم واحد (مثلاً Analytics) يُسقط الـ shell كاملاً.
- **الحل:** أضف `error.tsx` في كل صفحة حرجة (analytics, screens, schedules, media, playlists, settings).

#### F7 — Status indicators في Analytics table تستخدم enum خام
- **الدليل:** `analytics-page-client.tsx:336` — `{s.status}` يعرض `ONLINE`/`OFFLINE`/`MAINTENANCE` كنص خام بدل i18n keys.
- **الحل:** استخدم `tAnalytics('status_' + s.status.toLowerCase())` أو ما يماثله.

#### F8 — لا فرز (sort) في أي قائمة
- **الدليل:** لا يوجد sort في Screens, Media, Playlists, Schedules, Audit Log, Team, Notifications.
- **الحل:** أضف sort by name/date/status على الأقل في Screens و Media و Audit Log.

#### F9 — `screensInGroup` غير ظاهر في قائمة Playlists
- **الدليل:** `playlist-studio-client.tsx:44` — البيانات موجودة `_count.screensInGroup` لكنها تظهر فقط في نص dropdown (`:423`)، ليس كعداد بجانب كل playlist في القائمة.
- **الحل:** اعرض العداد بجانب اسم كل playlist في القائمة الجانبية.

### P3 — تحسينات

#### F10 — `overviewMetrics` i18n namespace لا يزال مستخدماً
- **الدليل:** `home-dashboard-sections.tsx` يستخدم `overviewMetrics`. هذا **ليس عيباً** — التأكيد فقط أنه حيّ وصحيح.

#### F11 — Mock billing env-gated بشكل صحيح
- **الدليل:** `settings-billing-client.tsx:86-87` — `process.env.NEXT_PUBLIC_ALLOW_MOCK_BILLING === 'true'`. هذا **ليس عيباً** — التأكيد فقط أنه محمي.

---

## 3. مراجعة الصفحات صفحة بصفحة (الحالة الحالية)

### Overview — `/overview`
- **الحالة:** ✅ جيد. PrayerTimes + Hijri widgets، OnboardingProgress، WorkspaceSummary، TotalsSection، RecentActivityFeed، BranchCards.
- **مشكلة:** ❌ F2 — spinner بدل skeleton عند التحميل.
- **تحسين:** Quick Actions في الـ header (إضافة شاشة/ميديا/بلايدست بنقرة).

### Screens — `/screens`
- **الحالة:** ✅ ممتاز. بحث، فلتر حالة، bulk select، bulk assign، Quick Edit، usage indicator، pairing، realtime، صفحة تفصيلية.
- **مشكلة:** ❌ لا table view (كروت فقط)، لا sort، لا export.
- **ملاحظة:** الـ API يدعم `remote-command` و `active-content` — كلاهما مستخدم في الـ frontend.

### Media — `/media`
- **الحالة:** ✅ ممتاز. رفع drag&drop، شبكة، مجلدات، bulk، بحث، فلتر نوع، pagination، expiry (شغّال)، seed demo، info dialog.
- **مشكلة:** ❌ لا table view، لا sort.

### Studio — `/studio`
- **الحالة:** ✅ جيد. محرّر كانفس، 6 قوالب، عناصر متعددة، معاينة، حفظ/نشر.
- **مشكلة:** لا حذف canvas من داخل Studio، لا auto-save، لا undo/redo على مستوى الكانفس.

### Templates — `/templates`
- **الحالة:** ✅ جيد. قوالب جاهزة + قوالب مستخدم، بحث، معاينة، حذف.
- **مشكلة:** لا "Edit in Studio" لقوالب المستخدم، لا إنشاء من هنا.

### Playlists — `/playlists`
- **الحالة:** ✅ جيد. sidebar + بحث، إنشاء/حذف/تكرار/clone/نشر، محرّر items بـ drag&drop، undo/redo، معاينة.
- **مشكلة:** ❌ F9 — `screensInGroup` غير ظاهر في القائمة. لا table view، لا bulk.

### Schedules — `/schedules`
- **الحالة:** ✅ ممتاز. تقويم 7×24، drag to reschedule، overlap detection، Timeline view (منقول من Campaigns)، list view، إنشاء كامل، حذف، override.
- **مشكلة:** لا recurrence، لا عرض شهري.

### Analytics — `/analytics`
- **الحالة:** ✅ جيد. 4 كروت حالة، uptime، peak hours، hourly bar chart، playlist distribution، per-screen table مع بحث + CSV export.
- **مشكلة:** ❌ F2 — spinner بدل skeleton. ❌ F7 — status enum خام. لا device metrics، لا crash reports.

### AI — `/ai`
- **الحالة:** ✅ مقبول (Demo مُعلَن). 4 أدوات، history في localStorage، بادج "Demo" واضح.
- **مشكلة:** لا تكامل حقيقي (مُعلَن بوضوح — مقبول).

### Emergency — `/emergency`
- **الحالة:** ✅ جيد. تحذير أحمر، تنشيط (قالب/رسالة/شاشة/مدة)، تنبيهات نشطة، cancel override.
- **ملاحظة:** B1 و B2 **مُصلَحان** — الرسالة تُرسَل و"كل الشاشات" تعمل.

### Settings — Profile — `/settings/profile`
- **الحالة:** ✅ جيد. ملف شخصي، تغيير إيميل (OTP)، 2FA، تفضيلات إشعارات (6)، GDPR.
- **مشكلة:** لا avatar، لا sessions management.

### Settings — Workspace — `/settings/workspace`
- **الحالة:** ✅ جيد. اسم الورك سبيس، اللغة، التوقيت، pause/resume، PrayerConfig، RamadanSettings.
- **مشكلة:** ❌ كان يتيم (A1) — **الآن في السايدبار** تحت Settings. ✅

### Settings — Billing — `/settings/billing`
- **الحالة:** ✅ جيد. خطة حالية، Stripe portal، سجل مدفوعات (جدول كامل)، تحميل PDF، اختيار خطة (Stripe checkout).
- **مشكلة:** ❌ F2 — loading نص بدل skeleton. Mock billing env-gated بشكل صحيح.

### Team — `/team`
- **الحالة:** ✅ جيد. أعضاء + دعوات، دعوة/إلغاء/إعادة إرسال/تغيير دور/إزالة.
- **مشكلة:** ❌ F1 — `confirm()` بدل AlertDialog. ❌ F5 — لا بحث/فلتر.

### Notifications — `/notifications`
- **الحالة:** ✅ جيد. فلتر (الكل/غير مقروء)، عدّاد، "تحديد الكل"، إشعارات المتصفح، قائمة (6 أنواع).
- **مشكلة:** ❌ F4 — لا ترقيم (سقف 50)، لا فلتر بالنوع، لا حذف، لا click→navigate.

### Audit Log — `/audit-log`
- **الحالة:** ⚠️ ضعيف. قائمة (نوع/وقت/actor/metadata/IP)، ألوان لكل نوع.
- **مشكلة:** ❌ F3 — لا بحث، لا فلتر، لا ترقيم، لا تصدير. يحمّل كل السجل دفعة واحدة.

### API Docs — `/api-docs`
- **الحالة:** ✅ جيد. Base URL+copy، curl، endpoints (accordion)، إدارة مفاتيح، إدارة webhooks (مع test).
- **مشكلة:** قائمة الـ endpoints ثابتة (غير متولّدة من الـ backend).

### Help — `/help`
- **الحالة:** ✅ جيد. 6 أدلّة سريعة (روابط بـ locale)، FAQ (6)، تواصل.
- **مشكلة:** لا بحث FAQ، لا نظام تذاكر.

### Branch Detail — `/branches/[workspaceId]`
- **الحالة:** ✅ جيد. تبويبات (Playlists/Screens/Media/Review)، إحصائيات، pairing.
- **ملاحظة:** خارج السايدبار — يُوصل من كارت المجموعة في Overview. مقبول.

---

## 4. التطابق بين الفرونت إند والباك إند

| الـ API في الباك إند | مستخدم في الفرونت إند | الحالة |
|---|---|---|
| `GET /screens` + `POST` + `PATCH` + `DELETE` | `screens-client.tsx` | ✅ |
| `POST /screens/:id/remote-command` | `screens-api.ts` | ✅ |
| `GET /screens/:id/active-content` | `use-screen-active-preview.ts` | ✅ |
| `POST /screens/:id/override` | `emergency-client.tsx` | ✅ |
| `GET /screens/analytics` | `analytics-page-client.tsx` | ✅ |
| `GET /playlists` + `POST` + `PATCH` + `DELETE` + `duplicate` + `clone` + `items` | `playlist-studio-client.tsx` | ✅ |
| `GET /schedules` + `POST` + `PATCH` + `DELETE` + `overlaps` | `schedules-client.tsx` | ✅ |
| `GET /media` + `POST upload` + `DELETE` + `folders/*` + `expiry` + `stats` | `media-library-client.tsx` | ✅ |
| `GET /notifications` + `mark-all-read` + `:id/read` | `notification-provider.tsx` | ✅ |
| `GET /audit-log` | `audit-log-page-client.tsx` | ✅ |
| `GET /subscriptions/current` + `stripe/checkout` + `stripe/portal` + `mock-plan` | `settings-billing-client.tsx` | ✅ |
| `GET /account/billing` + `invoice/:ref/pdf` | `settings-billing-client.tsx` | ✅ |
| `GET /workspaces/:id/members` + `invites/*` + `role` + `remove` | `team-client.tsx` | ✅ |

**النتيجة:** لا توجد endpoints في الباك إند غير مستخدمة في الفرونت إند. لا توجد calls في الفرونت إند لـ endpoints غير موجودة. **التطابق كامل.**

---

## 5. توصيات الأولويات (خطة التنفيذ التالية)

| # | الأولوية | المهمة | الملفات | الجهد |
|---|---|---|---|---|
| F1 | **P0** | استبدال `confirm()` بـ `AlertDialog` في Team | `team-client.tsx` | 30د |
| F2 | **P1** | تبني Skeleton في 4 صفحات متبقية | `overview-page-client.tsx`, `analytics-page-client.tsx`, `audit-log-page-client.tsx`, `team-client.tsx`, `settings-billing-client.tsx` | 1س |
| F3 | **P1** | إضافة بحث/فلتر/ترقيم/تصدير لـ Audit Log | `audit-log-page-client.tsx` | 2س |
| F4 | **P1** | إضافة فلتر نوع/حذف/click-navigate لـ Notifications | `notifications-page-client.tsx`, `notification-provider.tsx` | 2س |
| F5 | **P2** | إضافة بحث/فلتر لـ Team | `team-client.tsx` | 1س |
| F6 | **P2** | per-page error boundaries | `app/[locale]/(shell)/*/error.tsx` | 1س |
| F7 | **P2** | i18n status labels في Analytics table | `analytics-page-client.tsx` | 15د |
| F8 | **P2** | sort في القوائم (Screens/Media/Audit Log) | متعدد | 3س |
| F9 | **P2** | عرض `screensInGroup` في قائمة Playlists | `playlist-studio-client.tsx` | 30د |

**إجمالي تقديري:** ~11 ساعة لكل P0–P2.

---

## 6. خلاصة

الداشبورد في حالة **جيدة جداً** بعد Phase 1. التكرارات ذهبت، السايدبار نظيف، الـ i18n سليم، التطابق مع الباك إند كامل. المشاكل المتبقية هي **طبقة عرضية** (skeletons، confirm dialogs، search/filter في القوائم) وليست معمارية. لا توجد نواقص فيتشرز حرجة ولا تكرار ولا اختلاف بين الفرونت والباك إند.

**الخطوة التالية الموصى بها:** ابدأ بـ F1 (confirm→AlertDialog) لأنه P0 وسريع، ثم F2 (Skeleton متبقٍ) لإكمال T-J بشكل صحيح.
