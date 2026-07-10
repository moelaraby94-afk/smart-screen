# تقرير التحسين الشامل — Cloud-Screen

> **الفرع:** `fix/security-audit-v2`
> **المنهجية:** كل بند اتحقق منه بالأدوات **وعلى السيرفر الشغّال فعليًا** (Postgres + backend + dashboard + player)، مش بمراجعة الكود بس.
> **بوابة التحقق:** `npm run verify` = `tsc --noEmit` + `eslint --max-warnings=0` + tests + `i18n:check` + builds للتلات تطبيقات. الـ CI بيشغّل نفس السكريبت بالظبط.

---

## نظرة سريعة على الحالة

| الجزء | الحالة |
|---|---|
| **الجزء 1** — إصلاح الأوديت القديم + أخطاء التشغيل | ✅ خلص (3 commits) |
| **الجزء 2** — التحسين المنهجي (7 مراحل) | ✅ خلص (8 commits) |
| **الجزء 3** — الباقي (5 محاور) | ⏳ مخطّط، مبدأش |

### الأرقام

| المقياس | قبل | بعد |
|---|---|---|
| اختبارات الباك إند | 21 | **130** |
| ملفات اختبار الباك إند | 3 | **18** |
| اختبارات البلاير | 0 (مفيش test runner) | **6** |
| تحذيرات lint (التلات تطبيقات) | 19+ | **0** (بوابة صارمة) |
| `tsc --noEmit` | خطأ قديم واحد | **0** |
| CI | بيلنت بـ `--fix` (بيخبّي المخالفات) | بيشغّل `verify` كامل |

---

# الجزء 1 — إصلاح الأوديت القديم وأخطاء التشغيل

قبل التحسين المنهجي، كان فيه جولة إصلاحات سابقة (uncommitted) لتقرير الأوديت الأول. راجعتها، لقيتها **أدخلت أعطال جديدة**، وأصلحتها.

### `861db6e` — إصلاح الـ pairing + الأسرار + صلاحيات الأدمن

- **🔴 كل شاشة جديدة بتتربط كانت بتطلع ميتة.** الباك إند بقى يطلب سيكرت خاص بكل شاشة (`pairingSecretHash`)، لكن البلاير عمره ما استلمه — كان بيبعت السيكرت المشترك القديم. النتيجة: `GET /player/bootstrap` بيرجّع **401** والتلفزيون يفضل أسود. ماحدش لاحظ لأن شاشات الـ seed بتتعمل من غير الـ hash فبتمشي على fallback قديم. **الإصلاح:** البلاير يستلم سيكرته من الـ poll ويخزّنه، وحدث الـ socket بقى مجرد تنبيه للـ poll (مش مصدر للسيكرت). مع integration test كامل.
- **🔴 حارس الأسرار مكانش بيمسك أسرار المشروع نفسه.** كان بيمنع `dev-access-secret` بس، لكن `docker-compose.yml` بيحط `change-me-in-production` — **مش في القائمة فبيعدّي**. اتحوّل لفحص طول (≥32) + إنتروبي + اختلاف access عن refresh. وضفت claim `typ` يمنع استخدام refresh token كـ access token.
- **🟠 صلاحيات الأدمن اتوسّعت غلط.** أي `platformStaffRole` كان بيوصل سجل التدقيق كامل. أعيد كتابة الحارس **fail-closed** (`@PlatformRoles`).
- **🟠 الكتابة على القرص جوه Prisma transaction** (ملف 150MB جوه lock 5 ثواني) → نُقلت برّه بـ temp-then-rename. وبوابة تخطّي الكوتا في `duplicateMediaToWorkspace` اتقفلت.
- **🟠 سجل التدقيق كان ملف JSON** فيه race → اتنقل لجدول `AuditLog` في Postgres.
- **🟠 الـ backup مكانش بيغطّي الداتابيز** (volume الميديا بس) → `pg_dump` + volume الـ `.data` + سكريبت `restore`.
- **🟠 `Dockerfile.backend` healthcheck على بورت غلط** (4000 بينما التطبيق على 3000) → اتصلح.
- **🟠 `AllExceptionsFilter` كان بيكسر في سياق WebSocket** → بقى واعي بالـ context.

### `39a7813` + `9accd5c` — 6 أخطاء ماظهرتش غير بالتشغيل الفعلي

- **🔴 حلقة إعادة توجيه لتسجيل الدخول.** `server-auth.ts` كان بيستخدم `??` مع `INTERNAL_API_BASE_URL` اللي بيتشحن `""` — و`??` مبترجعش للبديل مع الـ string الفاضية. فـ `fetch("/auth/me")` بمسار نسبي كان بيرمي `TypeError`، والـ `catch` الفاضي بيحوّله لـ "مش مسجّل دخول" → كل صفحة محمية بتردّك للّوجين. **الإصلاح:** `||` بدل `??`.
- **`docker-compose.yml` مكانش بيتقرا** — الحراسات `${VAR:?msg}` فيها `: ` كسرت الـ YAML.
- **`prisma db seed` كان no-op صامت** — Prisma 7 نقل الإعداد لـ `prisma.config.ts`.
- **بانر `NOT_REGISTERED`** — البلاير كان بيبعت register + heartbeat في نفس اللحظة قبل ما السيرفر يربط الـ socket.
- **`Hydration failed`** — `NextIntlClientProvider` مكانش بياخد `timeZone`.
- **`[missing:...storageSubQuota]`** — مفتاح ترجمة بمسار غلط (`cards.` ناقصة).

---

# الجزء 2 — التحسين المنهجي (7 مراحل)

## المرحلة 0 — بوابة تحقق واحدة (`2bc61b5`)

- `npm run verify` واحدة بتلمّ كل الفحوصات، والـ CI بيشغّلها بالظبط.
- **اكتشاف:** سكريبت `lint` بتاع الباك إند كان شغّال بـ `--fix` — في الـ CI كان **بيصلّح المخالفات ويخرج 0** (يعني مفيش حماية حقيقية). وماكانش فيه lint للباك إند ولا typecheck ولا اختبارات بلاير أصلًا.
- 19 تحذير lint اتصلحوا (مش اتخبّوا)، منهم 4 حقيقيين. أهمهم: `IntlErrorHandlingProvider` كان بيبعت `onError`/`getMessageFallback` كـ arrow جديدة كل render، فبيكسر الـ memoization بتاع `t` — كل effect بيعتمد على `t` كان بيعيد التشغيل كل render.
- `prisma.config.ts` بقى يقرا `.env` بنفسه — `npm run prisma:migrate` كان بيفشل من clone جديد بـ "datasource.url is required".

## المرحلة 1.1 — تحقق DTO لكل request body (`548a59e`)

`ValidationPipe({ whitelist, forbidNonWhitelisted })` بيفحص الـ **class DTOs** بس. 5 مسارات كانت بتاخد `@Body() body: {...}` inline type، فالـ pipe بيتخطّاها. أثبتّ على السيرفر الشغّال:
- `POST /media/folders {"name":12345}` → **500** (`name.trim()` بيرمي — أي EDITOR يوصله) · دلوقتي **400**
- `{"name":"x","evilField":"y"}` → الحقل المجهول كان بيعدّي · دلوقتي **400**
- `PATCH /subscriptions/mock-plan {}` كان بيعمل default لـ `FREE` — يعني غلطة إملائية في اسم الحقل **بتخفّض خطة العميل بصمت** · دلوقتي **400**

الحل: `FolderNameDto`, `MoveMediaFolderDto`, `SetMockPlanDto`. + 12 اختبار يشغّل الـ controllers الحقيقية خلف نفس الـ pipe.

## المرحلة 1.2 — Rate limiting فعلي (`b7539fb`)

`ThrottlerModule.forRoot()` كان **بيعرّف** الحد ومحدش بينفّذه — الـ `ThrottlerGuard` كان متركّب يدويًا على 5 controllers بس، والـ 11 الباقيين (admin, media, playlists, screens, schedules, canvases, player…) مفتوحين تمامًا.
- سجّلت `ThrottlerGuard` كـ `APP_GUARD` (300/min افتراضي، قابل للضبط).
- **اكتشاف:** لما سجّلته عالميًا، الـ controllers اللي عليها الحارس يدويًا بقت **تعدّ مرتين**. قِسْتها: `forgot-password` حده 5 كان بيسمح بـ **2 بس**. شِلت التركيبات الزائدة.
- **اكتشاف:** `POST /auth/login` مكانش عليه `@Throttle` خالص — أهم هدف لهجمات كلمات السر. اتضاف **20/min**، ونفس الشيء لـ `register/verify` (كود 6 أرقام) و`reset-password`.
- Stripe webhooks و player kiosk اتعملهم `@SkipThrottle()` (Stripe بيعيد المحاولة، والشاشات في محل واحد بتشارك IP).
- `TRUST_PROXY_HOPS` — عشان `req.ip` ميبقاش IP البروكسي (bucket واحد للكل + IP غلط في سجل التدقيق).

**متحقق على السيرفر:** login بيسمح بـ 20 بالظبط ثم 429؛ pairing-create بـ 30؛ الـ player poll مبيتقفلش.

## المرحلة 1.3 — Pagination حقيقي (`77248b6`)

`screens` كان `limit` معرّف `@Min(1)` من **غير حد أقصى** → `?limit=1000000` مقبول (الـ pagination شكلية). `playlists`/`canvases`/`schedules` مكانش عندهم pagination خالص (`findMany` مفتوح).
- `PaginationQueryDto` + `buildPage()` — الحد بيتقصّ لـ 500 و**بيترجّع في الرد** عشان العميل يعرف إنه اتقصّ.
- كل list route بقى يربط whole-query DTO (لأن `forbidNonWhitelisted` بيرفض `workspaceId` لو ربطت الـ pagination DTO لوحده — اكتشفته على السيرفر).
- **الأهم — الـ UI بطّل يحسب:** `overview-metrics.tsx` كان بينزّل **مكتبة الوسائط كلها** ويعمل `arr.reduce((a,m)=>a+m.sizeBytes,0)` في المتصفح عشان يعرض رقمين. `use-workspace-stats.ts` كان بينزّل كل الميديا وكل الـ playlists عشان `.length` — في كل render للـ sidebar. دلوقتي `GET /media/stats` بيرجّع العدّ من `count()`+`aggregate()`، والـ UI بيقرا `total` من الـ envelope.

**متحقق على السيرفر:** `?limit=1000000` بيرجّع `limit:500`؛ `?take=` بقى 400؛ `page=2&limit=2` بيرجّع الصفحة التانية.

## المرحلة 1.5 — عقد أخطاء بكودات ثابتة (`395017c` + `187ba19`)

الباك إند كان بيرمي **نص إنجليزي** كاستثناء، و**29 كومبوننت** بيعرضوه حرفيًا — يعني المستخدم العربي كان بيشوف `"Email already registered"` بالإنجليزي. وأسوأ: `screens.service` كان بيحقن بيانات جوه النص (`SCREEN_LIMIT_REACHED:25`) والـ UI بيقطّعه، بينما `pairing.service` بيرمي `LIMIT_REACHED` (كود مختلف لنفس القاعدة).

**الباك إند:** كل رد خطأ بقى `{ statusCode, code, message, details? }`. `DomainException` (بتحمل الكود + بيانات) + `normalizeHttpError` (بتلمّ **كل حاجة** — حتى استثناءات Nest الجاهزة والـ `ValidationPipe` والـ `ThrottlerException` بياخدوا كود). حوّلت المواضع اللي المستخدم بيوصلها فعليًا.

**الـ UI:** اتشال منه `readApiErrorMessage` و`parseScreenLimitFromApiMessage` **نهائيًا** (محذوفين مش deprecated). بقى يقرا `errors.<CODE>` من كاتالوج (32 مفتاح en/ar، متطابقين مع 31 كود في الباك إند). حذفت كل فروع `msg.includes(...)`.

**دليل من المتصفح:** دخول بكلمة سر غلط على `/ar/login` → **«البريد الإلكتروني أو كلمة المرور غير صحيحة.»** (كانت `Invalid credentials`).

## المرحلة 3.1 — القدرات محسوبة في الباك إند (`446b842`)

`client-home-dashboard` كان بيحسب `storagePct = Math.min(100, Math.round((100*used)/quota))` — **قاعدة عمل جوه كومبوننت React**.
- `computeWorkspaceCapabilities(usage, limits)` — دالة نقية واحدة بترجّع `screens:{used,limit,remaining,canCreate}` و`storage:{usedBytes,limitBytes,remainingBytes,usedPct,canUpload}`. الحدود `null` = غير محدود. 9 اختبارات للحدود (عند الحد، فوقه، صفر، غير محدود).
- `/account/insights` بيرجّع `capabilities` لكل فرع.
- الـ UI بيقرا `capabilities.storage.usedPct` بدل ما يحسب. اتأكدت إن الرقم متطابق قبل التغيير.
- **تحسين جانبي:** إجمالي التخزين في insights كان بـ `findMany({select:{sizeBytes}})` ثم `reduce` → بقى `count()` + `aggregate()`.

## المرحلة 1.4 — اختبارات عزل المستأجرين (`e072178`)

الأوديت أثبت **يدويًا** إن مفيش IDOR (تتبّعت 23 استعلام). دلوقتي فيه **حماية آلية** من الرجوع:
- `roles.guard.spec.ts` (10 اختبارات) — `RolesGuard` هو الحدّ الأمني الأساسي و**ماكانش عليه أي اختبار**. بيغطي: العضو المسموح بيعدّي، **غير العضو مرفوض** (الحالة الأساسية للـ IDOR)، الدور الأقل مرفوض، `workspaceId` مطلوب، الـ super admin بيعدّي، ومصدر الـ workspaceId (params/query/body/header).
- `cross-tenant-scoping.spec.ts` (12 اختبار) — Prisma مزيّف بيفلتر `findFirst` بكل مفتاح في الـ `where`، مزروع بصف مملوك لـ workspace A. كل getter (canvases/schedules/screens/media) لازم: يرجّع الصف لصاحبه، **يرفض طلب workspace تاني له حتى لو عضو**، ويرفض id مجهول. **لو أي getter اتغيّر ليدوّر بـ `id` لوحده، الاختبار بيسقط** — وده بالظبط الـ IDOR اللي بيحرسه.

## المرحلة 2.x — قفل الدخول لكل حساب (`52a764e`)

الـ rate limit لكل IP، فهجمة موزّعة على حساب واحد — أو من مكتب ورا NAT واحد — كانت **غير محدودة**.
- `LoginLockout` — 10 محاولات فاشلة في 15 دقيقة → قفل 15 دقيقة. مربوط بالـ **email** (مش userId)، والمحاولة الفاشلة بتتعدّ حتى للإيميل **غير الموجود** → **مستحيل يتستخدم لمعرفة الحسابات الموجودة** (كل إيميل بيتقفل بنفس الطريقة). بيتمسح مع أول دخول ناجح.
- كود `TOO_MANY_LOGIN_ATTEMPTS` (429) بـ `details.retryAfterSeconds`، والـ UI بيترجمه (en/ar).
- جدول + migration جديدة، على نمط `PairingClaimLockout` الموجود.
- **دليل من Postgres:** 10 محاولات لإيميل **غير موجود** → 401×10 ثم 429 مع صف حقيقي (failedCount=10, locked) — يثبت خاصية عدم كشف الحسابات · 3 غلط لحساب حقيقي (failedCount 1,2,3) ثم كلمة السر الصح → **200 والصف اتمسح**.

---

# الجزء 3 — الباقي (تفصيلي)

الترتيب المخطّط: **3.2 → 2 → 3 → 4 → 5**. كله تقني ماعدا بوابة الدفع.

## المحور 3.2 — طبقة بيانات في الفرونت إند (الأولوية التالية)

**المشكلة بالأرقام:** **36 كومبوننت `.tsx` بينادوا `apiFetch` مباشرة**، مقابل 8 hooks بس. يعني منطق الـ fetching والـ state والعرض مخلوطين.

**الخطة:**
- `features/<domain>/api/*.ts` — دوال request مكتوبة الأنواع (typed)، الكومبوننت مبيعرفش الـ URLs ولا شكل الـ payload.
- Hooks بتمسك الـ state والـ async (`{data, actions, isLoading}`) — على نمط `useApiScreens` و`use-branch-playlists` الموجودين.
- الكومبوننت يبقى **عرض بس** — مفيش `apiFetch` جواه نهائيًا.
- **الهدف النهائي:** الـ UI ملوش أي سلطة على المنطق — بياخد بيانات جاهزة ويعرضها.

## المحور 2 — تدقيق البيزنس لوجيك (عميق، ملف ملف)

مراجعة كل domain service مقابل موديل Prisma وقواعد المنتج:
- **الجدولة (`scheduling.service`):** التعامل مع DST، الجداول اللي بتعدّي منتصف الليل (22:00–06:00)، ترتيب الأولوية (Override > Schedule > Default). (الأوديت الأولي شاف الأساس سليم — محتاج تدقيق أعمق + اختبارات).
- **الـ Playlists:** دلالات النسخ (`duplicate`) والاستنساخ عبر الفروع (`clone-to-workspace`)، العناصر اليتيمة، ترتيب `orderIndex`.
- **الاشتراكات:** انتقالات `trial → active → expired → paused`، وفرض حدود الشاشات + التخزين على **كل** مسار كتابة.
- **Stripe:** تغطية الـ webhooks، الـ idempotency، التوفيق (reconciliation) بين حالة Stripe والداتابيز.
- **الـ Pairing:** انتهاء الصلاحية، التنظيف، إعادة الربط، دوران السيكرت (secret rotation — الـ handoff بيتقرا مرة واحدة، لو ضاع الشاشة لازم تتربط من جديد).

## المحور 3 — معمارية الفرونت إند + UI/UX

- **تفكيك الـ 5 God Components الباقية:**
  - `admin-customer-profile-client.tsx` — **874 سطر**
  - `client-home-dashboard.tsx` — **822**
  - `studio-editor-client.tsx` — **669**
  - `screens-client.tsx` — **662**
  - `media-library-client.tsx` — **723**
  - (`branch-detail-client.tsx` — 936 سطر، اتفكّكت جزئيًا في جولة سابقة لكن لسه كبير)
- **Accessibility (WCAG AA):** labels، focus management، تباين الألوان، التنقل بالكيبورد، دعم RTL الكامل. (فحص سريع: `aria-label` في 16 ملف بس، `role=` في 6 — تغطية ناقصة).
- **حالات موحّدة:** loading / empty / error لكل شاشة.
- **نظام تصميم متسق** عبر الصفحات.

## المحور 4 — Observability و Operations

- **Logging منظّم** بـ request IDs (`x-request-id`) — دلوقتي بيستخدم Nest Logger الافتراضي بس، **مفيش structured logging ولا request correlation**.
- **فصل liveness عن readiness** — الـ readiness لازم يفحص اتصال Prisma فعليًا (دلوقتي `/health` بيرجّع 200 ثابت).
- **Sentry:** release tagging + تنظيف الـ PII على التطبيقين.
- **تجربة استرجاع (restore drill)** فعلية للـ backup.

## المحور 5 — الفيتشرز الناقصة (تحتاج قرار منتج)

- **جلسات متعددة الأجهزة + إلغاء:** دلوقتي `refreshTokenHash` عمود **واحد** على المستخدم — دخول من جهاز جديد بيلغي القديم بصمت. مفيش "خروج من كل الأجهزة" ولا رؤية الجلسات النشطة.
- **دورة حياة دعوات الفريق** (invite lifecycle).
- **Analytics / Proof-of-Play (Module 8):** **صفر models** حاليًا (`grep` رجّع 0).
- **POS / Foodics (Module 7) + قوالب منيو للمطاعم:** **صفر models** حاليًا.
- **تطبيق Android** (البلاير لسه Next.js ويب).
- **🅿️ بوابة دفع سعودية (Moyasar/HyperPay) — مؤجّلة بطلبك صراحةً.**

---

## ملاحظات تشغيلية

1. **Migration جديدة:** `20260710120000_add_login_lockout` — أي بيئة قائمة محتاجة `npx prisma migrate deploy`.
2. **الفرع:** كل الشغل على `fix/security-audit-v2` — 12 commit، الشجرة نظيفة.
3. **قبل الـ deploy:** ولّد الأسرار (`openssl rand -hex 32` للـ JWT × 2 + player secret) — الباك إند بيرفض الإقلاع في production من غيرها.
