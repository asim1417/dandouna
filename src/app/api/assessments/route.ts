import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assertPermission, ForbiddenError } from "@/lib/rbac";

// GET /api/assessments — جلسات المستخدم الحالي
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const assessments = await prisma.assessment.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      version: { select: { version: true, scale: { select: { title: true } } } },
    },
  });
  return NextResponse.json({ assessments });
}

const startSchema = z.object({ versionId: z.string().min(1) });

// POST /api/assessments — بدء جلسة (تتطلب موافقة سارية)
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  try {
    assertPermission(user.role, "assessment:take");
  } catch (e) {
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const parsed = startSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // شرط PDPL: لا تُفتح جلسة لقاصر إلا بموافقة سارية
  if (user.isMinor) {
    const consent = await prisma.consent.findFirst({
      where: { subjectId: user.id, status: "GRANTED" },
    });
    if (!consent)
      return NextResponse.json(
        { error: "تتطلب هذه الجلسة موافقة ولي الأمر" },
        { status: 403 }
      );
  }

  const assessment = await prisma.assessment.create({
    data: { userId: user.id, versionId: parsed.data.versionId },
  });
  return NextResponse.json({ assessment }, { status: 201 });
}
