import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assertPermission, ForbiddenError } from "@/lib/rbac";

// GET /api/assessments — جلسات ولي الأمر الحالي (لكل أطفاله)
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
      child: { select: { id: true, fullName: true } },
      version: { select: { version: true, scale: { select: { title: true } } } },
    },
  });
  return NextResponse.json({ assessments });
}

const startSchema = z.object({
  versionId: z.string().min(1),
  childId: z.string().min(1),
});

// POST /api/assessments — بدء جلسة لطفل (تتطلب ملكية الطفل وموافقة سارية)
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

  const { versionId, childId } = parsed.data;

  // ملكية الطفل: ولي الأمر لا يقيّم إلا طفلًا يملكه
  const child = await prisma.child.findFirst({
    where: { id: childId, guardianId: user.id, deletedAt: null },
  });
  if (!child)
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  // شرط PDPL: موافقة سارية على معالجة بيانات الطفل
  const consent = await prisma.consent.findFirst({
    where: { childId, status: "GRANTED" },
  });
  if (!consent)
    return NextResponse.json(
      { error: "تتطلب هذه الجلسة موافقة ولي الأمر على معالجة بيانات الطفل" },
      { status: 403 },
    );

  const assessment = await prisma.assessment.create({
    data: { userId: user.id, childId, versionId },
  });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "assessment.start", entity: "Assessment", entityId: assessment.id },
  });
  return NextResponse.json({ assessment }, { status: 201 });
}
