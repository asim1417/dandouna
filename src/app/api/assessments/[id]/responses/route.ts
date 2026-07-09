import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z.number().nullable().optional(),
  textValue: z.string().nullable().optional(),
});

// POST /api/assessments/[id]/responses — حفظ/تحديث إجابة
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({ where: { id } });
  if (!assessment || assessment.userId !== user.id)
    return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
  if (assessment.status !== "IN_PROGRESS")
    return NextResponse.json({ error: "الجلسة مغلقة" }, { status: 409 });

  const parsed = answerSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { questionId, value = null, textValue = null } = parsed.data;

  const response = await prisma.response.upsert({
    where: { assessmentId_questionId: { assessmentId: id, questionId } },
    create: { assessmentId: id, questionId, value, textValue },
    update: { value, textValue },
  });
  return NextResponse.json({ response });
}
