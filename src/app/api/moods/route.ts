import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

// GET /api/moods — سجل المزاج (آخر 30)
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const moods = await prisma.moodEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ moods });
}

const moodSchema = z.object({
  mood: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

// POST /api/moods — تسجيل مزاج (ركن الطمأنينة)
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const parsed = moodSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const entry = await prisma.moodEntry.create({
    data: { userId: user.id, mood: parsed.data.mood, note: parsed.data.note ?? null },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
