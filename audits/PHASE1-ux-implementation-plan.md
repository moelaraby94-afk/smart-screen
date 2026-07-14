# خطة التنفيذ الاحترافية — تجربة المستخدم وواجهة داشبورد الكلاينت

**الإصدار:** 1.1 · **التاريخ:** 2026-07-14 · **المصدر:** `audits/PHASE1-full-dashboard-analysis.md`
**الجمهور:** وكيل برمجي منفّذ (افترض استقلالية محدودة — اتّبع الوثيقة حرفياً).

> ⛔ **ابدأ من هنا:** إن كنت الإيجنت المكلّف بالإكمال، اقرأ **Part H — توجيه التنفيذ الصارم** (في آخر الملف) **أولاً وحرفياً**. كل قرار محسوم هناك؛ ممنوع الاجتهاد.
**الهدف:** أفضل وأسهل وأمتع تجربة مستخدم — عبر **تفكيك التشابك + ربط المبني + إصلاح الباجات + توحيد الطبقة العرضية**، مع بقاء كل فيتشر شغّالاً باحترافية.

> اقرأ أولاً: `PLAN-executable-remediation.md` §1 (القواعد الذهبية R1–R11) و`apps/dashboard/AGENTS.md`. هذه القواعد سارية هنا كلياً، خصوصاً **R2 (اقرأ قبل التغيير — أكّد العيب في الكود الحيّ أولاً)** و**R6 (i18n في كل نص، en+ar، RTL)** و**R3 (verify أخضر بعد كل مهمة)**.

---

## 0. المبادئ الحاكمة (Guiding Principles)

1. **One feature, one place** — لا صفحتان لنفس الشيء.
2. **Don't build, wire** — قبل بناء أي جديد، تأكّد أنه غير موجود ويتيم (نمط "المبني وغير المربوط" هو أكبر دَين).
3. **No page dies before its unique capability moves** — لا نحذف صفحة قبل نقل ميزتها الفريدة والتحقق منها.
4. **Redirect, don't 404** — كل route محذوف يُحوَّل بـ `redirect()` (يحفظ الروابط والـ bookmarks).
5. **Progressive disclosure** — الاختصار للأغلبية، السلسلة الكاملة للمتقدّم.
6. **كل نص عبر i18n (en+ar)، وكل تخطيط عبر خصائص منطقية (RTL).**
7. **مهمة واحدة = تركيز واحد = commit واحد + اختباره.** `npm run verify` أخضر بعد كل مهمة.

### تعريف "منجَز" (Definition of Done) — لكل مهمة
- [ ] العيب مؤكّد في الكود الحيّ قبل التغيير (`file:line`).
- [ ] التغيير محصور في ملفات المهمة.
- [ ] اختبار يفشل بدون التغيير وينجح معه (للباجات والمنطق).
- [ ] `npm run verify` أخضر (typecheck + lint + test + i18n + build).
- [ ] مفاتيح i18n جديدة في `en.json` **و** `ar.json` بنفس البنية؛ RTL محترم.
- [ ] لا تسريب أسرار/PII.
- [ ] commit واحد واضح: `fix(<area>): <what> — <why>` + الـ trailer.

---

## 1. خريطة الطريق (Roadmap Overview)

| المرحلة | العنوان | لماذا الآن | المخاطرة |
|---|---|---|---|
| **W0** | تأكيد الأساس + الأدلّة | لا نصلح ما هو مُصلَّح | منخفضة |
| **W1** | إصلاح الباجات المؤكّدة (B1–B9) | نزيف مباشر في التجربة | منخفضة |
| **W2** | ربط المبني (Wire the built) | قيمة جاهزة مدفوعة الثمن | منخفضة |
| **W3** | تفكيك التكرارات + IA + السايدبار | جوهر الالتباس | متوسطة |
| **W4** | توحيد الطبقة العرضية (Skeleton/Empty/Bulk/Sort/Export/Tabs/Confirm) | اتساق التجربة | متوسطة |
| **W5** | تبسيط الموديل (Quick Publish) | أعمق التباس مفاهيمي | متوسطة-عالية |
| **W6** | إغلاق الوصولية + responsive | جودة واحترافية | منخفضة |
| **W8** | المصطلحات + النصوص (Terminology & Microcopy) | لغة المنتج = هويته | منخفضة |
| **W9** | التنقّل داخل الصفحة + سطح التحكّم الكامل | إحساس الانتربرايز | متوسطة |
| **W10** | تكامل الإعدادات وسهولتها | تحكّم كامل بلا احتكاك | متوسطة |
| **W7** | إغلاق نواقص الفيتشرز (اختياري/لاحق) | نضج المنتج | متغيّرة |

**ترتيب التنفيذ الموصى:** W0 → W1 → W2 → W8 → W3 → W10 → W9 → W4 → W6 → W5 → W7.
(W1/W2 مكاسب سريعة؛ **W8 قبل W3** لأن توحيد المصطلحات يجب أن يسبق دمج الصفحات وتسمية الأقسام؛ W10 يلتقي مع T3.7.)

> **Part B (§ أدناه)** تحوي معايير الطبقة الاحترافية التفصيلية التي تغذّي W8/W9/W10. اقرأها كـ "دستور تجربة" قبل تنفيذها.

---

## المرحلة W0 — تأكيد الأساس

**T0.1 — أساس أخضر.** شغّل `npm run verify` وسجّل النتيجة. إن كانت حمراء على `main` قبل أي تغيير → **توقّف وأبلغ**.

**T0.2 — أكّد كل عيب.** لكل مهمة في W1–W6، افتح الملف/السطر المذكور وتأكّد أن العيب حقيقي. إن كان مُصلَّحاً → علّم المهمة "N/A — مُصلَّح" بدليل وتابع. (بنود §11 في الأوديت أمثلة لعيوب اختفت.)

---

## المرحلة W1 — إصلاح الباجات المؤكّدة

> كل مهمة: اقرأ الملف كاملاً، اكتب اختباراً يفشل، أصلِح، تحقّق.

### T1.1 — رسالة الطوارئ لا تُرسَل (B1) 🔴 P0
- **الملفات:** `features/dashboard/emergency-client.tsx`, `features/screens/api/screens-api.ts`, backend override endpoint، `emergency-client` test.
- **العيب:** `handleActivate` (`:59-62`) يرسل `{ playlistId: null, durationMinutes }` فقط — `message` يُهمَل.
- **القرار المطلوب أولاً (§ توقّف واسأل):** ما وجهة الرسالة؟ الأرجح **إنشاء emergency canvas/overlay ضمني** يحمل النص ويُبثّ كـ override playlist، أو تمرير `message` لحقل جديد يعرضه المشغّل.
- **الخطوات:**
  1. اختبار يفشل: التنشيط برسالة يجب أن يُمرّر النص للـ API.
  2. أضِف مسار override يقبل `message`/`emergencyText` أو أنشئ overlay canvas ثم اربطه.
  3. اجعل المشغّل يعرض النص (تنسيق مع `apps/player` — اقرأ `AGENTS.md`).
- **DoD:** رسالة الطوارئ تظهر فعلاً على الشاشة؛ اختبار يثبت وصول النص.

### T1.2 — "كل الشاشات" في الطوارئ (B2) 🔴 P0
- **الملفات:** نفس `emergency-client.tsx`.
- **العيب:** الزر `disabled={... || !selectedScreenId ...}` (`:174`) وخيار "الكل" قيمته `''` (`:145`) → البثّ الجماعي مستحيل.
- **الخطوات:** عند اختيار "الكل"، فعّل الزر وكرّر الـ override على كل الشاشات (أو مسار bulk override واحد). أضِف تأكيداً "ستؤثر على N شاشة".
- **DoD:** تنشيط طوارئ على كل الشاشات يعمل؛ اختبار للحالتين (شاشة واحدة/الكل).

### T1.3 — إعادة تحميل الإشعارات (B3) 🔴 P0
- **الملفات:** `features/notifications/notifications-page-client.tsx:61`.
- **العيب:** `window.location.reload()` عند mark-all-read.
- **الخطوات:** استبدله بتحديث state (اضبط كل الإشعارات `read=true` محلياً + استدعاء الـ API؛ Optimistic مع rollback عند الفشل).
- **DoD:** لا reload؛ العدّاد يصفّر فوراً؛ اختبار للحالة.

### T1.4 — locale ثابت في زر الترقية (B4) 🟠 P1
- **الملفات:** `features/settings/settings-billing-client.tsx:167`.
- **العيب:** `window.location.href = '/en/billing'`.
- **الخطوات:** استخدم `locale` (متوفّر عبر `useLocale()` بالفعل في الملف `:53`) → `/${locale}/billing` (أو بعد دمج W3، وجهة `/${locale}/settings/billing`). استخدم `router.push` بدل `window.location`.
- **DoD:** الزر يفتح الوجهة بالـ locale الصحيح.

### T1.5 — روابط المساعدة الثابتة (B5) 🟠 P1
- **الملفات:** `features/help/help-support-client.tsx:51,57,...`.
- **العيب:** `href:'/screens'`, `'/media'` بلا locale.
- **الخطوات:** مرّر `locale` (أو استخدم `pathWithLocale`) لكل رابط دليل.
- **DoD:** كل الروابط تعمل في ar و en؛ `i18n:check` أخضر.

### T1.6 — expiry معطّل في Content (B6) 🟠 P1
- **الملفات:** `features/media/content-client.tsx:135-143`.
- **العيب:** `<Select>` و`<input type=date>` بلا `value`/`onChange`.
- **القرار:** بما أن Content سيُدمج في Media (W3/D2)، **لا تُصلِح هنا** — بل تأكّد أن expiry في Media (info dialog) شغّال، ثم احذف Content. إن لزم إبقاء Content مؤقتاً: اربط الـ handlers أو أزِل الـ UI الميت (لا تترك حقلاً كاذباً).
- **DoD:** لا UI ميت يوهم المستخدم؛ expiry يعمل في الوجهة الباقية.

### T1.7 — نصوص Analytics الثابتة (B7) 🟡 P2
- **الملفات:** `features/analytics/analytics-page-client.tsx:28-37`.
- **العيب:** `formatRelative` يرجّع `Xs/Xm/Xh/Xd ago` إنجليزية.
- **الخطوات:** استخدم `Intl.RelativeTimeFormat(locale)` أو مفاتيح i18n مع تعدّدية. أضِف المفاتيح en+ar.
- **DoD:** الوقت النسبي بالعربية في locale=ar؛ `i18n:check` أخضر.

---

## المرحلة W2 — ربط المبني (Wire the Built)

> قيمة جاهزة — المكوّنات موجودة، فقط غير مربوطة.

### T2.1 — ربط GlobalSearch + ⌘K (B9) 🟠 P1
- **الملفات:** `components/layout/header.tsx`, `features/search/global-search.tsx`, `i18n/messages/{en,ar}.json`.
- **العيب:** المكوّن يتيم (لا مستوردين).
- **الخطوات:**
  1. اقرأ `global-search.tsx` كاملاً وافهم واجهته.
  2. أضِف زر بحث في الهيدر (بين WorkspaceSwitcher وNotificationBell) يفتح المكوّن.
  3. اربط اختصار `⌘K` / `Ctrl+K` عالمياً (listener في الـ shell).
  4. تأكّد a11y: `role="dialog"`, `aria-modal`, focus trap, `aria-label` للإدخال (بعضها موجود).
- **DoD:** البحث مرئي وقابل للفتح بالزر وبالاختصار؛ يتنقّل للنتائج؛ يعمل RTL.

### T2.2 — قرار OverviewMetrics (B8) 🟡 P2
- **الملفات:** `features/dashboard/overview-metrics.tsx`, `client-home-dashboard.tsx`.
- **العيب:** يتيم.
- **الخطوات:** قرّر: إمّا **استخدمه** في Overview (إن أضاف قيمة فوق `TotalsSection`) أو **احذفه** ككود ميت. لا تترك يتيماً.
- **DoD:** إمّا مستخدَم أو محذوف؛ لا كود ميت.

### T2.3 — تبنّي Skeleton في كل الصفحات (U1) 🟡 P2
- **الملفات:** كل feature client بحالة تحميل + `components/ui/skeleton.tsx`.
- **العيب:** Skeleton مستخدَم في موضع واحد؛ الباقي Spinners.
- **الخطوات:** استبدل Spinners بـ skeleton screens تحاكي التخطيط (كروت/جداول/قوائم). صفحة واحدة لكل commit، ابدأ بالأعلى مروراً (Overview, Screens, Media, Playlists, Schedules, Analytics).
- **DoD:** كل صفحة رئيسية تعرض skeleton أثناء التحميل؛ `aria-busy`/`aria-hidden` صحيحة.

---

## المرحلة W3 — تفكيك التكرارات + IA + السايدبار

> **الترتيب حاسم:** انقل الميزة الفريدة أولاً، تحقّق، ثم حوّل الـ route، ثم عدّل السايدبار. **زوج واحد لكل دورة، verify بينها.** ابدأ بالأبسط.

### T3.1 — Screens ← Displays (D1) — الأبسط
1. أضِف toggle "كروت/جدول" لـ `ScreensClient` (Table view من `DisplaysClient`).
2. تحقّق أن كل ميزات Displays موجودة في Screens (هي مجموعة فرعية صارمة).
3. `app/[locale]/(shell)/displays/page.tsx` → `redirect()` إلى `/screens`.
4. احذف `displays` من `CLIENT_NAV` (`shell-sidebar.tsx:62`) وأزِل مفتاح i18n.
- **DoD:** `/displays` يحوّل لـ `/screens`؛ toggle الجدول يعمل؛ verify أخضر.

### T3.2 — Media ← Content (D2)
1. أضِف toggle للجدول في `MediaLibraryClient`.
2. تأكّد expiry شغّال في Media (يحلّ B6).
3. `content/page.tsx` → `redirect()` إلى `/media`.
4. احذف `content` من `CLIENT_NAV` (`:63`) + مفتاح i18n + ملف `content-client.tsx` (بعد قراءته كاملاً — R2).
- **DoD:** `/content` يحوّل لـ `/media`؛ لا فقدان ميزة؛ verify أخضر.

### T3.3 — Playlists ← Display Groups (D4)
1. أضِف عمود/شارة "عدد الشاشات المستخدِمة" (`screensInGroup`) لقائمة `PlaylistStudioClient`.
2. `displays/groups/page.tsx` → `redirect()` إلى `/playlists`.
3. احذف `displayGroups` من `MANAGEMENT_NAV` (`:68`).
- **DoD:** عدّاد الشاشات ظاهر في Playlists؛ `/displays/groups` يحوّل؛ verify أخضر.

### T3.4 — Schedules ← Campaigns (D3)
1. أضِف عرض Timeline (7×24 grid) لـ `SchedulesClient` كـ view toggle (تقويم/Timeline/قائمة).
2. `campaigns/page.tsx` → `redirect()` إلى `/schedules`.
3. احذف `campaigns` من `SCHEDULING_NAV` (`:75`).
- **DoD:** Timeline متاح في Schedules؛ `/campaigns` يحوّل؛ verify أخضر.

### T3.5 — Analytics ← Proof of Play (D5)
1. أضِف بحث + تصدير CSV + جدول per-screen لـ `AnalyticsPageClient` (من `ProofOfPlayClient`).
2. `proof-of-play/page.tsx` → `redirect()` إلى `/analytics`.
3. احذف `proofOfPlay` من `TOOLS_NAV` (`:80`).
4. **صدق التسمية:** أبقِ الاسم "Analytics"؛ لا تدّعِ "Proof of Play" قبل وجود بيانات تشغيل حقيقية (impressions/play count).
- **DoD:** بحث/CSV/جدول في Analytics؛ `/proof-of-play` يحوّل؛ verify أخضر.

### T3.6 — دمج Billing (A2 + B4)
1. انقل اختيار الخطة + checkout + mock toggle من `BillingClient` إلى `SettingsBillingClient`.
2. `billing/page.tsx` → `redirect()` إلى `/settings/billing`.
3. تأكّد B4 مُصلَح (وجهة الترقية داخلية بالـ locale).
- **DoD:** صفحة فواتير واحدة كاملة؛ `/billing` يحوّل؛ verify أخضر. (**R10 — أي شيء يمسّ Stripe: اختبار + ملاحظة مخاطر.**)

### T3.7 — إضافة Workspace Settings + تبويب Settings (A1 + U2)
1. أضِف `/settings/workspace` للسايدبار — الأفضل عبر **تبويب Settings** (Profile | Workspace | Billing) باستخدام مكوّن `Tabs` الموجود.
2. اربط التبويبات بالثلاث صفحات.
- **DoD:** إعدادات الورك سبيس قابلة للوصول؛ تنقّل تبويبي بين صفحات Settings؛ verify أخضر.

### T3.8 — إعادة هيكلة السايدبار النهائية
- **الملفات:** `shell-sidebar.tsx`, `i18n` (مفاتيح الأقسام).
- طبّق البنية من §2.3 في الأوديت: OVERVIEW / FLEET / CONTENT / PLAYBACK / INSIGHTS / MANAGEMENT / RESOURCES.
- انقل Emergency إلى FLEET، Templates إلى CONTENT، Team/Billing/Settings إلى MANAGEMENT.
- حدّث `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE` بإزالة المفاتيح المحذوفة.
- **DoD:** سايدبار ~16 عنصر بلا تكرار؛ كل الأقسام مترجمة en+ar؛ الحالة النشطة صحيحة؛ verify أخضر.

---

## المرحلة W4 — توحيد الطبقة العرضية

### T4.1 — تأكيدات الحذف في الفريق (U3) 🟡 P2
- `features/team/team-client.tsx`: لفّ "إزالة عضو" و"إلغاء دعوة" بـ `AlertDialog` (موجود). نص واضح "لا يمكن التراجع".
- **DoD:** لا حذف بلا تأكيد؛ اختبار.

### T4.2 — فرز + تصدير + عمليات جماعية (U4)
- أضِف فرز (اسم/تاريخ/حالة) لـ Screens/Media/Playlists/Schedules/Audit Log.
- أضِف تصدير CSV حيث يفيد (Screens, Audit Log) — أعِد استخدام منطق CSV من PoP.
- وسّع bulk actions (حذف/نشر/تعيين) حيث ينقص.
- صفحة واحدة لكل commit.
- **DoD:** كل قائمة رئيسية قابلة للفرز؛ التصدير يعمل؛ verify أخضر.

### T4.3 — حالات فراغ بـ CTA
- راجع كل `EmptyState`: أضِف زر إجراء أساسي ("أضِف أول شاشة"، "ارفع ميديا"...).
- **DoD:** كل حالة فراغ توجّه لخطوة تالية.

### T4.4 — Audit Log: بحث/فلتر/pagination
- `audit-log-page-client.tsx`: أضِف بحثاً، فلتر بالنوع/التاريخ، pagination (لا تحميل كامل السجل).
- **DoD:** لا تحميل كامل؛ فلترة تعمل.

### T4.5 — Notifications: فلتر نوع + click→navigate + pagination
- بعد T1.3: أضِف فلتر بالنوع، انتقال عند النقر للصفحة المرتبطة، وتحميل تدريجي.
- **DoD:** تنقّل من الإشعار يعمل؛ لا سقف 50 صارم.

---

## المرحلة W5 — تبسيط الموديل (Quick Publish)

### T5.1 — اختصار "انشر الآن"
- **الفكرة:** من صفحة الشاشة أو الميديا، زر "انشر هذا المحتوى على الشاشة الآن" → ينشئ playlist ضمنية (أو يستخدم override) ويربطها، دون إجبار المستخدم على السلسلة كاملة.
- **الخطوات:** صمّم تدفّقاً واحداً (اختر محتوى → اختر شاشة/مجموعة → انشر). أعِد استخدام override/playlist APIs الموجودة.
- **القرار (توقّف واسأل):** هل الاختصار ينشئ playlist دائمة أم override مؤقّت؟ يؤثر على السلوك طويل المدى.
- **DoD:** مستخدم جديد ينشر محتوى على شاشة في خطوة/خطوتين؛ السلسلة الكاملة تبقى للمتقدّم.

### T5.2 — توضيح Studio ↔ Templates
- أضِف "Edit in Studio" لقوالب المستخدم في Templates؛ أضِف حذف canvas داخل Studio؛ وضّح العلاقة (Templates = معرض، Studio = محرّر).
- **DoD:** إدارة التصاميم من مكان واضح؛ لا حذف مفقود.

---

## المرحلة W6 — الوصولية + الاستجابة

### T6.1 — الحالة بنص+أيقونة لا لون فقط
- ONLINE/OFFLINE/MAINTENANCE: أضِف أيقونة/نص مع اللون (Screens/Analytics/Emergency).
- **DoD:** يجتاز 1.4.1 (لا اعتماد على اللون وحده).

### T6.2 — aria-live / aria-busy + جداول موبايل
- أضِف `aria-live` لمنطقة Toasts، `aria-busy` لحاويات التحميل، ولفّ الجداول بـ `overflow-x-auto` على الموبايل.
- **DoD:** قارئ الشاشة يعلن التحديثات؛ لا فيض أفقي للجداول.

### T6.3 — تدقيق أزرار الأيقونات والنماذج
- تأكّد `aria-label` لكل زر أيقونة، و`<label>` مرتبط (لا placeholder فقط) لكل حقل.
- **DoD:** تدقيق موثّق؛ لا زر أيقونة بلا اسم.

---

## المرحلة W7 — إغلاق نواقص الفيتشرز (لاحق/اختياري)

مرتّبة بالقيمة؛ كلٌّ يحتاج قراراً منفصلاً (بعضها بنية تحتية — **توقّف واسأل** قبل خدمة طرف ثالث):
1. **AI حقيقي** — ربط بنموذج فعلي (للـ Claude: اقرأ skill `claude-api` أولاً) أو إبقاء Demo.
2. **Proof of Play حقيقي** — endpoint impressions/play-count فعلي ثم فصل الصفحة من جديد.
3. **Screenshot مباشر** من المشغّل، **OTA updates**، **Map view** للمواقع.
4. **Schedule recurrence** (يومي/أسبوعي/شهري) + قوالب جدولة + جدولة أوقات الصلاة.
5. **Version history** في الواجهة، **approval workflow**، **multi-zone** واضح.
6. **API Docs try-it-now** + webhook delivery logs.

---

# ═══════════════════════════════════════════════════════════
# Part B — طبقة الاحترافية (Enterprise UX Layer)
# ═══════════════════════════════════════════════════════════

> **دستور التجربة.** هذه المعايير تُطبَّق **أفقياً على كل صفحة**، وتغذّي مهام W8/W9/W10. القاعدة العليا: **الاتساق يتفوّق على الإبداع الفردي** — عنصر واحد يتصرّف بنفس الطريقة في كل مكان.

---

## B1 — المعجم القانوني للمصطلحات (Canonical Terminology)

المصطلح غير المتّسق = منتج يبدو مصنوعاً من فِرق منفصلة. التدقيق كشف **تعارضات حقيقية في `nav`**:

| التعارض | الدليل | القرار القانوني |
|---|---|---|
| **Screens وDisplays كلاهما "الشاشات"** بالعربي | `nav.screens`="الشاشات"، `nav.displays`="الشاشات" — **نفس الكلمة حرفياً** | مصطلح واحد فقط: **Screen / شاشة**. تُحذف "Displays" (D1) وكل مشتقّاتها |
| **"الفروع" مقابل "مساحة العمل"** لنفس الكيان | `nav.workspaceSwitcher`="الفروع"، `nav.workspaceSettings`="مساحة العمل"، `clientBrandLine`="الفرع" | اختر **واحداً** كقانون. الموصى: **Branch / فرع** (أوضح لعميل multi-location) وتُحذف "Workspace/مساحة عمل" من الواجهة (تبقى داخلياً في الكود فقط) |
| **Media مقابل Content** | `nav.media`="الوسائط"، `nav.content`="المحتوى" | مصطلح واحد: **Media / الوسائط** (تُحذف Content بالدمج D2) |
| **Analytics مقابل Proof of Play** | `nav.analytics`="التحليلات"، `nav.proofOfPlay`="إثبات التشغيل" | **Analytics / التحليلات** فقط. "إثبات التشغيل" اسم كاذب (لا بيانات تشغيل) — يُحذف حتى وجود PoP حقيقي |
| **"Display Groups / مجموعات الشاشات"** تدير playlists | `nav.displayGroups`="مجموعات الشاشات" | يُحذف بالدمج (D4)؛ لا مصطلح "مجموعات شاشات" يشير لـ playlists |
| **اسم العلامة مضطرب** | `nav.brandName`="Cloud Signage / كلاود ساينج"، لكن المشروع "Cloud-Screen" والدعم `support@cloudscreen.app` | **وحّد اسم علامة واحد** عبر كل الواجهة والإيميلات والـ favicon (توقّف واسأل عن الاسم النهائي) |

**قاموس المنتج (Product Glossary) — يُوثّق كملف مرجعي `docs/terminology.md` ويُفرض:**

| المفهوم | EN (قانوني) | AR (قانوني) | تجنّب |
|---|---|---|---|
| جهاز العرض | Screen | شاشة | Display, Device, Monitor |
| مجموعة تنظيمية | Branch | فرع | Workspace, Site, Org |
| ملف وسائط | Media | وسائط | Content, Asset, File |
| تسلسل عرض | Playlist | قائمة تشغيل | Group, Channel |
| قاعدة توقيت | Schedule | جدولة | Campaign |
| تصميم | Canvas / Template | لوحة / قالب | Design, Layout |
| تقارير | Analytics | تحليلات | Proof of Play, Reports |

**مهمة W8.1:** أنشئ `docs/terminology.md`، ثم مرّر على `en.json`/`ar.json` وطبّق القاموس، واحذف المفاتيح المهجورة بعد الدمج. **DoD:** لا مصطلحين لمفهوم واحد؛ `i18n:check` أخضر.

---

## B2 — معايير النصوص (Microcopy Standards)

### نبرة الصوت (Voice)
واضحة، واثقة، موجزة، **بلا مبالغة تسويقية داخل المنتج**. الأزرار تَعِد بفعل، العناوين تصف مكاناً، الأخطاء تقترح حلاً.

### القواعد
| العنصر | القاعدة | مثال جيّد | تجنّب |
|---|---|---|---|
| عنوان الصفحة | اسم المكان، بلا فعل | "الشاشات" | "إدارة شاشاتك" |
| زر أساسي | فعل + مفعول | "إضافة شاشة" / "Add screen" | "جديد" / "إرسال" |
| حالة فارغة | جملة + سبب + CTA | "لا شاشات بعد. اربط أول شاشة لتبدأ." + زر | أيقونة صامتة |
| رسالة خطأ | ماذا + لماذا + الحل | "تعذّر الحفظ — انقطع الاتصال. أعِد المحاولة." | "حدث خطأ" |
| تأكيد حذف | العنصر + عدم الرجعة + عدد | "حذف 3 شاشات؟ لا يمكن التراجع." | "هل أنت متأكد؟" |
| Toast نجاح | نتيجة ملموسة | "نُشرت قائمة التشغيل على 5 شاشات" | "تم" |
| Tooltip | يشرح فائدة لا يكرّر التسمية | "يوقف العرض أثناء الصلاة تلقائياً" | "أوقات الصلاة" |
| التواريخ/الأرقام | Locale-aware (`Intl`) + أرقام tabular | ١٤ يوليو ٢٠٢٦ | `2026-07-14` ثابت |

### مبادئ إضافية
- **أرقام عربية hindi/latn حسب locale** عبر `Intl.NumberFormat`، لا نصوص ثابتة (يصلح B7).
- **الوقت النسبي** عبر `Intl.RelativeTimeFormat` (يصلح B7 نهائياً).
- **لا اختصارات غامضة** (PoP, WS) في الواجهة.
- **الاتساق في صيغة الجمع** — استخدم plural من next-intl (`{count, plural, ...}`).

**مهمة W8.2:** جرد نصوص كل صفحة مقابل هذه القواعد (استخدم جدول §B الفرعي لكل صفحة أدناه). صفحة واحدة لكل commit. **DoD:** كل صفحة تمرّ القائمة؛ `i18n:check` أخضر.

### تدقيق نصّي سريع لكل صفحة (أمثلة ملموسة للإصلاح)
| الصفحة | الإصلاح النصّي |
|---|---|
| Emergency | labels الكروت تقول "totalPlays/impressions" بينما البيانات uptime — صحّح النصوص لتطابق البيانات |
| Proof of Play → Analytics | احذف كل نصوص "إثبات التشغيل"؛ لا تَعِد ببيانات غير موجودة |
| AI | أبقِ "Demo" واضحاً؛ نبرة "معاينة" لا "قدرة حقيقية" |
| Help | نصوص الروابط تصف الوجهة بوضوح + locale (B5) |
| Settings/Billing | "ترقية الخطة" تفتح داخل المنتج لا `/en/` (B4) |

---

## B3 — التنقّل داخل الصفحة (In-page Navigation & Interaction)

### تشريح الصفحة القياسي (Page Anatomy) — موحّد لكل صفحة
```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb ›  عنوان الصفحة            [إجراء أساسي]      │  ← header ثابت (sticky)
│ [بحث] [فلتر ▾] [فرز ▾] [عرض: كروت/جدول] [كثافة] [تصدير] │  ← شريط تحكّم القائمة
├─────────────────────────────────────────────────────────┤
│ (اختيار متعدّد → يظهر شريط bulk عائم)                    │
│ المحتوى (كروت/جدول)                    │ لوحة سياقية ▸  │  ← side panel لا dialog للتفاصيل
└─────────────────────────────────────────────────────────┘
```

### قواعد التفاعل داخل الصفحة
1. **ترتيب التركيز (Focus order)** منطقي: بحث → فلاتر → أول صف → إجراءات الصف. `Tab`/`Shift+Tab` يتبعان الترتيب البصري (يحترم RTL).
2. **تنقّل القوائم بالكيبورد:** `↑/↓` بين الصفوف، `Enter` يفتح، `Space` يختار، `Esc` يغلق اللوحة/يلغي الاختيار.
3. **لوحة سياقية (Side Panel) بدل Dialog** لعرض/تعديل التفاصيل — تُبقي السياق (القائمة) مرئياً؛ Dialog يُحجَز للعمليات القاطعة (حذف/تأكيد).
4. **تعديل داخل السطر (Inline edit)** للحقول البسيطة (اسم، مدة) — نقرة → حقل → `Enter` يحفظ، `Esc` يلغي.
5. **حالة الصفحة في الـ URL** (deep-linkable): البحث/الفلتر/الفرز/التبويب/العرض تُخزَّن في query params — مشاركة الرابط تعيد نفس المشهد، والـ back يعمل.
6. **Breadcrumbs** حقيقية في الصفحات التفصيلية (Screen detail, Branch detail) مع "رجوع" يحفظ فلاتر القائمة.
7. **الإجراء الأساسي دائماً أعلى-يسار المحتوى (أو أعلى-يمين في RTL)** وثابت أثناء التمرير.
8. **الأقسام الطويلة** (Settings, Studio) لها **تنقّل جانبي/anchor** (Tabs أو in-page TOC) لا تمرير أعمى.

**مهمة W9.1:** طبّق تشريح الصفحة القياسي على القوائم الرئيسية (Screens/Media/Playlists/Schedules/Analytics/Team/Audit Log)، بادئاً بمكوّن `ListShell` قابل لإعادة الاستخدام (header + control bar + bulk bar + content + side panel). **DoD:** القوائم الرئيسية تشترك في نفس التشريح والتنقّل الكيبوردي؛ حالة القائمة في الـ URL.

---

## B4 — سطح التحكّم الكامل (Control Surface)

انطباع "التحكّم الكامل" = المستخدم يشعر أنه يقود المنتج لا يتسوّل منه.

### 1) Command Palette (⌘K) — يبني على `GlobalSearch` اليتيم (B9)
لا بحث فقط، بل **أوامر**: "إضافة شاشة"، "رفع وسائط"، "الذهاب لـ...", "تبديل الفرع"، "الوضع الليلي". قابل للبحث، بأيقونات واختصارات.

### 2) خريطة الاختصارات العامة (Global Shortcuts)
| الاختصار | الفعل |
|---|---|
| `⌘/Ctrl + K` | Command palette |
| `/` | تركيز البحث في الصفحة |
| `g` ثم `s/m/p/...` | انتقال سريع (go to Screens/Media/Playlists) |
| `c` | إنشاء (سياقي حسب الصفحة) |
| `?` | لوحة الاختصارات |
| `Esc` | إغلاق/إلغاء |
موثّقة في لوحة `?` قابلة للفتح.

### 3) تحكّم القوائم الموحّد (لكل قائمة)
بحث · فلتر (متعدّد) · فرز · تبديل عرض (كروت/جدول) · **كثافة (مريح/مضغوط)** · **أعمدة قابلة للتخصيص** (جدول) · **Saved Views** (فلاتر محفوظة بأسماء) · تصدير.

### 4) العمليات الجماعية في كل مكان (Bulk everywhere)
اختيار متعدّد + شريط bulk عائم يعرض "N مختار" + إجراءات (حذف/نشر/تعيين/نقل) + "اختيار الكل عبر الصفحات".

### 5) التراجع والتفاؤل (Undo & Optimistic)
- **Optimistic UI** لكل عملية سريعة (تحديث فوري + rollback عند الفشل) — يزيل انتظار الشبكة.
- **Undo toast** ("تم الحذف — تراجع") للعمليات القابلة للعكس بدل تأكيد ثقيل مسبق حيثما أمكن.

**مهام W9:** W9.2 Command palette (أوامر+تنقّل)، W9.3 لوحة اختصارات `?`، W9.4 Saved Views + كثافة + تخصيص أعمدة لجدول واحد كنمط ثم التعميم، W9.5 Optimistic+Undo لعمليات الحذف. **DoD لكل:** يعمل بالكيبورد وRTL، مترجم en+ar، verify أخضر.

---

## B5 — الإعدادات: السهولة والتكامل (Settings — Ease & Integration)

### نموذج الإعدادات الموحّد
ثلاث مناطق واضحة، متبوّبة تحت **مظلّة Settings واحدة** (يحلّ A1/U2):

```
Settings
├─ Profile      (أنا: اسم، إيميل، 2FA، إشعاراتي، اللغة، GDPR)
├─ Workspace    (الفرع: اسم، لغة افتراضية، توقيت، إيقاف، صلاة، رمضان، danger zone)
└─ Billing      (الخطة، الفواتير، وسيلة الدفع)
```

### مبادئ التكامل والسهولة
1. **تبويب واحد** (`Tabs` الموجود) — تنقّل فوري بين المناطق الثلاث بلا فقدان سياق.
2. **إعدادات سياقية (Contextual deep-links):** من أي فيتشر، أيقونة ⚙ صغيرة تقفز مباشرة للإعداد المعني (مثلاً من Prayer widget → إعدادات الصلاة؛ من Screens → حدود الخطة). "أعدّها من مكان استخدامها".
3. **بحث داخل الإعدادات** — حقل يفلتر كل الحقول عبر التبويبات (انتربرايز قياسي).
4. **نمط حفظ متّسق:** إمّا **Autosave** بمؤشّر "تم الحفظ" أو زر حفظ صريح — **لا خلط**. + **حارس التغييرات غير المحفوظة** (تنبيه عند المغادرة).
5. **Danger Zone** مفصولة بصرياً (حذف/نقل/إيقاف الفرع) بتأكيد يكتب فيه المستخدم الاسم.
6. **الصلاحيات مرئية:** الإعداد المقيّد بدور يظهر معطّلاً بتلميح "يتطلّب دور مالك"، لا يختفي بصمت.

**مهمة W10.1** (توسّع T3.7): طبّق نموذج التبويب الموحّد + الحفظ المتّسق + حارس التغييرات + Danger Zone.
**مهمة W10.2:** أضِف deep-links سياقية (⚙) من 3 فيتشرز على الأقل (Screens/Prayer/Billing) + بحث الإعدادات. **DoD:** كل الإعدادات قابلة للوصول من مظلّة واحدة وسياقياً؛ لا فقدان تغييرات؛ verify أخضر.

---

## B6 — نظام الحالات الموحّد (State System)

كل مكوّن قائمة/بطاقة يجب أن يعالج **كل** هذه الحالات صراحةً — لا حالة منسيّة:

| الحالة | المعالجة القياسية |
|---|---|
| تحميل أولي | **Skeleton** يحاكي التخطيط (لا spinner) — U1 |
| تحميل لاحق (revalidate) | مؤشّر خفيف بلا حجب المحتوى |
| فارغ (لا بيانات) | EmptyState + سبب + CTA أساسي |
| فارغ بعد فلترة | "لا نتائج لبحثك" + زر مسح الفلتر (مختلف عن الفارغ الحقيقي) |
| خطأ | رسالة + سبب + زر إعادة محاولة (لا toast صامت) |
| بلا صلاحية | حالة واضحة "يتطلّب دور X" لا صفحة فارغة |
| offline/غير متصل | لافتة + وضع للقراءة فقط عند الإمكان |
| نجاح عملية | toast بنتيجة ملموسة (B2) |

**مهمة W6.4 (يمتد W4):** أنشئ حالات موحّدة كمكوّنات (`ListStates`) واستخدمها في القوائم الرئيسية. **DoD:** كل قائمة رئيسية تعالج الحالات الثماني.

---

## B7 — الاتساق والكثافة والجودة البصرية (Consistency & Density)

- **سُلّم مسافات واحد** (4/8/12/16/24) مفروض عبر tokens موثّقة (يعالج نقص توثيق design tokens).
- **كثافة مزدوجة:** "مريح" افتراضي، "مضغوط" لمشغّلي الأساطيل الكبيرة (انتربرايز).
- **تكافؤ الجدول/الكارت:** نفس البيانات والإجراءات في العرضين.
- **نظام أيقونات ثابت** (lucide، stroke موحّد `ICON_STROKE`).
- **نظام حالة موحّد بصرياً** (لون + أيقونة + نص) عبر Screens/Analytics/Emergency (يعالج a11y §B6/T6.1).
- **حركة هادفة:** انتقالات ≤200ms، تحترم `prefers-reduced-motion` وRTL.

**مهمة W8.3 / W9.6:** وثّق design tokens في `docs/design-tokens.md`؛ أضِف مبدّل الكثافة؛ وحّد نظام الحالة البصري. **DoD:** tokens موثّقة؛ الكثافة تعمل؛ الحالة موحّدة عبر الصفحات.

---

## B8 — خلاصة مهام Part B (تُدمج في السجل)

| المهمة | الطبقة | يعتمد على |
|---|---|---|
| W8.1 معجم مصطلحات قانوني + تنظيف i18n | B1 | — (قبل W3) |
| W8.2 تدقيق نصوص كل صفحة | B2 | W8.1 |
| W8.3 توثيق design tokens | B7 | — |
| W9.1 `ListShell` + تشريح صفحة موحّد | B3 | W3 |
| W9.2 Command palette (أوامر+تنقّل) | B4 | B9/T2.1 |
| W9.3 لوحة اختصارات `?` | B4 | W9.2 |
| W9.4 Saved views + كثافة + أعمدة | B4/B7 | W9.1 |
| W9.5 Optimistic + Undo | B4 | — |
| W10.1 نموذج إعدادات متبوّب + حفظ متّسق + حارس | B5 | T3.7 |
| W10.2 deep-links سياقية + بحث الإعدادات | B5 | W10.1 |
| W6.4 نظام حالات موحّد (`ListStates`) | B6 | W4/U1 |

---

## 2. مخطّط التبعيّات (Dependency Graph)

```
W0 (تأكيد)
 ├─> W1 (باجات) ─────────┐
 ├─> W2 (ربط) ───────────┤
 └─> W8 (مصطلحات+نصوص) ───┤   ← قبل W3 (المصطلح يسبق الدمج)
                         ├─> W3 (IA/دمج) [T1.4/T1.6 يلتقيان T3.6/T3.2]
                         │      ├─> W10 (تكامل الإعدادات) [يوسّع T3.7]
                         │      ├─> W9 (تشريح صفحة+تحكّم) [W9.2 يعتمد B9/T2.1]
                         │      └─> W4 (طبقة عرضية) ──> W6 (a11y + ListStates)
                         │             └─> W5 (موديل/Quick Publish)
                         └─> W7 (فيتشرز — مستقل، لاحق)
```

- **W1/W2/W8 مستقلّة** ويمكن توازيها؛ لكن **W8 يجب أن يسبق W3** (توحيد المصطلح قبل دمج الصفحات وتسمية الأقسام).
- **T1.4 (locale الفواتير)** و**T1.6 (expiry Content)** يُغلقان نهائياً داخل **T3.6/T3.2** — نسّق حتى لا تُصلِح ثم تحذف.
- **W3 يسبق W9/W10/W4/W5** (لا معنى لتوحيد تشريح/تحكّم/إعدادات فوق صفحات ستُدمج).
- **W9.2 (Command palette)** يعتمد على ربط `GlobalSearch` في **T2.1**.

---

## 3. جدول التحويلات (Route Redirects)

| Route قديم | الإجراء | الوجهة |
|---|---|---|
| `/displays` | redirect | `/screens` |
| `/content` | redirect | `/media` |
| `/campaigns` | redirect | `/schedules` |
| `/displays/groups` | redirect | `/playlists` |
| `/proof-of-play` | redirect | `/analytics` |
| `/billing` | redirect/merge | `/settings/billing` |
| `/settings/workspace` | **إضافة للسايدبار** | (تبويب Settings) |

---

## 4. متى تتوقّف وتسأل (Stop & Ask)

- **T1.1** — وجهة رسالة الطوارئ (overlay canvas؟ حقل جديد؟).
- **T5.1** — Quick Publish: playlist دائمة أم override مؤقّت؟
- **W7** — أي خدمة طرف ثالث (AI model, screenshot pipeline, map provider).
- أي تغيير يمسّ **Stripe/الفوترة** (T3.6) — R10.
- أي عيب **لا يطابق** الكود الحيّ — أبلغ ولا تفرض التغيير.

---

## 5. قالب العمل لكل مهمة

```
## المهمة <ID> — <العنوان>
- العيب مؤكّد؟ (نعم/لا + file:line)            [R2/T0.2]
- الملفات: <...>
- الوثائق المقروءة: <AGENTS.md / node_modules docs>  [R1]
- اختبار فاشل أولاً (باج/منطق): <path>          [R8]
- ملخّص التغيير: <ماذا + لماذا>
- verify: <أخضر/أحمر + الإصلاح>                  [R3]
- i18n en+ar؟ RTL؟ عزل المستأجر؟ أسرار آمنة؟     [R6/R7/R10]
- Commit: <الرسالة>
- معايير القبول: [ ] ... [ ] ...
```

---

## 6. سجل التنفيذ (Execution Log)

> يُملأ أثناء التنفيذ. سطر لكل مهمة: `<ID> ✅/⏸/N-A — ملاحظة + SHA`.

| المهمة | الحالة | ملاحظة / SHA |
|---|---|---|
| T0.1 تأكيد الأساس الأخضر | ✅ | i18n + typecheck + build خضراء قبل أي تغيير |
| T3.2 دمج Content → Media | ✅ | redirect + حذف مكوّن ميت + تنظيف سايدبار · `add9dd4` |
| T3.3 دمج Display Groups → Playlists | ✅ | نقل عدّاد الشاشات + redirect + حذف · `add9dd4` |
| W8.1a توحيد الاسم (Smart Screen/شاشة ذكية) | ✅ | كل الواجهة + metadata + branding · `294e68a` |
| W8.1b توحيد المصطلح (Workspace/مساحة عمل) | ✅ | 93 en + 98 ar، تأنيث نحوي صحيح · `7d32f2e` |
| T1.3 إشعارات: إلغاء reload (B3) | ✅ | تحديث state بدل reload · `55bf611` |
| T1.1/T1.2 طوارئ: overlay canvas + كل الشاشات (B1/B2) | ✅ | canvas خلفية حمراء+رسالة عبر override · `f2d5462` |
| T1.4/T1.5 locale: فواتير + مساعدة (B4/B5) | ✅ | روابط من useLocale · `27973aa` |
| T1.7 Analytics: وقت نسبي محلّي (B7) | ✅ | Intl.RelativeTimeFormat · `5d5fefb` |
| B6 expiry الميت في Content | ✅ | حُلّ بدمج Content→Media |
| T2.1–T2.3 ربط المبني | ⬜ | GlobalSearch / OverviewMetrics / Skeleton |
| T3.1 دمج Displays → Screens | ⬜ | يحتاج نقل عرض الجدول |
| T3.4 دمج Campaigns → Schedules | ⬜ | يحتاج نقل عرض Timeline |
| T3.5 دمج Proof of Play → Analytics | ⬜ | يحتاج نقل بحث + CSV + جدول |
| T3.6 دمج Billing + T3.7 تبويب Settings | ⬜ | يحلّ A1/A2/B4 + W10 |
| T3.8 إعادة هيكلة أقسام السايدبار | ⬜ | بعد اكتمال الدمج |
| W9 تشريح صفحة + سطح تحكّم | ⬜ | ListShell / palette / saved views |
| W4/W6 طبقة عرضية + a11y | ⬜ | skeleton/empty/sort/export/confirm |
| T5 موديل (Quick Publish) · W7 فيتشرز | ⬜ | لاحق |

---

# ═══════════════════════════════════════════════════════════
# Part H — توجيه التنفيذ الصارم (HANDOFF DIRECTIVE)
# ═══════════════════════════════════════════════════════════

> **موجّه إلى الإيجنت الذي سيُكمل العمل.** هذا **أمر تنفيذ**، لا اقتراح. كل قرار مُنتَجي/تصميمي **محسوم** في هذا الجزء. **ممنوع الاجتهاد.** لو صادفت شيئاً غير محسوم هنا: **توقّف**، اكتب `<!-- BLOCKED: <السبب> -->` في مكان العمل، ولا تُخمّن ولا تُكمل تلك المهمة.

## H0 — قواعد إلزامية (اقرأها حرفياً)

1. **لا قرار باجتهادك.** كل الخيارات محسومة في H2. لا "أعتقد"، لا "الأفضل"، لا "يمكن أيضاً".
2. **مهمة واحدة = commit واحد.** لا تجمع مهمتين. لا تعمل drive-by refactor. لا تلمس ملفاً خارج قائمة ملفات المهمة.
3. **تحقّق أخضر قبل كل commit** (أوامر H3 بالضبط). ممنوع commit على build أحمر أو lint فيه errors.
4. **اتبع الوصفات في H4 حرفياً.** لا تبتكر نهجاً بديلاً لعملية موجودة لها وصفة.
5. **اقرأ الملف كاملاً قبل تعديله أو حذفه** (R2). لو العيب مُصلَّح أصلاً → علّم "N/A" وتابع.
6. **ممنوع:** `npm install` أو تعديل `package-lock.json` (خطر dual-checkout) · `prisma db push` أو تعديل migration قائم · حذف/إعادة كتابة ملفات `audits/`.
7. **تحذيرات `LF will be replaced by CRLF` من git طبيعية على ويندوز — تجاهلها تماماً.**
8. **i18n:** كل نص عبر مفتاح في en.json **و** ar.json بنفس البنية. RTL عبر خصائص منطقية فقط (`ms/me/ps/pe`, `start/end`).
9. **لا تلمس منطق Stripe/الفوترة** إلا في المهمة المخصّصة (T-D) وبحاجز مراجعة بشري صريح.

## H1 — الحالة الحالية (منجَز · متحقَّق · محفوظ — لا تُعِده)

| العمل | SHA |
|---|---|
| الأوديت + الخطة + طبقة الانتربرايز (Part B) | `0c1be77` |
| دمج Content→Media + Display Groups→Playlists (redirect + حذف clients + عدّاد الشاشات) | `add9dd4` |
| توحيد الاسم Smart Screen / شاشة ذكية | `294e68a` |
| توحيد المصطلح Workspace / مساحة عمل (93 en + 98 ar، تأنيث نحوي) | `7d32f2e` |
| B3 إشعارات: إلغاء reload | `55bf611` |
| B1+B2 طوارئ: overlay canvas + كل الشاشات | `f2d5462` |
| B4+B5 locale: فواتير + مساعدة | `27973aa` |
| B7 Analytics: وقت نسبي محلّي | `5d5fefb` |

**ملفات حُذفت (لا تُعِد إنشاءها):** `features/media/content-client.tsx` · `features/screens/display-groups-client.tsx`.
**مكوّن جديد:** `features/dashboard/emergency-overlay.ts`.

## H2 — القرارات المحسومة (نهائية — لا تُراجَع، لا تسأل عنها)

1. **الاسم:** Smart Screen (en) / شاشة ذكية (ar). *(منجَز.)*
2. **المصطلح:** Workspace / مساحة عمل. **ممنوع** إرجاع "Branch/فرع/الفروع" لأي نص واجهة. *(منجَز.)* لاحظ: أسماء الكود/الملفات/المتغيّرات (branches routes، BranchDetailClient…) تبقى كما هي — المصطلح للنصوص فقط.
3. **الطوارئ:** overlay canvas (خلفية حمراء + رسالة). *(منجَز.)*
4. **كل route مُدمَج:** يُستبدَل بـ `redirect()` — **ممنوع 404**. الروابط القديمة تبقى.
5. **Displays → Screens: redirect-only.** **ممنوع** بناء عرض جدول في Screens الآن؛ عرض الجدول يأتي لاحقاً ضمن ListShell (W9). الميزة الوحيدة المفقودة (تخطيط جدول) مؤجَّلة عمداً.
6. **Proof of Play → Analytics:** انقل (بحث + تصدير CSV + جدول per-screen) من `proof-of-play-client.tsx` إلى `analytics-page-client.tsx` **قبل** الـ redirect. لا تفقد ميزة.
7. **Campaigns → Schedules:** انقل عرض Timeline من `campaigns-client.tsx` إلى `schedules-client.tsx` كـ view-toggle ثالث (تقويم/Timeline/قائمة) **قبل** الـ redirect.
8. **Billing:** `/billing` (standalone) يُدمَج في `/settings/billing`. `/settings/billing` هو عنصر السايدبار "Billing" الحالي (يبقى). انقل UI اختيار الخطة فقط؛ **لا تلمس أي استدعاء Stripe** (انسخه حرفياً). **T-D يتطلّب مراجعة بشرية قبل commit — قف واطلبها.**
9. **Settings:** تبويب واحد (Profile | Workspace | Billing) عبر مكوّن `components/ui/tabs.tsx`. يحلّ وصول `/settings/workspace` (A1) بلا إضافة عنصر سايدبار منفصل.
10. **Quick Publish (T5.1):** يُنشئ **playlist دائمة** (لا override مؤقت).
11. **OverviewMetrics (B8):** **احذفه** (`features/dashboard/overview-metrics.tsx`) — كود يتيم. لا تحاول استخدامه.
12. **المفاتيح الميتة:** تُنظَّف في T-G فقط، بوصفة B، ولا قبلها.
13. **commit لكل مهمة**، رسالة `type(scope): what — why` + trailer.

## H3 — البيئة وأوامر التحقّق (استخدمها بالضبط)

بيئة: **Windows**، `node_modules` موجود، Node 22. **لا تشغّل `npm run verify` الكامل** (يحتاج DB على WSL). استخدم مجموعة الداشبورد بعد كل مهمة:

```
npm run typecheck -w apps/dashboard      # يجب: لا مخرجات خطأ
npm run lint -w apps/dashboard           # يجب: "0 errors". تحذيرات ≤ 32 (خط الأساس). ممنوع زيادتها.
npm run i18n:check                       # يجب: key-parity/hardcoded/missing-marker كلها OK
npm run build -w apps/dashboard          # يجب: "Compiled successfully" + exit 0
```

الأربعة يجب تمرّ قبل commit. لو انكسر ما كان أخضر → **تغييرك السبب، أصلحه قبل المتابعة**.

## H4 — الوصفات (اتبعها حرفياً)

### Recipe A — دمج صفحة مكرّرة (redirect-only)
1. استبدل محتوى `app/[locale]/(shell)/<route>/page.tsx` بالقالب (انسخ من `content/page.tsx` الحالي، غيّر الوجهة):
   ```tsx
   import { redirect } from 'next/navigation';
   type Props = { params: Promise<{ locale: string }> };
   export default async function Page({ params }: Props) {
     const { locale } = await params;
     redirect(`/${locale}/<TARGET>`);
   }
   ```
2. في `components/layout/shell-sidebar.tsx`: احذف عنصر الـ nav من مصفوفته؛ احذف المفتاح من `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE`؛ احذف أي أيقونة `import` صارت غير مستخدمة؛ بسّط أي `active` ternary خاص بالعنصر (كما فُعِل مع displayGroups).
3. احذف ملف الـ client المهجور (بعد قراءته كاملاً)؛ أكّد `grep -rln "<ClientName>"` = لا مراجع.
4. تحقّق (H3) → commit `refactor(nav): merge /<route> into /<target>`.

### Recipe B — تعديل/تنظيف i18n
- **إضافة مفتاح:** أضِفه في `en.json` **و** `ar.json` بنفس المسار والموضع النسبي.
- **حذف مفاتيح ميتة:** احذفها من الملفين **معاً**، **و** احذف كل مرجع كود لها في **نفس** المهمة (وإلا ينكسر key-parity أو استدعاء `t()`). استخدم `grep -rn "<key>"` أولاً.
- **تعديل جماعي للقيم:** استخدم script **يعدّل القيم فقط** (كما في `scratchpad/term-*.cjs`) — ممنوع تعديل المفاتيح.

### Recipe C — commit
`git add <ملفات المهمة بالضبط>` ثم:
```
git commit -m "type(scope): what — why

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## H5 — المهام المتبقية (نفّذها بهذا الترتيب؛ كل واحدة محسومة)

> بعد كل مهمة: تحقّق (H3) + commit + حدّث جدول §6 بالـ SHA.

### T-A — Proof of Play → Analytics  *(port ثم redirect)*
- **ملفات:** `features/analytics/analytics-page-client.tsx`, `features/analytics/proof-of-play-client.tsx`, `app/[locale]/(shell)/proof-of-play/page.tsx`, `shell-sidebar.tsx`, i18n.
- **خطوات:** (1) اقرأ `proof-of-play-client.tsx` كاملاً. (2) انقل إلى Analytics **فقط** الثلاثة الناقصة: حقل بحث (فلترة الجدول بالاسم/السيريال)، زر تصدير CSV (انسخ منطق CSV حرفياً)، جدول per-screen. لا تضف أي شيء آخر. (3) أعِد استخدام مفاتيح i18n الموجودة في proofOfPlayPage حيثما أمكن؛ المفقود أضِفه (en+ar). (4) طبّق Recipe A على `/proof-of-play` → `/analytics` (احذف `proofOfPlay` من `TOOLS_NAV` + الأيقونة `BarChart3` إن لم تُستخدم + active-check). (5) احذف `proof-of-play-client.tsx`.
- **قبول:** بحث + CSV + جدول تعمل في Analytics؛ `/proof-of-play` يحوّل؛ H3 أخضر.

### T-B — Campaigns → Schedules  *(port ثم redirect)*
- **ملفات:** `features/dashboard/campaigns-client.tsx`, `features/schedules/schedules-client.tsx` (+ ملف view جديد إن لزم), `app/[locale]/(shell)/campaigns/page.tsx`, `shell-sidebar.tsx`, i18n.
- **خطوات:** (1) اقرأ الملفين كاملين. (2) استخرج شبكة Timeline (7×24) من `campaigns-client.tsx` إلى مكوّن `features/schedules/schedules-timeline-view.tsx`. (3) أضِف مبدّل عرض في `schedules-client.tsx`: تقويم | Timeline | قائمة (استخدم نمط الأزرار الموجود). (4) i18n للمبدّل (en+ar). (5) Recipe A على `/campaigns` → `/schedules` (احذف `campaigns` من `SCHEDULING_NAV` + أيقونة `Megaphone` إن لم تُستخدم). (6) احذف `campaigns-client.tsx`.
- **قبول:** Timeline متاح داخل Schedules؛ `/campaigns` يحوّل؛ H3 أخضر.

### T-C — Displays → Screens  *(redirect-only — H2#5)*
- **ملفات:** `app/[locale]/(shell)/displays/page.tsx`, `shell-sidebar.tsx`, `features/screens/displays-client.tsx`, i18n (T-G لاحقاً).
- **خطوات:** طبّق Recipe A بالكامل: redirect `/displays` → `/screens`؛ احذف `displays` من `CLIENT_NAV` + active-check؛ احذف `displays-client.tsx`. **لا تبنِ جدولاً في Screens.**
- **قبول:** `/displays` يحوّل؛ Screens بلا تغيير وظيفي؛ H3 أخضر.

### T-D — Billing merge  *(⚠️ يتطلّب مراجعة بشرية قبل commit — R10)*
- **ملفات:** `features/settings/settings-billing-client.tsx`, `features/billing/billing-client.tsx`, `app/[locale]/(shell)/billing/page.tsx`, i18n.
- **خطوات:** (1) اقرأ الملفين. (2) انقل UI اختيار الخطة + mock toggle من `BillingClient` إلى قسم جديد في `SettingsBillingClient`. **انسخ كل استدعاءات Stripe/checkout حرفياً — لا تعدّل منطقها.** (3) redirect `/billing` → `/settings/billing`. (4) i18n (en+ar). (5) **قف — اطلب مراجعة بشرية — لا تعمل commit قبل موافقة صريحة.**
- **قبول:** صفحة فواتير واحدة؛ `/billing` يحوّل؛ H3 أخضر؛ **موافقة بشرية مسجّلة**.

### T-E — Settings تبويب موحّد  *(يحلّ A1)*
- **ملفات:** `features/settings/*` (profile/workspace/billing clients أو أغلفتها), مكوّن تبويب مشترك جديد `features/settings/settings-tabs.tsx`, `components/ui/tabs.tsx`, i18n.
- **خطوات:** (1) أنشئ `SettingsTabs` يعرض 3 روابط (Profile | Workspace | Billing) بالحالة النشطة من `usePathname`. (2) ضعه أعلى الصفحات الثلاث. (3) i18n للعناوين (en+ar، استخدم `nav.profileSettings`/`nav.workspaceSettings`/`nav.billing` الموجودة). لا تضف عنصر سايدبار جديد.
- **قبول:** التنقّل بين الإعدادات الثلاثة يعمل؛ `/settings/workspace` قابل للوصول؛ H3 أخضر.

### T-F — إعادة هيكلة أقسام السايدبار  *(بعد T-A..T-C)*
- **ملفات:** `shell-sidebar.tsx`, i18n (مفاتيح الأقسام).
- **خطوات:** طبّق البنية من §2.3 بالأوديت: OVERVIEW / FLEET (Screens, Emergency) / CONTENT (Media, Studio, Templates) / PLAYBACK (Playlists, Schedules) / INSIGHTS (Analytics, AI) / MANAGEMENT (Team, Billing, Settings) / RESOURCES. حرّك العناصر بين المصفوفات؛ حدّث مفاتيح عناوين الأقسام (en+ar).
- **قبول:** 7 أقسام كما بالأوديت؛ لا عنصر مكرّر؛ الحالة النشطة صحيحة؛ H3 أخضر.

### T-G — تنظيف مفاتيح i18n الميتة  *(Recipe B)*
- **مفاتيح للحذف (من en.json و ar.json):** `nav.content`, `nav.displayGroups`, namespace `contentPage` كامل, namespace `displayGroupsPage` كامل. وبعد T-A/T-B: `campaignsPage`, `proofOfPlayPage`, `displaysPage`, `nav.campaigns`, `nav.proofOfPlay`, `nav.displays`.
- **مراجع كود يجب حذفها في نفس المهمة:** في `lib/shell-header-meta.ts` احذف فروع `rest[0] === 'content'`, `'displays'&&'groups'`, `'displays'`, `'campaigns'`, `'proof-of-play'` + إدخالاتها في `clientMainWithBack`. في `features/workspace/workspace-gate.tsx` احذف `'content'`, `'displays'`, `'campaigns'`, `'proof-of-play'` من `CLIENT_ROUTE_SEGMENTS`. في `shell-sidebar.tsx` احذف فروع hrefFor + type-union للمفاتيح المحذوفة.
- **قبول:** `grep -rn "contentPage\|displayGroupsPage\|campaignsPage\|proofOfPlayPage\|displaysPage"` = لا مراجع؛ i18n:check OK؛ H3 أخضر.

### T-H — ربط GlobalSearch + ⌘K  *(B9)*
- **ملفات:** `components/layout/header.tsx`, `features/search/global-search.tsx`, i18n.
- **خطوات:** (1) اقرأ `global-search.tsx` وافهم واجهته (props). (2) أضِف زر بحث في الهيدر بين `WorkspaceSwitcher` و`NotificationBell` يفتح المكوّن. (3) listener عالمي لـ `Ctrl/⌘+K` يفتحه. (4) تأكّد a11y موجودة (`role=dialog`, `aria-modal`, focus). i18n لأي نص جديد.
- **قبول:** البحث يُفتح بالزر و⌘K؛ يعمل RTL؛ H3 أخضر.

### T-I — حذف OverviewMetrics  *(B8)*
- **خطوات:** أكّد `grep -rln "OverviewMetrics\|overview-metrics"` = ملف واحد فقط؛ احذف `features/dashboard/overview-metrics.tsx`؛ H3 أخضر.
- **قبول:** لا مراجع؛ H3 أخضر.

### T-J — تبنّي Skeleton  *(U1)*
- **ملفات:** كل feature-client بحالة تحميل (Overview, Screens, Media, Playlists, Schedules, Analytics, Team, Audit Log) + `components/ui/skeleton.tsx`.
- **خطوات:** استبدل `Loader2` spinners بـ skeletons تحاكي التخطيط. **صفحة واحدة = commit واحد.** استخدم `aria-hidden` على الـ skeleton.
- **قبول:** كل صفحة تعرض skeleton أثناء التحميل؛ H3 أخضر لكل commit.

### لاحقاً (بعد ما سبق): W9 (ListShell + palette) · W4 (فرز/تصدير/bulk/تأكيدات) · W6 (a11y) · W5 (Quick Publish) · W7. اتبع معايير **Part B** حرفياً؛ لا تبتكر خارجها.

## H6 — لا تُعِد عمل المنجَز (فخاخ)

- **لا** تُعِد إضافة `content`/`displayGroups` للسايدبار — دُمجا عمداً.
- **لا** تُعِد تشغيل توحيد المصطلح/الاسم — منجَز؛ لو رأيت "Branch/فرع" في نص واجهة **جديد** فقط، صحّحه.
- **لا** تُنشئ ملفات `content-client.tsx`/`display-groups-client.tsx` — محذوفة عمداً.
- **لا** تبنِ جدولاً في Screens (T-C redirect-only).

## H7 — تسليمات للإنسان (خارج نطاق الإيجنت — لا تحاولها)

1. **تحقّق بصري من الطوارئ (B1):** شغّل الـ stack الكامل (backend+player+DB) وفعّل طوارئ فعلية على شاشة للتأكد أن الـ overlay canvas يُعرَض. الإصلاح متحقَّق ستاتيكياً فقط.
2. **مراجعة T-D (Billing/Stripe)** قبل الدمج.
3. قرار خدمات الطرف الثالث في W7 (AI model، screenshot، map) — لا يُوفّرها الإيجنت.
