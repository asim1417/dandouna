import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assertPermission, ForbiddenError } from "@/lib/rbac";

// GET /api/consent — موافقات أطفال ولي الأمر الحالي
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const consents = await prisma.consent.findMany({
    where: { child: { guardianId: user.id, deletedAt: null } },
    include: { child: { select: { id: true, fullName: true } } },
  });
  return NextResponse.json({ consents });
}

const grantSchema = z.object({
  childId: z.string().min(1),
  purpose: z.string().min(3).default("أداء مقاييس التقييم السلوكي"),
  expiresAt: z.string().datetime().optional(),
});

// POST /api/consent — منح ولي الأمر موافقة لمعالجة بيانات طفله
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  try {
    assertPermission(user.role, "consent:grant");
  } catch (e) {
    if (e instanceof ForbiddenError)
      return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const parsed = grantSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { childId, purpose, expiresAt } = parsed.data;

  // ولي الأمر لا يمنح إلا لطفل يملكه فعلاً
  const child = await prisma.child.findFirst({
    where: { id: childId, guardianId: user.id, deletedAt: null },
  });
  if (!child)
    return NextResponse.json({ error: "لا تملك ولاية على هذا الملف" }, { status: 403 });

  const consent = await prisma.consent.create({
    data: {
      childId,
      grantedById: user.id,
      purpose,
      status: "GRANTED",
      grantedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "consent.grant", entity: "Consent", entityId: consent.id },
  });
  return NextResponse.json({ consent }, { status: 201 });
}

const revokeSchema = z.object({ consentId: z.string().min(1) });

// DELETE /api/consent — سحب الموافقة
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const parsed = revokeSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const consent = await prisma.consent.findUnique({ where: { id: parsed.data.consentId } });
  if (!consent || consent.grantedById !== user.id)
    return NextResponse.json({ error: "الموافقة غير موجودة" }, { status: 404 });

  const updated = await prisma.consent.update({
    where: { id: consent.id },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "consent.revoke", entity: "Consent", entityId: consent.id },
  });
  return NextResponse.json({ consent: updated });
}
