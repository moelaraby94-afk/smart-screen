# الأوديت الشامل + خطة المعالجة + دليل التنفيذ — Cloud-Screen

> **الفرع:** `fix/security-audit-v2`
> **التاريخ:** 11 يوليو 2026
> **الطبيعة:** ده **دليل تنفيذ كامل** مكتوب عشان أي مطوّر أو ايجنت (حتى الأقل خبرة) يقدر يمسك تاسك وينفّذه من غير سياق إضافي. كل تاسك مكتوب بـ: المشكلة (بدليل من الكود) → التغيير المطلوب → **الاختبارات المطلوبة** → معايير القبول → أفضل الممارسات.
> **المصدر:** أوديت فعلي على الكود الحالي (مش نقل من تقارير قديمة). التقارير القديمة ([`hardening-report.md`](./hardening-report.md), [`fix-plan.md`](./fix-plan.md), وتقارير الجذر) اتراجعت وادعاءاتها اتأكّدت مقابل الكود؛ اللي اتنفّذ اتشال من القائمة.

---

## 0. قواعد التنفيذ (اقرأها قبل أي تاسك) — إلزامية

هذه القواعد شرط على **كل** تاسك في هذا المستند:

1. **كل تغيير لازم معاه اختبار.** مفيش PR يتقبل من غير اختبار يغطّي السلوك الجديد أو الإصلاح. الاختبار لازم **يفشل قبل التغيير وينجح بعده**.
2. **بوابة التحقق الوحيدة:** بعد أي تغيير شغّل من جذر المشروع:
   ```bash
   npm run verify
   ```
   = `typecheck` + `lint --max-warnings=0` + `test` + `i18n:check` + `build` للتطبيقات. لازم يطلع **أخضر بالكامل**. الـ CI بيشغّل نفس السكريبت بالظبط.
3. **أمر الاختبار الصحيح:** اختبارات الباك إند لازم تتشغّل بـ `npm run test -w apps/backend` (بيمرّر `--experimental-vm-modules`). **مينفعش** `npx jest` مباشرةً — هيوقّع `media.service.spec` بخطأ ESM كاذب.
4. **بيئة التشغيل:** كل حاجة في Docker (Docker Desktop/WSL). `node_modules` **مش مثبّتة على Windows** — شغّل CLI جوّه container: `docker compose exec backend <cmd>`. الـ DB على host port **5433**. تفاصيل: [`security-audit-v2-changes.md`](./security-audit-v2-changes.md).
5. **اتبع الأنماط الموجودة (مهم جداً):**
   - أخطاء الباك إند: ارمِ `DomainException` بكود من `common/errors/error-codes.ts` — **ممنوع** نص إنجليزي حرفي. الـ UI بيقرا `errors.<CODE>` من كتالوج i18n.
   - كل request body لازم **class DTO** (مش inline type) عشان `ValidationPipe({whitelist, forbidNonWhitelisted})` يفحصه.
   - أي list endpoint يستخدم `PaginationQueryDto` + `buildPage()` ويرجّع الحد في الـ envelope.
   - التفويض عبر `@Roles` + `RolesGuard`؛ صلاحيات المنصة عبر `@PlatformRoles` (fail-closed).
   - **قواعد العمل في الباك إند، مش في الـ UI.** الـ UI بياخد بيانات محسوبة جاهزة (زي `computeWorkspaceCapabilities`).
   - i18n: أي نص للمستخدم له مفتاح في `en.json` **و** `ar.json` (بوابة `i18n:key-parity`).
6. **حجم الـ PR:** تاسك واحد = PR واحد صغير قابل للمراجعة. متجمّعش تاسكات غير مترابطة.
7. **قبل ما تبدأ تاسك:** اقرأ الملفات المذكورة فيه فعلياً وتأكد إن المشكلة لسه موجودة (الكود بيتغيّر).

---

## 1. الحالة الحالية (متحقّق منها بالكود)

**نقاط القوة (متأكّدة):**
- جودة كود عالية: **صفر** `: any`، `@ts-ignore`، `eslint-disable`، أو `TODO/FIXME` في `apps/*/src`.
- بوابة `verify` صارمة + CI (`.github/workflows/ci.yml`) بيشغّلها.
- أمان الباك إند متقدّم: helmet، CORS allow-list، `ThrottlerGuard` عالمي، قفل دخول لكل حساب + لكل IP، عقد أخطاء بكودات، تحقق DTO، عزل مستأجرين مغطّى باختبارات (`roles.guard.spec`, `cross-tenant-scoping.spec`).
- **اختبارات الباك إند: 130/130 خضراء (18 suite).**
- الجدولة timezone-aware (`date-fns-tz`) وبتتعامل مع تعدّي منتصف الليل.

**ما تم إنجازه في هذا الفرع (اتشال من قائمة القصور):**
- ✅ جلسات refresh متعددة (`RefreshToken` + `sid`) — كان القصور رقم 5 في `hardening-report`.
- ✅ قفل pairing لكل IP + عزل المستأجرين عند الـ claim.
- ✅ سر الـ player heartbeat مبقاش في الـ client bundle.
- ✅ توكن الوصول مبقاش في localStorage في production.
- ✅ هجرة الداشبورد لـ semantic design tokens.

---

## 2. القصور الرئيسي (مصنّف بالدليل)

| # | المجال | الدليل الملموس | الخطورة |
|---|--------|----------------|---------|
| A | **تغطية اختبارات الباك إند** | 17 service من غير unit test، منهم `auth` (852 سطر)، `admin` (979)، `subscriptions` (398)، `scheduling`+`schedules` (399)، `playlists` (665)، `pairing` (471) | 🔴 عالية |
| B | **صفر اختبارات في الداشبورد** | 138 ملف `.tsx/.ts`، **مفيش test runner أصلاً**؛ سكريبت `test` بيتخطّى الداشبورد | 🔴 عالية |
| C | **طبقة بيانات الفرونت** | **36 component** بينادوا `apiFetch` مباشرة مقابل 8 hooks — منطق fetch/state/عرض مخلوط | 🟠 متوسطة |
| D | **God components** | branch-detail (934)، admin-customer-profile (874)، client-home (826)، media-library (714)، studio-editor (669)، screens (661)، schedules (634)، playlist-studio (589) | 🟠 متوسطة |
| E | **Observability** | `/health` (main.ts:83) ثابت 200 — مفيش readiness/فحص DB؛ **صفر** request correlation؛ Logger افتراضي | 🟠 متوسطة |
| F | **Accessibility** | تغطية `aria-*`/`role` ناقصة (الأوديت السابق: 16 و6 ملفات) — مفيش تدقيق WCAG | 🟡 منخفضة |
| G | **فيتشرز ناقصة** | UI إدارة الجلسات، دورة حياة دعوات الفريق، Analytics/Proof-of-Play (0 models)، POS (0 models)، Android player | 🟡 قرار منتج |
| H | **دَين تقني في التغييرات الأخيرة** | كود multi-session refresh (852 سطر auth) **من غير اختبار مخصّص**؛ الـ legacy path مبيعملش rotation | 🟠 متوسطة |

---

## 3. الخطة والمراحل (بالترتيب)

المبدأ: **شبكة أمان اختبارات الأول** (عشان أي refactor بعدها آمن)، بعدين تدقيق المنطق، بعدين المعمارية، بعدين التشغيل، بعدين الفيتشرز.

| المرحلة | الهدف | يعتمد على |
|---------|-------|-----------|
| **P1** | شبكة أمان: اختبارات للخدمات الحرجة + إعداد اختبارات الداشبورد | — |
| **P2** | تدقيق البيزنس لوجيك + اختباراته | P1 |
| **P3** | طبقة بيانات الفرونت (api modules + hooks) | P1 (اختبارات hooks) |
| **P4** | تفكيك God components + accessibility | P3 |
| **P5** | Observability و Operations | — (مستقلة) |
| **P6** | الفيتشرز الناقصة | قرار منتج |

---

## 4. باكلوج التاسكات (تفصيلي)

> صيغة كل تاسك: **المعرّف · العنوان · الأولوية · الملفات · المشكلة · التغيير · الاختبارات المطلوبة · معايير القبول**.
> الأولويات: P0 (عاجل/أمان) · P1 (عالية) · P2 (متوسطة) · P3 (تحسين).

### المرحلة P1 — شبكة الأمان

#### P1-T1 · اختبارات جلسات الـ refresh المتعددة · **P0**
- **الملفات:** `apps/backend/src/domains/auth/auth.service.ts` (منطق `refreshToken`, `setRefreshTokenSession`, `logout`) + spec جديد `auth-refresh-session.spec.ts`.
- **المشكلة:** الكود اللي اتضاف في `45d55b3` (rotation، legacy fallback، logout-all) **مفيش عليه اختبار**. القاعدة: كل تغيير له اختبار.
- **التغيير:** لا تعديل منطق (غير تاسك P1-T2) — بس اختبارات.
- **الاختبارات المطلوبة (Prisma مزيّف على نمط `claim-pairing-session-security.spec.ts`):**
  1. refresh بتوكن صالح فيه `sid` → بيرجّع pair جديد و**بيمسح** صف الجلسة القديم (rotation).
  2. refresh بنفس التوكن **مرتين** → التانية بترمي `Invalid refresh token` (الصف اتمسح).
  3. refresh بتوكن قديم بدون `sid` → يستخدم `refreshTokenHash` legacy وينجح.
  4. `logout` → بيمسح **كل** صفوف `RefreshToken` للمستخدم.
  5. `resetPassword` → بيمسح كل الجلسات + بيصفّر `refreshTokenHash`.
- **معايير القبول:** 5 اختبارات خضراء؛ `npm run verify` أخضر.

#### P1-T2 · إصلاح: legacy refresh token مبيتعملّوش rotation · **P1**
- **الملفات:** `auth.service.ts` (دالة `setRefreshTokenSession`).
- **المشكلة (دليل):** في المسار الـ legacy، بعد التحقق من `refreshTokenHash`، القيمة مش بتتصفّر — فالتوكن القديم يفضل قابل لإعادة الاستخدام لحد ما يخلص (نافذة replay أثناء الهجرة).
- **التغيير:** خلّي `setRefreshTokenSession` تضيف داخل الـ `$transaction` تحديث `user.update({ where:{id:userId}, data:{ refreshTokenHash: null } })`. كده أول جلسة جديدة لأي مستخدم بتتقاعد توكنه الـ legacy.
- **الاختبارات المطلوبة:** اختبار: مستخدم عنده `refreshTokenHash` → بعد login/refresh، القيمة بقت `null` والجلسات الأخرى (صفوف `RefreshToken`) لسه شغّالة.
- **معايير القبول:** الاختبار أخضر؛ اختبارات P1-T1 لسه خضراء.

#### P1-T3 · اختبارات `scheduling.service` (DST / منتصف الليل / أولوية) · **P0**
- **الملفات:** `apps/backend/src/domains/schedules/scheduling.service.ts` (199 سطر، timezone-aware، بيتعامل مع منتصف الليل) + spec جديد.
- **المشكلة:** منطق حرج (بيحدّد إيه اللي بيتعرض على الشاشة الآن) **بدون أي اختبار**. أي regression بيظهر على شاشات العملاء مباشرة.
- **التغيير:** لا تعديل منطق أول الأمر — اختبارات characterization تثبّت السلوك الحالي، بعدين أصلح أي bug يظهر.
- **الاختبارات المطلوبة (نقية، بـ `at: Date` ثابت و`timeZone`):**
  1. نافذة عادية (09:00–17:00): وقت جوّه/برّه.
  2. نافذة بتعدّي منتصف الليل (22:00–06:00): 23:00 داخل، 05:00 داخل، 12:00 خارج.
  3. ترتيب الأولوية: Override > Schedule > Default.
  4. حدود التاريخ (startDate/endDate) بتوقيت الـ workspace.
  5. تحوّل DST (اختَر tz فيه DST زي `America/New_York` وتاريخ التحوّل).
- **معايير القبول:** ≥5 اختبارات؛ أي bug يتصلح مع اختبار يثبته.

#### P1-T4 · اختبارات إنفاذ حدود الاشتراك · **P0**
- **الملفات:** `subscriptions.service.ts` (398)، ومسارات الكتابة: `screens.service.ts`، `media.service.ts`، `pairing.service.ts`.
- **المشكلة:** حد الشاشات + التخزين مفروض في ~8 خدمات؛ **الاتساق غير مختبَر**. غلطة في مسار واحد = تجاوز صامت للخطة.
- **التغيير:** لا تعديل أولاً؛ اختبارات تتأكد إن **كل** مسار كتابة بيفرض الحد، بعدين إصلاح أي ثغرة.
- **الاختبارات المطلوبة:**
  1. إنشاء شاشة عند/فوق الحد → `SCREEN_LIMIT_REACHED` (429/403).
  2. claim pairing session لما الحد مكتمل → مرفوض بنفس الكود.
  3. رفع ميديا بيتجاوز الكوتا → `STORAGE_...` ورجوع الملف المؤقت.
  4. خطة `null limit` (غير محدود) → مسموح.
- **معايير القبول:** كل مسار كتابة عليه اختبار حد؛ الكودات موحّدة (نفس الكود لنفس القاعدة).

#### P1-T5 · إعداد test runner للداشبورد + أول اختبارات · **P0**
- **الملفات:** `apps/dashboard/` (إعداد Vitest + React Testing Library موصى بها لـ Next 16)، تحديث `apps/dashboard/package.json` (`"test"`) وسكريبت `test` الجذري ليشمل الداشبورد.
- **المشكلة:** 138 ملف، صفر اختبار، والـ `test` الجذري بيتخطّى الداشبورد.
- **التغيير:**
  1. أضف Vitest + `@testing-library/react` + `jsdom` كـ devDeps للداشبورد.
  2. `vitest.config.ts` بيدعم مسارات `@/` (نفس tsconfig paths).
  3. عدّل `package.json` الجذري: `"test": "... && npm run test -w apps/dashboard"`.
  4. اكتب أول اختبارين **للدوال النقية** (أسهل بداية): `computeWorkspaceCapabilities` mirror لو فيه، و`session.ts` (تأكد no-op في production).
- **الاختبارات المطلوبة:** ≥2 اختبار أخضر داخل الداشبورد؛ `npm run verify` يشملهم.
- **معايير القبول:** `npm run test -w apps/dashboard` يشتغل ويعدّي؛ الـ CI يشمل اختبارات الداشبورد.

#### P1-T6 · اختبارات وحدة للخدمات الحرجة المتبقية · **P1**
- **الملفات + الأولوية داخل التاسك:** `playlists.service.ts` (665) → `workspaces.service.ts` (383) → `canvases.service.ts` (223) → `screens.service.ts` (309) → `account.service.ts` (308) → `player.service.ts` (235).
- **المشكلة:** خدمات كبيرة تحمل منطق، بدون اختبار.
- **التغيير:** spec لكل خدمة يغطّي المسارات السعيدة + الحدود + الأخطاء (بـ Prisma مزيّف). **تاسك فرعي منفصل لكل خدمة** (PR صغير لكل واحدة).
- **الاختبارات المطلوبة:** لكل خدمة، تغطية دوالها العامة الأساسية.
- **معايير القبول:** كل خدمة عندها spec؛ عدد الخدمات بدون اختبار ينزل من 17 لـ ≤ عدد trivial (< 40 سطر).

### المرحلة P2 — تدقيق البيزنس لوجيك (كل تاسك: تدقيق + اختبار + إصلاح)

#### P2-T1 · Playlists: duplicate / clone-to-workspace / عناصر يتيمة / `orderIndex` · **P1**
- **الملفات:** `playlists.service.ts`.
- **الفحص:** دلالات النسخ داخل نفس الفرع مقابل الاستنساخ عبر الفروع؛ إعادة ترقيم `orderIndex` بعد الحذف؛ منع العناصر اليتيمة (media محذوفة).
- **الاختبارات:** duplicate بيحافظ على الترتيب؛ clone-to-workspace بينسخ للـ workspace الصح فقط (عزل)؛ حذف عنصر بيعيد ترقيم الباقي.

#### P2-T2 · انتقالات حالة الاشتراك · **P1**
- **الملفات:** `subscriptions.service.ts`، `webhooks/stripe-webhook.service.ts`.
- **الفحص:** `trial → active → expired → paused` وكل الانتقالات الممنوعة؛ إعادة الحساب عند تغيير الخطة.
- **الاختبارات:** جدول انتقالات (كل انتقال مسموح/ممنوع)؛ idempotency للـ webhook (نفس الـ event مرتين → أثر واحد).

#### P2-T3 · دورة حياة الـ Pairing + secret rotation · **P2**
- **الملفات:** `pairing.service.ts`، `player.service.ts`.
- **الفحص:** انتهاء الصلاحية، التنظيف، إعادة الربط، الـ handoff بيتقرا مرة واحدة (لو ضاع → إعادة ربط).
- **الاختبارات:** جلسة منتهية مرفوضة؛ handoff مستهلَك مرفوض تانية؛ إعادة ربط بتصدر secret جديد.

#### P2-T4 · تدقيق Stripe reconciliation · **P2**
- **الملفات:** `stripe-webhook.service.ts`، `subscriptions.service.ts`.
- **الفحص:** التوفيق بين حالة Stripe والـ DB، معالجة الأحداث خارج الترتيب، الـ idempotency (`ProcessedWebhookEvent`).
- **الاختبارات:** أحداث خارج الترتيب؛ حدث مكرّر؛ حدث لاشتراك غير موجود.

### المرحلة P3 — طبقة بيانات الفرونت إند

#### P3-T1 · قالب + أول domain (screens) · **P1**
- **الملفات:** أنشئ `apps/dashboard/src/features/screens/api/*.ts` + hook، نظّف `screens-client.tsx` من `apiFetch`.
- **النمط المرجعي:** `useApiScreens` و`use-branch-playlists` الموجودين.
- **الاختبارات:** اختبار للـ hook (بـ mock للـ api module): يرجّع `{data, isLoading}`، بيتعامل مع الخطأ، actions بتستدعي الدالة الصح.
- **معايير القبول:** `screens-client.tsx` مفهوش `apiFetch` نهائيًا؛ الاختبار أخضر.

#### P3-T2..N · تكرار P3-T1 لكل الـ 36 component · **P2**
- **التغيير:** تاسك فرعي لكل component (أو مجموعة domain). الهدف النهائي: **صفر** `apiFetch` في ملفات `.tsx`.
- **الاختبارات:** hook test لكل domain.
- **معايير القبول:** `git grep -l apiFetch -- 'apps/dashboard/src/**/*.tsx'` = صفر.

### المرحلة P4 — معمارية الفرونت + Accessibility

#### P4-T1..T8 · تفكيك God components · **P2**
- **الهدف:** كل ملف من (branch-detail 934، admin-customer-profile 874، client-home 826، media-library 714، studio-editor 669، screens 661، schedules 634، playlist-studio 589) يتقسّم لمكوّنات فرعية + hooks (بعد P3، المنطق أصلاً بيطلع للـ hooks).
- **الاختبارات:** الـ hooks المستخرجة عليها اختبارات؛ smoke test للمكوّن (render بدون crash) في الداشبورد.
- **معايير القبول:** مفيش ملف `.tsx` > ~400 سطر في القائمة دي.

#### P4-T9 · تدقيق Accessibility (WCAG AA) · **P2**
- **الفحص:** labels لكل input، focus management في الـ dialogs، تباين ألوان، تنقّل كيبورد، RTL كامل.
- **التغيير:** ابدأ بأكثر الشاشات استخدامًا (login, dashboard, media, screens).
- **الاختبارات:** اختبارات RTL/a11y بـ `@testing-library` (وجود `aria-label`, `role`, focus trap) + فحص يدوي بكيبورد.
- **معايير القبول:** الشاشات الأساسية تعدّي فحص a11y آلي (زي `axe`) بدون انتهاكات حرجة.

### المرحلة P5 — Observability و Operations

#### P5-T1 · فصل liveness عن readiness · **P1**
- **الملفات:** `apps/backend/src/main.ts` (السطر ~83) + controller/handler جديد.
- **المشكلة:** `/health` بيرجّع 200 ثابت — لو الـ DB واقعة، الـ health لسه بيقول OK.
- **التغيير:** `/health` (liveness) يفضل ثابت؛ أضف `/ready` (readiness) بيعمل `SELECT 1` على Prisma ويرجّع 503 لو فشل. حدّث الـ healthcheck في `Dockerfile.backend`/compose للـ readiness حيث مناسب.
- **الاختبارات:** اختبار: `/ready` بيرجّع 200 لما الـ DB شغّالة، 503 لما الـ ping بيرمي (Prisma مزيّف).

#### P5-T2 · Structured logging + request correlation · **P2**
- **الملفات:** middleware جديد + إعداد Logger.
- **المشكلة:** صفر request correlation؛ Logger افتراضي.
- **التغيير:** middleware يقرأ/يولّد `x-request-id`، ويحطّه في async context، وكل log line تحمله. logs JSON في production.
- **الاختبارات:** اختبار middleware: بيولّد id لو مفيش، وبيحافظ على المُرسَل.

#### P5-T3 · Sentry: release tagging + PII scrubbing · **P2**
- **الملفات:** إعداد Sentry في الداشبورد + الباك إند.
- **التغيير:** أضف `release` + `beforeSend` يشيل PII (إيميلات، توكنز).
- **الاختبارات:** اختبار `beforeSend` بيشيل الحقول الحساسة.

#### P5-T4 · تجربة استرجاع backup (restore drill) · **P3**
- **التغيير:** وثّق ونفّذ استرجاع فعلي من `pg_dump` لبيئة نظيفة؛ سكريبت مؤتمت.
- **الاختبارات:** سكريبت drill بيتأكد إن الصفوف الأساسية رجعت.

### المرحلة P6 — الفيتشرز الناقصة (قرار منتج قبل التنفيذ)

- **P6-T1 · UI إدارة الجلسات:** الباك إند خلاص بيدعم جلسات متعددة (RefreshToken). ناقص: endpoint يعرض الجلسات النشطة + endpoint "خروج من كل الأجهزة" (موجود منطقه في `logout`) + UI. **اختبار** لكل endpoint.
- **P6-T2 · دورة حياة دعوات الفريق** (invite lifecycle) — قرار منتج + اختبارات.
- **P6-T3 · Analytics / Proof-of-Play** — 0 models حاليًا؛ يحتاج تصميم schema + قرار منتج.
- **P6-T4 · POS / Foodics** — 0 models؛ قرار منتج.
- **P6-T5 · Android player** — البلاير حاليًا Next.js ويب.
- **🅿️ بوابة الدفع السعودية — مؤجّلة صراحةً بطلب المالك.**

---

## 5. جدول تتبّع التقدّم

| المرحلة | إجمالي التاسكات | تمّ | ملاحظات |
|---------|:---:|:---:|---------|
| P1 | 6 | 6 | ✅ كاملة — 214 اختبار خضراء |
| P2 | 4 | 4 | ✅ كاملة — 257 اختبار خضراء |
| P3 | ~10 | 10 | ✅ كاملة — صفر apiFetch في .tsx؛ 12 وحدة API + hooks |
| P4 | ~9 | 0 | بعد P3 |
| P5 | 4 | 0 | مستقلة — ممكن بالتوازي |
| P6 | 5 | 0 | قرار منتج |

**قاعدة الإنهاء:** تاسك ما يتشالش من الجدول إلا لما يكون معاه اختبار و`npm run verify` أخضر.
