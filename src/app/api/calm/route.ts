import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

// GET /api/calm — محتوى ركن الطمأنينة + نصوص التقارير الموحّدة
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

  const [calm, reports] = await Promise.all([
    prisma.siteContent.findUnique({ where: { key: "calmCorner" } }),
    prisma.siteContent.findUnique({ where: { key: "reportTexts" } }),
  ]);
  return NextResponse.json({ calmCorner: calm?.data ?? null, reportTexts: reports?.data ?? null });
}
