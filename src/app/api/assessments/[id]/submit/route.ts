import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { scoreAssessment, type ScoredQuestion, type Band, type ScoringMethod } from "@/lib/scoring";

// POST /api/assessments/[id]/submit — إغلاق الجلسة واحتساب الدرجات
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      responses: true,
      version: {
        include: {
          questions: { select: { id: true, weight: true, subscale: true } },
          bands: {
            include: {
              recommendations: { include: { references: { include: { reference: true } } } },
            },
          },
        },
      },
    },
  });

  if (!assessment || assessment.userId !== user.id)
    return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
  if (assessment.status !== "IN_PROGRESS")
    return NextResponse.json({ error: "الجلسة مغلقة مسبقًا" }, { status: 409 });

  // بناء مدخلات المحرّك
  const answerMap = new Map(assessment.responses.map((r) => [r.questionId, r.value]));
  const scored: ScoredQuestion[] = assessment.version.questions.map((q) => ({
    questionId: q.id,
    weight: q.weight,
    subscale: q.subscale,
    value: answerMap.get(q.id) ?? null,
  }));

  const bands: Band[] = assessment.version.bands.map((b) => ({
    subscale: b.subscale,
    minScore: b.minScore,
    maxScore: b.maxScore,
    label: b.label,
    interpretation: b.interpretation,
  }));

  const results = scoreAssessment(
    scored,
    bands,
    assessment.version.scoring as ScoringMethod
  );

  // حفظ النتائج وإغلاق الجلسة
  await prisma.$transaction([
    prisma.scaleResult.deleteMany({ where: { assessmentId: id } }),
    ...results.map((r) =>
      prisma.scaleResult.create({
        data: {
          assessmentId: id,
          subscale: r.subscale,
          rawScore: r.rawScore,
          band: r.band,
          interpretation: r.interpretation,
        },
      })
    ),
    prisma.assessment.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { actorId: user.id, action: "assessment.submit", entity: "Assessment", entityId: id },
    }),
  ]);

  // ربط التوصيات والمراجع الشرعية بالنطاق الناتج (للعرض في التقرير)
  const recommendations = assessment.version.bands
    .filter((b) => results.some((r) => r.band === b.label && r.subscale === b.subscale))
    .flatMap((b) =>
      b.recommendations.map((rec) => ({
        title: rec.title,
        body: rec.body,
        references: rec.references.map((rr) => ({
          title: rr.reference.title,
          textAr: rr.reference.textAr,
          citation: rr.reference.citation,
          source: rr.reference.source,
        })),
      }))
    );

  return NextResponse.json({
    results,
    recommendations,
    disclaimer: "هذه النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا أو نفسيًا.",
  });
}
