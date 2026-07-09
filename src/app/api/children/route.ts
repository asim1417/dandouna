import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

// GET /api/children — ملفات أطفال ولي الأمر الحالي
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const children = await prisma.child.findMany({
    where: { guardianId: user.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { assessments: true } },
      consents: { where: { status: "GRANTED" }, select: { id: true }, take: 1 },
    },
  });
  return NextResponse.json({ children });
}

const createSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جدًا"),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  avatarColor: z.string().optional(),
  notes: z.string().optional(),
  grantConsent: z.boolean().optional().default(true),
});

// POST /api/children — إنشاء ملف طفل (وموافقة PDPL اختيارية)
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "بيانات غير صالحة";
    return NextResponse.json({ error: first }, { status: 422 });
  }

  const { fullName, birthDate, gender, avatarColor, notes, grantConsent } = parsed.data;

  const child = await prisma.child.create({
    data: {
      guardianId: user.id,
      fullName,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
      avatarColor: avatarColor || null,
      notes: notes || null,
      ...(grantConsent
        ? {
            consents: {
              create: {
                grantedById: user.id,
                purpose: "أداء مقاييس التقييم السلوكي",
                status: "GRANTED",
                grantedAt: new Date(),
              },
            },
          }
        : {}),
    },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "child.create", entity: "Child", entityId: child.id },
  });
  return NextResponse.json({ child }, { status: 201 });
}
