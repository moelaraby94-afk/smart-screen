# سجل تغييرات جلسة الإصلاح — fix/security-audit-v2

> **الفرع:** `fix/security-audit-v2`
> **التاريخ:** 11 يوليو 2026
> **النطاق:** إصلاح بيئة التشغيل المكسورة + تنفيذ بنود التقوية الأمنية من الأوديت + هجرة نظام التصميم في الداشبورد.
> **منهجية التحقق:** كل تغيير اتحقق منه على **السيرفر الشغّال فعليًا** (Postgres + backend + dashboard containers)، مش بمراجعة الكود بس — اختبارات jest داخل الـ container، `next build` كامل للداشبورد، و login حقيقي end-to-end.

---

## نظرة سريعة (الـ commits)

| # | Commit | العنوان | الحالة |
|---|--------|---------|--------|
| 1 | `a2675d8` | `fix(infra)` — الوصول لقاعدة بيانات compose + شحن كل الـ deps | ✅ متحقّق |
| 2 | `45d55b3` | `feat(security)` — refresh tokens متعددة الجلسات + قفل pairing لكل IP + عزل المستأجرين | ✅ متحقّق (45 اختبار) |
| 3 | `d7698c8` | `fix(security)` — وقف تسريب سر الـ player heartbeat في الـ client bundle | ✅ متحقّق |
| 4 | `f884e55` | `fix(security)` — وقف تخزين الـ access JWT في localStorage في production | ✅ متحقّق |
| 5 | `8a08052` | `refactor(dashboard)` — الهجرة لـ semantic design tokens + skip-to-content | ✅ متحقّق (next build) |

---

## 1. إصلاح بيئة التشغيل (`a2675d8`)

الـ backend container كان بيعمل **crash-loop** (`Exited 1`) لسببين متراكمين اتصلّحوا:

1. **تسريب `DATABASE_URL`** — `docker-compose.yml` كان بيستخدم `${DATABASE_URL:-...@db:5432}`. Compose بيقرا الـ root `.env` تلقائيًا، والـ `DATABASE_URL` هناك بيشاور على `localhost:5433` (للأدوات اللي بتشتغل على الـ host). القيمة دي كانت **بتتسرّب للـ container**، وجوّه الـ container `localhost` هو الـ container نفسه — فـ `prisma migrate deploy` كان بيفشل بـ `P1001`. الحل: تثبيت القيمة على `@db:5432` مباشرةً للـ container.
2. **migration فاشل نص نص** — شوف القسم 2 (idempotency).

كمان:
- **`Dockerfile.backend`**: شيل `npm prune --omit=dev`. الـ runner محتاج الـ validators وقت التشغيل (`class-validator`/`class-transformer`) و `ts-node` للـ seed — الـ prune كان بيشيلهم.
- **`Dockerfile.dashboard`**: نسخ `apps/marketing/package.json` و `packages/` قبل `npm ci` عشان الـ workspace install يحلّ كل الأعضاء.

> **ملاحظة بيئة:** فيه checkoutين للمشروع — Windows (`D:\projects\Smart Screen`) و WSL. تشغيل `npm install` من السياق الغلط بيفسد `package-lock.json` (paths وهمية لـ `wsl.localhost` + workspaces `extraneous`). لو حصل: `git checkout HEAD -- package.json package-lock.json`. شغّل `npm install` من checkout واحد بس.

---

## 2. تقوية أمنية في الـ backend (`45d55b3`)

### 2.1 Refresh tokens متعددة الجلسات
- موديل `RefreshToken` جديد (`userId`, `sessionId`, `tokenHash`, `expiresAt`) — كل login/impersonation بياخد جلسة مستقلة بتعمل rotation، بدل `refreshTokenHash` واحد على `User`.
- الـ refresh JWT بيحمل claim اسمه `sid` بيستخدم للبحث عن الـ hash المخزّن وعمل rotation ليه.
- `logout` و password reset بيمسحوا **كل** جلسات المستخدم.
- `User.refreshTokenHash` **متساب عمدًا** كـ legacy fallback للقراءة فقط: التوكنات اللي اتعملت قبل الـ migration تفضل شغّالة لحد ما تخلص صلاحيتها.

### 2.2 قفل الـ pairing لكل IP
- `PairingClaimLockout` بقى مفتاحه `(userId, ip)` بدل `userId` لوحده — عداد الـ brute-force بيتتبّع لكل IP مصدر.
- الـ controller بيمرّر `req.ip` لـ `claimSession`.

### 2.3 عزل المستأجرين عند الـ claim
- الجلسة اللي بتبدأ بسياق workspace بتتثبّت على الـ workspace ده. `claimSession` بيطابق بس الجلسات اللي `workspaceId` بتاعها `null` أو بيساوي المتصل — فمستأجر مايقدرش ياخد كود مستأجر تاني.

### 2.4 Migrations idempotent
- الـ migrations اتكتبت بـ `IF [NOT] EXISTS` عشان لو اتطبّقت نص نص تتعاد بأمان. (السبب اللي خلّى migration الـ pairing يفشل أصلًا واتكتبله `fix_migration.sql` يدوي — اتشال الملف ده واتعمل idempotency بدله.)

### 2.5 إصلاح اختبار حقيقي
- الـ spec (`claim-pairing-session-security.spec.ts`) كان بيتأكد من مفتاح lockout غلط (`${userId}:null`) بعد تغيير الـ schema لـ `(userId, ip)` — كان بيفشل. اتصلّح ليدوّر على الصف بالـ `userId` prefix (شكل الـ loopback IP بيختلف بين الأنظمة) ويمرّر نفس الـ ip للاستدعاء المباشر.

**التحقق:** كل اختبارات auth/pairing/cross-tenant/login-lockout (45 اختبار، 6 suites) خضراء داخل الـ container.

---

## 3. سر الـ player heartbeat (`d7698c8`)

`NEXT_PUBLIC_PLAYER_HEARTBEAT_SECRET` كان بيتحط inline في الـ JS bundle العام وقت البناء — أي حد يفتح صفحة الـ player يقدر يقراه.

- اتغيّر لـ `PLAYER_HEARTBEAT_SECRET` (من غير `NEXT_PUBLIC_`) → متغيّر server-only.
- بيتقرا في الـ server component (`app/page.tsx`) وبيتمرّر كـ prop اسمه `kioskSecret` عبر `PlayerRuntime → PlayerHeartbeat / PlayerPairingWait` وفي body الـ `startPlayerPairingSession`.

> السر لسه بيوصل المتصفح في الـ RSC payload (الـ player نفسه محتاجه client-side)، بس مبقاش inlined في الـ static bundle — وده تقليل حقيقي للتعرّض.

---

## 4. توكن الوصول في localStorage (`f884e55`)

`setStoredAccessToken`/`getStoredAccessToken` بقوا no-op في `NODE_ENV=production`. الـ backend أصلًا بيحط httpOnly cookie (`cs_access_token`) و`apiFetch` بيبعته بـ `credentials: 'include'`، فنسخة تانية في localStorage كانت بتدّي أي XSS طريقة يقرا التوكن مباشرةً وتلغي حماية الـ httpOnly. الـ mirror متساب dev-only للسيتَبات متعددة الـ origin/port.

---

## 5. هجرة نظام التصميم في الداشبورد (`8a08052`)

استبدال الـ palette المموّه المثبّت (`#1B254B` / `#FF6B00` / كلاسات `glass*` + متغيّرات `dark`/`split` لكل مكوّن) عبر كل واجهات الداشبورد (admin, auth, branches, dashboard, media, playlists, schedules, screens, studio, settings, team, workspace) بـ **semantic Tailwind tokens** (`bg-card`, `text-foreground`, `text-primary`, `text-destructive`, `border-border`, ...) اللي بتتبع الثيم light/dark. + رابط "Skip to content" (en + ar) + `allowedDevOrigins` لسيرفر Next dev.

**التحقق:** `next build` كامل (typecheck + lint + build) أخضر — والـ config **مش** بيتجاهل الـ errors.

---

## التحقق الشامل المُنفَّذ

- ✅ الـ 3 containers (db, backend, dashboard) `healthy`.
- ✅ `/health` → HTTP 200.
- ✅ login حقيقي بالأدمن المزروع → بيرجّع user + workspaces + JWT صالح (HTTP 200).
- ✅ `prisma migrate status` → "Database schema is up to date" (26 migration).
- ✅ اختبارات الـ backend كاملة: **130/130 (18 suite)** عبر `npm run test`؛ والمتعلّقة بالتغييرات مباشرةً: 45/45.
- ✅ `next build` للداشبورد: أخضر.

### إعادة تعيين الـ DB المحلي (لو احتجتها)
البيئة local dev (Docker Desktop على WSL، داتا تجريبية). لإعادة التعيين:
```bash
docker compose stop backend db && docker compose rm -f backend db
docker volume rm smart-screen_pgdata            # يمسح الـ DB بس
docker compose build backend                    # يخبز الـ migrations المصلّحة
docker compose up -d db backend                 # migrate deploy بيتطبّق نضيف
docker compose exec -e ENABLE_DB_SEED=true backend npx prisma db seed
```
> الـ seed بيرفض يشتغل تحت `NODE_ENV=production` من غير `ENABLE_DB_SEED=true` (حماية مقصودة). بيعمل Super Admin (`admin@smartscreen.local`) و demo client بباسوردات عشوائية تتعرض مرة واحدة.

---

## حالة الاختبارات

كل اختبارات الـ backend **خضراء: 130/130 (18 suite)** لما تتشغّل بالأمر الصح `npm run test -w apps/backend` (اللي بيمرّر `--experimental-vm-modules`، مطلوب لأن `media.service` بيستخدم dynamic `import()` لموديول ESM). تشغيل `npx jest` مباشرةً من غير الـ flag ده بيوقّع `media.service.spec` — ده **مشكلة استدعاء، مش فشل حقيقي**؛ الـ CI و `npm run verify` بيستخدموا الأمر الصح فهما أخضر.

## متابعات (خارج نطاق هذه الجلسة)

1. **الـ legacy refresh path مبيعملش rotation** — التوكن اللي اتعمل قبل الـ migration يفضل صالح لحد ما يخلص (نافذة replay صغيرة أثناء الهجرة). تحسين مقترح: تصفير `refreshTokenHash` عند أول إصدار جلسة جديدة للمستخدم. (مُدرَج كـ تاسك في [`docs/full-audit-and-remediation-plan.md`](./full-audit-and-remediation-plan.md)).

---

## المستندات ذات الصلة
- [`docs/hardening-report.md`](./hardening-report.md) — تقرير التقوية الشامل (الأجزاء 1-2).
- [`docs/fix-plan.md`](./fix-plan.md) — خطة التنفيذ المرجعية.
- [`smart-screen-ux-audit.md`](../smart-screen-ux-audit.md) — أوديت الـ UX/UI (المرجع لهجرة التصميم).
- [`smart-screen-audit-report.md`](../smart-screen-audit-report.md), [`smart-screen-audit-v2.md`](../smart-screen-audit-v2.md) — تقارير الأوديت الأمني.
