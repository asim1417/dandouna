# خريطة الربط · شاشات دندونة ← الطبقة الخلفية

ربط كل شاشة من الـ28 في `index.html` بمسارات الـ API وجداول قاعدة البيانات المطلوبة لتشغيلها.
الحالة: ● منفّذ في هذا الهيكل · ◐ هيكل جاهز يحتاج إكمالًا · ○ لم يُنفّذ بعد.

## مجموعة المنصة (13)

| الشاشة | مسار API | الجداول | الحالة |
|---|---|---|---|
| الرئيسية | `GET /api/scales` | Scale, ScaleVersion | ● |
| تسجيل الدخول (تدفق كامل) | `POST /api/auth/*`, `POST /api/auth/register` | User, Account, Session, VerificationToken | ◐ |
| لوحة المستخدم | `GET /api/assessments`, `GET /api/moods` | Assessment, MoodEntry | ● |
| الجوال | نفس مسارات اللوحة (واجهة متجاوبة) | — | ◐ |
| الاختبار والنتيجة | `POST /api/assessments/[id]/submit` | Assessment, Response, ScaleResult | ● |
| شاشة السؤال | `POST /api/assessments/[id]/responses` | Response, Question, QuestionOption | ● |
| الخطة والتحديات | `GET /api/plan` | (Plan, Challenge — للإضافة) | ○ |
| التقارير | `GET /api/assessments/[id]/result` | ScaleResult, Recommendation, IslamicReference | ◐ |
| التهيئة (Onboarding) | `PATCH /api/me` | User | ○ |
| إعداد الملف | `PATCH /api/me` | User | ○ |
| الموافقة | `POST /api/consent` | Consent, GuardianLink | ● |
| ركن الطمأنينة | `POST /api/moods`, `GET /api/moods` | MoodEntry | ● |
| الخصوصية | صفحة ثابتة + `DELETE /api/me` (حق الحذف) | User (حذف منطقي) | ◐ |

## مجموعة البوابات (5)

| الشاشة | مسار API | الجداول | الحالة |
|---|---|---|---|
| ولي الأمر | `GET /api/wards`, `POST /api/consent` | GuardianLink, Consent, Assessment | ◐ |
| المختص | `GET /api/specialist/cases` | Assessment, ScaleResult (بصلاحية) | ○ |
| الطفل/المراهق | مسارات المستخدم مع فحص القاصر | User (isMinor), Consent | ◐ |
| المؤسسة | `GET /api/org/[id]/members`, تقارير مجمّعة | Organization, Membership | ○ |
| الشركات | `GET /api/org/[id]` + فوترة | Organization, Membership | ○ |

## مجموعة الإدارة (10)

| الشاشة | مسار API | الجداول | الحالة |
|---|---|---|---|
| اللوحة | `GET /api/admin/overview` | (تجميع) | ○ |
| المستخدمون | `GET/PATCH /api/admin/users` | User | ○ |
| المقاييس | `GET/POST /api/scales` | Scale, ScaleVersion | ● |
| الأسئلة | `GET/POST /api/admin/questions` | Question, QuestionOption | ○ |
| الدرجات | `GET/POST /api/admin/bands` | ScoreBand | ○ |
| التوصيات | `GET/POST /api/admin/recommendations` | Recommendation | ○ |
| المراجع الشرعية | `GET/POST /api/admin/references` | IslamicReference, RecommendationReference | ● |
| المؤسسات | `GET/POST /api/admin/orgs` | Organization, Membership | ○ |
| سجل التدقيق | `GET /api/admin/audit` (صلاحية audit:view) | AuditLog | ◐ |
| الأمن | `GET /api/admin/security` | (إعدادات + AuditLog) | ○ |

## ملخص المنفّذ في هذا الهيكل

المسارات العاملة الآن:
- `GET/POST /api/scales`
- `GET/POST /api/assessments`
- `POST /api/assessments/[id]/responses`
- `POST /api/assessments/[id]/submit` (محرّك الاحتساب الكامل)
- `GET/POST/DELETE /api/consent`
- `GET/POST /api/moods`
- `GET/POST /api/admin/references`
- `GET/POST /api/auth/[...nextauth]` (Auth.js)

الطبقات المشتركة:
- `src/lib/db.ts` — عميل Prisma (محوّل pg)
- `src/lib/scoring.ts` — محرّك احتساب الدرجات
- `src/lib/rbac.ts` — الأدوار والصلاحيات
- `src/lib/auth.ts` — المصادقة والجلسات
- `src/lib/session.ts` — سحب الهوية من الجلسة (لا من الطلب)
- `src/middleware.ts` — حارس المسارات المحمية

## أولوية الإكمال (بعد المرحلة صفر)

1. إكمال تدفق التسجيل الفعلي (`/api/auth/register` + OTP عبر VerificationToken).
2. ترحيل شاشات `index.html` إلى مكوّنات React وربطها بالمسارات أعلاه.
3. مسار التقرير `/api/assessments/[id]/result` وعرض التوصيات والمراجع.
4. لوحات الإدارة (الأسئلة، الدرجات، التوصيات) على البيانات الفعلية.
5. بوابات المؤسسة والشركة والتقارير المجمّعة.
