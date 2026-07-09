// ============================================================
//  بيانات تمهيدية (Seed) — بيانات تجريبية فقط
//  تُنشئ: مستخدمين، مقياسًا واحدًا كاملًا، نطاقات، توصيات، ومرجعًا شرعيًا
//  لا تُستخدم بيانات حقيقية في التطوير (شرط PDPL)
// ============================================================
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("→ بدء التهيئة…");

  // ===== مستخدمون تجريبيون =====
  const pass = await bcrypt.hash("Dandouna#1447", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dandouna.local" },
    update: {},
    create: { email: "admin@dandouna.local", fullName: "مدير النظام", role: "ADMIN", passwordHash: pass },
  });

  const guardian = await prisma.user.upsert({
    where: { email: "guardian@dandouna.local" },
    update: {},
    create: { email: "guardian@dandouna.local", fullName: "ولي الأمر", role: "GUARDIAN", passwordHash: pass },
  });

  // مشرف محتوى تجريبي
  await prisma.user.upsert({
    where: { email: "editor@dandouna.local" },
    update: {},
    create: { email: "editor@dandouna.local", fullName: "مشرف المحتوى", role: "CONTENT_EDITOR", passwordHash: pass },
  });

  // ملف طفل يملكه ولي الأمر + موافقة سارية على معالجة بياناته
  const existingChild = await prisma.child.findFirst({
    where: { guardianId: guardian.id, fullName: "سارة" },
  });
  const child =
    existingChild ??
    (await prisma.child.create({
      data: {
        guardianId: guardian.id,
        fullName: "سارة",
        birthDate: new Date("2013-01-01"),
        gender: "أنثى",
        avatarColor: "#F74A80",
      },
    }));
  const hasConsent = await prisma.consent.findFirst({ where: { childId: child.id } });
  if (!hasConsent) {
    await prisma.consent.create({
      data: {
        childId: child.id,
        grantedById: guardian.id,
        purpose: "أداء مقاييس التقييم السلوكي",
        status: "GRANTED",
        grantedAt: new Date(),
      },
    });
  }

  // مؤسسة/شركة تجريبية + عضوية ولي الأمر (لبوابات المؤسسة/الشركة)
  const existingOrg = await prisma.organization.findFirst({ where: { name: "شركة أفق التقنية" } });
  if (!existingOrg) {
    const org = await prisma.organization.create({
      data: { name: "شركة أفق التقنية", type: "COMPANY", seats: 50 },
    });
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: guardian.id, orgId: org.id } },
      update: {},
      create: { userId: guardian.id, orgId: org.id, roleInOrg: "COMPANY" },
    });
  }

  // تفادي التكرار عند إعادة التشغيل
  const existingScale = await prisma.scale.findUnique({ where: { code: "DOPA-SCREEN-01" } });
  if (existingScale) {
    console.log("✓ البيانات موجودة مسبقًا — تم تخطّي إنشاء المقياس");
    return;
  }

  // ===== مرجع شرعي =====
  const ref = await prisma.islamicReference.create({
    data: {
      source: "SUNNAH",
      title: "الاعتدال وحفظ الوقت",
      textAr: "من حسن إسلام المرء تركه ما لا يعنيه.",
      citation: "رواه الترمذي",
      category: "التوازن السلوكي",
    },
  });

  // ===== مقياس دوبامين تجريبي =====
  const scale = await prisma.scale.create({
    data: {
      code: "DOPA-SCREEN-01",
      title: "مقياس الأنماط المرتبطة بالمكافأة الرقمية",
      description: "مقياس توعوي لرصد أنماط الاندفاع والإفراط في المحفزات الرقمية.",
      audience: "USER",
      versions: {
        create: {
          version: 1,
          scoring: "SUM",
          isCurrent: true,
          questions: {
            create: [
              likert(1, "أجد صعوبة في التوقف عن استخدام الشاشة رغم رغبتي في ذلك", {
                flagThreshold: 4,
                flagLabel: "صعوبة مرتفعة في ضبط استخدام الشاشة — يُنصح بمتابعة أقرب.",
              }),
              likert(2, "أشعر بالملل بسرعة عند غياب المحفزات السريعة"),
              likert(3, "أؤجّل مهامي المهمة لصالح متعة لحظية"),
              likert(4, "أتفقّد هاتفي بشكل متكرر دون سبب واضح"),
              // سؤال عكسي: الموافقة العالية تدل على توازن (تُقلب قيمته عند الاحتساب)
              likert(5, "ألتزم بأوقات محدّدة ومنظّمة لاستخدام الأجهزة", { isReverse: true }),
            ],
          },
          bands: {
            create: [
              {
                subscale: null, minScore: 0, maxScore: 6, label: "منخفض",
                interpretation: "نمط متوازن؛ لا مؤشرات تستدعي القلق.",
                recommendations: {
                  create: [{ title: "الحفاظ على التوازن", body: "استمر في عاداتك المنظّمة، وخصّص وقتًا للأنشطة غير الرقمية.", order: 1 }],
                },
              },
              {
                subscale: null, minScore: 7, maxScore: 13, label: "متوسط",
                interpretation: "مؤشرات مبكرة تستحق الانتباه.",
                recommendations: {
                  create: [{
                    title: "ضبط المحفزات",
                    body: "قلّل الإشعارات، وجرّب فترات انقطاع مجدولة عن الشاشة.",
                    order: 1,
                    references: { create: [{ referenceId: ref.id }] },
                  }],
                },
              },
              {
                subscale: null, minScore: 14, maxScore: 20, label: "مرتفع",
                interpretation: "نمط ملحوظ من الإفراط؛ يُنصح بالمتابعة مع مختص.",
                recommendations: {
                  create: [{
                    title: "طلب دعم متخصص",
                    body: "ننصح بالتواصل مع مختص، مع تطبيق خطة تدريجية لتقليل المحفزات.",
                    order: 1,
                    references: { create: [{ referenceId: ref.id }] },
                  }],
                },
              },
            ],
          },
        },
      },
    },
    include: { versions: true },
  });

  console.log("✓ اكتملت التهيئة");
  console.log("  المدير: admin@dandouna.local");
  console.log("  ولي الأمر: guardian@dandouna.local");
  console.log("  مشرف المحتوى: editor@dandouna.local");
  console.log("  كلمة المرور للجميع: Dandouna#1447");
  console.log(`  المقياس: ${scale.code} (نسخة ${scale.versions[0].version})`);
}

// مولّد سؤال ليكرت خماسي (أبدًا … دائمًا) بقيم 0..4
function likert(
  order: number,
  text: string,
  opts?: { isReverse?: boolean; flagThreshold?: number; flagLabel?: string },
) {
  const labels = ["أبدًا", "نادرًا", "أحيانًا", "غالبًا", "دائمًا"];
  return {
    order,
    text,
    type: "LIKERT" as const,
    weight: 1,
    isReverse: opts?.isReverse ?? false,
    flagThreshold: opts?.flagThreshold ?? null,
    flagLabel: opts?.flagLabel ?? null,
    options: { create: labels.map((label, i) => ({ label, value: i, order: i + 1 })) },
  };
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
