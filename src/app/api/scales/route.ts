import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assertPermission, ForbiddenError } from "@/lib/rbac";

// GET /api/scales — المقاييس الفعّالة المتاحة للمستخدم
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const scales = await prisma.scale.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      audience: true,
      versions: {
        where: { isCurrent: true },
        select: { id: true, version: true },
      },
    },
  });
  return NextResponse.json({ scales });
}

const createSchema = z.object({
  code: z.string().min(2),
  title: z.string().min(2),
  description: z.string().optional(),
  audience: z.enum(["USER", "GUARDIAN", "SPECIALIST", "INSTITUTION", "COMPANY"]),
});

// POST /api/scales — إنشاء مقياس (مدير فقط)
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  try {
    assertPermission(user.role, "scale:manage");
  } catch (e) {
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const scale = await prisma.scale.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "scale.create", entity: "Scale", entityId: scale.id },
  });
  return NextResponse.json({ scale }, { status: 201 });
}
