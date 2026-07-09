import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

// يتحقق أن الطفل يخص ولي الأمر الحالي
async function ownedChild(userId: string, id: string) {
  return prisma.child.findFirst({ where: { id, guardianId: userId, deletedAt: null } });
}

// GET /api/children/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;

  const child = await prisma.child.findFirst({
    where: { id, guardianId: user.id, deletedAt: null },
    include: {
      consents: { orderBy: { createdAt: "desc" } },
      assessments: {
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          status: true,
          startedAt: true,
          version: { select: { scale: { select: { title: true } } } },
        },
      },
    },
  });
  if (!child) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
  return NextResponse.json({ child });
}

const updateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  avatarColor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// PATCH /api/children/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  if (!(await ownedChild(user.id, id)))
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 422 });

  const { birthDate, ...rest } = parsed.data;
  const child = await prisma.child.update({
    where: { id },
    data: { ...rest, ...(birthDate !== undefined ? { birthDate: birthDate ? new Date(birthDate) : null } : {}) },
  });
  return NextResponse.json({ child });
}

// DELETE /api/children/[id] — حذف منطقي (PDPL)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  if (!(await ownedChild(user.id, id)))
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  await prisma.child.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "child.delete", entity: "Child", entityId: id },
  });
  return NextResponse.json({ ok: true });
}
