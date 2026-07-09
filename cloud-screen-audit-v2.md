# تقرير Audit v2 — Cloud-Screen (مُحدَّث بعد تنفيذ الإصلاحات)

> **حالة التقرير:** كل البنود الحرجة والعالية اللي اتذكرت هنا **اتصلحت واتحقق منها فعليًا**.
>
> **التحقق (شغّلت الأدوات، مش ادعاء):**
>
> | الفحص | النتيجة |
> |---|---|
> | `tsc --noEmit` (backend) | ✅ **0 أخطاء** (حتى الـ `TS7022` القديم اتصلح) |
> | `eslint src/**/*.ts` (backend) | ✅ **0 أخطاء** |
> | `jest` (backend) | ✅ **10 suites / 53 اختبار** — كانت 8 / 21 |
> | `nest build` (backend) | ✅ ينجح |
> | `tsc --noEmit` (player) | ✅ 0 أخطاء |
> | `node --test` (player) | ✅ **6 اختبارات** — ماكانش فيه test runner أصلًا |
> | `next build` (player) | ✅ ينجح |
> | `npm run i18n:check` | ✅ key-parity + hardcoded-scan + missing-marker-scan كلهم OK |
> | `next build` (dashboard) | ✅ ينجح |
> | **تشغيل فعلي للـ stack** | ✅ Postgres + backend + dashboard + player — شوف القسم 15 |
>
> **الحالة:** كل الشغل اتعمله commit على فرع `fix/security-audit-v2`
> (`861db6e` الإصلاحات، `39a7813` أخطاء التشغيل الفعلي).

---

## 0. الخلاصة التنفيذية

الجولة السابقة من الإصلاحات كانت شغل حقيقي، لكنها أدخلت **عطل بيكسر أهم flow في المنتج** (كل شاشة جديدة بتتربط كانت بتطلع ميتة) و**ثغرة في حارس الأسرار نفسه**.

دلوقتي: **10 بنود اتصلحوا**، ولكل واحد فيهم **اختبار بيمنع رجوعه**.

| # | المشكلة | الخطورة | الحالة |
|---|---|---|---|
| 1 | كل شاشة جديدة بتتربط = شاشة ميتة | 🔴 حرج | ✅ **اتصلح + integration test** |
| 2 | حارس الأسرار مش بيمسك `change-me-in-production` | 🔴 حرج | ✅ **اتصلح + 9 اختبارات** |
| 3 | `docker compose up` مبيقلعش | 🔴 حرج | ✅ **اتصلح** |
| 4 | صلاحيات الأدمن اتوسّعت / الأدوار مش متمايزة | 🟠 عالي | ✅ **اتصلح (fail-closed) + 9 اختبارات** |
| 5 | كتابة ملف 150MB جوه الـ transaction | 🟠 عالي | ✅ **اتصلح + 8 اختبارات** |
| 6 | `duplicateMediaToWorkspace` بيتخطى الكوتا | 🟠 عالي | ✅ **اتصلح + اختبارين** |
| 7 | سجل التدقيق ملف JSON فيه race | 🟠 عالي | ✅ **اتنقل لـ Postgres + 3 اختبارات** |
| 8 | النسخ الاحتياطي مش بيغطي الداتابيز | 🟠 عالي | ✅ **اتصلح (backup + restore)** |
| 9 | `Dockerfile.backend` healthcheck على بورت غلط | 🟠 عالي | ✅ **اتصلح** |
| 10 | `AllExceptionsFilter` بيكسر في سياق WebSocket | 🟠 عالي | ✅ **اتصلح + 4 اختبارات** |

---

## 1. ✅ [حرج] كل شاشة جديدة بتتربط كانت بتطلع ميتة

### المشكلة (بالدليل)
1. `pairing.service.ts` بقى يولّد سيكرت خاص بكل شاشة ويخزّن `pairingSecretHash`.
2. `player.service.ts` و `realtime.gateway.ts` بقوا **يطلبوا** السيكرت ده لما الـ hash موجود.
3. البلاير **عمره ما استلمه**: النوع `PollPairingSessionResponse` مكنش فيه حقل `screenSecret` أصلًا، و`player-pairing-wait.tsx` كان بيحفظ السيريال بس.

النتيجة: `GET /player/bootstrap` → **401**، و`screen:register` → **UNAUTHORIZED**. التلفزيون يفضل أسود.

**ليه محدش لاحظ:** شاشات الـ seed بتتعمل من `workspaces.service.ts` **من غير** `pairingSecretHash` → قيمته `NULL` → بتمشي على الـ fallback القديم وبتشتغل. الفحص اليدوي اتعمل على الشاشات دي بالظبط.

### الإصلاح
- `apps/player/src/lib/pairing-handoff.ts` **(جديد)** — دالة نقية `interpretPollResult()` بتفسّر رد الـ poll. الحالة الخطيرة (`complete` من غير `screenSecret`) بترجع `failed` مش `paired`، فمستحيل نحفظ سيريال من غير بيانات اعتماد.
- `auth-session.ts` — تخزين/قراءة/مسح السيكرت (`cs_player_screen_secret`).
- `player-pairing-wait.tsx` — بيحفظ السيكرت **قبل** الـ reload، وفيه single-flight guard لأن الـ handoff بيتقرا مرة واحدة بس.
- **حدث الـ socket `pairing:complete` بقى مجرد تنبيه للـ poll**، مش مصدر للإنهاء — لأنه بيتبث لـ room ومستحيل ينقل سيكرت.
- `player-runtime.tsx` — `secret = pairedSecret || envSecret`، والـ pairing بقى شغال من غير ما تحتاج السيكرت المشترك أصلًا.
- الـ fallback للشاشات القديمة (`pairingSecretHash = NULL`) **اتساب شغال** عن قصد.

### التحقق
`apps/backend/src/domains/pairing/pairing-to-bootstrap.integration.spec.ts` **(جديد، 6 اختبارات)** — بيشغّل الـ flow الحقيقي: `startSession → claimSession → pollSession → bootstrap → screen:register`، بـ bcrypt حقيقي وHTTP حقيقي (supertest):

- ✅ الـ poll بيسلّم السيكرت **مرة واحدة**، والتانية بترجع `null`
- ✅ الداتابيز بتخزن **hash بس**، والـ handoff بيتمسح بعد الاستهلاك
- ✅ `GET /player/bootstrap` بالسيكرت الجديد → **200**
- ✅ `GET /player/bootstrap` بالسيكرت المشترك → **401** ← *حارس الـ regression*
- ✅ `screen:register` بيقبل الجديد ويرفض المشترك
- ✅ الشاشات القديمة (NULL hash) لسه شغالة بالـ fallback

`apps/player/src/lib/pairing-handoff.test.ts` **(جديد، 6 اختبارات)** — بيثبّت الطرف التاني من العقد، وفيه اختبار صريح للشكل اللي كان البلاير بيقبله غلط.

> **ملاحظة تصميمية باقية:** الـ handoff بيتقرا **مرة واحدة**. لو ضاع (البلاير قفل بين الـ poll والحفظ)، الشاشة لازم تتربط من جديد. ده مقصود أمنيًا، والبلاير دلوقتي بيقول للمستخدم كده صراحةً بدل ما يدخل في loop من 401.

---

## 2. ✅ [حرج] حارس الأسرار مكنش بيمسك أسرار المشروع نفسه

**المشكلة:** `assert-production-secrets.ts` كان بيمنع 3 قيم بس (`dev-access-secret`…)، بس `docker-compose.yml` كان بيحط `change-me-in-production` — **مش في القائمة، فكان بيعدّي**. الحارس كان بيدّي **إحساس زائف بالأمان** على سيكرت مكتوب في ريبو عام.

**الإصلاح:** القائمة السوداء بقت خط الدفاع التاني مش الأول:
- **طول ≥ 32 حرف** (`openssl rand -hex 32`)
- **≥ 8 حروف مختلفة** (يرفض `'a'.repeat(64)`)
- قائمة موسّعة بالـ placeholders (شاملة `change-me-in-production`)
- **`JWT_ACCESS_SECRET` لازم يختلف عن `JWT_REFRESH_SECRET`**

**دفاع في العمق — claim `typ`:** التوكن دلوقتي فيه `typ: 'access' | 'refresh'`:
- `jwt.strategy.ts` بيرفض أي توكن `typ === 'refresh'`
- `auth.service.refreshTokens()` بيرفض أي توكن `typ === 'access'`
- `realtime.gateway.parseUserFromSocket()` بيرفض الـ refresh كذلك

يعني حتى لو السيكرتين اتظبطوا غلط بنفس القيمة، **الـ refresh token مبقاش ينفع كـ access token**. والتوكنات القديمة (من غير `typ`) لسه مقبولة، فمفيش تسجيل خروج جماعي عند النشر.

**التحقق:** `assert-production-secrets.spec.ts` — **9 اختبارات**، منها واحد صريح اسمه *"rejects docker-compose's 'change-me-in-production' default"*.

---

## 3. ✅ [حرج] `docker compose up` مكنش بيقلع

`docker-compose.yml` كان بيحط `NODE_ENV=production` مع `PLAYER_HEARTBEAT_SECRET` الافتراضي — واللي هو **في قائمة المنع** — فالسيرفر كان بيموت عند الإقلاع بالإعدادات الافتراضية اللي الـ README نفسه بيقولها.

**الإصلاح:** القيم الافتراضية الخطرة **اتشالت خالص**. بقت `${JWT_ACCESS_SECRET:?...}` — يعني Compose بيقف برسالة واضحة لو المتغير مش موجود، **قبل** ما الحاوية تشتغل. مفيش أي سيكرت افتراضي في `docker-compose.yml` دلوقتي.

---

## 4. ✅ [عالي] صلاحيات الأدمن: من "معطّلة" لـ "مفتوحة زيادة" لـ **fail-closed**

**المشكلة:** الحارس على مستوى الـ Controller بقى يقبل **أي** `platformStaffRole`. فموظف Billing كان بيقدر يقرا **سجل التدقيق كامل** (`GET admin/logs`)، وكل بيانات كل العملاء، ويعمل workspaces. والدورين كان ليهم نفس الصلاحيات بالظبط.

**الإصلاح:** ديكوريتور `@PlatformRoles(...)` + `PlatformStaffDbGuard` أعيدت كتابته ليكون **fail-closed**:
- الـ super admin بيعدّي كل حاجة
- أي دور تاني **بيعدّي بس المسارات اللي بتسمّي دوره صراحةً**
- **مسار من غير ديكوريتور = super admin بس** ← نسيان الديكوريتور بيقفل المسار، مش بيفتحه

التوزيع الحالي:

| المسار | مين يوصله |
|---|---|
| `GET admin/users` · `customers*` | SUPPORT + BILLING |
| `GET admin/workspaces` · `screens` · `fleet/screens` | SUPPORT |
| `GET admin/stats` (الإيرادات) | BILLING |
| **`GET admin/logs` (سجل التدقيق)** | **super admin بس** |
| `GET admin/settings` | super admin بس |
| **كل عمليات الكتابة** | **super admin بس** |

> تفويض عمليات الكتابة لأدوار معيّنة **قرار منتج** مش قرار تقني — سبتها مقفولة لحد ما تقرر.

**التحقق:** `platform-staff-db.guard.spec.ts` — **9 اختبارات**، منها *"is fail-closed: staff cannot reach a route that grants no roles"* و *"does not let one staff role reach another role's route"*.

---

## 5 و 6. ✅ [عالي] الميديا: الكتابة جوه الـ transaction + تخطّي الكوتا

**المشكلتين:**
1. `saveUploadedFile` كان بيكتب ملف يوصل 150MB **جوه** `$transaction` ماسك `pg_advisory_xact_lock` → مهلة Prisma الافتراضية 5 ثواني تنتهي (`P2028`)، والملف مبيترجعش مع الـ rollback → **ملفات يتيمة + كوتا بتحسب غلط**.
2. `duplicateMediaToWorkspace` **مكنش بيفحص الكوتا خالص** → تجاوز الحد المدفوع بنسخ playlists بين الفروع.

**الإصلاح:**
- دالة مشتركة `assertWithinStorageQuotaTx()` — القفل + الفحص، بتتستدعى من **المسارين**.
- ترتيب جديد: **اكتب لملف مؤقت `.part` → افتح transaction قصيرة (قفل + فحص + `media.create`) → `rename` ذرّي بعد الـ commit**.
- لو الـ `rename` فشل، الصف بيتمسح من الداتابيز عشان الكوتا متعدّش على ملف مش موجود.
- `sizeBytes` بقى `buffer.length` (حقيقة) مش `params.size` (بيجي من العميل).
- **`main.ts` بقى يرجّع 404 لأي مسار بينتهي بـ `.part`** — لأن الملفات المؤقتة بتعيش لحظات جوه المجلد اللي بيتقدّم static.

**التحقق:** `media.service.spec.ts` — **12 اختبار** (كانت 2)، بـ PNG حقيقي و`file-type` حقيقي:
- ✅ *"writes the file before opening the transaction, not inside it"*
- ✅ *"takes the per-workspace advisory lock before reading the used total"*
- ✅ *"rolls back the DB row if the file cannot be moved into place"*
- ✅ *"enforces the target workspace quota and cleans up on rejection"* (النسخ)
- ✅ رفض HTML متسمّي `.png` (magic bytes حقيقية)

> **اكتشاف جانبي:** `await import('file-type')` (حزمة ESM بحتة) **مكنش ممكن يتنفذ تحت Jest** أصلًا — يعني كل مسار الـ magic-bytes كان **غير قابل للاختبار**. `test` script بقى `node --experimental-vm-modules …` فبقى الكود ده متغطّى فعليًا.

---

## 7. ✅ [عالي] سجل التدقيق اتنقل من ملف JSON لـ Postgres

**المشكلة:** `appendAuditLog` كان بيعمل `readFile` → تعديل → `writeFile` للملف كله **من غير أي قفل**. عمليتين متزامنتين = **سجل ضايع**. وكمان الملف كان برّه أي نسخة احتياطية للداتابيز.

**الإصلاح:**
- جدول `AuditLog` في `schema.prisma` + migration `20260709120000_add_audit_log_table`
- `common/audit/audit-log.service.ts` **(جديد)** — كل append بقى `INSERT` ذرّي واحد
- `admin.service` و `auth.service` بيحقنوه بدل الدوال العامة
- `admin-runtime.store.ts` بقى للإعدادات بس، وبيتجاهل مفتاح `logs` القديم لو موجود

**التحقق:** `audit-log.service.spec.ts` — 3 اختبارات، منها *"keeps every entry when appends run concurrently"* (25 append متوازي → 25 صف).

---

## 8. ✅ [عالي] النسخ الاحتياطي بقى يغطي الداتابيز

`scripts/backup-uploads.sh` كان بياخد نسخة من volume الميديا **بس** — يعني بند "مفيش backup للداتابيز" كان **لسه مفتوح بالكامل** رغم وجود سكريبت اسمه backup.

**الإصلاح** (السكريبت القديم اتشال، وبقى subset من الجديد):
- `scripts/backup.sh` — `pg_dump` **+** volume الميديا **+** volume الـ `.data`، مع `RETENTION_DAYS` اختياري، وبيمسح الأرشيف الناقص لو الـ dump فشل
- `scripts/restore.sh` **(جديد)** — نسخة احتياطية متجرّبتش مش نسخة احتياطية
- `docs/runbook.md` — أمر الـ cron + تحذير "جرّب الاسترجاع كل ربع سنة"

---

## 9. ✅ [عالي] `Dockerfile.backend`: healthcheck على بورت غلط

كان `EXPOSE 4000` و healthcheck على `:4000/api/v1`، بينما التطبيق بيسمع على `PORT || 3000` والـ Dockerfile مبيحطش `PORT`. `docker-compose` كان بيخفي المشكلة بـ healthcheck خاص بيه — لكن أي `docker run` أو **Railway** كان بيشوف الحاوية **unhealthy للأبد**.

**الإصلاح:** `ENV PORT=3000` + `EXPOSE 3000` + الفحص على `/health` (الـ endpoint المخصص اللي بيرجع 200 بس). بقى متسق مع `Dockerfile.dashboard`.

---

## 10. ✅ [عالي] `AllExceptionsFilter` بقى واعي بالسياق

**المشكلة:** الفلتر مسجّل كـ `APP_FILTER`، فبيستقبل استثناءات الـ WebSocket كمان. هناك `switchToHttp().getResponse()` بترجع **payload الرسالة**، فـ `response.status()` كانت بترمي `TypeError` **جوه الفلتر نفسه** — الخطأ الأصلي بيتخفي والـ client مبياخدش رد.

**الإصلاح:** `switch (host.getType())` — HTTP بياخد رده الطبيعي، والـ WS بياخد `client.emit('exception', …)` برسالة عامة مع تسجيل الخطأ الحقيقي. وضفت حماية `response.headersSent`.

**التحقق:** `all-exceptions.filter.spec.ts` — 7 اختبارات، منها *"does not throw, and reports a generic error to the client"* و *"never leaks the underlying error text to the socket client"*.

> **للأمانة:** كنت متوقع إن `@SentryExceptionCaptured()` هيبعت كل الـ 4xx لـ Sentry. **فحصت كود المكتبة الفعلي** ولقيت `isExpectedError()` بيستثني الـ `HttpException` صح. **التوصيل كان سليم — مفيش مشكلة، والتوقع كان غلط.**

---

## 11. 🟡 بنود متوسطة (مفتوحة عن قصد)

| البند | الحالة |
|---|---|
| كود الربط بيتبحث عنه عبر كل المستأجرين (`where {code, PENDING}`) | مفتوح — الـ throttle واللوك أوت بيخففوا الـ brute force، بس التصميم نفسه محتاج قرار |
| اللوك أوت مربوط بالـ `userId` والتسجيل مجاني | مفتوح — تخفيف حقيقي مش قفل |
| `NEXT_PUBLIC_PLAYER_HEARTBEAT_SECRET` بيتحقن في bundle البلاير | **أثره اتقلّص جدًا** — الشاشات الجديدة بقى ليها سيكرت خاص. باقي كـ fallback للشاشات القديمة بس، وموثّق في `.env.example` |
| `buildPublicUrl` بيشتغل بس لو `MEDIA_UPLOAD_DIR` جوه `uploads/` | مفتوح (متغطّى باختبار للسلوك الحالي) |
| نسخة التوكن في `localStorage` (§17.1 القديم) | مفتوح — محتاج تأكيد مين بيعتمد عليها |
| جلسة واحدة لكل مستخدم (`refreshTokenHash` عمود واحد) | مفتوح — تغيير معماري |
| `Dockerfile.dashboard` مبينسخش `packages/` ولا `apps/marketing/package.json` | مفتوح — يستاهل تحقق بـ `docker build` فعلي |

---

## 12. ❌ الغائب بالكامل (لم يتغير — موديولات، مش أخطاء)

| البند | الحالة |
|---|---|
| **Module 7 — تكامل POS (Foodics)** | ❌ صفر models |
| **Module 8 — Analytics / Proof-of-Play** | ❌ صفر models |
| **بوابة دفع سعودية (Moyasar/HyperPay)** | ❌ Stripe بس |
| **تطبيق Android** | ❌ البلاير لسه Next.js ويب |
| **قوالب منيو للمطاعم** | ❌ الـ Canvas لسه عام |
| **تغطية اختبارات أوسع** | جزئي — بقت **59 اختبار** (53 backend + 6 player) بعد ما كانت 21. لسه مفيش تغطية لعزل الـ workspaces والـ Playlists |

---

## 13. الخطوات التالية

1. **`git commit`** — كل ده لسه uncommitted
2. **شغّل الـ migration** على أي بيئة قائمة: `npx prisma migrate deploy` (بيضيف جدول `AuditLog`)
3. **ولّد الأسرار** قبل أي `docker compose up`:
   ```bash
   printf 'JWT_ACCESS_SECRET=%s\nJWT_REFRESH_SECRET=%s\nPLAYER_HEARTBEAT_SECRET=%s\n' \
     "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" >> .env
   ```
4. **أي شاشة اتربطت قبل الإصلاح ده لازم تتربط من جديد** — عندها `pairingSecretHash` في الداتابيز بس البلاير معندوش السيكرت
5. جرّب `scripts/restore.sh` على stack تجريبي **مرة واحدة على الأقل**
6. بعدين: Moyasar/HyperPay → Module 7 → قوالب المنيو → Module 8 → Android

---

## 14. الدرس المنهجي

الباج الأخطر مكانش خطأ في المنطق — كان **عقد بين خدمتين اتغير من طرف واحد**. الباك إند اتحدّث، والبلاير لأ، والاختبارات اتعملت على بيانات (شاشات الـ seed) **اتولّدت بالعقد القديم**، فمكنتش ممكن تشوف الكسر.

عشان كده الاختبار الجديد `pairing-to-bootstrap.integration.spec.ts` **بيولّد الشاشة من مسار الـ pairing الحقيقي** قبل ما يختبر الـ bootstrap عليها. والدالة النقية `interpretPollResult` موجودة تحديدًا عشان الحالة الصامتة (`complete` من غير سيكرت) تبقى **حالة فشل صريحة** مستحيل تعدّي بالغلط.

**القاعدة:** لما تغيّر عقد بين خدمتين، اختبر على بيانات اتولدت بالعقد الجديد — مش بالقديم.

---

## 15. الجولة الأخيرة — 6 أخطاء ما ظهرتش غير بتشغيل المشروع فعليًا

الأخطاء دي **كلها عدّت** من `tsc` و `eslint` ومن الـ 59 اختبار. ولا واحد فيهم كان ممكن يتلقى بقراءة الكود. ظهروا لما شغّلت الـ stack كامل (Postgres في Docker + الخدمات التلاتة) وسقت المنتج بإيدي.

### 15.1 🔴 حلقة إعادة توجيه لتسجيل الدخول — كل صفحة محمية بترجّعك للّوجين

الأخطر في القايمة، والمستخدم شافه بنفسه.

`server-auth.ts` كان بيعمل:
```ts
const API_BASE = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '...';
```
و `.env.example` بيشحن `INTERNAL_API_BASE_URL=""` ومكتوب جنبها حرفيًا *"Leave empty for local dev"*.

`??` بترجع للبديل بس لو `null`/`undefined` — **مش لو string فاضية**. فـ `API_BASE` بقى `""`، والسيرفر نادى `fetch("/auth/me")` بمسار نسبي → `TypeError: Failed to parse URL`. والـ `catch { }` الفاضي حوّل الخطأ ده لـ `{ authenticated: false }`.

يعني: **عطل في الإعدادات كان بيتنكّر في صورة "المستخدم مش مسجّل دخول"**. تسجّل دخول بنجاح، تضغط أي صفحة، ترجع للّوجين مع `?returnTo=/ar/admin`.

**الإصلاح:** `||` بدل `??`، والـ `catch` بقى بيسجّل الخطأ بدل ما يبلعه. ونفس الفخ اتقفل في `getApiBaseUrl` بتاع الداشبورد والبلاير.

### 15.2 🔴 `docker-compose.yml` مكانش بيتقرا أصلًا

الحراسات اللي ضفتها في الجولة السابقة (`${JWT_ACCESS_SECRET:?...}`) رسالتها فيها `: ` — وده **يكسر YAML** جوه scalar غير مقتبس. الملف كله مكانش بيتحلل.

خطأ مني، وماكانش ليه أي طريقة يظهر غير بتشغيل `docker compose`. اتصلح، واتأكدت من الاتجاهين: بيقلع بالـ `.env`، وبيقف برسالة واضحة من غيرها.

### 15.3 🟠 `prisma db seed` كان no-op صامت

Prisma 7 نقل أمر الـ seed لـ `prisma.config.ts`، والمفتاح القديم `prisma.seed` في `package.json` بقى **متجاهَل**. فـ `npm run prisma:seed` كان بيطبع تعليمات إعداد **ويخرج بكود 0** من غير ما يزرع صف واحد.

نجاح كاذب — أسوأ أنواع الفشل.

### 15.4 🟠 بانر `NOT_REGISTERED` على كل شاشة

البلاير كان بيبعت `screen:register` و`screen:heartbeat` في **نفس الـ tick**، بينما السيرفر بيربط الـ socket بشكل غير متزامن. الـ heartbeat بيوصل الأول → `NOT_REGISTERED`.

race قديم كان نايم؛ إضافة `bcrypt.compare` (~250ms) في مسار المصادقة خلّته **يضرب كل مرة**. أول heartbeat بقى بيستنى إشعار `screen:registered`.

### 15.5 🟠 `Hydration failed` على كل صفحة

`NextIntlClientProvider` مكانش بياخد `timeZone`، فالعميل بينسّق التواريخ بتوقيت المتصفح بينما السيرفر بيستخدم `UTC` من `getRequestConfig` → React بيرمي الشجرة ويعيد بناءها.

الاتنين بقوا بيقروا ثابت واحد `DEFAULT_TIME_ZONE` عشان ما يفترقوش تاني.

### 15.6 🟡 `[missing:adminHomeOverview.storageSubQuota]` في صفحة الأدمن

الكومبوننت بينادي `t('storageSubQuota')` والمفتاح موجود في `cards.storageSubQuota`.

**ليه الفحوصات ما مسكتهوش:** `i18n:key-parity` بيقارن `en` بـ `ar` بس — ومفتاح ناقص من **الاتنين** بيعدّي. وكمان الصفحة نفسها كانت **مستحيل توصلها** بسبب حلقة اللوجين في 15.1، فمحدش شافها.

---

## 16. التحقق النهائي — على السيرفر الشغّال

| ما تم اختباره | النتيجة |
|---|---|
| ربط شاشة من واجهة البلاير → claim → تشغيل محتوى | ✅ الشاشة اتربطت، `bootstrap` رجع 200، اتسجلت على الـ socket (`ONLINE`)، والمحتوى اتدفع لحظيًا من غير reload |
| `bootstrap` بالسيكرت المشترك القديم | ✅ **401** |
| الـ poll التاني للـ handoff | ✅ `screenSecret: null` |
| `SUPPORT_SPECIALIST` على `customers/users/screens` | ✅ 200 |
| `SUPPORT_SPECIALIST` على `stats/logs/settings/staff` | ✅ **403** |
| refresh token كـ Bearer access token | ✅ **401** (claim الـ `typ`) — وبيشتغل عادي على `/auth/refresh` |
| HTML متسمّي `image/png` | ✅ **400** (magic bytes) |
| رفع يتجاوز الكوتا | ✅ **403** · مفيش صف في الداتابيز · مفيش ملف `.part` متبقي |
| `impersonate` | ✅ صف في جدول `AuditLog` بـ IP حقيقي `127.0.0.1` |
| صفحات الأدمن والعميل | ✅ كلها بتفتح ببيانات حقيقية |

**الدرس:** الاختبارات والـ type checker بيثبتوا إن الكود **متماسك مع نفسه**. تشغيل المنتج هو اللي بيثبت إنه **بيشتغل**. الستة دول كلهم عدّوا من الأول وسقطوا في التاني.
