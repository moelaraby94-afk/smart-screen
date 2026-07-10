# تقرير التحسين المنهجي — Cloud-Screen

> فرع `fix/security-audit-v2`. كل بند اتحقق منه بالأدوات **وعلى السيرفر الشغّال**، مش بالكود بس.
> بوابة التحقق `npm run verify` = typecheck + lint (`--max-warnings=0`) + tests + i18n + builds للتلات تطبيقات.

## الأرقام النهائية

| المقياس | قبل | بعد |
|---|---|---|
| اختبارات الباك إند | 21 | **130** |
| ملفات اختبار الباك إند | 3 | **18** |
| اختبارات البلاير | 0 (مفيش runner) | **6** |
| تحذيرات lint (التلات تطبيقات) | 19+ | **0** (بوابة صارمة) |
| `tsc --noEmit` | خطأ قديم | **0** |
| CI | بيلنت بـ `--fix` (بيخفي المخالفات) | بيشغّل `verify` كامل |

---

## المرحلة 0 — بوابة تحقق واحدة (`2bc61b5`)

- `npm run verify` واحدة بتلمّ كل الفحوصات، والـ CI بيشغّلها بالظبط.
- **اكتشاف:** سكريبت `lint` بتاع الباك إند كان شغّال بـ `--fix` — في الـ CI كان **بيصلّح المخالفات ويخرج 0**. وماكانش فيه lint للباك إند ولا typecheck ولا اختبارات بلاير.
- 19 تحذير lint اتصلحوا (مش اتخبّوا)، أهمهم إن `IntlErrorHandlingProvider` كان بيكسر الـ memoization بتاع `t`.
- `prisma.config.ts` بقى يقرا `.env` بنفسه — `npm run prisma:migrate` كان بيفشل من clone جديد.

## المرحلة 1.1 — تحقق DTO لكل request body (`548a59e`)

`ValidationPipe` بيفحص الـ classes بس. 5 مسارات كانت بتاخد `@Body() body: {...}` inline فمكانتش بتتفحص. أثبتّ على السيرفر:
- `{"name":12345}` → **500** (أي EDITOR يوصله) · دلوقتي **400**
- حقول مجهولة كانت بتعدّي · دلوقتي مرفوضة
- `PATCH mock-plan {}` كان **بيخفّض الخطة لـ FREE بصمت** · دلوقتي **400**

## المرحلة 1.2 — Rate limiting فعلي (`b7539fb`)

`ThrottlerModule.forRoot()` كان **بيعرّف** حد ومحدش بينفّذه — 11 من 16 controller مفتوحين.
- سجّلت `ThrottlerGuard` كـ `APP_GUARD`.
- **اكتشاف:** الـ controllers اللي عليها الحارس يدويًا بقت **تعدّ مرتين** — `forgot-password` حده 5 كان بيسمح بـ 2. اتصلح.
- **اكتشاف:** `POST /auth/login` مكانش عليه `@Throttle` خالص. اتضاف (20/min)، ونفس الشيء لـ OTP verify و reset-password.
- `TRUST_PROXY_HOPS` — عشان `req.ip` ميبقاش IP البروكسي (bucket واحد للكل + IP غلط في السجل).

## المرحلة 1.3 — Pagination حقيقي (`77248b6`)

`screens` كان `@Min(1)` من غير حد أقصى → `?limit=1000000` مقبول. `playlists`/`canvases`/`schedules` مكانش عندهم pagination خالص.
- `PaginationQueryDto` + `buildPage()`، الحد بيتقصّ لـ 500 وبيترجّع في الرد.
- **الأهم — الـ UI بطّل يحسب:** `overview-metrics` كان بينزّل **مكتبة الوسائط كلها** ويعمل `reduce` للبايتات في المتصفح. `use-workspace-stats` كان بينزّل كل الميديا والـ playlists عشان `.length`. دلوقتي `GET /media/stats` بيرجّع العدّ من `count()`+`aggregate()`، والـ UI بيقرا `total` من الـ envelope.

## المرحلة 1.5 — عقد أخطاء بكودات ثابتة (`395017c` + `187ba19`)

الباك إند كان بيرمي نص إنجليزي، و**29 كومبوننت** بيعرضوه حرفيًا — المستخدم العربي كان بيشوف `"Invalid credentials"`.
- كل رد خطأ بقى `{ statusCode, code, message, details? }`. `DomainException` + `normalizeHttpError` (بتلمّ حتى استثناءات Nest والـ ValidationPipe).
- الـ UI اتشال منه `readApiErrorMessage` و`parseScreenLimitFromApiMessage` **نهائيًا** — بقى يقرا `errors.<CODE>` من كاتالوج (32 مفتاح en/ar). حذفت فروع كانت بتعمل `msg.includes('LIMIT_REACHED')`.
- **دليل من المتصفح:** دخول بكلمة سر غلط على `/ar/login` → **«البريد الإلكتروني أو كلمة المرور غير صحيحة.»**

## المرحلة 3.1 — القدرات محسوبة في الباك إند (`446b842`)

`client-home-dashboard` كان بيحسب `storagePct = Math.min(100, Math.round(...))` — قاعدة عمل في كومبوننت React.
- `computeWorkspaceCapabilities()` — دالة واحدة بترجّع `screens:{remaining,canCreate}` و`storage:{usedPct,remainingBytes,canUpload}`. `/account/insights` بيرجّعها.
- الـ UI بيقرا `capabilities.storage.usedPct` بدل ما يحسب. اتأكدت إن الحساب متطابق قبل التغيير.

## المرحلة 1.4 — اختبارات عزل المستأجرين (`e072178`)

الأوديت أثبت مفيش IDOR **يدويًا** — دلوقتي فيه حماية آلية من الرجوع:
- `roles.guard.spec.ts` (10 اختبارات) — الحدّ الأساسي، **ماكانش عليه أي اختبار**. بيغطي: غير العضو مرفوض، الدور الأقل مرفوض، الـ super admin بيعدّي، مصدر الـ workspaceId.
- `cross-tenant-scoping.spec.ts` (12 اختبار) — Prisma مزيّف بيفلتر بكل مفاتيح الـ `where`. لو أي getter اتغيّر ليدوّر بـ `id` لوحده، الاختبار بيسقط.

## المرحلة 2.x — قفل الدخول لكل حساب (`52a764e`)

الـ rate limit لكل IP، فهجمة موزّعة على حساب واحد كانت غير محدودة.
- `LoginLockout` — 10 محاولات فاشلة في 15 دقيقة → قفل 15 دقيقة. مربوط بالـ **email** (مش userId) والمحاولة الفاشلة بتتعدّ حتى للإيميل غير الموجود → **مستحيل يتستخدم لمعرفة الحسابات الموجودة**.
- **دليل من Postgres:** 10 محاولات لإيميل غير موجود → 401×10 ثم 429 مع صف حقيقي · 3 غلط لحساب حقيقي ثم كلمة السر الصح → 200 والصف اتمسح.

---

## اللي لسه فاضل (خارطة الطريق)

| المرحلة | المحتوى | الحالة |
|---|---|---|
| 3.2 | طبقة بيانات — 36 كومبوننت لسه بينادوا `apiFetch` مباشرة | مخطّط |
| 2 | تدقيق بيزنس لوجيك (جدولة، playlists، اشتراكات، Stripe) | مخطّط |
| 4 | Observability (logging منظّم، readiness، Sentry) | مخطّط |
| 5 | فيتشرز ناقصة (جلسات متعددة، دعوات، analytics، POS) + **بوابة دفع سعودية (مؤجّلة بطلبك)** | مخطّط |

**ملاحظة تشغيلية:** فيه migration جديدة (`20260710120000_add_login_lockout`) — شغّل `npx prisma migrate deploy` على أي بيئة قائمة.
