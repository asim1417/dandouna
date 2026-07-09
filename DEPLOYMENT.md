# دليل النشر — منصة دندونة

نشر نسخة تجريبية قابلة للاستخدام العائلي على **Vercel + Postgres**.

## المتطلبات
- حساب [Vercel](https://vercel.com)
- قاعدة بيانات PostgreSQL سحابية — [Neon](https://neon.tech) (مجاني) أو Vercel Postgres
- (اختياري للبريد الفعلي) حساب [Resend](https://resend.com) لإرسال رموز OTP

## الخطوات

### 1) قاعدة البيانات
- أنشئ قاعدة Postgres على Neon/Vercel وانسخ رابط الاتصال `DATABASE_URL`
  (يجب أن يتضمّن `?sslmode=require`).

### 2) ربط المشروع بـ Vercel
- استورد المستودع في Vercel (يكتشف Next.js تلقائيًا).
- أمر البناء تلقائي: `prisma generate && next build`.

### 3) متغيّرات البيئة (Vercel → Settings → Environment Variables)
| المتغيّر | القيمة |
|---------|--------|
| `DATABASE_URL` | رابط Postgres |
| `AUTH_SECRET` | ناتج `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | رابط موقعك (مثل `https://dandouna.vercel.app`) |
| `RESEND_API_KEY` | (اختياري) لإرسال رموز OTP فعليًا بالبريد |
| `EMAIL_FROM` | (اختياري) `دندونة <no-reply@نطاقك>` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | (اختياري) لدخول Google |

> **بدون `RESEND_API_KEY`** لن تُرسَل رموز OTP بالبريد (تُطبع في سجل الخادم فقط) — لازمة للتجربة العائلية عن بُعد.

### 4) تهيئة قاعدة البيانات (مرة واحدة)
من جهازك مع ضبط `DATABASE_URL` على قاعدة الإنتاج:
```bash
npm install
npm run db:deploy   # أو: npm run db:push
npm run db:seed     # بيانات تجريبية + مقياس DOPA-SCREEN-01
```

### 5) التحقق
- افتح رابط الموقع → «تسجيل الدخول» → أدخل بريدك → استلم الرمز → لوحة ولي الأمر.
- أضِف ملف طفل → ابدأ اختبارًا → اطّلع على النتيجة والتوصيات.
- للإدارة: ادخل ببريد `admin@dandouna.local` (أو رقِّ حسابك إلى ADMIN في قاعدة البيانات).

## حسابات البذور التجريبية
| الدور | البريد |
|------|--------|
| مدير | `admin@dandouna.local` |
| ولي أمر | `guardian@dandouna.local` |
| مشرف محتوى | `editor@dandouna.local` |

الدخول عبر رمز OTP يُرسَل للبريد (أو يُطبع في السجل في وضع التطوير).

## ملاحظات الأمان والامتثال
- بيانات الأطفال تُعالَج بموافقة ولي الأمر فقط (PDPL) — الحذف منطقي.
- كل عمليات الإدارة والتقييم تُسجَّل في `AuditLog`.
- تُفضّل استضافة قاعدة البيانات داخل السعودية للامتثال الكامل لإقامة البيانات.
