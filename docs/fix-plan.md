# خطة تنفيذ إصلاحات Cloud-Screen

> **تاريخ الإنشاء:** 11 يوليو 2026
> **المرجع:** تقارير الـ Audit الثلاثة (`cloud-screen-audit-report.md`, `cloud-screen-audit-v2.md`, `cloud-screen-ux-audit.md`)
> **الفرع الحالي:** `fix/security-audit-v2`
> **قاعدة التنفيذ:** أي تعديل → sync فوري لـ WSL → rebuild للـ container المتأثر → `npm run verify` → اختبار يدوي

---

## Phase 0 — Security Hardening (المتبقي من الأوديت)

> **الأولوية:** عالية — لازم يخلص قبل أي موديولات جديدة
> **المرجع:** audit-report §17.1, audit-v2 §11

### Task 0.1: إغلاق localStorage token mirror في production

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §17.1 — نسخة توكن في `localStorage` بتلغي حماية `httpOnly` |
| **المشكلة** | `session.ts` بيخزن نسخة من الـ Access Token في `localStorage` + كوكي غير httpAlways (`cs_access_mirror`) — والميزة دي شغالة دايمًا حتى في production رغم إن التعليق بيقول "(dev)" |
| **التأثير** | أي XSS في أي مكان في الداشبورد يقدر يسرق التوكن من `localStorage.getItem('cs_access_token')` |
| **التنفيذ** | في `session.ts`، لف منطق `cs_access_mirror` و `localStorage.setItem` خلف `if (process.env.NODE_ENV !== 'production')` |
| **المرجع التقني** | [LocalStorage vs httpOnly Cookies for JWT](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies) — Hybrid approach: httpOnly cookies for refresh, in-memory for access |
| **مؤشر النجاح** | `localStorage.getItem('cs_access_token')` بيرجع `null` في production build، والـ dashboard لسه شغال بالـ httpOnly cookie بس |

### Task 0.2: تقييد بحث كود الـ pairing بـ workspace ID

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-v2 §11 — `claimSession` بيدور على الكود عبر كل المستأجرين |
| **المشكلة** | `pairing.service.ts` → `claimSession()` بيدور بـ `where: { code, status: PENDING, expiresAt: { gt: now } }` — مش مقيّد بـ workspace |
| **التأثير** | أي مستخدم يقدر يجرب كود من أي شاشة في أي حساب على المنصة |
| **التنفيذ** | عدّل `claimSession()` ياخد `workspaceId` ويضيفه للـ `where` clause |
| **المرجع التقني** | [OWASP Broken Access Control](https://owasp.org/www-community/attacks/Broken_Access_Control) — tenant isolation |
| **مؤشر النجاح** | كود من workspace-A مبيشتغلش على workspace-B + اختبار بيتأكد |

### Task 0.3: Lockout مرتبط بـ IP بدل userId فقط

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-v2 §11 — التسجيل مجاني فالـ lockout بـ `userId` مبيوقفش المهاجم |
| **المشكلة** | الـ lockout مربوط بـ `userId` بس، والمهاجم يقدر يعمل حسابات جديدة بسهولة |
| **التأثير** | المهاجم يقدر يجرب كودات من حسابات مختلفة بدون ما يتقفل |
| **التنفيذ** | خلي الـ lockout يجمع بين `userId + IP` (أو `IP` لو المستخدم مش معروف) |
| **المرجع التقني** | [NestJS Throttler docs](https://docs.nestjs.com/security/rate-limiting) — multi-key rate limiting |
| **مؤشر النجاح** | محاولات فاشلة من IPs مختلفة بتعدّي، بس نفس الـ IP بعد X محاولة بيتقفل |

### Task 0.4: إزالة `NEXT_PUBLIC_PLAYER_HEARTBEAT_SECRET` من bundle

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-v2 §11 — السيكرت المشترك لسه بيتحقن في client bundle |
| **المشكلة** | `NEXT_PUBLIC_` prefix بيخلي القيمة تظهر في الـ client bundle اللي بيتسلمه أي متصفح |
| **التأثير** | أي حد يفتح الـ player ويقرا الـ bundle يقدر يشوف السيكرت |
| **التنفيذ** | شيل `NEXT_PUBLIC_` prefix، خليه server-side only، البلاير يعتمد على السيكرت الخاص بكل شاشة |
| **المرجع التقني** | [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables) — server-only vs client-exposed |
| **مؤشر النجاح** | `grep` في `.next/static` ميرجعش القيمة + شاشات قديمة لسه شغالة بـ fallback |

### Task 0.5: إصلاح `Dockerfile.dashboard` (packages/ + marketing)

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-v2 §11 — الـ Dockerfile مش بينسخ `packages/` ولا `apps/marketing/package.json` |
| **المشكلة** | `npm ci` بيفشل لو workspace manifest ناقص |
| **التأثير** | البناء ممكن يفشل أو يتجاهل workspace كامل |
| **التنفيذ** | ضيف `COPY packages/ ./packages/` و `COPY apps/marketing/package.json ./apps/marketing/` في stage البناء |
| **المرجع التقني** | [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) — all workspace manifests must be present |
| **مؤشر النجاح** | `docker build -f Dockerfile.dashboard .` بينجح من غير missing workspace errors |

### Task 0.6: دعم جلسات متعددة (Multi-session)

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §3 — عمود `refreshTokenHash` واحد على `User` = تسجيل دخول جديد بيلغي القديم |
| **المشكلة** | تسجيل دخول من جهاز/متصفح جديد بيلغي جلسة الجهاز القديم تلقائيًا من غير إشعار |
| **التأثير** | تجربة مستخدم سيئة — المستخدم بيلاقي نفسه مسجل خروج فجأة |
| **التنفيذ** | جدول جديد `RefreshSession` (id, userId, tokenHash, createdAt, expiresAt, userAgent) + Prisma migration + تعديل `auth.service.ts` |
| **المرجع التقني** | [Prisma migrations in production](https://www.prisma.io/docs/orm/prisma-client/queries/pagination) — `prisma migrate deploy` |
| **مؤشر النجاح** | تسجيل دخول من جهازين في نفس الوقت + كل جهاز ليه session مستقلة + تسجيل خروج من جهاز مبيأثرش على التاني |

---

## Phase 1 — UX/Core Feature Gaps

> **الأولوية:** عالية — تقسيم الكومبوننتات الضخمة + إكمال الصفحات الناقصة
> **المرجع:** ux-audit §9.2, §9.3

### Task 1.1: تقسيم `branch-detail-client.tsx` (937 سطر)

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §9.2 — God Component |
| **المنهجية** | extract hooks الأول (React docs best practice) — `useBranchScreens`, `useBranchPlaylists`, `useBranchMedia` → بعدين extract sub-components للـ tabs |
| **المرجع التقني** | [React: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — extract hooks before splitting render |
| **مؤشر النجاح** | ملف رئيسي < 200 سطر + كل hook مستقل قابل للاختبار + الصفحة لسه شغالة 100% |

### Task 1.2: تقسيم `admin-customer-profile-client.tsx` (875 سطر)

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §9.2 |
| **التنفيذ** | `useCustomerProfile`, `useCustomerSubscription` hooks + sub-components للـ tabs (branches, subscription, payments) |
| **المرجع التقني** | [When to Split a React Component](https://dev.to/137foundry/when-to-split-a-react-component-and-when-youre-over-engineering-2a6) — split by responsibility, not by line count |
| **مؤشر النجاح** | ملف رئيسي < 200 سطر + كل tab في component مستقل |

### Task 1.3: تقسيم `client-home-dashboard.tsx` (823 سطر)

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §9.2 |
| **التنفيذ** | `useBranchesOverview` hook + `BranchCard` component مستقل + `BranchActions` component |
| **مؤشر النجاح** | ملف رئيسي < 200 سطر |

### Task 1.4: تقسيم `player-runtime.tsx` (685 سطر)

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §5.1 |
| **التنفيذ** | `usePlayerSocket`, `usePlayerHeartbeat`, `usePlayerContent` hooks — كل hook self-contained بدون refs مشتركة |
| **المرجع التقني** | [Refactoring Large React Components with Custom Hooks](https://codingdunia.com/blog/refactoring-react-components-ai-clean-architecture/) — extract self-contained logic |
| **مؤشر النجاح** | ملف رئيسي < 250 سطر + البلاير لسه شغال |

### Task 1.5: إضافة search/filter في Media, Screens, Customers

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §9.3 — مشاكل متوسطة |
| **التنفيذ** | client-side filtering للداتا المعروضة + server-side query params للـ API (search term + status filter) |
| **مؤشر النجاح** | بحث بيشتغل في الـ 3 صفحات + النتايج بتتحدث فورًا |

### Task 1.6: إكمال Team page

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.12 — ينقص remove member, change role, pending invites |
| **التنفيذ** | إضافة remove member dialog, change role dropdown, resend invite button, pending invites tab |
| **مؤشر النجاح** | كل العمليات شغالة + toast لكل عملية + pending invites بتظهر |

### Task 1.7: إضافة password change من settings/profile

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.13 — ينقص password change |
| **التنفيذ** | endpoint `POST /auth/change-password` (currentPassword + newPassword) + form في الـ profile page |
| **مؤشر النجاح** | تغيير الباسورد شغال + بيتطلب الباسورد الحالي + toast نجاح |

---

## Phase 2 — Performance & Data Layer

> **الأولوية:** متوسطة
> **المرجع:** ux-audit §11

### Task 2.1: إضافة SWR لـ data caching

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §11.2 — مفيش SWR/React Query |
| **المنهجية** | SWR (Vercel) — bundle أصغر (~4KB) و native fit مع Next.js |
| **التنفيذ** | wrapper `useApiFetch` حوالين `apiFetch` + `SWRConfig` provider مع global error handling |
| **المرجع التقني** | [SWR docs](https://swr.vercel.app/docs/getting-started) + [React Query vs SWR in 2026](https://dev.to/whoffagents/react-query-vs-swr-in-2026-what-i-actually-use-and-why-3362) |
| **مؤشر النجاح** | صفحات بتفتح أسرع + مفيش refetch مكرر + deduplication شغال |

### Task 2.2: Optimistic updates للـ mutations الشائعة

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §11.2 |
| **التنفيذ** | `useSWRMutation` للـ create/delete operations (media upload, screen create/delete, playlist reorder) |
| **مؤشر النجاح** | UI بيتحدث فورًا قبل رد الـ API + rollback لو فشل |

### Task 2.3: Skeleton loading موحد

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §2.5 |
| **التنفيذ** | `SkeletonCard`, `SkeletonTable`, `SkeletonList` components reusable |
| **مؤشر النجاح** | كل صفحة ليها skeleton matching لشكل المحتوى |

### Task 2.4: Empty state موحد

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §2.5 |
| **التنفيذ** | `EmptyState` component reusable (icon + title + description + optional action button) |
| **مؤشر النجاح** | كل الصفحات الفاضية بتستخدم نفس الـ component |

---

## Phase 3 — UX Enhancements

> **الأولوية:** منخفضة لمتوسطة
> **المرجع:** ux-audit §9.3, §9.4

### Task 3.1: Onboarding wizard للعملاء الجدد

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.4 — مفيش onboarding wizard |
| **التنفيذ** | 3-step wizard بعد أول تسجيل دخول: (1) Create workspace → (2) Upload first media → (3) Pair first screen |
| **مؤشر النجاح** | مستخدم جديد يخلص الـ wizard ويبقى عنده workspace + media + شاشة جاهزة |

### Task 3.2: Undo/redo في الـ Studio (Canvas Editor)

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.8 — مفيش undo/redo |
| **التنفيذ** | history stack للـ Konva canvas state + keyboard shortcuts (Ctrl+Z / Ctrl+Y) + undo/redo buttons في الـ toolbar |
| **مؤشر النجاح** | undo/redo بيشتغل + الـ shortcuts شغالة + الـ history بيتمسح لما الـ canvas تتقفل |

### Task 3.3: Plan comparison في الـ billing

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.13 — مفيش plan comparison |
| **التنفيذ** | جدول مقارنة FREE vs PRO vs ENTERPRISE + feature matrix + CTA buttons |
| **مؤشر النجاح** | المستخدم يقدر يقارن الـ plans قبل الـ upgrade |

### Task 3.4: Password strength indicator

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.1 — مفيش strength indicator |
| **التنفيذ** | meter بصري (weak/fair/strong) أثناء الكتابة في register + change password |
| **مؤشر النجاح** | المؤشر بيظهر فورًا وبيتحرك مع الكتابة |

### Task 3.5: Video preview في media library

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §3.11 — مفيش video preview |
| **التنفيذ** | `<video>` element بدل thumbnail للملفات الـ video في الـ grid + hover-to-play |
| **مؤشر النجاح** | الفيديوهات بتتشغل preview في الـ library |

### Task 3.6: Export (CSV) للجداول

| البند | التفاصيل |
|---|---|
| **المصدر** | ux-audit §4.4 — مفيش export |
| **التنفيذ** | زر export في جداول الأدمن (customers, users, logs) → client-side CSV generation |
| **مؤشر النجاح** | ملف CSV بينزل بالبيانات المعروضة |

---

## Phase 4 — Missing Business Modules

> **الأولوية:** متوسطة — الموديولات اللي مش موجودة أصلًا
> **المرجع:** audit-report §5, audit-v2 §12

### Task 4.1: بوابة دفع سعودية (Moyasar/HyperPay)

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §2.5 — Stripe بس، مش بيفتح حسابات سعودية |
| **الأولوية** | عالية — بدونها مفيش تحصيل من عملاء سعوديين |
| **التنفيذ** | `moyasar.module.ts` + `moyasar.controller.ts` + webhook handler + UI selector بين Stripe/Moyasar + تعديل `PaymentRecord.provider` |
| **المرجع التقني** | [Moyasar API docs](https://docs.moyasar.com/) |
| **مؤشر النجاح** | دفع فعلي عبر Moyasar في sandbox + webhook بيحدّث الـ subscription |

### Task 4.2: Module 7 — تكامل POS (Foodics)

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §5 — غير موجود بالمرة |
| **التنفيذ** | Prisma models (Menu, Category, MenuItem, Price, Modifier) + Foodics API integration service + sync cron job + UI صفحة إعدادات التكامل |
| **المرجع التقني** | [Foodics API docs](https://developer.foodics.com/) |
| **مؤشر النجاح** | منيو Foodics بيتسحب ويتعرض في الـ dashboard + sync تلقائي |

### Task 4.3: قوالب منيو مخصصة للمطاعم

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §5 — الـ Canvas عام، مفيش بلوكات منيو |
| **التنفيذ** | canvas blocks جاهزة (Category, Item, Price, Badge, Modifier) + menu templates في الـ Studio + auto-layout |
| **مؤشر النجاح** | مستخدم يقدر يعمل منيو من template في < 5 دقايق |

### Task 4.4: Module 8 — Analytics / Proof-of-Play

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §5 — غير موجود |
| **التنفيذ** | Prisma model `PlaybackLog` (screenId, mediaId, playedAt, durationSec) + logging من البلاير + dashboard charts + export |
| **مؤشر النجاح** | تقارير Proof-of-Play بتظهر لكل شاشة + إحصائيات عرض لكل media item |

### Task 4.5: تطبيق Android

| البند | التفاصيل |
|---|---|
| **المصدر** | audit-report §5 — البلاير لسه Next.js ويب بس |
| **التنفيذ** | قرار معماري: WebView wrapper (أسرع) أو React Native (أقوى) → APK + offline support + auto-start on boot + kiosk mode |
| **مؤشر النجاح** | APK بيشغل البلاير على جهاز Android فعلي + offline cache شغال |

---

## قواعد التنفيذ العامة

1. **قبل كل تاسك:** سيرش من الدوكيومنشن الرسمية (NestJS docs, Next.js docs, Prisma docs, React docs)
2. **بعد كل تعديل:** sync فوري لـ WSL: `wsl -d Ubuntu -- bash -c "cp /mnt/d/projects/Cloud-Screen/<file> /home/gpack/Cloud-Screen/<file>"`
3. **Rebuild:** `docker compose up --build <service>` للخدمة المتأثرة
4. **بعد كل phase:** تشغيل `npm run verify` + اختبار يدوي على السيرفر
5. **الترتيب:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 (الترتيب مهم — مفيش تخطي)
6. **Tests:** كل تاسك حرج لازم يكون معاه اختبار يمنع رجوع المشكلة (regression test)
7. **Commits:** commit بعد كل تاسك برسالة واضحة بالـ conventional commits format

---

## ملخص الأولويات

| Phase | الأولوية | عدد التاسكات | التقدير الزمني |
|---|---|---|---|
| **Phase 0** — Security | 🔴 عالية | 6 | 2-3 أيام |
| **Phase 1** — UX/Core | 🟠 عالية | 7 | 4-5 أيام |
| **Phase 2** — Performance | 🟡 متوسطة | 4 | 2-3 أيام |
| **Phase 3** — UX Enhancements | 🔵 منخفضة | 6 | 3-4 أيام |
| **Phase 4** — Business Modules | 🟡 متوسطة | 5 | 2-3 أسابيع |
| **الإجمالي** | | **28** | ~4-5 أسابيع |
