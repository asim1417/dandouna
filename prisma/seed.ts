// ============================================================
//  بيانات تمهيدية (Seed) — محتوى تجريبي احترافي
//  مستخدمون + طفل + مؤسسة + مكتبة مراجع + ٣ مقاييس علمية
//  (جمع/أعلام، محاور فرعية، موزون). لا بيانات حقيقية (PDPL).
// ============================================================
import { PrismaClient, type RefSource, type ScoringMethod } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ===== أنواع مساعدة لتأليف المحتوى =====
const LIKERT = ["أبدًا", "نادرًا", "أحيانًا", "غالبًا", "دائمًا"]; // قيم 0..4

type QDef = {
  text: string;
  weight?: number;
  isReverse?: boolean;
  subscale?: string;
  flagThreshold?: number;
  flagLabel?: string;
};
type BandDef = { subscale?: string | null; min: number; max: number; label: string; interpretation: string; recs?: RecDef[] };
type RecDef = { title: string; body: string; refKeys?: string[] };
type ScaleDef = {
  code: string;
  title: string;
  description: string;
  category: string;
  minAge?: number;
  maxAge?: number;
  estMinutes: number;
  scoring: ScoringMethod;
  questions: QDef[];
  bands: BandDef[];
};

async function main() {
  console.log("→ بدء التهيئة…");
  const pass = await bcrypt.hash("Dandouna#1447", 10);

  // ===== مستخدمون =====
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
  await prisma.user.upsert({
    where: { email: "editor@dandouna.local" },
    update: {},
    create: { email: "editor@dandouna.local", fullName: "مشرف المحتوى", role: "CONTENT_EDITOR", passwordHash: pass },
  });

  // ===== ملف طفل + موافقة =====
  let child = await prisma.child.findFirst({ where: { guardianId: guardian.id, fullName: "سارة" } });
  if (!child) {
    child = await prisma.child.create({
      data: { guardianId: guardian.id, fullName: "سارة", birthDate: new Date("2013-01-01"), gender: "أنثى", avatarColor: "#F74A80" },
    });
  }
  if (!(await prisma.consent.findFirst({ where: { childId: child.id } }))) {
    await prisma.consent.create({
      data: { childId: child.id, grantedById: guardian.id, purpose: "أداء مقاييس التقييم السلوكي", status: "GRANTED", grantedAt: new Date() },
    });
  }

  // ===== مؤسسة/شركة =====
  if (!(await prisma.organization.findFirst({ where: { name: "شركة أفق التقنية" } }))) {
    const org = await prisma.organization.create({ data: { name: "شركة أفق التقنية", type: "COMPANY", seats: 50 } });
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: guardian.id, orgId: org.id } },
      update: {},
      create: { userId: guardian.id, orgId: org.id, roleInOrg: "COMPANY" },
    });
  }

  // ===== مكتبة المراجع (تُنشأ مرة واحدة بالمفتاح) =====
  const refLibrary: Record<string, { source: RefSource; title: string; textAr: string; citation?: string; category?: string }> = {
    israf: { source: "QURAN", title: "الاعتدال وعدم الإسراف", textAr: "وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا ۚ إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ", citation: "الأعراف ٣١", category: "الاعتدال" },
    tumanina: { source: "QURAN", title: "الطمأنينة بذكر الله", textAr: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", citation: "الرعد ٢٨", category: "الطمأنينة" },
    tarkMaLaYani: { source: "SUNNAH", title: "حفظ الوقت وترك ما لا يعني", textAr: "من حسن إسلام المرء تركه ما لا يعنيه", citation: "رواه الترمذي", category: "حفظ الوقت" },
    sihhaFaragh: { source: "SUNNAH", title: "اغتنام الصحة والفراغ", textAr: "نعمتان مغبون فيهما كثير من الناس: الصحة والفراغ", citation: "رواه البخاري", category: "اغتنام الوقت" },
    qawiyy: { source: "SUNNAH", title: "العناية بالجسد والقوة", textAr: "المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف، وفي كلٍّ خير", citation: "رواه مسلم", category: "العناية بالجسد" },
    waqtSaif: { source: "SCHOLARLY", title: "قيمة الوقت", textAr: "الوقت أنفس ما عُني بحفظه، وأراه أيسر ما يُضيَّع", citation: "من كلام أهل العلم", category: "إدارة الوقت" },
    sleepHygiene: { source: "OTHER", title: "نظافة النوم", textAr: "تقليل الشاشات قبل النوم بساعة، وثبات مواعيد النوم، يحسّنان جودة النوم والتركيز نهارًا", citation: "إرشاد تربوي", category: "النوم" },
  };
  const refIds: Record<string, string> = {};
  for (const [key, data] of Object.entries(refLibrary)) {
    const existing = await prisma.islamicReference.findFirst({ where: { title: data.title } });
    refIds[key] = existing ? existing.id : (await prisma.islamicReference.create({ data })).id;
  }

  // ===== تعريف المقاييس =====
  const scales: ScaleDef[] = [
    {
      code: "DOPA-SCREEN-01",
      title: "مقياس الأنماط المرتبطة بالمكافأة الرقمية",
      description: "مقياس توعوي لرصد أنماط الاندفاع والإفراط في المحفزات الرقمية.",
      category: "التوازن الرقمي",
      minAge: 9, maxAge: 18, estMinutes: 8, scoring: "SUM",
      questions: [
        { text: "أجد صعوبة في التوقف عن استخدام الشاشة رغم رغبتي في ذلك", flagThreshold: 4, flagLabel: "صعوبة مرتفعة في ضبط استخدام الشاشة — يُنصح بمتابعة أقرب." },
        { text: "أشعر بالملل بسرعة عند غياب المحفزات السريعة" },
        { text: "أؤجّل مهامي المهمة لصالح متعة لحظية" },
        { text: "أتفقّد الجهاز بشكل متكرر دون سبب واضح" },
        { text: "أحتاج وقتًا أطول تدريجيًا أمام الشاشة لأشعر بالرضا" },
        { text: "أهملت أنشطة كنت أستمتع بها بسبب الشاشة" },
        { text: "أنزعج بشدة عند مطالبتي بترك الجهاز", flagThreshold: 4, flagLabel: "انفعال حاد عند المنع — يستحسن حوار هادئ ومتابعة." },
        { text: "ألتزم بأوقات منظّمة ومحدّدة لاستخدام الأجهزة", isReverse: true },
      ],
      bands: [
        { min: 0, max: 10, label: "منخفض", interpretation: "نمط متوازن؛ لا مؤشرات تستدعي القلق.", recs: [{ title: "الحفاظ على التوازن", body: "استمر في العادات المنظّمة، وخصّص وقتًا يوميًا لأنشطة غير رقمية.", refKeys: ["sihhaFaragh"] }] },
        { min: 11, max: 21, label: "متوسط", interpretation: "مؤشرات مبكرة تستحق الانتباه.", recs: [{ title: "ضبط المحفزات", body: "قلّل الإشعارات، وجرّب فترات انقطاع مجدولة عن الشاشة، واتفق على حدود واضحة.", refKeys: ["tarkMaLaYani", "waqtSaif"] }] },
        { min: 22, max: 32, label: "مرتفع", interpretation: "نمط ملحوظ من الإفراط؛ يُنصح بالمتابعة مع مختص.", recs: [{ title: "طلب دعم متخصص", body: "ننصح بالتواصل مع مختص، مع خطة تدريجية لتقليل المحفزات وبدائل ممتعة غير رقمية.", refKeys: ["qawiyy"] }] },
      ],
    },
    {
      code: "FOCUS-ATTN-01",
      title: "مؤشر الانتباه والتنظيم الذاتي",
      description: "مقياس بمحاور فرعية (التشتّت، الاندفاع) لفهم أنماط الانتباه والتنظيم الذاتي.",
      category: "التركيز",
      minAge: 7, maxAge: 15, estMinutes: 7, scoring: "SUBSCALE",
      questions: [
        // محور التشتّت
        { subscale: "التشتّت", text: "ينتقل انتباهي بسرعة من شيء لآخر" },
        { subscale: "التشتّت", text: "أفقد تركيزي بسهولة عند وجود مقاطعات" },
        { subscale: "التشتّت", text: "أحافظ على انتباهي في المهمة الواحدة", isReverse: true },
        // محور الاندفاع
        { subscale: "الاندفاع", text: "أتصرّف قبل أن أفكّر في النتائج" },
        { subscale: "الاندفاع", text: "أجد صعوبة في انتظار دوري", flagThreshold: 4, flagLabel: "صعوبة ملحوظة في ضبط الاندفاع — يُنصح بمتابعة." },
        { subscale: "الاندفاع", text: "أفكّر بهدوء قبل أن أتصرّف", isReverse: true },
      ],
      bands: [
        { subscale: "التشتّت", min: 0, max: 4, label: "منخفض", interpretation: "تشتّت ضمن المعدّل الطبيعي.", recs: [{ title: "تعزيز التركيز", body: "بيئة هادئة ومهمة واحدة في كل مرة مع فترات راحة قصيرة." }] },
        { subscale: "التشتّت", min: 5, max: 8, label: "متوسط", interpretation: "تشتّت يستحق الانتباه.", recs: [{ title: "تقليل المشتّتات", body: "أبعد المشتّتات أثناء المهام، وقسّم العمل إلى خطوات قصيرة.", refKeys: ["tarkMaLaYani"] }] },
        { subscale: "التشتّت", min: 9, max: 12, label: "مرتفع", interpretation: "تشتّت ملحوظ؛ يُستحسن استشارة مختص.", recs: [{ title: "دعم متخصص للتركيز", body: "استشارة مختص وخطة داعمة للانتباه." }] },
        { subscale: "الاندفاع", min: 0, max: 4, label: "منخفض", interpretation: "تنظيم ذاتي جيد.", recs: [{ title: "الحفاظ على التنظيم", body: "استمر في تشجيع التفكير قبل التصرّف." }] },
        { subscale: "الاندفاع", min: 5, max: 8, label: "متوسط", interpretation: "اندفاع يستحق الانتباه.", recs: [{ title: "مهارات التوقّف والتفكير", body: "تدرّب على «توقّف ثم فكّر»، وكافئ الانتظار الهادئ.", refKeys: ["tumanina"] }] },
        { subscale: "الاندفاع", min: 9, max: 12, label: "مرتفع", interpretation: "اندفاع ملحوظ؛ يُستحسن استشارة مختص.", recs: [{ title: "دعم متخصص", body: "استشارة مختص وخطة لتنمية ضبط النفس." }] },
      ],
    },
    {
      code: "SLEEP-BAL-01",
      title: "مقياس التوازن والنوم",
      description: "مقياس موزون يقيس جودة النوم والعادات المرتبطة بها (بأوزان مختلفة).",
      category: "النوم",
      minAge: 10, maxAge: 18, estMinutes: 6, scoring: "WEIGHTED",
      questions: [
        { text: "أستخدم الجهاز في السرير قبل النوم مباشرة", weight: 2 },
        { text: "أجد صعوبة في النوم في وقت مناسب", weight: 2, flagThreshold: 4, flagLabel: "اضطراب ملحوظ في موعد النوم — يُنصح بمراجعة العادات." },
        { text: "أستيقظ متعبًا رغم عدد ساعات كافٍ", weight: 1 },
        { text: "أشعر بالنعاس والتشتّت خلال النهار", weight: 1 },
        { text: "ألتزم بموعد نوم ثابت", weight: 1, isReverse: true },
      ],
      // الأوزان: (2+2+1+1+1)=7 أسئلة موزونة، أقصى خام = 7*4 = 28
      bands: [
        { min: 0, max: 9, label: "منخفض", interpretation: "عادات نوم متوازنة.", recs: [{ title: "الحفاظ على النوم الصحي", body: "استمر في ثبات المواعيد وتقليل الشاشات مساءً.", refKeys: ["sleepHygiene"] }] },
        { min: 10, max: 18, label: "متوسط", interpretation: "بعض العادات تؤثّر على جودة النوم.", recs: [{ title: "تحسين بيئة النوم", body: "أوقف الشاشات قبل النوم بساعة، وثبّت موعد النوم والاستيقاظ.", refKeys: ["sleepHygiene", "qawiyy"] }] },
        { min: 19, max: 28, label: "مرتفع", interpretation: "مؤشرات على اضطراب النوم؛ يُنصح بالمتابعة.", recs: [{ title: "مراجعة مختص", body: "راجع مختصًا إن استمرت صعوبات النوم، مع خطة تدريجية لضبط العادات." }] },
      ],
    },
  ];

  // ===== إنشاء المقاييس (idempotent بالكود) =====
  let created = 0;
  for (const s of scales) {
    if (await prisma.scale.findUnique({ where: { code: s.code } })) continue;
    await prisma.scale.create({
      data: {
        code: s.code,
        title: s.title,
        description: s.description,
        audience: "USER",
        category: s.category,
        minAge: s.minAge ?? null,
        maxAge: s.maxAge ?? null,
        estMinutes: s.estMinutes,
        versions: {
          create: {
            version: 1,
            scoring: s.scoring,
            isCurrent: true,
            optionMin: 0,
            optionMax: 4,
            questions: {
              create: s.questions.map((q, i) => ({
                order: i + 1,
                text: q.text,
                type: "LIKERT" as const,
                weight: q.weight ?? 1,
                isReverse: q.isReverse ?? false,
                subscale: q.subscale ?? null,
                flagThreshold: q.flagThreshold ?? null,
                flagLabel: q.flagLabel ?? null,
                options: { create: LIKERT.map((label, v) => ({ label, value: v, order: v + 1 })) },
              })),
            },
            bands: {
              create: s.bands.map((b) => ({
                subscale: b.subscale ?? null,
                minScore: b.min,
                maxScore: b.max,
                label: b.label,
                interpretation: b.interpretation,
                recommendations: {
                  create: (b.recs ?? []).map((r, i) => ({
                    title: r.title,
                    body: r.body,
                    order: i,
                    references: { create: (r.refKeys ?? []).map((k) => ({ referenceId: refIds[k] })) },
                  })),
                },
              })),
            },
          },
        },
      },
    });
    created++;
  }

  console.log("✓ اكتملت التهيئة");
  console.log("  المدير: admin@dandouna.local · ولي الأمر: guardian@dandouna.local · مشرف المحتوى: editor@dandouna.local");
  console.log("  كلمة المرور للجميع: Dandouna#1447");
  console.log(`  المراجع: ${Object.keys(refIds).length} · المقاييس المُنشأة الآن: ${created} (إجمالي ${scales.length})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
