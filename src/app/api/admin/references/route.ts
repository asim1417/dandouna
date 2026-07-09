import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assertPermission, ForbiddenError } from "@/lib/rbac";

// GET /api/admin/references — المراجع الشرعية
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  try { assertPermission(user.role, "reference:manage"); }
  catch (e) { if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 }); throw e; }
  const references = await prisma.islamicReference.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ references });
}

const refSchema = z.object({
  source: z.enum(["QURAN", "SUNNAH", "SCHOLARLY", "OTHER"]),
  title: z.string().min(2),
  textAr: z.string().min(2),
  citation: z.string().optional(),
  category: z.string().optional(),
});

// POST /api/admin/references — إضافة مرجع شرعي
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  try { assertPermission(user.role, "reference:manage"); }
  catch (e) { if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 }); throw e; }
  const parsed = refSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const reference = await prisma.islamicReference.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "reference.create", entity: "IslamicReference", entityId: reference.id },
  });
  return NextResponse.json({ reference }, { status: 201 });
}
