# منصة دندونة · DANDOUNA

منصة سعودية متكاملة لاختبارات المؤشرات وتنمية الوعي الذاتي — بلغة ودودة ومطمئنة، بأساس علمي وخصوصية كاملة.

> **النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا.**

## المرحلة الحالية

يجري تحويل المنصة من **نموذج تصميمي (Prototype)** إلى **منتج فعلي** على مراحل. التصميم الأصلي الكامل (٢٨ شاشة) محفوظ كمرجع في `design-reference/index.html`.

**تمّ إنجازه (المرحلة ٠ + بداية ١):**
- ✅ مشروع Next.js 15 (App Router + TypeScript)
- ✅ نظام تصميم Pastel V4 مُرحّل (Readex Pro محلي عبر `next/font`، RTL كامل، أيقونات SVG بلا اعتماد خارجي)
- ✅ قاعدة بيانات Postgres عبر Prisma (مستخدمون/أدوار/موافقة ولي أمر/مقاييس)
- ✅ مصادقة حقيقية (Auth.js): تسجيل/دخول بكلمة مرور مُعمّاة (bcrypt) + Google اختياري
- ✅ صفحات حقيقية: الرئيسية `/` · الدخول `/login` · التسجيل `/register` · اللوحة `/dashboard`
- ✅ عناصر إنتاج: وصف/OG/Twitter/favicon/theme-color + ترويسات أمان

**قادم:** موافقة ولي الأمر · OTP بالبريد · محرّك الاختبار وحساب الدرجات · التقارير · البوابات · لوحات الإدارة · امتثال PDPL.

## التقنيات
- **الواجهة والخادم:** Next.js 15 (App Router) · React 19 · TypeScript
- **قاعدة البيانات:** PostgreSQL · Prisma ORM
- **المصادقة:** Auth.js (next-auth v5) · bcryptjs
- **الاستضافة:** Vercel

## التشغيل محليًا

```bash
# 1) الاعتماديات
npm install

# 2) متغيّرات البيئة
cp .env.example .env       # ثم عبّئ DATABASE_URL و AUTH_SECRET

# 3) قاعدة البيانات
npm run db:push            # إنشاء الجداول
npm run db:seed            # (اختياري) مدير + مقياس تجريبي

# 4) التطوير
npm run dev                # http://localhost:3000
```

## النشر على Vercel
1. اربط المستودع بمشروع Vercel.
2. أضِف قاعدة بيانات Postgres (Vercel Postgres / Neon) وانسخ `DATABASE_URL`.
3. اضبط متغيّرات البيئة: `DATABASE_URL` · `AUTH_SECRET` (`openssl rand -base64 32`) · اختياريًا `AUTH_GOOGLE_ID/SECRET`.
4. النشر يشغّل `prisma generate && next build` تلقائيًا.

## هيكل المشروع
```
app/                واجهات ومسارات التطبيق (App Router)
  (auth)/           صفحات الدخول والتسجيل
  api/              نقاط النهاية (register, auth)
  dashboard/        اللوحة (محميّة)
components/         مكوّنات مشتركة (Icon, SiteHeader)
lib/                prisma, auth
prisma/             مخطط قاعدة البيانات + البذور
design-reference/   التصميم الأصلي الكامل (٢٨ شاشة) للرجوع
public/             الأصول الثابتة
```

## الهوية البصرية
- الخط: Readex Pro (عربي) + Inter (أرقام) — مُستضاف محليًا
- الألوان: أبيض · أزرق `#1E3A8A` · وردي `#F74A80` · ذهبي `#C9A86A`
- أيقونات خطية (Lucide) مُضمّنة كـ SVG
