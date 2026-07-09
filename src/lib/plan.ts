import { prisma } from "@/lib/db";

/**
 * يولّد خطة عملية لطفل من آخر تقييم مكتمل: كل توصية مطابقة للنطاق تصبح تحديًا.
 * يعيد معرّف الخطة، أو null إن لم توجد نتائج/توصيات.
 */
export async function generatePlanFromLatestAssessment(
  childId: string,
): Promise<string | null> {
  const assessment = await prisma.assessment.findFirst({
    where: { childId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    include: {
      results: true,
      version: {
        include: {
          scale: { select: { title: true } },
          bands: { include: { recommendations: { orderBy: { order: "asc" } } } },
        },
      },
    },
  });
  if (!assessment) return null;

  const recs = assessment.version.bands
    .filter((b) => assessment.results.some((r) => r.band === b.label && r.subscale === b.subscale))
    .flatMap((b) => b.recommendations);
  if (recs.length === 0) return null;

  const plan = await prisma.plan.create({
    data: {
      childId,
      assessmentId: assessment.id,
      title: `خطة ${assessment.version.scale.title}`,
      challenges: {
        create: recs.map((r, i) => ({ title: r.title, description: r.body, order: i })),
      },
    },
  });
  return plan.id;
}
