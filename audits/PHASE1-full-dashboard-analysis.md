# تحليل شامل احترافي لداشبورد الكلاينت — UI / UX / IA / الفيتشرز

**تاريخ التحليل:** 2026-07-14
**النطاق:** كل صفحات داشبورد الكلاينت (22 عنصر في السايدبار + 5 صفحات غير مرتبطة) + الطبقات العرضية (تصميم، تفاعل، وصولية، RTL، الأداء المُدرَك).
**المنهجية:** كل عيب موثّق بدليل `file:line` تم التحقق منه في الشجرة الحالية. العيوب المُصلَّحة حديثاً موسومة صراحةً في §11 حتى لا نعمل على مشاكل انتهت.
**معيار الدليل:** لا يُدرَج عيب في جدول الأولويات إلا بعد فتح الملف والتأكد منه في الكود (اتّباعاً لقاعدة R2 في خطة العلاج).

> **الوثيقة المصاحبة:** خطة التنفيذ التفصيلية في `audits/PHASE1-ux-implementation-plan.md`. هذه الوثيقة **تشخيص**؛ تلك **علاج**.

---

## 0. الملخّص التنفيذي (Executive Summary)

الداشبورد **مكتمل الوظائف تقريباً** — معظم الفيتشرز حقيقية ومربوطة بـ API فعلي، والأساس التقني ممتاز (Next 15 / React 19 / Tailwind 4 / نظام ORCA، دعم RTL بخصائص منطقية، وضع ليلي كامل). **المشكلة ليست في نقص الوظائف بل في ثلاثة أمراض بنيوية تُفسد تجربة المستخدم:**

1. **التكرار (Duplication):** 5 أزواج من الصفحات تستهلك نفس الـ API وتظهر معاً في السايدبار → المستخدم لا يعرف "أروح فين". هذا أخطر عيب في المعمارية المعلوماتية (IA).
2. **الفيتشرز المبنية وغير المربوطة (Built-but-unwired):** مكوّنات كاملة موجودة في الكود لكنها **يتيمة** — لا تُستدعى من أي مكان: `GlobalSearch` (بحث عام)، `OverviewMetrics`، وكذلك مكوّن `Skeleton` مستخدَم في **موضع واحد فقط** رغم وجوده، و`Tabs` موجود لكن صفحات Settings غير متبوّبة. جهد مدفوع ثمنه لكن المستخدم لا يراه.
3. **صفحات حرجة غير قابلة للوصول:** `/settings/workspace` (اسم الورك سبيس، اللغة، التوقيت، الإيقاف، إعدادات الصلاة ورمضان) و`/billing` (اختيار الخطة) **غير موجودتين في السايدبار إطلاقاً**.

بالإضافة إلى **9 باجات مؤكّدة** (بأدلة `file:line`) تُسرّب بيانات أو تكسر التدفّق، وسلسلة من نواقص الطبقة العرضية (Skeletons، حالات فارغة، فرز/تصدير/عمليات جماعية، وصولية WCAG).

**الخلاصة:** المطلوب ليس بناء فيتشرز جديدة بقدر ما هو **تفكيك التشابك (Untangling) + ربط المبني + إصلاح الباجات + توحيد الطبقة العرضية**. هذا هو الطريق لأفضل وأسهل تجربة.

### مؤشر الحالة العام

| البُعد | التقييم | ملاحظة |
|---|---|---|
| اكتمال الوظائف | 🟢 عالٍ | معظم الفيتشرز حقيقية ومربوطة |
| المعمارية المعلوماتية (IA) | 🔴 ضعيف | 5 تكرارات + صفحات يتيمة + تسميات خاطئة |
| اتساق التجربة | 🟡 متوسط | نظام تصميم جيد لكن التطبيق غير موحّد |
| الوصولية (a11y) | 🟡 متوسط | أساس Radix جيد، لكن ثغرات مؤكّدة |
| RTL / i18n | 🟢 جيد | خصائص منطقية، مع بقايا نصوص ثابتة |
| الأداء المُدرَك | 🟡 متوسط | Spinners بدل Skeletons، لا SSR |

---

## 1. جدول الأولويات المُوحّد (Master Severity Ledger)

الترقيم: **P0** = يكسر/يُضلّل الآن، **P1** = عيب معماري كبير، **P2** = احتكاك تجربة، **P3** = تحسين.

| # | الأولوية | العيب | الدليل (`file:line`) | الأثر |
|---|---|---|---|---|
| B1 | **P0** | رسالة الطوارئ المخصّصة **تُكتب ثم تُهمَل** — لا تُرسَل للـ API | `emergency-client.tsx:59-62` | المستخدم يظن أنه بثّ رسالة طوارئ، والشاشة لا تعرض شيئاً |
| B2 | **P0** | خيار "كل الشاشات" في الطوارئ **غير قابل للتفعيل** (الزر مُعطّل ما لم تُختَر شاشة واحدة) | `emergency-client.tsx:174` مع `:145` | البثّ الجماعي في الطوارئ مستحيل عملياً |
| B3 | **P0** | صفحة الإشعارات تعمل `window.location.reload()` عند "تحديد الكل كمقروء" | `notifications-page-client.tsx:61` | إعادة تحميل كاملة، فقدان الحالة، وميض |
| B4 | **P1** | زر الترقية في الفواتير يفتح `/en/billing` بـ locale ثابت | `settings-billing-client.tsx:167` | يكسر التجربة للمستخدم العربي، ويصل لصفحة غير موجودة بالسايدبار |
| B5 | **P1** | روابط صفحة المساعدة ثابتة بلا locale (`/screens`, `/media`) | `help-support-client.tsx:51,57` | روابط مكسورة خارج locale=en |
| B6 | **P1** | `expiry` في صفحة Content: `<Select>` و`<input type=date>` **بلا أي handler** (UI ميت) | `content-client.tsx:135-143` | المستخدم يضبط تاريخ انتهاء ولا شيء يُحفظ |
| B7 | **P2** | نصوص إنجليزية ثابتة في Analytics (`Xs ago`, `Xm ago`, `Xh ago`, `Xd ago`) | `analytics-page-client.tsx:32-37` | خرق i18n، تجربة عربية مكسورة |
| B8 | **P2** | مكوّن `OverviewMetrics` **يتيم** — غير مستورد في أي مكان | `dashboard/overview-metrics.tsx` (لا مستوردين) | كود ميت + قيمة ضائعة |
| B9 | **P1** | مكوّن `GlobalSearch` **مبني وغير مربوط** — غير مستورد في الهيدر أو الـ shell | `search/global-search.tsx` (لا مستوردين) | أهم فيتشر تنقّل مفقود من الواجهة رغم وجوده |
| D1 | **P1** | تكرار: **Screens ↔ Displays** (نفس `/screens` API) | `shell-sidebar.tsx:61-62` | ازدواج تنقّل |
| D2 | **P1** | تكرار: **Media ↔ Content** (نفس `/media` API) | `shell-sidebar.tsx:62-63` | ازدواج تنقّل |
| D3 | **P1** | تكرار: **Schedules ↔ Campaigns** (نفس `/schedules` API) | `shell-sidebar.tsx:75-76` | ازدواج تنقّل |
| D4 | **P1** | تكرار + تسمية خاطئة: **Playlists ↔ Display Groups** (نفس `/playlists`) | `shell-sidebar.tsx:68,74` | "Display Groups" يدير playlists لا شاشات |
| D5 | **P1** | تكرار + تسمية خاطئة: **Analytics ↔ Proof of Play** (نفس `/screens/:ws/analytics`) | `shell-sidebar.tsx:80-81` | "Proof of Play" لا يعرض بيانات تشغيل فعلية |
| A1 | **P0** | `/settings/workspace` **غير موجود في السايدبار** رغم وجود الصفحة | `shell-sidebar.tsx` (لا رابط) | إعدادات الورك سبيس الحرجة غير قابلة للوصول |
| A2 | **P1** | `/billing` **غير موجود في السايدبار** | `shell-sidebar.tsx` (لا رابط) | اختيار الخطة غير متاح إلا عبر زر مكسور (B4) |
| U1 | **P2** | لا Skeleton loading فعلي — المكوّن موجود لكن مُستخدَم في موضع واحد | `components/ui/skeleton.tsx` (استخدام واحد) | أداء مُدرَك ضعيف، Spinners في كل مكان |
| U2 | **P2** | Settings غير متبوّبة رغم وجود مكوّن `Tabs` | `settings/*` + `components/ui/tabs.tsx` | 3 صفحات معزولة بلا تنقّل بينها |
| U3 | **P2** | لا تأكيد قبل إزالة عضو / إلغاء دعوة في الفريق | `team-client.tsx` | عمليات مدمّرة بلا حماية |
| U4 | **P2** | غياب فرز/تصدير/عمليات جماعية في معظم القوائم | متعدّد | احتكاك في القوائم الكبيرة |

---

## 2. تفكيك التكرارات — البازل الأساسي (IA)

هذه أخطر مشكلة تجربة: **صفحتان لنفس الشيء = المستخدم يشلّ في اتخاذ القرار**. كل زوج أدناه يستهلك نفس الـ API؛ الفرق الوحيد ميزة صغيرة قابلة للدمج.

### 2.1 مصفوفة القرار

| الزوج | الـ API المشترك | الميزة الفريدة في الثانية | القرار |
|---|---|---|---|
| Screens ↔ **Displays** | `/screens` | Table view فقط | ادمج → أضف toggle للجدول في Screens، وحوّل `/displays` → `/screens` |
| Media ↔ **Content** | `/media` | لا شيء (الـ expiry معطّل — B6) | ادمج → أضف toggle للجدول في Media، وحوّل `/content` → `/media` |
| Schedules ↔ **Campaigns** | `/schedules` | Timeline grid view | ادمج → أضف عرض Timeline لـ Schedules، وحوّل `/campaigns` → `/schedules` |
| Playlists ↔ **Display Groups** | `/playlists` | عدّاد `screensInGroup` | ادمج → أضف العدّاد لقائمة Playlists، وحوّل `/displays/groups` → `/playlists` |
| Analytics ↔ **Proof of Play** | `/screens/:ws/analytics` | بحث + CSV + جدول | ادمج → أضفها لـ Analytics، وحوّل `/proof-of-play` → `/analytics` |

> **مبدأ الدمج:** لا نحذف صفحة قبل نقل ميزتها الفريدة للصفحة الباقية والتحقق منها (Capability parity). التحويل عبر `redirect()` يحفظ الروابط القديمة.

### 2.2 الصفحات اليتيمة (خارج السايدبار)

| الصفحة | الخطورة | الوصول الحالي |
|---|---|---|
| `/settings/workspace` | **حرج (A1)** | لا شيء — الصفحة موجودة لكن لا رابط لها |
| `/billing` | **عالٍ (A2)** | فقط عبر زر "ترقية" المكسور (B4) |
| `/branches/[workspaceId]` | متوسط | من كارت المجموعة في Overview — يتداخل مع الصفحات الفردية |

### 2.3 السايدبار المقترح (7 → 7 أقسام، بلا تكرار)

```
OVERVIEW      Overview
FLEET         Screens (كروت+جدول)  ·  Emergency
CONTENT       Media (شبكة+جدول)  ·  Studio  ·  Templates
PLAYBACK      Playlists (+عدّاد الشاشات)  ·  Schedules (تقويم+Timeline)
INSIGHTS      Analytics (+بحث/CSV/جدول)  ·  AI (Demo)
MANAGEMENT    Team  ·  Billing (خطة+فواتير)  ·  Settings (Profile|Workspace|Billing متبوّبة)
RESOURCES     Notifications  ·  Audit Log  ·  API Docs  ·  Help
```

النتيجة: من **22 عنصر** فيها 5 تكرارات وصفحتان يتيمتان → **~16 عنصر** بلا تكرار وكل شيء قابل للوصول.

---

## 3. عقدة الموديل الذهني (Content Model Mental-Model)

أعمق التباس تجربة ليس بصرياً بل **مفاهيمي**: مسار المحتوى طويل وغير بديهي.

```
المتوقّع من العميل:   شاشة ← أحطّ عليها محتوى
الواقع في المنتج:     Media → Playlist → Items(+مدة) → Schedule/Assign → Screen
```

**الأعراض الناتجة:**
- "شاشة" = جهاز فيزيائي + playlist مرفقة، وليست "تكوين محتوى مستقل".
- "Display Groups" تدير playlists لا شاشات (D4).
- الـ pairing يربط شاشة واحدة لا مجموعة.
- المستخدم يمرّ بـ 4 صفحات لعرض صورة على شاشة.

**الحل (يُفصَّل في الخطة):** طبقة اختصار "**Quick Publish**" — من صفحة الشاشة أو الميديا: "انشر هذا المحتوى على هذه الشاشة الآن" تُنشئ playlist ضمنية وتربطها، دون إجبار المستخدم على فهم السلسلة كاملة. السلسلة تبقى للمستخدم المتقدّم؛ الاختصار للأغلبية.

---

## 4. الطبقة العرضية العرضية — نظام التجربة (Cross-cutting UX)

### 4.1 التنقّل والبحث (Navigation & Findability)
- ❌ **B9 — لا بحث عام مرئي.** المكوّن موجود ويتيم. أهم فيتشر تنقّل في أي SaaS.
- ❌ لا Command Palette (⌘K) رغم أن البنية جاهزة له (المكوّن اليتيم dialog أصلاً).
- ❌ لا Quick Actions في الهيدر/Overview (إضافة شاشة/ميديا/بلايدست بنقرة).
- ⚠️ عدّادات السايدبار موجودة (`counts: media/screens/playlists`) لكنها محدودة.

### 4.2 حالات الفراغ والتحميل والخطأ (Empty / Loading / Error)
- ✅ `EmptyState` مُتبنّى في 15 موضعاً — جيد.
- ❌ **U1 — Skeleton loading غير متبنّى.** المكوّن موجود، الاستخدام موضع واحد. الباقي Spinners → إحساس بالبطء.
- ⚠️ حالات الفراغ أيقونية بلا CTA واضح في بعض الصفحات (لا "ابدأ من هنا").
- ⚠️ لا per-page error boundaries — انهيار قسم يُسقط الـ shell.

### 4.3 التغذية الراجعة والعمليات (Feedback & Actions)
- ✅ Toasts عبر `sonner` متّسقة.
- ❌ **U3 — لا تأكيد قبل الحذف** في الفريق (إزالة عضو/إلغاء دعوة). خطر.
- ❌ **U4 — لا فرز (sort)** في القوائم (Screens/Media/Playlists...).
- ❌ لا **تصدير** خارج Proof of Play.
- ⚠️ **عمليات جماعية (bulk)** محدودة — موجودة في Screens/Media فقط، وبعمليات قليلة.
- ⚠️ لا Optimistic UI — كل عملية تنتظر الشبكة.

### 4.4 النماذج (Forms)
- ⚠️ لا طبقة `Form`/`FormField` موحّدة — كل نموذج يدير حالته يدوياً.
- ⚠️ بعض الحقول تعتمد `placeholder` بدل `<label>` مرتبط.
- ⚠️ لا تحقّق فوري (inline validation) متّسق.

### 4.5 الاتساق (Consistency)
- 🔴 **نمط "المبني وغير المتبنّى"** يتكرّر: `Skeleton` (1 استخدام)، `Tabs` (Settings لا يستخدمه)، `GlobalSearch` (يتيم)، `OverviewMetrics` (يتيم). دلالة على انقطاع بين بناء المكوّنات وتبنّيها.
- ⚠️ عرض الجداول غير موحّد: Screens كروت فقط، Displays جدول، Media شبكة، Content شبكة+جدول جزئي.

---

## 5. نظام التصميم والطبقة البصرية (Design System)

نظام "ORCA" نظيف ومهني (Blue-600، أسطح كروت، أرقام tabular، وضع ليلي كامل). النواقص:

- ⚠️ **لا توثيق design tokens** — النظام في CSS فقط، غير موثّق كمرجع.
- ⚠️ **Gradient mesh** مستخدم في Overview فقط، غير متّسق عبر الصفحات.
- ⚠️ **الوضع الليلي مختلط** — بعض المكوّنات تستخدم `dark:` وبعضها متغيّرات CSS دلالية. الأفضل توحيد المتغيّرات الدلالية.
- ⚠️ **الحركة (Motion):** Framer Motion على مستوى الصفحة والكروت. تأكّد أن كل `x` offsets تحترم RTL (بعضها أُصلِح، راجع §7).
- ⚠️ لا micro-interactions موحّدة (hover/press/focus) خارج السايدبار المصقول.

---

## 6. الوصولية (Accessibility — WCAG 2.2 AA)

الأساس جيد (Radix، skip-to-content، خصائص منطقية، ARIA على أزرار الأيقونات). الثغرات:

- ⚠️ **مؤشرات الحالة باللون فقط** (ONLINE/OFFLINE/MAINTENANCE) قد تعتمد اللون دون نص/أيقونة → فشل 1.4.1.
- ⚠️ **`aria-live`** لإعلانات Toast غير مؤكّد لقارئات الشاشة.
- ⚠️ **`aria-busy`** على حاويات التحميل غير موجود.
- ⚠️ **فخّ التركيز (focus trap)** مضمون في Radix Dialog، لكن أي modal مخصّص قد يفتقده.
- ✅ بعض الإصلاحات تمّت (skeleton `aria-hidden`، info-tooltip `aria-describedby`، أزرار select حصلت على `aria-label`) — راجع §11.

---

## 7. الاستجابة و RTL و i18n

**الاستجابة:**
- ✅ سايدبار موبايل (drawer)، شبكات مستجيبة، padding مستجيب.
- ⚠️ **قفزة من موبايل لديسكتوب عند 1024px** — نطاق التابلت يستخدم تخطيط موبايل.
- ⚠️ **الجداول على الموبايل** قد تفيض — لا wrapper أفقي واضح.

**RTL / i18n:**
- ✅ `dir="rtl"`، خصائص منطقية (`ms/me/ps/pe`, `start/end`).
- ✅ حركات `x` في onboarding/studio تحترم RTL (أُصلِحت).
- ❌ **B7 — نصوص إنجليزية ثابتة** في Analytics.
- ⚠️ نصوص ثابتة سابقة في `error.tsx`/`not-found.tsx` (تحقّق — قد تكون أُصلِحت في T5.1).

---

## 8. مراجعة الصفحات صفحةً صفحة (Per-page)

> ملاحظة: الوصف الوظيفي لكل صفحة كامل ودقيق؛ أُضيف عمود **الحالة المؤكّدة** والدليل. البنود المشطوبة/المُصلَّحة موسومة.

### 8.1 Overview — `/overview` (`HomeOverview → ClientHomeDashboard`)
هيدر gradient، OnboardingProgress، Prayer+Hijri widgets، WorkspaceSummary، TotalsSection (6 إحصائيات)، RecentActivityFeed، BranchCards.
- ❌ تكرار جزئي مع Branch Detail (نفس بيانات المجموعة).
- ❌ **B8** — `OverviewMetrics` يتيم.
- ⚠️ `locale` يُقرأ من `document.documentElement.lang` (هشّ) — الأفضل `useLocale()`.
- ⚠️ RecentActivityFeed يستخدم `workspaceId` بينما insights ترجع لكل الورك سبيسز — تناقض نطاق.
- ❌ لا Quick Actions.

### 8.2 Screens — `/screens` (`ScreensClient`) — المرجع الأغنى
بحث، فلتر حالة، bulk select، bulk playlist assign، Quick Edit، تحليلات مصغّرة، usage indicator، إضافة/pairing/حذف، صفحة تفصيلية، realtime.
- ⚠️ الموديل مربك (شاشة = جهاز + playlist) — راجع §3.
- ❌ لا table view (كروت فقط) — سيُحلّ بدمج Displays (D1).
- ❌ لا فرز/تصدير. bulk محدودة.
- نواقص: grouping/tags/خريطة/screenshot/OTA/إعادة تشغيل عن بعد.

### 8.3 Displays — `/displays` (`DisplaysClient`) ⚠️ مكرر (D1)
مجموعة فرعية صارمة من Screens؛ ميزتها الوحيدة Table view. **ادمج واحذف.**

### 8.4 Media — `/media` (`MediaLibraryClient`)
رفع drag&drop، شبكة، مجلدات، bulk، بحث، فلتر نوع، pagination، إضافة لبلايدست، scope toggle، مؤشر تخزين، info dialog (expiry شغّال هنا)، seed demo.
- ❌ لا table view (سيُحلّ بدمج Content — D2).
- ❌ لا معاينة فيديو في الشبكة، لا version history في الواجهة.
- نواقص: رفع رابط خارجي من هنا، compression، watermark.

### 8.5 Content — `/content` (`ContentClient`) ⚠️ مكرر (D2)
مجموعة فرعية من Media. **❌ B6 — الـ expiry معطّل (UI ميت).** **ادمج واحذف.**

### 8.6 Studio — `/studio` (`StudioEditorClient`)
محرّر كانفس drag&drop، قوالب جاهزة (6)، عناصر (صور/فيديو/نص/يوتيوب/كانفا)، أبعاد/مدة، معاينة، حفظ/نشر.
- ❌ لا حذف canvas من داخل Studio (فقط في Templates).
- ❌ لا بحث في قائمة الـ canvases، لا auto-save، لا undo/redo على مستوى الكانفس.
- ⚠️ يعمل على مستوى الورك سبيس لا الشاشة.
- نواقص: layers، alignment guides، export، قوالب مستخدم، multi-zone واضح.

### 8.7 Display Groups — `/displays/groups` (`DisplayGroupsClient`) ⚠️ مكرر ومسمّى خطأ (D4)
يدير playlists باسم "groups"، في قسم Management بدل Playback. ميزته الوحيدة `screensInGroup`. **ادمج في Playlists.**

### 8.8 Templates — `/templates` (`TemplatesClient`)
قوالب جاهزة (6) + قوالب مستخدم (canvases) مع بحث/معاينة/حذف.
- ⚠️ تداخل مع Studio (نفس `/canvases`) — مكمّلان لكن الفصل مربك.
- ❌ لا "Edit in Studio" لقوالب المستخدم، لا إنشاء من هنا، المعاينة صورة ثابتة.
- نواقص: categories/tags، قوالب صناعية جاهزة، import/export، مشاركة.

### 8.9 Team — `/team` (`TeamClient`)
أعضاء + دعوات معلّقة + دعوة/إلغاء/إعادة إرسال/تغيير دور/إزالة، animation.
- ❌ **U3** — لا تأكيد قبل إزالة عضو أو إلغاء دعوة.
- ❌ لا بحث/فلترة/pagination/آخر نشاط.
- نواقص: أدوار مخصّصة، صلاحيات تفصيلية، audit لكل عضو، 2FA إجباري، session management.

### 8.10 Playlists — `/playlists` (`PlaylistStudioClient`)
sidebar + بحث، إنشاء/تسمية/حذف(مع force)/تكرار/clone لورك سبيس/نشر، محرّر items بـ drag&drop، مدد، undo/redo، معاينة.
- ⚠️ الموديل مربك (§3).
- ❌ لا table view، لا عرض عدد الشاشات المستخدِمة (سيُحلّ بدمج Display Groups)، لا bulk.
- نواقص: nested، جدولة داخلية، version history، approval، تعليقات.

### 8.11 Campaigns — `/campaigns` (`CampaignsClient`) ⚠️ مكرر (D3)
نفس `/schedules`. إنشاء ناقص (بلا يوم/priority/date range/enable). ميزته الوحيدة Timeline grid. **ادمج في Schedules.**

### 8.12 Schedules — `/schedules` (`SchedulesClient`)
تقويم 7×24، drag to reschedule، overlap detection، إنشاء كامل (playlist/شاشة/يوم/وقت/priority/date range/enable)، حذف، screen override، list، legend.
- ⚠️ الـ override مكرّر مع Emergency.
- ❌ لا Timeline (في Campaigns فقط — سيُدمج)، لا تكرار (recurrence)، لا عرض شهري.
- ⚠️ الـ drag يعتمد pointer events لا مكتبة dnd.
- نواقص: approval، عرض timezone واضح، conflict resolution، copy/paste، قوالب جدولة، جدولة أوقات الصلاة.

### 8.13 Proof of Play — `/proof-of-play` (`ProofOfPlayClient`) ⚠️ مكرر ومسمّى خطأ (D5)
يستهلك نفس analytics endpoint. الـ labels تقول "totalPlays/impressions/avgDuration" لكن البيانات = عدد شاشات + uptime. ميزاته: بحث + CSV + جدول. **ادمج في Analytics** حتى وجود بيانات PoP حقيقية.
- نواقص حقيقية: play count لكل item، impressions، duration played، date range، مقارنة، تفصيل لكل محتوى.

### 8.14 Analytics — `/analytics` (`AnalyticsPageClient`)
4 كروت حالة، uptime + peak hours، playlist distribution، per-screen.
- ❌ مكرر مع PoP، ينقصه بحث/CSV/جدول (فيها بـ PoP).
- ❌ **B7** — نصوص إنجليزية ثابتة (`formatRelative`).
- نواقص: device metrics، crash reports، bandwidth، content performance، PDF، تقارير مجدولة.

### 8.15 AI — `/ai` (`AiToolsClient`) — Demo مُعلَن ✅ (كان "وهمي")
4 أدوات (Headline/Body/CTA/Colors)، history في localStorage.
- ✅ **تحديث:** أصبح موسوماً "Demo" ببادج + إشعار (T4.3). النتائج ما زالت `mockResults`، لكن **لم يعد مُضلِّلاً**.
- ❌ لا تكامل حقيقي مع نموذج، لا ربط بـ Studio (النتائج لا تنتقل للمحرّر).

### 8.16 Emergency — `/emergency` (`EmergencyClient`)
تحذير أحمر، تنشيط تنبيه (قالب/رسالة/شاشة/مدة)، تنبيهات نشطة، تحكم صلاحيات.
- 🔴 **B1 — الرسالة المخصّصة تُهمَل** (الـ API يستقبل `playlistId:null` + مدة فقط، `message` يضيع).
- 🔴 **B2 — "كل الشاشات" غير قابل للتفعيل** (الزر مُعطّل ما لم تُختَر شاشة).
- ✅ **تحديث:** قوالب الرسائل أصبحت i18n (`t(\`templates.${id}.message\`)`) — لم تعد ثابتة إنجليزية.
- ❌ لا preview، لا test mode.
- ⚠️ الـ override مكرّر مع Schedules.
- نواقص: قوالب بصرية، طوارئ مجدولة، سجل طوارئ، بثّ جماعي فعلي، تكامل تنبيهات خارجية.

### 8.17 Billing (Settings) — `/settings/billing` (`SettingsBillingClient`)
خطة حالية، Stripe portal، سجل مدفوعات (جدول كامل)، تحميل PDF، رسالة retention.
- ❌ **B4** — زر الترقية `/en/billing` ثابت.
- ❌ لا اختيار خطة من هنا (في `/billing` فقط — A2).
- نواقص: مقارنة خطط، proration preview، إدارة وسيلة الدفع، مستندات ضريبية، تنبيهات إنفاق.

### 8.18 Billing (مستقل) — `/billing` (`BillingClient`) ⚠️ خارج السايدبار (A2)
عرض/اختيار خطة، Stripe checkout، mock toggle، تسعير لكل شاشة، إجمالي تقديري.
- ❌ **A2** — غير قابل للوصول من القائمة. **ادمج في `/settings/billing`.**

### 8.19 Settings — Profile — `/settings/profile` (`SettingsProfileClient`)
ملف شخصي، تغيير إيميل (OTP)، 2FA، تفضيلات إشعارات (6)، GDPR (تصدير/حذف).
- ❌ **U2** — لا tab navigation بين Profile/Workspace/Billing.
- ⚠️ "حذف الحساب" = anonymize (ليس حذفاً فعلياً).
- ⚠️ redirect بعد الحذف يعتمد `window.location.pathname.split('/')[1]` (هشّ).
- نواقص: avatar، تغيير كلمة سر واضح، sessions، حسابات مرتبطة، لغة لكل مستخدم.

### 8.20 Settings — Workspace — `/settings/workspace` (`WorkspaceSettingsClient`) ⚠️ خارج السايدبار (A1)
اسم الورك سبيس، اللغة، التوقيت، pause/resume، PrayerConfig، RamadanSettings.
- 🔴 **A1** — غير قابل للوصول إطلاقاً. أخطر عيب IA.
- نواقص: حذف/نقل ورك سبيس، danger zone واضح.

### 8.21 Notifications — `/notifications` (`NotificationsPageClient`)
فلتر (الكل/غير مقروء)، عدّاد، "تحديد الكل"، إشعارات المتصفح، قائمة (6 أنواع).
- 🔴 **B3** — `handleMarkAllRead` يعمل `window.location.reload()`.
- ❌ لا pagination (سقف 50)، لا فلتر بالنوع، لا حذف، لا click→navigate.
- نواقص: تفضيلات من هنا، email digest، push حقيقي، grouping.

### 8.22 Audit Log — `/audit-log` (`AuditLogPageClient`)
قائمة (نوع/وقت/actor/metadata/IP)، ألوان لكل نوع (11).
- ❌ لا بحث، لا فلتر، لا pagination (يحمّل كل السجل)، لا تصدير، لا date range.
- نواقص: realtime، diff view، بحث في metadata.

### 8.23 API Docs — `/api-docs` (`ApiDocsClient` + Keys + Webhooks)
3 كروت، Base URL+copy، curl، مجموعات endpoints (accordion)، إدارة مفاتيح، إدارة webhooks (مع test).
- ⚠️ قائمة الـ endpoints ثابتة (غير متولّدة من الـ backend).
- ❌ لا try-it-now، لا request/response examples، لا SDK.
- نواقص: rate limits، error codes، changelog، webhook delivery logs.

### 8.24 Help — `/help` (`HelpSupportClient`)
6 أدلّة سريعة، FAQ (6)، تواصل.
- ❌ **B5** — الروابط ثابتة بلا locale.
- ❌ لا بحث FAQ، لا نظام تذاكر، لا live chat.
- نواقص: فيديوهات، knowledge base، status page، مجتمع.

### 8.25 Branch Detail — `/branches/[workspaceId]` (`BranchDetailClient`) ⚠️ خارج السايدبار
تبويبات (Playlists/Screens/Media/Review)، إحصائيات، pairing.
- ❌ تكرار مع الصفحات الفردية بإمكانيات أقل.
- **الحل:** يبقى كـ "workspace overview" يربط للصفحات الفردية بدل تكرار وظائفها.

---

## 9. نواقص على مستوى المنتج (Product-level)

**حرجة (P0/P1):** A1 (Workspace Settings)، A2 (Billing selection)، B1 (Emergency message)، B3 (Notifications reload)، B9 (Global search يتيم).

**نواقص الموديل:** المسار الطويل (§3)، pairing لشاشة واحدة، Display Groups تدير playlists.

**نواقص UX:** بحث عام مرئي، تبويب Settings، bulk/sort/export، empty CTA، skeletons، إصلاح النصوص الثابتة.

**نواقص فيتشرز (P2/P3):** AI حقيقي، PoP حقيقي، screenshot مباشر، OTA، map view، multi-zone واضح، approval، version history في الواجهة، collaborative editing.

---

## 10. ملخّص التوصيات (يُفصَّل في خطة التنفيذ)

1. **تفكيك التكرارات** (5 أزواج) + إعادة هيكلة السايدبار + إضافة الصفحات اليتيمة.
2. **ربط المبني:** GlobalSearch → الهيدر (+⌘K)، OverviewMetrics → قرار (استخدام/حذف)، Skeleton → كل الصفحات، Tabs → Settings.
3. **إصلاح الباجات المؤكّدة** B1–B9.
4. **توحيد الطبقة العرضية:** skeletons، empty CTAs، فرز/تصدير/bulk، تأكيدات الحذف.
5. **تبسيط الموديل:** Quick Publish من الشاشة/الميديا.
6. **إغلاق نواقص الوصولية** (نص+أيقونة للحالة، aria-live/busy، responsive tables).

---

## 11. تصحيحات على الأوديت السابق (بنود قديمة/مُصلَّحة)

للحفاظ على المصداقية — البنود التالية كانت في نسخة سابقة وتغيّرت في الشجرة الحالية:

| البند السابق | الحالة الآن | الدليل |
|---|---|---|
| "قوالب رسائل الطوارئ ثابتة إنجليزية" | ✅ **أُصلِح** — أصبحت i18n | `emergency-client.tsx:53,120` (`t(\`templates.${id}...\`)`) |
| "AI وهمي بالكامل ومُضلِّل" | 🟡 **جزئياً** — ما زال mock لكن **موسوم Demo** بوضوح | `ai-tools-client.tsx:78-79,126` |
| "Hijri widget مفقود" | ✅ **أُضيف** (T4.2) | `features/islamic/hijri-date-widget.tsx` |
| "auto-pause عند الصلاة غير مطبّق في المشغّل" | ✅ **أُضيف** (T4.1) — المشغّل يستطلع كل 30ث | خطة العلاج §Phase 4 |
| "لا بحث عام" | ⚠️ **دقّة:** المكوّن **موجود لكن يتيم** (B9) — ليس مفقوداً بل غير مربوط | `search/global-search.tsx` |
| "بعض UI primitives مفقودة (Select/Switch/Tabs/Skeleton)" | ✅ **أُضيفت** — لكن التبنّي ناقص (U1/U2) | `components/ui/{select,switch,tabs,skeleton,checkbox}.tsx` |

---

## 12. حالة التسليم (Phase 1 Deliverables)

- [x] جرد كامل للسايدبار (22 عنصر) + 5 صفحات يتيمة.
- [x] كل صفحة: غرض + API + مكوّن + حالة مؤكّدة بدليل.
- [x] 5 تكرارات محدّدة بمصفوفة قرار.
- [x] 9 باجات مؤكّدة بأدلّة `file:line`.
- [x] طبقة عرضية كاملة: IA، تصميم، تفاعل، وصولية، RTL، responsive.
- [x] تصحيح البنود القديمة (مصداقية).
- [x] جدول أولويات موحّد (P0–P3).
- [x] ربط بخطة التنفيذ `PHASE1-ux-implementation-plan.md`.
