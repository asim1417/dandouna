# منصة دندونة · DANDOUNA

منصة سعودية متكاملة لاختبارات المؤشرات وتنمية الوعي الذاتي — بلغة ودودة ومطمئنة، بأساس علمي وخصوصية كاملة.

> **النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا أو نفسيًا.**

## نظرة عامة

المنصة الآن **تطبيق Next.js فعلي**: باك-إند احترافي (Prisma + RBAC + محرّك احتساب) مع واجهة بهوية Pastel V4. التصميم الأصلي الكامل (٢٨ شاشة) محفوظ كمرجع في `design-reference/index.html`، وخريطة ربط الشاشات بالـ API في `docs/screen-api-mapping.md`.

**منجَز ويعمل من الطرف للطرف:**
- ✅ مصادقة حقيقية (Auth.js v5): تسجيل/دخول بكلمة مرور مُعمّاة (bcrypt) + Google اختياري
- ✅ التحكم بالأدوار والصلاحيات (RBAC) بمنع افتراضي — `src/lib/rbac.ts`
- ✅ محرّك احتساب الدرجات (SUM/AVERAGE/WEIGHTED/SUBSCALE) — `src/lib/scoring.ts`
- ✅ تدفق الاختبار الكامل: المقاييس → بدء جلسة → حفظ تلقائي للإجابات → إنهاء واحتساب → تقرير
- ✅ التقرير يعرض النطاق والتفسير + توصيات مخصّصة + مراجع شرعية (قرآن/سنة/قول أهل العلم)
- ✅ امتثال PDPL: موافقة ولي الأمر شرطٌ لجلسات القُصّر، وحذف منطقي، وسجل تدقيق (AuditLog)
- ✅ نظام تصميم Pastel V4 (Readex Pro محلي عبر `next/font`، RTL، أيقونات SVG مضمّنة)
- ✅ عناصر إنتاج: وصف/OG/Twitter/favicon/theme-color + ترويسات أمان

**قادم:** OTP بالبريد · شاشات الخطة والتحديات · البوابات (ولي أمر/مختص/مؤسسة/شركة) · لوحات الإدارة العشر.

## التقنيات
- **الإطار:** Next.js 15 (App Router) · React 19 · TypeScript
- **قاعدة البيانات:** PostgreSQL · Prisma 7 (محوّل `@prisma/adapter-pg`)
- **المصادقة:** Auth.js (next-auth v5) · bcryptjs · جلسات JWT
- **الاستضافة:** Vercel

## نقاط الـ API الحالية
```
POST /api/auth/register           إنشاء حساب
GET/POST /api/auth/[...nextauth]  دخول/خروج (Auth.js)
GET  /api/scales                  المقاييس الفعّالة
GET/POST /api/assessments         جلسات المستخدم / بدء جلسة
POST /api/assessments/[id]/responses  حفظ إجابة (تلقائي)
POST /api/assessments/[id]/submit     إنهاء واحتساب النتيجة
GET/POST/DELETE /api/consent       موافقات PDPL
GET/POST /api/moods                ركن الطمأنينة (المزاج)
GET/POST /api/admin/references     المراجع الشرعية (مدير)
```

## التشغيل محليًا
```bash
npm install
cp .env.example .env          # عبّئ DATABASE_URL و AUTH_SECRET
npm run db:push               # إنشاء الجداول
npm run db:seed               # بيانات تجريبية (مدير + مقياس DOPA-SCREEN-01)
npm run dev                   # http://localhost:3000
```
حسابات البذور: `admin@dandouna.local` · `guardian@dandouna.local` · `child@dandouna.local` — كلمة المرور `Dandouna#1447`.

## النشر على Vercel
1. اربط المستودع بمشروع Vercel.
2. أضِف قاعدة بيانات Postgres (Vercel Postgres / Neon) وانسخ `DATABASE_URL`.
3. اضبط: `DATABASE_URL` · `AUTH_SECRET` (`openssl rand -base64 32`) · اختياريًا `AUTH_GOOGLE_ID/SECRET`.
4. النشر يشغّل `prisma generate && next build` تلقائيًا. بعد أول نشر شغّل `npm run db:deploy` (أو `db:push`) و `db:seed`.

## هيكل المشروع
```
src/app/            المسارات والواجهات (App Router)
  auth/             الدخول/التسجيل
  assessment/       قائمة · تشغيل الاختبار · التقرير
  dashboard/        اللوحة (محميّة)
  api/              نقاط النهاية
src/lib/            db · auth · session · rbac · scoring
src/components/     Icon · SiteHeader · AssessmentRunner
prisma/             المخطط + البذور
docs/               خريطة ربط الشاشات بالـ API
design-reference/   التصميم الأصلي (٢٨ شاشة) للرجوع
```

## الهوية البصرية
- الخط: Readex Pro (عربي) + Inter (أرقام) — مُستضاف محليًا
- الألوان: أبيض · أزرق `#1E3A8A` · وردي `#F74A80` · ذهبي `#C9A86A`
