import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import {
  scoreAssessment,
  type EngineQuestion,
  type EngineBand,
  type EngineConfig,
  type ScoringMethod,
} from "@/lib/assessment-engine";

// POST /api/assessments/[id]/submit — إغلاق الجلسة واحتساب الدرجات (في الخادم)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      responses: true,
      version: {
        include: {
          questions: {
            select: {
              id: true,
              weight: true,
              subscale: true,
              isReverse: true,
              flagThreshold: true,
              flagLabel: true,
            },
          },
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

  const answerMap = new Map(assessment.responses.map((r) => [r.questionId, r.value]));
  const cfg: EngineConfig = {
    method: assessment.version.scoring as ScoringMethod,
    optionMin: assessment.version.optionMin,
    optionMax: assessment.version.optionMax,
  };

  const questions: EngineQuestion[] = assessment.version.questions.map((q) => ({
    id: q.id,
    weight: q.weight,
    subscale: q.subscale,
    isReverse: q.isReverse,
    value: answerMap.get(q.id) ?? null,
    flagThreshold: q.flagThreshold,
    flagLabel: q.flagLabel,
  }));

  const bands: EngineBand[] = assessment.version.bands.map((b) => ({
    subscale: b.subscale,
    minScore: b.minScore,
    maxScore: b.maxScore,
    label: b.label,
    interpretation: b.interpretation,
  }));

  const results = scoreAssessment(questions, bands, cfg);

  await prisma.$transaction([
    prisma.scaleResult.deleteMany({ where: { assessmentId: id } }),
    ...results.map((r) =>
      prisma.scaleResult.create({
        data: {
          assessmentId: id,
          subscale: r.subscale,
          rawScore: r.rawScore,
          normalizedScore: r.normalizedScore,
          band: r.band,
          interpretation: r.interpretation,
          flags: r.flags,
        },
      }),
    ),
    prisma.assessment.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { actorId: user.id, action: "assessment.submit", entity: "Assessment", entityId: id },
    }),
  ]);

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
      })),
    );

  return NextResponse.json({
    results,
    recommendations,
    disclaimer: "هذه النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا أو نفسيًا.",
  });
}
