// ============================================================
//  مستورد حزمة المحتوى — دندونة
//  يستورد المراجع (REF-xxx) والمقاييس الـ14 بشكل idempotent.
//  كل مقياس يُدخل approved=false (لا يظهر لمستخدم قبل الاعتماد).
//  إعادة التشغيل تُحدّث ولا تكرّر (upsert بالكود + إعادة بناء النسخة).
// ============================================================
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient, type RefSource, type Role, type ScoringMethod } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DIR = path.join(process.cwd(), "dandouna-content");

type RefJson = { id: string; source: string; title: string; textAr: string; citation?: string; category?: string };
type OptJson = { label: string; value: number };
type QJson = { order: number; reverse?: boolean; type?: string; weight?: number; subscale?: string | null; text: string; options: OptJson[] };
type RecJson = { title: string; body: string; references?: string[] };
type BandJson = { subscale?: string | null; min: number; max: number; label: string; interpretation: string; recommendations?: RecJson[] };
type FlagJson = { code: string; label: string; operator?: string; threshold: number; onSubscale?: string | null; severity?: string };
type ScaleJson = {
  code: string; title: string; description?: string; audience: string; version: number;
  scoring: string; questions: QJson[]; bands: BandJson[]; flags?: FlagJson[]; references?: string[];
};

const warnings: string[] = [];
const warn = (m: string) => { warnings.push(m); console.log("  ⚠ " + m); };

async function importReferences(): Promise<Set<string>> {
  const data = JSON.parse(readFileSync(path.join(DIR, "references.json"), "utf-8"));
  const refs: RefJson[] = data.references;
  const ids = new Set<string>();
  for (const r of refs) {
    await prisma.islamicReference.upsert({
      where: { id: r.id },
      update: { source: r.source as RefSource, title: r.title, textAr: r.textAr, citation: r.citation ?? null, category: r.category ?? null },
      create: { id: r.id, source: r.source as RefSource, title: r.title, textAr: r.textAr, citation: r.citation ?? null, category: r.category ?? null },
    });
    ids.add(r.id);
  }
  console.log(`✓ مراجع مستوردة: ${refs.length}`);
  return ids;
}

async function importScale(s: ScaleJson, refIds: Set<string>) {
  const optionMax = Math.max(...s.questions.flatMap((q) => q.options.map((o) => o.value)));
  const optionMin = Math.min(...s.questions.flatMap((q) => q.options.map((o) => o.value)));
  const estMinutes = Math.max(4, Math.round(s.questions.length * 0.6));

  await prisma.$transaction(async (tx) => {
    // upsert المقياس (بالكود)
    const scale = await tx.scale.upsert({
      where: { code: s.code },
      update: { title: s.title, description: s.description ?? null, audience: s.audience as Role, estMinutes },
      create: { code: s.code, title: s.title, description: s.description ?? null, audience: s.audience as Role, estMinutes, approved: false },
    });

    // إيجاد/إنشاء النسخة
    let version = await tx.scaleVersion.findUnique({ where: { scaleId_version: { scaleId: scale.id, version: s.version } } });
    if (version) {
      // منع إعادة البناء لو للنسخة جلسات (حفاظًا على البيانات)
      const used = await tx.assessment.count({ where: { versionId: version.id } });
      if (used > 0) { warn(`${s.code} v${s.version}: توجد ${used} جلسة — حُدّثت البيانات الوصفية فقط دون إعادة بناء الأسئلة`); return; }
      // إعادة بناء: احذف الأسئلة والنطاقات والأعلام (cascade للتوصيات والخيارات)
      await tx.question.deleteMany({ where: { versionId: version.id } });
      await tx.scoreBand.deleteMany({ where: { versionId: version.id } });
      await tx.scaleFlag.deleteMany({ where: { versionId: version.id } });
      await tx.scaleVersion.update({ where: { id: version.id }, data: { scoring: s.scoring as ScoringMethod, optionMin, optionMax, isCurrent: true } });
    } else {
      version = await tx.scaleVersion.create({ data: { scaleId: scale.id, version: s.version, scoring: s.scoring as ScoringMethod, isCurrent: true, optionMin, optionMax } });
    }

    // الأسئلة + الخيارات
    for (const q of s.questions) {
      await tx.question.create({
        data: {
          versionId: version.id, order: q.order, text: q.text, type: "LIKERT",
          weight: q.weight ?? 1, isReverse: q.reverse ?? false, subscale: q.subscale ?? null,
          options: { create: q.options.map((o, i) => ({ label: o.label, value: o.value, order: i + 1 })) },
        },
      });
    }

    // النطاقات + التوصيات (ربط المراجع بمعرّف REF)
    for (const b of s.bands) {
      await tx.scoreBand.create({
        data: {
          versionId: version.id, subscale: b.subscale ?? null, minScore: b.min, maxScore: b.max, label: b.label, interpretation: b.interpretation,
          recommendations: {
            create: (b.recommendations ?? []).map((r, i) => {
              const refs = (r.references ?? []).filter((rid) => {
                if (!refIds.has(rid)) { warn(`${s.code}: مرجع مفقود ${rid} في توصية «${r.title}»`); return false; }
                return true;
              });
              return { title: r.title, body: r.body, order: i, references: { create: refs.map((rid) => ({ referenceId: rid })) } };
            }),
          },
        },
      });
    }

    // أعلام المقياس
    for (const f of s.flags ?? []) {
      await tx.scaleFlag.create({
        data: { versionId: version.id, code: f.code, label: f.label, operator: f.operator ?? "GTE", threshold: f.threshold, onSubscale: f.onSubscale ?? null, severity: f.severity ?? "WARN" },
      });
    }
  });
}

async function main() {
  console.log("→ استيراد حزمة المحتوى…");
  const refIds = await importReferences();

  const files = readdirSync(path.join(DIR, "scales")).filter((f) => f.endsWith(".json")).sort();
  let n = 0;
  for (const file of files) {
    const s: ScaleJson = JSON.parse(readFileSync(path.join(DIR, "scales", file), "utf-8"));
    await importScale(s, refIds);
    n++;
    console.log(`  ✓ ${s.code} (${s.questions.length} سؤال · ${s.bands.length} نطاق · ${(s.flags ?? []).length} عَلَم)`);
  }

  console.log(`\n✓ اكتمل الاستيراد: ${refIds.size} مرجع · ${n} مقياس (كلها approved=false)`);
  if (warnings.length) console.log(`⚠ تحذيرات: ${warnings.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
